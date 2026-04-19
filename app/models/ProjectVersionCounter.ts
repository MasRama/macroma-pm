import DB from "@services/DB";
import { Knex } from "knex";

export interface ProjectVersionCounterRecord {
  project_id: string;
  patch_counter: number;
  updated_at: number;
}

class ProjectVersionCounterModel {
  protected tableName = "project_version_counters";

  /**
   * Atomically increment the patch counter for a project and return the new value.
   * If no counter row exists yet, creates one starting at 1.
   * Must be called INSIDE an existing Knex transaction (pass the trx object).
   */
  async incrementAndGet(projectId: string, trx: Knex.Transaction): Promise<number> {
    const existing = await trx<ProjectVersionCounterRecord>(this.tableName)
      .where("project_id", projectId)
      .first();

    const now = Date.now();

    if (!existing) {
      await trx(this.tableName).insert({
        project_id: projectId,
        patch_counter: 1,
        updated_at: now,
      });
      return 1;
    } else {
      const newCounter = existing.patch_counter + 1;
      await trx(this.tableName)
        .where("project_id", projectId)
        .update({ patch_counter: newCounter, updated_at: now });
      return newCounter;
    }
  }

  async ensureExists(projectId: string): Promise<void> {
    const existing = await DB.from<ProjectVersionCounterRecord>(this.tableName)
      .where("project_id", projectId)
      .first();
    if (!existing) {
      await DB.from(this.tableName).insert({
        project_id: projectId,
        patch_counter: 0,
        updated_at: Date.now(),
      });
    }
  }

  async get(projectId: string): Promise<ProjectVersionCounterRecord | undefined> {
    return DB.from<ProjectVersionCounterRecord>(this.tableName)
      .where("project_id", projectId)
      .first();
  }
}

export const ProjectVersionCounter = new ProjectVersionCounterModel();
export default ProjectVersionCounter;
