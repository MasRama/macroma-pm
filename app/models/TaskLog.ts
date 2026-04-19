import { BaseModel, BaseRecord } from "./BaseModel";

export interface TaskLogRecord extends BaseRecord {
  id: string;
  task_id: string;
  version: string;
  column_from: string | null;
  column_to: string;
  note: string;
  created_by: string | null;
  created_at: number;
  // NO updated_at — task_logs are immutable
}

class TaskLogModel extends BaseModel<TaskLogRecord> {
  protected tableName = "task_logs";

  protected timestampOptions = {
    useTimestamps: false,
  };

  async findByTask(taskId: string): Promise<TaskLogRecord[]> {
    return this.query().where("task_id", taskId).orderBy("created_at", "asc");
  }

  async create(data: Partial<Omit<TaskLogRecord, "created_at">> & { id: string }): Promise<TaskLogRecord> {
    const insertData = {
      ...data,
      created_at: Date.now(),
    };
    await this.query().insert(insertData);
    const record = await this.findById(data.id);
    return record as TaskLogRecord;
  }

  // Override update to enforce immutability
  async update(_id: string | number, _data: Partial<Omit<TaskLogRecord, "id" | "created_at">>): Promise<TaskLogRecord | undefined> {
    throw new Error("TaskLog records are immutable and cannot be updated");
  }

  // Override delete to enforce immutability
  async delete(_id: string | number): Promise<number> {
    throw new Error("TaskLog records are immutable and cannot be deleted");
  }
}

export const TaskLog = new TaskLogModel();
export default TaskLog;
