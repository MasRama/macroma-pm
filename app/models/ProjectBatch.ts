import { BaseModel, BaseRecord } from "./BaseModel";

export interface ProjectBatchRecord extends BaseRecord {
  id: string;
  project_id: string;
  major: number;
  minor: number;
  label: string | null;
  is_active: boolean;
  created_at: number;
  updated_at: number;
}

export function versionString(batch: ProjectBatchRecord): string {
  return `v${batch.major}.${batch.minor}${batch.label ? " " + batch.label : ""}`;
}

class ProjectBatchModel extends BaseModel<ProjectBatchRecord> {
  protected tableName = "project_batches";

  async findByProject(projectId: string): Promise<ProjectBatchRecord[]> {
    return this.query()
      .where("project_id", projectId)
      .orderBy("major", "desc")
      .orderBy("minor", "desc");
  }

  async findActive(projectId: string): Promise<ProjectBatchRecord | undefined> {
    return this.query().where({ project_id: projectId, is_active: true }).first();
  }

  async getNextVersion(projectId: string, bumpMajor: boolean): Promise<{ major: number; minor: number }> {
    const latest = await this.query()
      .where("project_id", projectId)
      .orderBy("major", "desc")
      .orderBy("minor", "desc")
      .first();

    if (!latest) {
      return { major: 0, minor: 1 };
    }

    if (bumpMajor) {
      return { major: latest.major + 1, minor: 0 };
    }

    return { major: latest.major, minor: latest.minor + 1 };
  }
}

export const ProjectBatch = new ProjectBatchModel();
export default ProjectBatch;
