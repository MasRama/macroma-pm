import type { NaraRequest, NaraResponse } from "@core";
import { BaseController, jsonSuccess, jsonCreated, jsonError, jsonServerError } from "@core";
import { Workspace, WorkspaceMember, WorkspaceInvitation, Notification, Project } from "@models";
import DB from "@services/DB";
import { buildNavData } from "@helpers/nav";

class WorkspaceController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaces = await Workspace.findAllForUser(req.user.id);

    const workspacesWithMeta = await Promise.all(
      workspaces.map(async (ws) => {
        const memberCount = await WorkspaceMember.count({ workspace_id: ws.id });
        const projectCount = await Project.count({ workspace_id: ws.id });
        return { ...ws, member_count: memberCount, project_count: projectCount };
      })
    );

    const [nav, unreadCount] = await Promise.all([
      buildNavData(req.user.id),
      Notification.countUnread(req.user.id),
    ]);

    this.requireInertia(res);
    return res.inertia("workspaces", {
      workspaces: workspacesWithMeta,
      unread_count: unreadCount,
      user: req.user,
      ...nav,
    });
  }

  async show(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");

    const isMember = await WorkspaceMember.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return jsonError(res, "Workspace not found", 404);
    }

    const memberRecords = await WorkspaceMember.findByWorkspace(workspaceId);
    const members = await Promise.all(
      memberRecords.map(async (m) => {
        const user = await DB.from("users")
          .where("id", m.user_id)
          .select("id", "name", "email", "avatar")
          .first();
        return { ...m, user };
      })
    );

    const projects = await DB.from("projects")
      .where({ workspace_id: workspaceId })
      .select("*")
      .orderBy("created_at", "desc");

    const invitations = await WorkspaceInvitation.findByWorkspace(workspaceId);

    const [nav, unreadCount] = await Promise.all([
      buildNavData(req.user.id),
      Notification.countUnread(req.user.id),
    ]);

    this.requireInertia(res);
    return res.inertia("workspace", {
      workspace,
      members,
      projects,
      invitations,
      unread_count: unreadCount,
      user: req.user,
      ...nav,
    });
  }

  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    let body: { name?: string; description?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.name || String(body.name).trim() === "") {
      return jsonError(res, "Nama workspace wajib diisi", 422);
    }

    try {
      const workspaceId = crypto.randomUUID();
      const now = Date.now();

      await Workspace.create({
        id: workspaceId,
        name: String(body.name).trim(),
        description: body.description ? String(body.description).trim() : null,
        owner_id: req.user.id,
      });

      await DB.table("workspace_members").insert({
        id: crypto.randomUUID(),
        workspace_id: workspaceId,
        user_id: req.user.id,
        role: "owner",
        created_at: now,
      });

      return jsonCreated(res, "Workspace berhasil dibuat", { id: workspaceId });
    } catch {
      return jsonServerError(res, "Failed to create workspace");
    }
  }

  async update(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return jsonError(res, "Workspace not found", 404);
    }

    if (workspace.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { name?: string; description?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    const updated = await Workspace.update(workspaceId, {
      name: body.name ? String(body.name).trim() : workspace.name,
      description: body.description !== undefined ? String(body.description).trim() : workspace.description,
    });

    return jsonSuccess(res, "Workspace updated", { workspace: updated });
  }

  async destroy(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return jsonError(res, "Workspace not found", 404);
    }

    if (workspace.owner_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    await Workspace.delete(workspaceId);

    return jsonSuccess(res, "Workspace deleted");
  }

  async invite(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return jsonError(res, "Workspace not found", 404);
    }

    const isMember = await WorkspaceMember.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { email?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.email || String(body.email).trim() === "") {
      return jsonError(res, "Email wajib diisi", 422);
    }

    const inviteeEmail = String(body.email).trim().toLowerCase();

    const alreadyMember = await DB.from("workspace_members")
      .join("users", "workspace_members.user_id", "users.id")
      .where({ "workspace_members.workspace_id": workspaceId, "users.email": inviteeEmail })
      .first();

    if (alreadyMember) {
      return jsonError(res, "User sudah menjadi member workspace ini", 422);
    }

    const hasPending = await WorkspaceInvitation.hasPendingInvitation(workspaceId, inviteeEmail);
    if (hasPending) {
      return jsonError(res, "Undangan sudah dikirim ke email ini", 422);
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;

    await WorkspaceInvitation.create({
      id: crypto.randomUUID(),
      workspace_id: workspaceId,
      inviter_id: req.user.id,
      invitee_email: inviteeEmail,
      token,
      status: "pending",
      expires_at: expiresAt,
    } as any);

    const invitee = await DB.from("users").where({ email: inviteeEmail }).select("id").first();
    if (invitee) {
      await Notification.createForUser(invitee.id, "workspace_invitation", {
        workspace_id: workspaceId,
        workspace_name: workspace.name,
        inviter_name: req.user.name || req.user.email,
        token,
      });
    }

    return jsonSuccess(res, "Undangan berhasil dikirim");
  }

  async cancelInvite(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");
    const invitationId = this.getRequiredParam(req, "invitationId");

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return jsonError(res, "Workspace not found", 404);
    }

    const isOwner = workspace.owner_id === req.user.id;
    if (!isOwner) {
      return jsonError(res, "Forbidden", 403);
    }

    const invitation = await WorkspaceInvitation.findById(invitationId);
    if (!invitation || invitation.workspace_id !== workspaceId) {
      return jsonError(res, "Undangan tidak ditemukan", 404);
    }

    if (invitation.status !== "pending") {
      return jsonError(res, "Undangan sudah tidak aktif", 422);
    }

    await WorkspaceInvitation.delete(invitationId);

    return jsonSuccess(res, "Undangan berhasil dibatalkan");
  }

  async removeMember(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");
    const targetUserId = this.getRequiredParam(req, "userId");

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return jsonError(res, "Workspace not found", 404);
    }

    if (workspace.owner_id === targetUserId) {
      return jsonError(res, "Owner tidak bisa dikeluarkan dari workspace", 422);
    }

    const isOwner = workspace.owner_id === req.user.id;
    const isSelf = targetUserId === req.user.id;

    if (!isOwner && !isSelf) {
      return jsonError(res, "Forbidden", 403);
    }

    await WorkspaceMember.removeMember(workspaceId, targetUserId);

    return jsonSuccess(res, "Member berhasil dikeluarkan");
  }
}

export const workspaceController = new WorkspaceController();
export default workspaceController;
