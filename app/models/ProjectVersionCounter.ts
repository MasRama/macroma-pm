import DB from "@services/DB";
import { Knex } from "knex";

export interface ProjectVersionCounterRecord {
  project_id: string;
  patch_counter: number;
  major: number;
  minor: number;
  updated_at: number;
}

export interface VersionInfo {
  major: number;
  minor: number;
  patch: number;
  string: string;
}

class ProjectVersionCounterModel {
  protected tableName = "project_version_counters";

  async incrementAndGet(projectId: string, trx: Knex.Transaction): Promise<VersionInfo> {
    const existing = await trx<ProjectVersionCounterRecord>(this.tableName)
      .where("project_id", projectId)
      .first();

    const now = Date.now();

    if (!existing) {
      await trx(this.tableName).insert({
        project_id: projectId,
        patch_counter: 1,
        major: 0,
        minor: 0,
        updated_at: now,
      });
      return { major: 0, minor: 0, patch: 1, string: "v0.0.1" };
    }

    const newPatch = existing.patch_counter + 1;
    await trx(this.tableName)
      .where("project_id", projectId)
      .update({ patch_counter: newPatch, updated_at: now });

    const { major, minor } = existing;
    return { major, minor, patch: newPatch, string: `v${major}.${minor}.${newPatch}` };
  }

  async bump(projectId: string, bumpMajor: boolean): Promise<void> {
    const existing = await DB.from<ProjectVersionCounterRecord>(this.tableName)
      .where("project_id", projectId)
      .first();

    const now = Date.now();

    if (!existing) {
      await DB.from(this.tableName).insert({
        project_id: projectId,
        patch_counter: 0,
        major: bumpMajor ? 1 : 0,
        minor: bumpMajor ? 0 : 1,
        updated_at: now,
      });
      return;
    }

    const newMajor = bumpMajor ? existing.major + 1 : existing.major;
    const newMinor = bumpMajor ? 0 : existing.minor + 1;

    await DB.from(this.tableName)
      .where("project_id", projectId)
      .update({ patch_counter: 0, major: newMajor, minor: newMinor, updated_at: now });
  }

  async ensureExists(projectId: string): Promise<void> {
    const existing = await DB.from<ProjectVersionCounterRecord>(this.tableName)
      .where("project_id", projectId)
      .first();
    if (!existing) {
      await DB.from(this.tableName).insert({
        project_id: projectId,
        patch_counter: 0,
        major: 0,
        minor: 0,
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
