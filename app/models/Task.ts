import { BaseModel, BaseRecord } from "./BaseModel";
import DB from "@services/DB";

export interface TaskRecord extends BaseRecord {
  id: string;
  project_id: string;
  batch_id: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  assignee_id: string | null;
  column_id: "backlog" | "ongoing" | "revisi" | "done";
  sort_order: number;
  version_major: number;
  version_minor: number;
  version_patch: number;
  created_at: number;
  updated_at: number;
}

export function taskVersionString(task: TaskRecord): string {
  return `v${task.version_major}.${task.version_minor}.${task.version_patch}`;
}

class TaskModel extends BaseModel<TaskRecord> {
  protected tableName = "tasks";

  async findByProject(projectId: string, batchId?: string | null): Promise<TaskRecord[]> {
    let query = this.query().where("project_id", projectId);
    if (batchId !== undefined) {
      query = query.where("batch_id", batchId);
    }
    return query.orderBy("sort_order", "asc");
  }

  async findByColumn(projectId: string, column: string, batchId?: string | null): Promise<TaskRecord[]> {
    let query = this.query().where({ project_id: projectId, column_id: column });
    if (batchId !== undefined) {
      query = query.where("batch_id", batchId);
    }
    return query.orderBy("sort_order", "asc");
  }

  async getMaxSortOrder(projectId: string, columnId: string): Promise<number> {
    const result = await this.query()
      .where({ project_id: projectId, column_id: columnId })
      .max("sort_order as max_sort")
      .first();
    return Number((result as { max_sort: number | null })?.max_sort ?? 0);
  }

  async incrementVersion(id: string): Promise<TaskRecord | undefined> {
    await DB.from(this.tableName)
      .where("id", id)
      .increment("version_patch", 1)
      .update({ updated_at: Date.now() });
    return this.findById(id);
  }
}

export const Task = new TaskModel();
export default Task;
