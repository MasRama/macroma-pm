import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface ProjectRecord extends BaseRecord {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  workspace_id: string | null;
  created_at: number;
  updated_at: number;
}

class ProjectModel extends BaseModel<ProjectRecord> {
  protected tableName = "projects";

  async findByOwner(userId: string): Promise<ProjectRecord[]> {
    return this.query().where("owner_id", userId).orderBy("created_at", "desc");
  }

  async findByMember(userId: string): Promise<ProjectRecord[]> {
    return DB.from("projects")
      .join("project_members", "projects.id", "project_members.project_id")
      .where("project_members.user_id", userId)
      .select("projects.*")
      .orderBy("projects.created_at", "desc");
  }

  async findAllForUser(userId: string): Promise<ProjectRecord[]> {
    const [memberProjectIds, workspaceIds] = await Promise.all([
      DB.from("project_members")
        .where("user_id", userId)
        .select("project_id")
        .then((rows: { project_id: string }[]) => rows.map((r) => r.project_id)),
      DB.from("workspace_members")
        .where("user_id", userId)
        .select("workspace_id")
        .then((rows: { workspace_id: string }[]) => rows.map((r) => r.workspace_id)),
    ]);

    if (memberProjectIds.length === 0 && workspaceIds.length === 0) {
      return [];
    }

    return this.query()
      .where(function () {
        if (memberProjectIds.length > 0) {
          this.whereIn("id", memberProjectIds);
        }
        if (workspaceIds.length > 0) {
          if (memberProjectIds.length > 0) {
            this.orWhereIn("workspace_id", workspaceIds);
          } else {
            this.whereIn("workspace_id", workspaceIds);
          }
        }
      })
      .orderBy("created_at", "desc");
  }
}

export const Project = new ProjectModel();
export default Project;
