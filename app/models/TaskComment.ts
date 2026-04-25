import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface TaskCommentRecord extends BaseRecord {
  id: string;
  task_id: string;
  user_id: string | null;
  content: string;
  created_at: number;
  updated_at: number;
}

export interface TaskCommentWithUser extends TaskCommentRecord {
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    avatar: string | null;
  } | null;
}

class TaskCommentModel extends BaseModel<TaskCommentRecord> {
  protected tableName = "task_comments";

  async findByTask(taskId: string): Promise<TaskCommentWithUser[]> {
    const rows = await DB.from("task_comments")
      .leftJoin("users", "task_comments.user_id", "users.id")
      .where("task_comments.task_id", taskId)
      .orderBy("task_comments.created_at", "asc")
      .select(
        "task_comments.*",
        "users.id as user__id",
        "users.name as user__name",
        "users.email as user__email",
        "users.avatar as user__avatar"
      );

    return rows.map((row) => ({
      id: row.id,
      task_id: row.task_id,
      user_id: row.user_id,
      content: row.content,
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
}

export const TaskComment = new TaskCommentModel();
export default TaskComment;
