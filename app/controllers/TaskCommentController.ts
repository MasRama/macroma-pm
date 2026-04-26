import type { NaraRequest, NaraResponse } from "@core";
import {
  BaseController,
  jsonSuccess,
  jsonCreated,
  jsonError,
  jsonServerError,
} from "@core";
import { ProjectMember, Task, TaskComment } from "@models";
import Realtime from "@services/Realtime";

class TaskCommentController extends BaseController {
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

    const comments = await TaskComment.findByTask(taskId);
    return jsonSuccess(res, "Comments retrieved", { comments });
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

    let body: { content?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    const content = body.content ? String(body.content).trim() : "";
    if (!content) {
      return jsonError(res, "Komentar tidak boleh kosong", 422);
    }
    if (content.length > 2000) {
      return jsonError(res, "Komentar terlalu panjang (maks 2000 karakter)", 422);
    }

    try {
      const id = crypto.randomUUID();
      await TaskComment.create({
        id,
        task_id: taskId,
        user_id: req.user.id,
        content,
      });

      const created = (await TaskComment.findByTask(taskId)).find((c) => c.id === id);

      // Realtime broadcast — surface new comments to anyone with this task open.
      if (created) {
        Realtime.publish(
          Realtime.topics.project(task.project_id),
          "comment.created",
          { task_id: taskId, comment: created, actor_id: req.user.id }
        );
      }

      return jsonCreated(res, "Comment added", { comment: created });
    } catch {
      return jsonServerError(res, "Failed to add comment");
    }
  }

  async destroy(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const commentId = this.getRequiredParam(req, "commentId");

    const comment = await TaskComment.findById(commentId);
    if (!comment) {
      return jsonError(res, "Comment not found", 404);
    }

    const task = await Task.findById(comment.task_id);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const membership = await ProjectMember.findMembership(task.project_id, req.user.id);
    const isAuthor = comment.user_id === req.user.id;
    const isOwner = membership?.role === "owner";
    if (!isAuthor && !isOwner) {
      return jsonError(res, "Forbidden", 403);
    }

    await TaskComment.delete(commentId);

    Realtime.publish(
      Realtime.topics.project(task.project_id),
      "comment.deleted",
      { task_id: comment.task_id, comment_id: commentId, actor_id: req.user.id }
    );

    return jsonSuccess(res, "Comment deleted");
  }
}

export const taskCommentController = new TaskCommentController();
export default taskCommentController;
