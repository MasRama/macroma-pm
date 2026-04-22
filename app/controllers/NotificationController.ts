import type { NaraRequest, NaraResponse } from "@core";
import { BaseController, jsonSuccess, jsonError } from "@core";
import { Notification } from "@models";

class NotificationController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const notifications = await Notification.findForUser(req.user.id, 30);
    const unreadCount = await Notification.countUnread(req.user.id);

    const parsed = notifications.map((n) => ({
      ...n,
      data: JSON.parse(n.data),
    }));

    return jsonSuccess(res, "Notifications retrieved", {
      notifications: parsed,
      unread_count: unreadCount,
    });
  }

  async markRead(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const id = this.getRequiredParam(req, "id");

    const notification = await Notification.findById(id);
    if (!notification) {
      return jsonError(res, "Notification not found", 404);
    }

    if (notification.user_id !== req.user.id) {
      return jsonError(res, "Forbidden", 403);
    }

    await Notification.markRead(id);

    return jsonSuccess(res, "Marked as read");
  }

  async markAllRead(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    await Notification.markAllRead(req.user.id);

    return jsonSuccess(res, "All notifications marked as read");
  }
}

export const notificationController = new NotificationController();
export default notificationController;
