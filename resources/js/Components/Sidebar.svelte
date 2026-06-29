<script lang="ts">
  import { inertia, page as inertiaPage, router } from '@inertiajs/svelte';
  import { fly, fade } from 'svelte/transition';
  import DarkModeToggle from './DarkModeToggle.svelte';
  import NotificationDropdown from './NotificationDropdown.svelte';
  import LogoMark from './LogoMark.svelte';
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

  // ── Flyout state ──────────────────────────────────────────────
  // Which flyout panel is open: null | 'workspaces' | 'projects'
  let openFlyout = $state<string | null>(null);
  let expandedWorkspaces = $state<Set<string>>(new Set());
  let showUserMenu = $state(false);
  let railEl = $state<HTMLElement | null>(null);

  // Determine current page from inertia url
  let currentPath = $derived(($inertiaPage.url as string) || '');
  let onDashboard = $derived(currentPath === '/dashboard' || currentPath === '/');
  let onWorkspaces = $derived(currentPath.startsWith('/workspaces'));
  let onProjects = $derived(currentPath.startsWith('/projects'));

  function toggleFlyout(name: string) {
    openFlyout = openFlyout === name ? null : name;
  }

  function toggleWorkspace(id: string) {
    const next = new Set(expandedWorkspaces);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    expandedWorkspaces = next;
  }

  function closeAll() {
    openFlyout = null;
    showUserMenu = false;
  }

  function handleLogout() {
    showUserMenu = false;
    router.post('/logout', {}, { headers: buildCSRFHeaders() });
  }

  // Auto-expand active workspace on first render
  $effect(() => {
    if (activeWorkspaceId && !expandedWorkspaces.has(activeWorkspaceId)) {
      expandedWorkspaces = new Set([...expandedWorkspaces, activeWorkspaceId]);
    }
  });
</script>

<!-- ═══════════════════════════════════════════════════════════════
     V2 Icon Rail — 64px fixed left, Linear/Notion style
     ═══════════════════════════════════════════════════════════════ -->
<aside data-testid="sidebar" class="fixed left-0 top-0 h-screen w-16 bg-white dark:bg-[#1c1814] border-r border-stone-200/70 dark:border-white/10 flex flex-col z-40 font-display">
  <!-- subtle mesh top -->
  <div class="absolute top-0 left-0 w-32 h-24 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(22,167,102,0.10),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_20%_0%,rgba(22,167,102,0.14),transparent_60%)] pointer-events-none"></div>

  <!-- Logo -->
  <div class="h-16 flex items-center justify-center relative z-10 border-b border-stone-100 dark:border-white/[0.05]">
    <a use:inertia href="/dashboard" class="block cursor-pointer" title="Dashboard">
      <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(22,167,102,0.45)] hover:bg-brand-400 transition-colors">
        <LogoMark class="w-5 h-5 text-white" />
      </div>
    </a>
  </div>

  <!-- Primary nav icons -->
  <nav class="flex-1 flex flex-col items-center gap-1.5 py-4 relative z-10">
    <!-- Dashboard -->
    <a
      use:inertia
      href="/dashboard"
      class="rail-icon {onDashboard ? 'rail-active' : ''}"
      title="Dashboard"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
    </a>

    <!-- Workspaces (flyout trigger) -->
    <button
      onclick={() => toggleFlyout('workspaces')}
      class="rail-icon {onWorkspaces || openFlyout === 'workspaces' ? 'rail-active' : ''}"
      title="Workspace"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
      {#if nav_workspaces.length > 0}
        <span class="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-500"></span>
      {/if}
    </button>

    <!-- Projects (flyout trigger) -->
    <button
      onclick={() => toggleFlyout('projects')}
      class="rail-icon {onProjects || openFlyout === 'projects' ? 'rail-active' : ''}"
      title="Project"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      {#if nav_projects_standalone.length > 0}
        <span class="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-teal-500"></span>
      {/if}
    </button>
  </nav>

  <!-- Bottom: notifications + darkmode + user -->
  <div class="flex flex-col items-center gap-1.5 py-4 relative z-10 border-t border-stone-100 dark:border-white/[0.05]">
    <NotificationDropdown {unread_count} />
    <DarkModeToggle />

    <!-- User avatar -->
    <button
      onclick={() => showUserMenu = !showUserMenu}
      class="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs hover:bg-brand-400 transition-colors cursor-pointer"
      title={($inertiaPage.props.user as any)?.name || 'User'}
    >
      {(($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'U')[0].toUpperCase()}
    </button>
  </div>
</aside>

<!-- ═══════════════════════════════════════════════════════════════
     Flyout panels — overlay, slide from rail
     ═══════════════════════════════════════════════════════════════ -->
{#if openFlyout}
  <!-- Click-catcher — above page content (z-30), below rail (z-40) so rail stays clickable -->
  <div
    class="fixed inset-0 z-30"
    onclick={() => openFlyout = null}
    onkeydown={(e) => e.key === 'Escape' && (openFlyout = null)}
    role="button"
    tabindex="-1"
    aria-label="Close panel"
  ></div>

  <!-- Panel — topmost (z-50) so it covers all content -->
  <div
    class="fixed top-0 left-16 h-screen w-64 bg-white dark:bg-[#1c1814] border-r border-stone-200/70 dark:border-white/10 z-50 flex flex-col shadow-[0_0_40px_-10px_rgba(0,0,0,0.15)] dark:shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)]"
    transition:fly={{ x: -20, duration: 200 }}
  >
    <!-- Panel header -->
    <div class="h-16 flex items-center justify-between px-5 border-b border-stone-100 dark:border-white/[0.05]">
      <span class="text-sm font-bold text-stone-900 dark:text-white">
        {openFlyout === 'workspaces' ? 'Workspace' : 'Project'}
      </span>
      <button onclick={() => openFlyout = null} class="w-6 h-6 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Panel content -->
    <div class="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar">
      {#if openFlyout === 'workspaces'}
        <!-- New workspace CTA -->
        <a use:inertia href="/workspaces" class="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 text-sm font-semibold hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Workspace baru
        </a>

        {#if nav_workspaces.length === 0}
          <p class="px-3 py-4 text-xs text-stone-400 dark:text-stone-500 text-center">Belum ada workspace</p>
        {:else}
          <div class="space-y-0.5">
            {#each nav_workspaces as workspace, wsIndex}
              {@const isActiveWs = activeWorkspaceId === workspace.id}
              {@const isExpanded = expandedWorkspaces.has(workspace.id)}
              {@const hasActiveProject = workspace.projects.some(p => p.id === activeProjectId)}
              {@const dotColors = ['bg-brand-500', 'bg-brand-400', 'bg-teal-500', 'bg-teal-400']}

              <div>
                <div class="flex items-center gap-1 rounded-xl {isActiveWs || hasActiveProject ? 'bg-brand-50 dark:bg-brand-500/10' : ''}">
                  <a use:inertia href="/workspaces/{workspace.id}" onclick={() => openFlyout = null} class="flex-1 flex items-center gap-2.5 px-3 py-2 text-sm font-semibold transition-colors {isActiveWs || hasActiveProject ? 'text-brand-700 dark:text-brand-400' : 'text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white'}">
                    <span class="w-2 h-2 rounded-full {dotColors[wsIndex % 4]} shrink-0"></span>
                    <span class="truncate flex-1">{workspace.name}</span>
                  </a>
                  {#if workspace.projects.length > 0}
                    <button onclick={() => toggleWorkspace(workspace.id)} class="p-1.5 mr-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer" aria-label="Toggle">
                      <svg class="w-3 h-3 transition-transform duration-200 {isExpanded ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  {/if}
                </div>
                {#if isExpanded && workspace.projects.length > 0}
                  <div class="ml-4 mt-0.5 space-y-0.5 border-l border-stone-200 dark:border-white/10 pl-2">
                    {#each workspace.projects as project}
                      {@const isActiveProject = activeProjectId === project.id}
                      <a use:inertia href="/projects/{project.id}" onclick={() => openFlyout = null} class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all {isActiveProject ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400' : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-white/[0.04]'}">
                        <svg class="w-3 h-3 shrink-0 {isActiveProject ? 'text-brand-500' : 'text-stone-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                        <span class="truncate">{project.name}</span>
                      </a>
                    {/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      {:else if openFlyout === 'projects'}
        <!-- New project CTA -->
        <a use:inertia href="/projects" class="flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 text-sm font-semibold hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-colors cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Project baru
        </a>

        {#if nav_projects_standalone.length === 0}
          <p class="px-3 py-4 text-xs text-stone-400 dark:text-stone-500 text-center">Belum ada project lepas</p>
        {:else}
          <div class="space-y-0.5">
            {#each nav_projects_standalone as project, index}
              {@const isActiveProject = activeProjectId === project.id}
              {@const dotColors = ['bg-brand-500', 'bg-brand-400', 'bg-teal-500', 'bg-teal-400']}
              <a use:inertia href="/projects/{project.id}" onclick={() => openFlyout = null} class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all {isActiveProject ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-400' : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/5'}">
                <span class="w-2 h-2 rounded-full {dotColors[index % 4]} shrink-0"></span>
                <span class="truncate">{project.name}</span>
              </a>
            {/each}
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}

<!-- User menu (logout) -->
{#if showUserMenu}
  <div
    use:clickOutside
    onclick_outside={() => showUserMenu = false}
    transition:fly={{ y: 8, duration: 150 }}
    class="fixed z-[9999] bg-white dark:bg-stone-900 ring-1 ring-stone-900/10 dark:ring-white/10 rounded-xl shadow-lg overflow-hidden"
    style="bottom: 80px; left: 76px; width: 180px;"
  >
    <div class="px-4 py-3 border-b border-stone-100 dark:border-white/[0.05]">
      <p class="text-xs font-semibold text-stone-700 dark:text-stone-200 truncate">{($inertiaPage.props.user as any)?.name || 'User'}</p>
      <p class="text-[10px] text-stone-400 dark:text-stone-500 truncate">{($inertiaPage.props.user as any)?.email || ''}</p>
    </div>
    <a use:inertia href="/profile" onclick={() => showUserMenu = false} class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
      Profil
    </a>
    <button onclick={handleLogout} class="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full text-left cursor-pointer">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
      Keluar
    </button>
  </div>
{/if}

<style>
  /* Icon rail button base */
  .rail-icon {
    position: relative;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a8a29e;
    transition: all 0.2s;
    cursor: pointer;
  }
  .rail-icon:hover {
    background: #f5f5f4;
    color: #44403c;
  }
  :global(.dark) .rail-icon { color: #78716c; }
  :global(.dark) .rail-icon:hover {
    background: rgba(255,255,255,0.05);
    color: #e7e5e4;
  }
  .rail-active {
    background: #edfdf4;
    color: #0b8552;
  }
  .rail-active:hover {
    background: #d4f7e2;
    color: #0a6a44;
  }
  :global(.dark) .rail-active {
    background: rgba(22,167,102,0.1);
    color: #3cc483;
  }
  :global(.dark) .rail-active:hover {
    background: rgba(22,167,102,0.2);
    color: #73dda7;
  }
  .rail-active::before {
    content: '';
    position: absolute;
    left: -0.5rem;
    top: 50%;
    transform: translateY(-50%);
    width: 0.25rem;
    height: 1.25rem;
    border-radius: 9999px;
    background: #16a766;
  }

  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(22,167,102,0.3); }
</style>
