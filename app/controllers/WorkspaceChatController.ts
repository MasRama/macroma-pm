import type { NaraRequest, NaraResponse } from "@core";
import { BaseController, jsonSuccess, jsonCreated, jsonError, jsonServerError } from "@core";
import { WorkspaceMember, WorkspaceMessage } from "@models";

class WorkspaceChatController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");

    const isMember = await WorkspaceMember.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    const messages = await WorkspaceMessage.findByWorkspace(workspaceId, 50);

    return jsonSuccess(res, "Messages fetched", { messages });
  }

  async store(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const workspaceId = this.getRequiredParam(req, "id");

    const isMember = await WorkspaceMember.isMember(workspaceId, req.user.id);
    if (!isMember) {
      return jsonError(res, "Forbidden", 403);
    }

    let body: { message?: string };
    try {
      body = await req.json();
    } catch {
      return jsonError(res, "Invalid request body", 400);
    }

    const text = body.message ? String(body.message).trim() : "";
    if (!text) {
      return jsonError(res, "Message tidak boleh kosong", 422);
    }

    if (text.length > 2000) {
      return jsonError(res, "Message terlalu panjang (max 2000 karakter)", 422);
    }

    try {
      const messageId = crypto.randomUUID();

      await WorkspaceMessage.create({
        id: messageId,
        workspace_id: workspaceId,
        user_id: req.user.id,
        message: text,
      });

      const newMessage = await WorkspaceMessage.findById(messageId);

      return jsonCreated(res, "Message terkirim", {
        message: {
          ...newMessage,
          user: {
            id: req.user.id,
            name: (req.user as any).name ?? null,
            email: req.user.email,
            avatar: (req.user as any).avatar ?? null,
          },
        },
      });
    } catch {
      return jsonServerError(res, "Gagal mengirim pesan");
    }
  }
}

export const workspaceChatController = new WorkspaceChatController();
export default workspaceChatController;
