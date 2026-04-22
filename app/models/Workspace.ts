import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface WorkspaceRecord extends BaseRecord {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: number;
  updated_at: number;
}

export interface CreateWorkspaceData {
  id: string;
  name: string;
  description?: string | null;
  owner_id: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string | null;
}

class WorkspaceModel extends BaseModel<WorkspaceRecord> {
  protected tableName = "workspaces";

  async findAllForUser(userId: string): Promise<WorkspaceRecord[]> {
    return DB.from("workspaces")
      .join("workspace_members", "workspaces.id", "workspace_members.workspace_id")
      .where("workspace_members.user_id", userId)
      .select("workspaces.*")
      .orderBy("workspaces.created_at", "desc");
  }

  async isOwner(workspaceId: string, userId: string): Promise<boolean> {
    const ws = await this.query().where({ id: workspaceId, owner_id: userId }).first();
    return !!ws;
  }
}

export const Workspace = new WorkspaceModel();
export default Workspace;
