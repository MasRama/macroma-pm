import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface ProjectMemberRecord extends BaseRecord {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  created_at: number;
}

class ProjectMemberModel extends BaseModel<ProjectMemberRecord> {
  protected tableName = "project_members";

  protected timestampOptions = {
    useTimestamps: false,
  };

  async findByProject(projectId: string): Promise<ProjectMemberRecord[]> {
    return this.query().where("project_id", projectId).orderBy("created_at", "asc");
  }

  async findMembership(projectId: string, userId: string): Promise<ProjectMemberRecord | undefined> {
    return this.query().where({ project_id: projectId, user_id: userId }).first();
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const record = await this.findMembership(projectId, userId);
    return !!record;
  }

  async create(data: Partial<Omit<ProjectMemberRecord, "created_at">> & { id: string }): Promise<ProjectMemberRecord> {
    const insertData = {
      ...data,
      created_at: Date.now(),
    };
    await this.query().insert(insertData);
    const record = await this.findById(data.id);
    return record as ProjectMemberRecord;
  }

  async canAccessProject(projectId: string, userId: string): Promise<boolean> {
    const directMember = await this.findMembership(projectId, userId);
    if (directMember) return true;

    const project = await DB.from("projects").where("id", projectId).select("workspace_id").first();
    if (!project?.workspace_id) return false;

    const workspaceMember = await DB.from("workspace_members")
      .where({ workspace_id: project.workspace_id, user_id: userId })
      .first();
    return !!workspaceMember;
  }
}

export const ProjectMember = new ProjectMemberModel();
export default ProjectMember;
