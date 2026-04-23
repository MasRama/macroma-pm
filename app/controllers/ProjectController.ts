import type { NaraRequest, NaraResponse } from "@core";
import {
  BaseController,
  jsonSuccess,
  jsonCreated,
  jsonError,
  jsonServerError,
} from "@core";
import { Project, ProjectMember, WorkspaceMember, ProjectBatch, Task, ProjectActivityLog, ProjectVersionCounter } from "@models";
import DB from "@services/DB";
import { logActivity } from "@helpers/activity";
import { buildNavData } from "@helpers/nav";

class ProjectController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projects = await Project.findAllForUser(req.user.id);

    const projectsWithMeta = await Promise.all(
      projects.map(async (project) => {
        const activeBatch = await ProjectBatch.findActive(project.id);
        const memberCount = await ProjectMember.count({ project_id: project.id });

        const ongoingCount = await Task.count({ project_id: project.id, column_id: "ongoing" });
        const revisiCount = await Task.count({ project_id: project.id, column_id: "revisi" });
        const doneCount = await Task.count({ project_id: project.id, column_id: "done" });

        return {
          ...project,
          active_batch_label: activeBatch
            ? `v${activeBatch.major}.${activeBatch.minor}${activeBatch.label ? " " + activeBatch.label : ""}`
            : null,
          task_counts: { ongoing: ongoingCount, revisi: revisiCount, done: doneCount },
          member_count: memberCount,
        };
      })
    );

    const nav = await buildNavData(req.user.id);

    this.requireInertia(res);
    return res.inertia("projects", {
      projects: projectsWithMeta,
      user: req.user,
      ...nav,
    });
  }

  async show(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const project = await Project.findById(projectId);
    if (!project) {
      return jsonError(res, "Project not found", 404);
    }

    const canAccess = await ProjectMember.canAccessProject(projectId, req.user.id);
    if (!canAccess) {
      return jsonError(res, "Forbidden", 403);
    }

    const activeBatch = await ProjectBatch.findActive(projectId);
    const batchId = req.query.batch_id as string | undefined;

    const tasks = await Task.findByProject(projectId, batchId !== undefined ? batchId : undefined);
    const batches = await ProjectBatch.findByProject(projectId);

    const memberRecords = await ProjectMember.findByProject(projectId);

    const userIdSet = new Set<string>(memberRecords.map((m) => m.user_id));
    if (project.workspace_id) {
      const workspaceMemberRecords = await WorkspaceMember.findByWorkspace(project.workspace_id);
      workspaceMemberRecords.forEach((m) => userIdSet.add(m.user_id));
    }

    const members = await Promise.all(
      Array.from(userIdSet).map(async (userId) => {
        const projectMember = memberRecords.find((m) => m.user_id === userId);
        const user = await DB.from("users")
          .where("id", userId)
          .select("id", "name", "email", "avatar")
          .first();
        return {
          id: projectMember?.id ?? userId,
          project_id: projectId,
          user_id: userId,
          role: projectMember?.role ?? "member",
          created_at: projectMember?.created_at ?? 0,
          user,
        };
      })
    );

    const nav = await buildNavData(req.user.id);

    this.requireInertia(res);
    return res.inertia("project-board", {
      project,
      tasks,
      batches: batches.map((b) => ({
        ...b,
        version_string: `v${b.major}.${b.minor}${b.label ? " " + b.label : ""}`,
      })),
      activeBatch: activeBatch
        ? {
            ...activeBatch,
            version_string: `v${activeBatch.major}.${activeBatch.minor}${activeBatch.label ? " " + activeBatch.label : ""}`,
          }
        : null,
      members,
      user: req.user,
      ...nav,
    });
  }

  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    let body: { name?: string; description?: string; workspace_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.name || String(body.name).trim() === "") {
      return jsonError(res, "Nama project wajib diisi", 422);
    }

    try {
      const projectId = crypto.randomUUID();
      const now = Date.now();

      const project = await Project.create({
        id: projectId,
        name: String(body.name).trim(),
        description: body.description ? String(body.description).trim() : null,
        owner_id: req.user.id,
        workspace_id: body.workspace_id ? String(body.workspace_id) : null,
      });

      await DB.table("project_members").insert({
        id: crypto.randomUUID(),
        project_id: projectId,
        user_id: req.user.id,
        role: "owner",
        created_at: now,
      });

      await ProjectVersionCounter.ensureExists(projectId);

      await logActivity({
        projectId,
        eventType: "project.created",
        description: `Project "${String(body.name).trim()}" dibuat`,
        actorId: req.user.id,
      });

      return jsonCreated(res, "Project berhasil dibuat", { id: projectId });
    } catch (err) {
      return jsonServerError(res, "Failed to create project");
    }
  }

  async update(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const project = await Project.findById(projectId);
    if (!project) {
      return jsonError(res, "Project not found", 404);
    }

    if (project.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { name?: string; description?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    const updated = await Project.update(projectId, {
      name: body.name ? String(body.name).trim() : project.name,
      description: body.description !== undefined ? String(body.description).trim() : project.description,
    });

    return jsonSuccess(res, "Project updated", { project: updated });
  }

  async destroy(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const project = await Project.findById(projectId);
    if (!project) {
      return jsonError(res, "Project not found", 404);
    }

    if (project.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    await Project.delete(projectId);

    return jsonSuccess(res, "Project deleted");
  }

  async activity(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const canAccess = await ProjectMember.canAccessProject(projectId, req.user.id);
    if (!canAccess) {
      return jsonError(res, "Forbidden", 403);
    }

    const logs = await ProjectActivityLog.findByProject(projectId, 50);

    const logsWithActor = await Promise.all(
      logs.map(async (log) => {
        let actorName: string | null = null;
        if (log.actor_id) {
          const actor = await DB.from("users")
            .where("id", log.actor_id)
            .select("name", "email")
            .first();
          actorName = actor?.name || actor?.email || null;
        }
        return { ...log, actor_name: actorName };
      })
    );

    return jsonSuccess(res, "Activity logs retrieved", { logs: logsWithActor });
  }
}

export const projectController = new ProjectController();
export default projectController;
