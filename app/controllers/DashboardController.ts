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
      tasks_per_project: tasksPerProject,
      recent_activity: recentActivity,
      projects: projectsWithWorkspace,
      ...nav,
    });
  }
}

export const dashboardController = new DashboardController();
export default dashboardController;
