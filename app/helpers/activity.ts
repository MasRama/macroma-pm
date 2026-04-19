import { randomUUID } from "crypto";
import { ProjectActivityLog, ActivityEventType } from "@models";

interface LogActivityOptions {
  projectId: string;
  eventType: ActivityEventType;
  description: string;
  actorId?: string | null;
  taskId?: string | null;
  batchId?: string | null;
  meta?: Record<string, unknown> | null;
}

export async function logActivity(opts: LogActivityOptions): Promise<void> {
  try {
    await ProjectActivityLog.create({
      id: randomUUID(),
      project_id: opts.projectId,
      event_type: opts.eventType,
      description: opts.description,
      actor_id: opts.actorId ?? null,
      task_id: opts.taskId ?? null,
      batch_id: opts.batchId ?? null,
      meta: opts.meta ? JSON.stringify(opts.meta) : null,
      created_at: Date.now(),
    });
  } catch {
    // Activity logging is non-critical — never let it break the main flow
  }
}
