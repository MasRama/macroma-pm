import type { NaraRequest, NaraResponse } from "@core";
import { BaseController } from "@core";
import { Workspace, Project, Task, Notification } from "@models";
import { buildNavData } from "@helpers/nav";
import DB from "@services/DB";

class DashboardController extends BaseController {
  async index(req: NaraRequest, res: NaraResponse) {
    this.requireAuth(req);

    const userId = req.user.id;

    const [nav, unreadCount, workspaces, allProjects] = await Promise.all([
      buildNavData(userId),
      Notification.countUnread(userId),
      Workspace.findAllForUser(userId),
      Project.findAllForUser(userId),
    ]);

    const projectIds = allProjects.map((p) => p.id);
    const workspaceIds = workspaces.map((w) => w.id);

    const [taskCounts, recentActivity] = await Promise.all([
      projectIds.length > 0
        ? DB.from("tasks")
            .whereIn("project_id", projectIds)
            .select("column_id")
            .count("* as count")
            .groupBy("column_id")
            .then((rows: { column_id: string; count: number | string }[]) =>
              rows.reduce(
                (acc, row) => {
                  acc[row.column_id] = Number(row.count);
                  return acc;
                },
                {} as Record<string, number>
              )
            )
        : Promise.resolve({} as Record<string, number>),
      projectIds.length > 0
        ? DB.from("project_activity_logs")
            .whereIn("project_id", projectIds)
            .orderBy("created_at", "desc")
            .limit(8)
            .select("id", "project_id", "event_type", "description", "created_at")
        : Promise.resolve([]),
    ]);

    const tasksPerProject = projectIds.length > 0
      ? await DB.from("tasks")
          .whereIn("project_id", projectIds)
          .select("project_id")
          .count("* as count")
          .groupBy("project_id")
          .then((rows: { project_id: string; count: number | string }[]) =>
            rows.map((r) => {
              const project = allProjects.find((p) => p.id === r.project_id);
              return { name: project?.name ?? "Unknown", count: Number(r.count) };
            })
          )
      : [];

    // ── 7-day trend data (real, cumulative) ───────────────────────
    // For each of the last 7 days, count entities created up to end-of-that-day.
    // "Selesai" = tasks with column_id='done' AND updated_at <= end-of-day.
    const trends = await this.computeTrends(userId, projectIds, workspaceIds, 7);

    const projectsWithWorkspace = allProjects.map((p) => ({
      id: p.id,
      name: p.name,
      workspace_id: p.workspace_id,
    }));

    this.requireInertia(res);
    return res.inertia("dashboard", {
      user: req.user,
      unread_count: unreadCount,
      stats: {
        workspace_count: workspaces.length,
        project_count: allProjects.length,
        task_backlog: taskCounts["backlog"] ?? 0,
        task_ongoing: taskCounts["ongoing"] ?? 0,
        task_revisi: taskCounts["revisi"] ?? 0,
        task_review: taskCounts["review"] ?? 0,
        task_done: taskCounts["done"] ?? 0,
      },
      trends,
      tasks_per_project: tasksPerProject,
      recent_activity: recentActivity,
      projects: projectsWithWorkspace,
      ...nav,
    });
  }

  /**
   * Compute 7-day cumulative trends for sparklines.
   * Returns array of { day, workspace, project, active, done } where each
   * value is the cumulative count up to end of that day.
   */
  private async computeTrends(
    userId: string,
    projectIds: string[],
    workspaceIds: string[],
    days: number
  ): Promise<{ day: string; workspace: number; project: number; active: number; done: number }[]> {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const dayMs = 24 * 60 * 60 * 1000;
    const result: { day: string; workspace: number; project: number; active: number; done: number }[] = [];

    // Build day boundaries (oldest first)
    const boundaries: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      boundaries.push(now.getTime() - i * dayMs);
    }

    for (const endTs of boundaries) {
      const dayLabel = new Date(endTs).toLocaleDateString('id-ID', { weekday: 'short' });

      // Workspace cumulative (owned by user, created <= endTs)
      const wsCount = workspaceIds.length > 0
        ? await DB.from("workspaces")
            .where("owner_id", userId)
            .where("created_at", "<=", endTs)
            .count("* as c")
            .then((r: any[]) => Number(r[0]?.c ?? 0))
        : 0;

      // Project cumulative (accessible to user, created <= endTs)
      const projCount = projectIds.length > 0
        ? await DB.from("projects")
            .whereIn("id", projectIds)
            .where("created_at", "<=", endTs)
            .count("* as c")
            .then((r: any[]) => Number(r[0]?.c ?? 0))
        : 0;

      // Active tasks (ongoing/revisi/review) with updated_at <= endTs
      let activeCount = 0;
      let doneCount = 0;
      if (projectIds.length > 0) {
        const colCounts = await DB.from("tasks")
          .whereIn("project_id", projectIds)
          .where("updated_at", "<=", endTs)
          .whereIn("column_id", ["ongoing", "revisi", "review", "done"])
          .select("column_id")
          .count("* as c")
          .groupBy("column_id")
          .then((rows: { column_id: string; c: number | string }[]) =>
            rows.reduce((acc, r) => {
              acc[r.column_id] = Number(r.c);
              return acc;
            }, {} as Record<string, number>)
          );

        activeCount = (colCounts["ongoing"] ?? 0) + (colCounts["revisi"] ?? 0) + (colCounts["review"] ?? 0);
        doneCount = colCounts["done"] ?? 0;
      }

      result.push({ day: dayLabel, workspace: wsCount, project: projCount, active: activeCount, done: doneCount });
    }

    return result;
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
