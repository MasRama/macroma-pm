import type { NaraRequest, NaraResponse } from "@core";
import {
  BaseController,
  jsonSuccess,
  jsonCreated,
  jsonError,
  jsonServerError,
} from "@core";
import { ProjectMember, ProjectBatch, Task, TaskLog, taskVersionString, ProjectVersionCounter } from "@models";
import DB from "@services/DB";
import { logActivity } from "@helpers/activity";

const VALID_COLUMNS = ["ongoing", "revisi", "done"] as const;
type ColumnId = typeof VALID_COLUMNS[number];

function isValidColumn(value: string): value is ColumnId {
  return VALID_COLUMNS.includes(value as ColumnId);
}

class TaskController extends BaseController {
  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const isMember = await ProjectMember.isMember(projectId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: {
      title?: string;
      description?: string;
      priority?: string;
      assignee_id?: string;
      batch_id?: string;
    };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.title || String(body.title).trim() === "") {
      return jsonError(res, "Judul task wajib diisi", 422);
    }

    const priority = body.priority && ["low", "medium", "high"].includes(body.priority)
      ? body.priority as "low" | "medium" | "high"
      : "medium";

    if (body.assignee_id) {
      const assigneeMember = await ProjectMember.isMember(projectId, body.assignee_id);
      if (!assigneeMember) {
        return jsonError(res, "Assignee must be a project member", 422);
      }
    }

    const activeBatch = body.batch_id
      ? await ProjectBatch.findById(body.batch_id)
      : await ProjectBatch.findActive(projectId);

    const maxSortOrder = await Task.getMaxSortOrder(projectId, "ongoing");

    try {
      const taskId = crypto.randomUUID();
      const now = Date.now();
      let newVersion = "";

      await DB.transaction(async (trx) => {
        const newPatch = await ProjectVersionCounter.incrementAndGet(projectId, trx);
        newVersion = `v0.0.${newPatch}`;

        await trx("tasks").insert({
          id: taskId,
          project_id: projectId,
          batch_id: activeBatch ? activeBatch.id : null,
          title: String(body.title).trim(),
          description: body.description ? String(body.description).trim() : null,
          priority,
          assignee_id: body.assignee_id || null,
          column_id: "ongoing",
          sort_order: maxSortOrder + 1,
          version_major: 0,
          version_minor: 0,
          version_patch: newPatch,
          created_at: now,
          updated_at: now,
        });

        await trx("task_logs").insert({
          id: crypto.randomUUID(),
          task_id: taskId,
          version: newVersion,
          column_from: null,
          column_to: "ongoing",
          note: "Tugas dibuat",
          created_by: req.user.id,
          created_at: now,
        });
      });

      await logActivity({
        projectId,
        eventType: "task.created",
        description: `Task "${String(body.title).trim()}" dibuat`,
        actorId: req.user.id,
        taskId,
        meta: { version: newVersion },
      });

      return res.redirect(`/projects/${projectId}`);
    } catch (err) {
      return jsonServerError(res, "Failed to create task");
    }
  }

  async move(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");

    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { column_id?: string; note?: string; sort_order?: number };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.column_id || !isValidColumn(body.column_id)) {
      return jsonError(res, "column_id must be one of: ongoing, revisi, done", 422);
    }

    if (body.column_id === task.column_id) {
      return jsonError(res, "Cannot move task to the same column", 400);
    }

    if (!body.note || String(body.note).trim() === "") {
      return jsonError(res, "Catatan wajib diisi saat memindah task", 422);
    }

    const now = Date.now();

    try {
      let updatedTask: Awaited<ReturnType<typeof Task.findById>>;
      let log: Awaited<ReturnType<typeof TaskLog.findById>>;
      let newVersion: string = "";

      await DB.transaction(async (trx) => {
        const newPatch = await ProjectVersionCounter.incrementAndGet(task.project_id, trx);
        newVersion = `v0.0.${newPatch}`;

        await trx("tasks")
          .where("id", taskId)
          .update({
            column_id: body.column_id,
            version_patch: newPatch,
            sort_order: body.sort_order ?? 0,
            updated_at: now,
          });

        const logId = crypto.randomUUID();
        await trx("task_logs").insert({
          id: logId,
          task_id: taskId,
          version: newVersion,
          column_from: task.column_id,
          column_to: body.column_id,
          note: String(body.note).trim(),
          created_by: req.user.id,
          created_at: now,
        });
      });

      updatedTask = await Task.findById(taskId);
      log = await TaskLog.findBy({ task_id: taskId, version: newVersion! });

      const columnNames: Record<string, string> = { ongoing: "On Going", revisi: "Revisi", done: "Done" };
      await logActivity({
        projectId: task.project_id,
        eventType: "task.moved",
        description: `Task "${task.title}" dipindah dari ${columnNames[task.column_id] ?? task.column_id} → ${columnNames[body.column_id!] ?? body.column_id} (${newVersion})`,
        actorId: req.user.id,
        taskId,
        meta: { from: task.column_id, to: body.column_id, note: String(body.note).trim(), version: newVersion },
      });

      return jsonSuccess(res, "Task moved", {
        task: updatedTask,
        log,
        version: newVersion,
      });
    } catch (err) {
      return jsonServerError(res, "Failed to move task");
    }
  }

  async addLog(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");

    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { note?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.note || String(body.note).trim() === "") {
      return jsonError(res, "Catatan wajib diisi", 422);
    }

    const now = Date.now();
    let newVersion = "";

    try {
      let log: Awaited<ReturnType<typeof TaskLog.findBy>>;

      await DB.transaction(async (trx) => {
        const newPatch = await ProjectVersionCounter.incrementAndGet(task.project_id, trx);
        newVersion = `v0.0.${newPatch}`;

        await trx("tasks")
          .where("id", taskId)
          .update({
            version_patch: newPatch,
            updated_at: now,
          });

        const logId = crypto.randomUUID();
        await trx("task_logs").insert({
          id: logId,
          task_id: taskId,
          version: newVersion,
          column_from: task.column_id,
          column_to: task.column_id,
          note: String(body.note).trim(),
          created_by: req.user.id,
          created_at: now,
        });
      });

      log = await TaskLog.findBy({ task_id: taskId, version: newVersion });
      const updatedTask = await Task.findById(taskId);

      await logActivity({
        projectId: task.project_id,
        eventType: "task.log_added",
        description: `Task "${task.title}" diupdate (${newVersion}): ${String(body.note).trim()}`,
        actorId: req.user.id,
        taskId,
        meta: { note: String(body.note).trim(), version: newVersion },
      });

      return jsonSuccess(res, "Log added", {
        log,
        task: updatedTask,
        version: newVersion,
      });
    } catch (err) {
      return jsonServerError(res, "Failed to add log");
    }
  }

  async destroy(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");

    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const membership = await ProjectMember.findMembership(task.project_id, req.user.id);
    if (!membership || membership.role !== "owner") {
      return jsonError(res, "Forbidden", 403);
    }

    await Task.delete(taskId);

    return jsonSuccess(res, "Task deleted");
  }

  async getLogs(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const taskId = this.getRequiredParam(req, "id");

    const task = await Task.findById(taskId);
    if (!task) {
      return jsonError(res, "Task not found", 404);
    }

    const isMember = await ProjectMember.isMember(task.project_id, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    const logs = await TaskLog.findByTask(taskId);

    return jsonSuccess(res, "Logs retrieved", { logs });
  }
}

export const taskController = new TaskController();
export default taskController;
