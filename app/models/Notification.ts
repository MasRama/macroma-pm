import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface NotificationRecord extends BaseRecord {
  id: string;
  user_id: string;
  type: string;
  data: string;
  is_read: boolean;
  created_at: number;
}

export interface CreateNotificationData {
  id: string;
  user_id: string;
  type: string;
  data: string;
  is_read?: boolean;
}

class NotificationModel extends BaseModel<NotificationRecord> {
  protected tableName = "notifications";
  protected timestampOptions = { useTimestamps: false, timestampFormat: 'bigint' as const };

  async findForUser(userId: string, limit = 20): Promise<NotificationRecord[]> {
    return this.query()
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit);
  }

  async countUnread(userId: string): Promise<number> {
    return this.count({ user_id: userId, is_read: false });
  }

  async markAllRead(userId: string): Promise<void> {
    await DB.from(this.tableName)
      .where({ user_id: userId, is_read: false })
      .update({ is_read: true });
  }

  async markRead(id: string): Promise<void> {
    await DB.from(this.tableName).where({ id }).update({ is_read: true });
  }

  async createForUser(userId: string, type: string, data: Record<string, unknown>): Promise<void> {
    await this.create({
      id: crypto.randomUUID(),
      user_id: userId,
      type,
      data: JSON.stringify(data),
      created_at: Date.now(),
    } as any);
  }
}

export const Notification = new NotificationModel();
export default Notification;
