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
    const memberProjectIds = await DB.from("project_members")
      .where("user_id", userId)
      .select("project_id")
      .then((rows: { project_id: string }[]) => rows.map(r => r.project_id));

    return this.query()
      .whereIn("id", memberProjectIds)
      .orderBy("created_at", "desc");
  }
}

export const Project = new ProjectModel();
export default Project;
