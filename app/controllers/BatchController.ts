import type { NaraRequest, NaraResponse } from "@core";
import {
  BaseController,
  jsonSuccess,
  jsonCreated,
  jsonError,
  jsonServerError,
} from "@core";
import { Project, ProjectMember, ProjectBatch, versionString } from "@models";
import DB from "@services/DB";

class BatchController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const isMember = await ProjectMember.isMember(projectId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    const batches = await ProjectBatch.findByProject(projectId);

    return jsonSuccess(res, "Batches retrieved", {
      batches: batches.map((b) => ({ ...b, version_string: versionString(b) })),
    });
  }

  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const isMember = await ProjectMember.isMember(projectId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { label?: string; bump_major?: boolean };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    const bumpMajor = body.bump_major === true;

    try {
      const { major, minor } = await ProjectBatch.getNextVersion(projectId, bumpMajor);

      const batch = await ProjectBatch.create({
        id: crypto.randomUUID(),
        project_id: projectId,
        major,
        minor,
        label: body.label ? String(body.label).trim() : null,
        is_active: false,
      });

      return jsonCreated(res, "Batch created", {
        batch: { ...batch, version_string: versionString(batch) },
      });
    } catch (err) {
      return jsonServerError(res, "Failed to create batch");
    }
  }

  async activate(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");
    const batchId = this.getRequiredParam(req, "batchId");

    const project = await Project.findById(projectId);
    if (!project) {
      return jsonError(res, "Project not found", 404);
    }

    if (project.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    const batch = await ProjectBatch.findById(batchId);
    if (!batch || batch.project_id !== projectId) {
      return jsonError(res, "Batch not found", 404);
    }

    try {
      await DB.transaction(async (trx) => {
        await trx("project_batches")
          .where("project_id", projectId)
          .update({ is_active: false, updated_at: Date.now() });

        await trx("project_batches")
          .where("id", batchId)
          .update({ is_active: true, updated_at: Date.now() });
      });

      const updated = await ProjectBatch.findById(batchId);

      return jsonSuccess(res, "Batch activated", {
        batch: updated ? { ...updated, version_string: versionString(updated) } : null,
      });
    } catch (err) {
      return jsonServerError(res, "Failed to activate batch");
    }
  }
}

export const batchController = new BatchController();
export default batchController;
