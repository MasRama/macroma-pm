import type { NaraRequest, NaraResponse } from "@core";
import { BaseController, jsonSuccess, jsonError } from "@core";
import { WorkspaceInvitation, WorkspaceMember, Workspace, Notification } from "@models";
import DB from "@services/DB";

class WorkspaceInvitationController extends BaseController {
  async respond(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const token = this.getRequiredParam(req, "token");

    let body: { action?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    if (!body.action || !["accept", "decline"].includes(body.action)) {
      return jsonError(res, "Action harus 'accept' atau 'decline'", 422);
    }

    const invitation = await WorkspaceInvitation.findByToken(token);
    if (!invitation) {
      return jsonError(res, "Undangan tidak ditemukan", 404);
    }

    if (invitation.status !== "pending") {
      return jsonError(res, "Undangan ini sudah direspon", 422);
    }

    if (invitation.expires_at < Date.now()) {
      return jsonError(res, "Undangan sudah kadaluarsa", 422);
    }

    if (invitation.invitee_email.toLowerCase() !== req.user.email.toLowerCase()) {
      return jsonError(res, "Undangan ini bukan untuk Anda", 403);
    }

    const newStatus = body.action === "accept" ? "accepted" : "declined";
    await WorkspaceInvitation.updateStatus(invitation.id, newStatus);

    await DB.from("notifications")
      .where({ user_id: req.user.id, type: "workspace_invitation" })
      .whereRaw(`json_extract(data, '$.token') = ?`, [token])
      .update({ is_read: true });

    if (body.action === "accept") {
      const alreadyMember = await WorkspaceMember.isMember(invitation.workspace_id, req.user.id);
      if (!alreadyMember) {
        await WorkspaceMember.create({
          id: crypto.randomUUID(),
          workspace_id: invitation.workspace_id,
          user_id: req.user.id,
          role: "member",
        } as any);
      }

      const workspace = await Workspace.findById(invitation.workspace_id);
      const inviter = await DB.from("users").where({ id: invitation.inviter_id }).select("name", "email").first();

      await Notification.createForUser(invitation.inviter_id, "invitation_accepted", {
        workspace_id: invitation.workspace_id,
        workspace_name: workspace?.name ?? "",
        accepter_name: req.user.name || req.user.email,
      });

      return jsonSuccess(res, "Berhasil bergabung ke workspace");
    }

    return jsonSuccess(res, "Undangan ditolak");
  }
}

export const workspaceInvitationController = new WorkspaceInvitationController();
export default workspaceInvitationController;
