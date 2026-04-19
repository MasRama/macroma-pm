import { BaseModel, BaseRecord } from "./BaseModel";

export type ActivityEventType =
  | "project.created"
  | "task.created"
  | "task.moved"
  | "task.log_added"
  | "batch.created"
  | "batch.activated";

export interface ProjectActivityLogRecord extends BaseRecord {
  id: string;
  project_id: string;
  event_type: ActivityEventType;
  description: string;
  actor_id: string | null;
  task_id: string | null;
  batch_id: string | null;
  meta: string | null;
  created_at: number;
}

class ProjectActivityLogModel extends BaseModel<ProjectActivityLogRecord> {
  protected tableName = "project_activity_logs";

  async findByProject(projectId: string, limit = 50): Promise<ProjectActivityLogRecord[]> {
    return this.query()
      .where("project_id", projectId)
      .orderBy("created_at", "desc")
      .limit(limit);
  }

  async create(data: Omit<ProjectActivityLogRecord, "created_at"> & { created_at?: number }): Promise<ProjectActivityLogRecord> {
    const insertData = {
      ...data,
      created_at: data.created_at ?? Date.now(),
    };
    await this.query().insert(insertData);
    return this.findById(data.id) as Promise<ProjectActivityLogRecord>;
  }

  async update(_id: string | number, _data: Partial<ProjectActivityLogRecord>): Promise<ProjectActivityLogRecord | undefined> {
    throw new Error("ProjectActivityLog records are immutable");
  }

  async delete(_id: string | number): Promise<number> {
    throw new Error("ProjectActivityLog records are immutable");
  }
}

export const ProjectActivityLog = new ProjectActivityLogModel();
export default ProjectActivityLog;
