import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface WorkspaceMemberRecord extends BaseRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  created_at: number;
}

export interface CreateWorkspaceMemberData {
  id: string;
  workspace_id: string;
  user_id: string;
  role?: string;
}

class WorkspaceMemberModel extends BaseModel<WorkspaceMemberRecord> {
  protected tableName = "workspace_members";
  protected timestampOptions = { useTimestamps: false };

  async isMember(workspaceId: string, userId: string): Promise<boolean> {
    const record = await this.query().where({ workspace_id: workspaceId, user_id: userId }).first();
    return !!record;
  }

  async findByWorkspace(workspaceId: string): Promise<WorkspaceMemberRecord[]> {
    return this.query().where({ workspace_id: workspaceId }).orderBy("created_at", "asc");
  }

  async findByUser(userId: string): Promise<WorkspaceMemberRecord[]> {
    return this.query().where({ user_id: userId });
  }

  async getMemberRole(workspaceId: string, userId: string): Promise<string | null> {
    const record = await this.query().where({ workspace_id: workspaceId, user_id: userId }).first();
    return record?.role ?? null;
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await DB.from(this.tableName).where({ workspace_id: workspaceId, user_id: userId }).delete();
  }
}

export const WorkspaceMember = new WorkspaceMemberModel();
export default WorkspaceMember;
