<script lang="ts">
  import { inertia, page as inertiaPage, router } from '@inertiajs/svelte';
  import { fly } from 'svelte/transition';
  import DarkModeToggle from './DarkModeToggle.svelte';
  import NotificationDropdown from './NotificationDropdown.svelte';
  import { buildCSRFHeaders, clickOutside } from './helper';

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
    nav_workspaces = [],
    nav_projects_standalone = [],
    activeProjectId = '',
    activeWorkspaceId = '',
    unread_count = 0,
  }: {
    nav_workspaces: NavWorkspace[];
    nav_projects_standalone: NavProject[];
    activeProjectId?: string;
    activeWorkspaceId?: string;
    unread_count?: number;
  } = $props();

  const workspaceDotColors = [
    'bg-emerald-400',
    'bg-teal-400',
    'bg-cyan-400',
    'bg-sky-400',
  ];

  const projectDotColors = [
    'bg-primary-400',
    'bg-accent-400',
    'bg-info-400',
    'bg-warning-400',
  ];

  function buildInitialExpanded(): Set<string> {
    const initial = new Set<string>();
    if (activeWorkspaceId) initial.add(activeWorkspaceId);
    if (activeProjectId) {
      const ws = nav_workspaces.find(w => w.projects.some(p => p.id === activeProjectId));
      if (ws) initial.add(ws.id);
    }
    return initial;
  }

  let expandedWorkspaces = $state<Set<string>>(buildInitialExpanded());
  let showUserMenu = $state(false);
  let profileBtnEl = $state<HTMLElement | null>(null);
  let menuPos = $state({ top: 0, left: 0, width: 0 });

  function toggleUserMenu() {
    if (!showUserMenu && profileBtnEl) {
      const rect = profileBtnEl.getBoundingClientRect();
      menuPos = { top: rect.top - 8, left: rect.left, width: rect.width };
    }
    showUserMenu = !showUserMenu;
  }

  function toggleWorkspace(id: string) {
    const next = new Set(expandedWorkspaces);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedWorkspaces = next;
  }

  function handleLogout() {
    showUserMenu = false;
    router.post('/logout', {}, {
      headers: buildCSRFHeaders()
    });
  }
</script>

<aside data-testid="sidebar" class="fixed left-0 top-0 h-screen w-[260px] bg-white dark:bg-surface-dark backdrop-blur-xl border-r border-slate-200 dark:border-white/[0.06] flex flex-col z-40 transition-all duration-300 overflow-hidden">
  <div class="absolute top-0 left-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

  <div class="h-16 flex items-center px-6 relative z-10">
    <div class="flex items-center gap-3">
      <svg class="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
      <span class="text-slate-800 dark:text-slate-100 font-bold text-lg">PM Macroma</span>
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar relative z-10 flex flex-col gap-6">

    <div>
      <a
        use:inertia
        href="/dashboard"
        class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors mb-1"
      >
        <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
        </svg>
        Dashboard
      </a>
    </div>

    <div>
      <div class="flex items-center justify-between px-3 mb-2">
        <p class="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600 font-semibold">Workspaces</p>
        <a use:inertia href="/workspaces" class="w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" title="Manage Workspaces">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </a>
      </div>

      <div class="space-y-0.5">
        {#if nav_workspaces.length === 0}
          <p class="px-3 py-2 text-xs italic text-slate-400 dark:text-slate-600">No workspaces yet</p>
        {:else}
          {#each nav_workspaces as workspace, wsIndex}
            {@const isActiveWs = activeWorkspaceId === workspace.id}
            {@const isExpanded = expandedWorkspaces.has(workspace.id)}
            {@const hasActiveProject = workspace.projects.some(p => p.id === activeProjectId)}

            <div>
              <div class="flex items-center gap-1 rounded-lg {isActiveWs || hasActiveProject ? 'bg-primary-50 dark:bg-primary-500/10' : ''}">
                <a
                  use:inertia
                  href="/workspaces/{workspace.id}"
                  class="flex-1 flex items-center gap-2.5 px-3 py-2 text-sm font-medium transition-colors {isActiveWs || hasActiveProject ? 'text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
                >
                  <span class="w-2 h-2 rounded-full {workspaceDotColors[wsIndex % 4]} shrink-0"></span>
                  <span class="truncate flex-1">{workspace.name}</span>
                </a>
                {#if workspace.projects.length > 0}
                  <button
                    onclick={() => toggleWorkspace(workspace.id)}
                    class="p-1.5 mr-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                  >
                    <svg class="w-3 h-3 transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </button>
                {/if}
              </div>

              {#if isExpanded && workspace.projects.length > 0}
                <div class="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-white/[0.06] pl-2">
                  {#each workspace.projects as project}
                    {@const isActiveProject = activeProjectId === project.id}
                    <a
                      use:inertia
                      href="/projects/{project.id}"
                      class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all {isActiveProject ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04]'}"
                    >
                      <svg class="w-3 h-3 shrink-0 {isActiveProject ? 'text-primary-500' : 'text-slate-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                      </svg>
                      <span class="truncate">{project.name}</span>
                    </a>
                  {/each}
                </div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>

    {#if nav_projects_standalone.length > 0}
      <div>
        <p class="text-xs uppercase tracking-widest text-slate-400 dark:text-slate-600 px-3 mb-2 font-semibold">Projects</p>
        <div class="space-y-0.5">
          {#each nav_projects_standalone as project, index}
            {@const isActiveProject = activeProjectId === project.id}
            <a
              use:inertia
              href="/projects/{project.id}"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all {isActiveProject ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 border-l-2 border-primary-500' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.04] border-l-2 border-transparent'}"
            >
              <span class="w-2 h-2 rounded-full {projectDotColors[index % 4]} shrink-0"></span>
              <span class="truncate">{project.name}</span>
            </a>
          {/each}
        </div>
      </div>
    {/if}

  </nav>

  <div class="p-4 relative z-10">
    <a use:inertia href="/projects" class="flex items-center justify-center w-full py-2.5 mb-5 rounded-xl bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 border border-primary-200 dark:border-primary-500/20 text-sm font-medium text-primary-600 dark:text-primary-400 transition-colors">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Project
    </a>

    <div class="flex items-center gap-3 px-2 relative" use:clickOutside onclick_outside={() => showUserMenu = false}>
      <button
        bind:this={profileBtnEl}
        onclick={toggleUserMenu}
        class="flex items-center gap-3 flex-1 min-w-0 rounded-lg py-1 px-1 -ml-1 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
      >
        <div class="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs border border-slate-300 dark:border-white/10 shrink-0">
          {(($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'U')[0].toUpperCase()}
        </div>
        <div class="flex-1 min-w-0 text-left">
          <p class="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
            {($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'User'}
          </p>
        </div>
      </button>

      <NotificationDropdown {unread_count} />

      <DarkModeToggle />
    </div>

    {#if showUserMenu}
      <div
        use:clickOutside onclick_outside={() => showUserMenu = false}
        transition:fly={{ y: 8, duration: 150 }}
        class="fixed z-[9999] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl shadow-lg overflow-hidden"
        style="bottom: {window.innerHeight - menuPos.top}px; left: {menuPos.left}px; width: {menuPos.width}px;"
      >
        <button
          onclick={handleLogout}
          class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    {/if}
  </div>
</aside>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12);
    border-radius: 10px;
  }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
