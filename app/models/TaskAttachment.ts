import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface TaskAttachmentRecord extends BaseRecord {
  id: string;
  task_id: string;
  url: string;
  name: string | null;
  mime_type: string | null;
  size: number | null;
  uploaded_by: string | null;
  created_at: number;
  updated_at: number;
}

export interface TaskAttachmentWithUser extends TaskAttachmentRecord {
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    avatar: string | null;
  } | null;
}

class TaskAttachmentModel extends BaseModel<TaskAttachmentRecord> {
  protected tableName = "task_attachments";

  async findByTask(taskId: string): Promise<TaskAttachmentWithUser[]> {
    const rows = await DB.from("task_attachments")
      .leftJoin("users", "task_attachments.uploaded_by", "users.id")
      .where("task_attachments.task_id", taskId)
      .orderBy("task_attachments.created_at", "asc")
      .select(
        "task_attachments.*",
        "users.id as user__id",
        "users.name as user__name",
        "users.email as user__email",
        "users.avatar as user__avatar"
      );

    return rows.map((row) => ({
      id: row.id,
      task_id: row.task_id,
      url: row.url,
      name: row.name,
      mime_type: row.mime_type,
      size: row.size,
      uploaded_by: row.uploaded_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: row["user__id"]
        ? {
            id: row["user__id"],
            name: row["user__name"],
            email: row["user__email"],
            avatar: row["user__avatar"],
          }
        : null,
    }));
  }

  async countByTask(taskId: string): Promise<number> {
    const result = await DB.from(this.tableName)
      .where("task_id", taskId)
      .count("* as count")
      .first();
    return Number((result as { count: number | string } | undefined)?.count || 0);
  }
}

export const TaskAttachment = new TaskAttachmentModel();
export default TaskAttachment;
