import { randomUUID } from "crypto";
import type { NaraRequest, NaraResponse } from "@core";
import { BaseController, jsonError, jsonServerError, jsonSuccess, jsonCreated } from "@core";
import sharp from "sharp";
import { Task, TaskAttachment, ProjectMember } from "@models";
import { Storage } from "@services";
import { UPLOAD } from "@config/constants";
import Logger from "@services/Logger";
import Realtime from "@services/Realtime";
import { logActivity } from "@helpers/activity";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILES_PER_UPLOAD = 8;

interface ProcessedFile {
  id: string;
  url: string;
  name: string;
  mime_type: string;
  size: number;
}

class TaskAttachmentController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");
    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const canAccess = await ProjectMember.canAccessProject(task.project_id, req.user.id);
    if (!canAccess) {
      return jsonError(res, "Forbidden", 403);
    }

    const attachments = await TaskAttachment.findByTask(taskId);
    return jsonSuccess(res, "Attachments retrieved", { attachments });
  }

  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");
    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const canAccess = await ProjectMember.canAccessProject(task.project_id, req.user.id);
    if (!canAccess) {
      return jsonError(res, "Forbidden", 403);
    }

    const userId = req.user.id;
    const processed: ProcessedFile[] = [];
    const errors: string[] = [];
    let fileCount = 0;
    const processingPromises: Promise<void>[] = [];

    try {
      await req.multipart((field: any) => {
        if (!field.file) return;

        fileCount++;
        if (fileCount > MAX_FILES_PER_UPLOAD) {
          errors.push(`Maksimal ${MAX_FILES_PER_UPLOAD} file per upload`);
          return;
        }

        if (!ALLOWED_MIME_TYPES.includes(field.mime_type)) {
          errors.push(`${field.name || "File"}: tipe tidak didukung (hanya JPEG/PNG/GIF/WebP)`);
          return;
        }

        const id = randomUUID();
        const processingPromise = new Promise<void>((resolve, reject) => {
          const chunks: Buffer[] = [];
          const readable = field.file.stream;
          let totalBytes = 0;
          let streamEnded = false;

          readable.on("data", (chunk: Buffer) => {
            totalBytes += chunk.length;
            if (totalBytes > MAX_FILE_SIZE_BYTES) {
              readable.destroy(new Error("FILE_TOO_LARGE"));
              return;
            }
            chunks.push(chunk);
          });

          readable.on("error", (error: Error) => {
            if (error.message === "FILE_TOO_LARGE") {
              errors.push(`${field.name || "File"}: ukuran melebihi ${MAX_FILE_SIZE_MB}MB`);
              return resolve();
            }
            reject(error);
          });

          readable.on("end", async () => {
            if (streamEnded) return;
            streamEnded = true;

            try {
              const buffer = Buffer.concat(chunks);
              const processedBuffer = await sharp(buffer)
                .webp({ quality: 82 })
                .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
                .toBuffer();

              const stored = await Storage.put(processedBuffer, {
                directory: UPLOAD.TASK_ATTACHMENT_DIR,
                name: id,
                extension: "webp",
              });

              processed.push({
                id,
                url: stored.url,
                name: field.name || `${id}.webp`,
                mime_type: "image/webp",
                size: processedBuffer.length,
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          });
        });

        processingPromises.push(processingPromise);
      });

      await Promise.all(processingPromises);

      if (processed.length === 0) {
        return jsonError(
          res,
          errors.length ? errors.join("; ") : "Tidak ada file yang diupload",
          400,
          "NO_FILES_PROCESSED"
        );
      }

      const createdIds: string[] = [];

      for (const file of processed) {
        await TaskAttachment.create({
          id: file.id,
          task_id: taskId,
          url: file.url,
          name: file.name,
          mime_type: file.mime_type,
          size: file.size,
          uploaded_by: userId,
        } as any);
        createdIds.push(file.id);
      }

      const attachments = await TaskAttachment.findByTask(taskId);
      const created = attachments.filter((a) => createdIds.includes(a.id));

      await logActivity({
        projectId: task.project_id,
        eventType: "task.attachment_added",
        description: `${created.length} gambar ditambahkan ke task "${task.title}"`,
        actorId: userId,
        taskId,
        meta: { count: created.length },
      });

      Realtime.publish(Realtime.topics.project(task.project_id), "task.attachment_added", {
        task_id: taskId,
        attachments: created,
        actor_id: userId,
      });

      const message = errors.length
        ? `${created.length} gambar terupload. ${errors.length} gagal: ${errors.join("; ")}`
        : `${created.length} gambar berhasil diupload`;

      return jsonCreated(res, message, { attachments: created, errors });
    } catch (error) {
      Logger.error("Error uploading task attachments", error as Error);
      return jsonServerError(res, "Gagal mengupload gambar");
    }
  }

  async destroy(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");
    const attachmentId = this.getRequiredParam(req, "attachmentId");

    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const membership = await ProjectMember.findMembership(task.project_id, req.user.id);
    const isOwner = membership?.role === "owner";

    const attachment = await TaskAttachment.findById(attachmentId);
    if (!attachment || attachment.task_id !== taskId) {
      return jsonError(res, "Attachment not found", 404);
    }

    if (!isOwner && attachment.uploaded_by !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    await TaskAttachment.delete(attachmentId);

    // Best-effort delete file from storage
    if (attachment.url.startsWith("/storage/")) {
      const relativePath = attachment.url.slice("/storage/".length);
      await Storage.delete(relativePath).catch(() => {});
    }

    await logActivity({
      projectId: task.project_id,
      eventType: "task.attachment_removed",
      description: `Gambar dihapus dari task "${task.title}"`,
      actorId: req.user.id,
      taskId,
      meta: { attachment_id: attachmentId },
    });

    Realtime.publish(Realtime.topics.project(task.project_id), "task.attachment_removed", {
      task_id: taskId,
      attachment_id: attachmentId,
      actor_id: req.user.id,
    });

    return jsonSuccess(res, "Gambar dihapus");
  }
}

export const taskAttachmentController = new TaskAttachmentController();
export default taskAttachmentController;
