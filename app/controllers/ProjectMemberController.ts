import type { NaraRequest, NaraResponse } from "@core";
import {
  BaseController,
  jsonSuccess,
  jsonCreated,
  jsonError,
  jsonServerError,
} from "@core";
import { Project, ProjectMember, User } from "@models";
import DB from "@services/DB";

class ProjectMemberController extends BaseController {
  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");

    const project = await Project.findById(projectId);
    if (!project) {
      return jsonError(res, "Project not found", 404);
    }

    if (project.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { user_id?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.user_id) {
      return jsonError(res, "user_id wajib diisi", 422);
    }

    const targetUser = await User.findById(body.user_id);
    if (!targetUser) {
      return jsonError(res, "User not found", 404);
    }

    const alreadyMember = await ProjectMember.isMember(projectId, body.user_id);
    if (alreadyMember) {
      return jsonError(res, "User is already a member of this project", 409);
    }

    try {
      const member = await DB.table("project_members").insert({
        id: crypto.randomUUID(),
        project_id: projectId,
        user_id: body.user_id,
        role: "member",
        created_at: Date.now(),
      });

      return jsonCreated(res, "Member added", { member });
    } catch (err) {
      return jsonServerError(res, "Failed to add member");
    }
  }

  async destroy(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const projectId = this.getRequiredParam(req, "id");
    const userId = this.getRequiredParam(req, "userId");

    const project = await Project.findById(projectId);
    if (!project) {
      return jsonError(res, "Project not found", 404);
    }

    if (project.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    if (userId === project.owner_id) {
      return jsonError(res, "Cannot remove the project owner", 400);
    }

    const membership = await ProjectMember.findMembership(projectId, userId);
    if (!membership) {
      return jsonError(res, "Member not found", 404);
    }

    await ProjectMember.delete(membership.id);

    return jsonSuccess(res, "Member removed");
  }
}

export const projectMemberController = new ProjectMemberController();
export default projectMemberController;
