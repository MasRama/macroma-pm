<script lang="ts">
  import Sidebar from './Sidebar.svelte';
  import WorkspaceChatWidget from './WorkspaceChatWidget.svelte';

  interface NavProject {
    id: string;
    name: string;
    workspace_id: string | null;
  }

  interface NavWorkspace {
    id: string;
    name: string;
    projects: NavProject[];
  }

  let {
    title = 'PM Macroma',
    children,
    nav_workspaces = [],
    nav_projects_standalone = [],
    activeProjectId = '',
    activeWorkspaceId = '',
    unread_count = 0,
    chat_workspace_id = '',
    chat_workspace_name = '',
  }: {
    title?: string;
    children: import('svelte').Snippet;
    nav_workspaces?: NavWorkspace[];
    nav_projects_standalone?: NavProject[];
    activeProjectId?: string;
    activeWorkspaceId?: string;
    unread_count?: number;
    chat_workspace_id?: string;
    chat_workspace_name?: string;
  } = $props();
</script>

<svelte:head>
  <title>{title} — PM Macroma</title>
</svelte:head>

<div class="flex min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-300">
  <Sidebar {nav_workspaces} {nav_projects_standalone} {activeProjectId} {activeWorkspaceId} {unread_count} />

  <main class="flex-1 ml-[260px] min-h-screen">
    {@render children()}
  </main>
</div>

{#if chat_workspace_id}
  <WorkspaceChatWidget workspace_id={chat_workspace_id} workspace_name={chat_workspace_name} />
{/if}
