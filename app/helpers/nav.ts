import { Workspace, Project } from "@models";

export interface NavProject {
  id: string;
  name: string;
  workspace_id: string | null;
}

export interface NavWorkspace {
  id: string;
  name: string;
  projects: NavProject[];
}

export interface NavData {
  nav_workspaces: NavWorkspace[];
  nav_projects_standalone: NavProject[];
}

export async function buildNavData(userId: string): Promise<NavData> {
  const [workspaces, allProjects] = await Promise.all([
    Workspace.findAllForUser(userId),
    Project.findAllForUser(userId),
  ]);

  const projectsByWorkspace = new Map<string, NavProject[]>();
  const standaloneProjects: NavProject[] = [];

  for (const p of allProjects) {
    const nav: NavProject = { id: p.id, name: p.name, workspace_id: p.workspace_id };
    if (p.workspace_id) {
      const bucket = projectsByWorkspace.get(p.workspace_id) ?? [];
      bucket.push(nav);
      projectsByWorkspace.set(p.workspace_id, bucket);
    } else {
      standaloneProjects.push(nav);
    }
  }

  const nav_workspaces: NavWorkspace[] = workspaces.map((ws) => ({
    id: ws.id,
    name: ws.name,
    projects: projectsByWorkspace.get(ws.id) ?? [],
  }));

  return {
    nav_workspaces,
    nav_projects_standalone: standaloneProjects,
  };
}
