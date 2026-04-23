import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface WorkspaceMessageRecord extends BaseRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  message: string;
  created_at: number;
  updated_at: number;
}

export interface CreateWorkspaceMessageData {
  id: string;
  workspace_id: string;
  user_id: string;
  message: string;
}

export interface WorkspaceMessageWithUser extends WorkspaceMessageRecord {
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
}

class WorkspaceMessageModel extends BaseModel<WorkspaceMessageRecord> {
  protected tableName = "workspace_messages";

  async findByWorkspace(
    workspaceId: string,
    limit = 50
  ): Promise<WorkspaceMessageWithUser[]> {
    const rows = await DB.from("workspace_messages")
      .join("users", "workspace_messages.user_id", "users.id")
      .where("workspace_messages.workspace_id", workspaceId)
      .orderBy("workspace_messages.created_at", "desc")
      .limit(limit)
      .select(
        "workspace_messages.*",
        "users.id as user__id",
        "users.name as user__name",
        "users.email as user__email",
        "users.avatar as user__avatar"
      );

    return rows.reverse().map((row) => ({
      id: row.id,
      workspace_id: row.workspace_id,
      user_id: row.user_id,
      message: row.message,
      created_at: row.created_at,
      updated_at: row.updated_at,
      user: {
        id: row["user__id"],
        name: row["user__name"],
        email: row["user__email"],
        avatar: row["user__avatar"],
      },
    }));
  }
}

export const WorkspaceMessage = new WorkspaceMessageModel();
export default WorkspaceMessage;
