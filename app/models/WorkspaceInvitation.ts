import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface WorkspaceInvitationRecord extends BaseRecord {
  id: string;
  workspace_id: string;
  inviter_id: string;
  invitee_email: string;
  token: string;
  status: 'pending' | 'accepted' | 'declined';
  expires_at: number;
  created_at: number;
  updated_at: number;
}

export interface CreateWorkspaceInvitationData {
  id: string;
  workspace_id: string;
  inviter_id: string;
  invitee_email: string;
  token: string;
  status?: string;
  expires_at: number;
}

class WorkspaceInvitationModel extends BaseModel<WorkspaceInvitationRecord> {
  protected tableName = "workspace_invitations";

  async findByToken(token: string): Promise<WorkspaceInvitationRecord | undefined> {
    return this.query().where({ token }).first();
  }

  async findPendingForEmail(email: string): Promise<WorkspaceInvitationRecord[]> {
    return this.query()
      .where({ invitee_email: email, status: 'pending' })
      .where('expires_at', '>', Date.now())
      .orderBy('created_at', 'desc');
  }

  async findByWorkspace(workspaceId: string): Promise<WorkspaceInvitationRecord[]> {
    return this.query().where({ workspace_id: workspaceId }).orderBy('created_at', 'desc');
  }

  async hasPendingInvitation(workspaceId: string, email: string): Promise<boolean> {
    const record = await this.query()
      .where({ workspace_id: workspaceId, invitee_email: email, status: 'pending' })
      .where('expires_at', '>', Date.now())
      .first();
    return !!record;
  }

  async updateStatus(id: string, status: 'accepted' | 'declined'): Promise<void> {
    await DB.from(this.tableName).where({ id }).update({ status, updated_at: Date.now() });
  }
}

export const WorkspaceInvitation = new WorkspaceInvitationModel();
export default WorkspaceInvitation;
