<script lang="ts">
  import { inertia, router } from '@inertiajs/svelte';
  import { fly, scale } from 'svelte/transition';
  import { buildCSRFHeaders, Toast } from '../Components/helper';
  import AppLayout from '../Components/AppLayout.svelte';

  interface Stats {
    workspace_count: number;
    project_count: number;
    task_backlog: number;
    task_ongoing: number;
    task_revisi: number;
    task_review: number;
    task_done: number;
  }

  interface TasksPerProject {
    name: string;
    count: number;
  }

  interface RecentActivity {
    id: string;
    project_id: string;
    event_type: string;
    description: string;
    created_at: number;
  }

  interface User {
    id: string;
    name: string | null;
    email: string;
  }

  let {
    user,
    stats,
    tasks_per_project = [],
    recent_activity = [],
    nav_workspaces = [],
    nav_projects_standalone = [],
    unread_count = 0,
  }: {
    user: User;
    stats: Stats;
    tasks_per_project: TasksPerProject[];
    recent_activity: RecentActivity[];
    nav_workspaces: any[];
    nav_projects_standalone: any[];
    unread_count: number;
  } = $props();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Selamat pagi' : hour < 18 ? 'Selamat siang' : 'Selamat malam';

  let showCreateWorkspace = $state(false);
  let showCreateProject = $state(false);
  let newWorkspaceName = $state('');
  let newWorkspaceDesc = $state('');
  let newProjectName = $state('');
  let newProjectDesc = $state('');
  let isCreatingWorkspace = $state(false);
  let isCreatingProject = $state(false);

  async function handleCreateWorkspace() {
    if (!newWorkspaceName.trim()) return;
    isCreatingWorkspace = true;
    try {
      const res = await fetch('/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ name: newWorkspaceName.trim(), description: newWorkspaceDesc.trim() || null }),
      });
      const data = await res.json();
      if (res.ok && data.data?.id) {
        showCreateWorkspace = false;
        newWorkspaceName = '';
        newWorkspaceDesc = '';
        Toast('Workspace berhasil dibuat!', 'success');
        router.visit(`/workspaces/${data.data.id}`);
      } else {
        Toast(data.message || 'Gagal membuat workspace', 'error');
      }
    } catch {
      Toast('Gagal membuat workspace', 'error');
    } finally {
      isCreatingWorkspace = false;
    }
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    isCreatingProject = true;
    try {
      const res = await fetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDesc.trim() || null }),
      });
      const data = await res.json();
      if (res.ok && data.data?.id) {
        showCreateProject = false;
        newProjectName = '';
        newProjectDesc = '';
        Toast('Project berhasil dibuat!', 'success');
        router.visit(`/projects/${data.data.id}`);
      } else {
        Toast(data.message || 'Gagal membuat project', 'error');
      }
    } catch {
      Toast('Gagal membuat project', 'error');
    } finally {
      isCreatingProject = false;
    }
  }

  const totalTasks = $derived(stats.task_backlog + stats.task_ongoing + stats.task_revisi + stats.task_review + stats.task_done);

  const donutSegments = $derived(() => {
    if (totalTasks === 0) return [];
    const segments = [
      { label: 'Backlog', value: stats.task_backlog, color: '#64748b' },
      { label: 'Ongoing', value: stats.task_ongoing, color: '#6366f1' },
      { label: 'Revisi', value: stats.task_revisi, color: '#f59e0b' },
      { label: 'Review', value: stats.task_review, color: '#a855f7' },
      { label: 'Done', value: stats.task_done, color: '#10b981' },
    ];
    const cx = 60;
    const cy = 60;
    const r = 44;
    const gap = 0.04;
    let cumulative = 0;
    return segments.map((seg) => {
      const fraction = seg.value / totalTasks;
      const startAngle = cumulative * 2 * Math.PI - Math.PI / 2 + gap;
      const endAngle = (cumulative + fraction) * 2 * Math.PI - Math.PI / 2 - gap;
      cumulative += fraction;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = fraction > 0.5 ? 1 : 0;
      const d = fraction < 0.001
        ? ''
        : `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
      return { ...seg, d, fraction };
    });
  });

  const maxTaskCount = $derived(tasks_per_project.length > 0 ? Math.max(...tasks_per_project.map(p => p.count)) : 1);

  function activityIcon(eventType: string) {
    if (eventType.startsWith('task')) return 'task';
    if (eventType.startsWith('batch')) return 'batch';
    return 'project';
  }

  function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'baru saja';
    if (mins < 60) return `${mins}m lalu`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}j lalu`;
    return `${Math.floor(hrs / 24)}h lalu`;
  }
</script>

<AppLayout title="Dashboard" {nav_workspaces} {nav_projects_standalone} {unread_count}>
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50 dark:bg-[#020617]">
    <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] opacity-20 dark:opacity-60"></div>
    <div class="absolute top-[30%] -right-[10%] w-[35%] h-[35%] rounded-full bg-accent-500/10 blur-[120px] opacity-20 dark:opacity-60"></div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

    <div in:fly={{ y: 20, duration: 500 }}>
      <p class="text-xs font-semibold uppercase tracking-widest text-primary-500 dark:text-primary-400 mb-1">{greeting}</p>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-white">
        {user.name || user.email}
      </h1>
      <p class="text-sm text-slate-500 mt-0.5">Berikut ringkasan aktivitas proyek kamu.</p>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" in:fly={{ y: 20, duration: 500, delay: 60 }}>
      <a use:inertia href="/workspaces" class="group cursor-pointer bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-primary-500/50 dark:hover:border-primary-500/30 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
          </div>
          <svg class="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.workspace_count}</p>
        <p class="text-xs text-slate-500 mt-0.5">Workspaces</p>
      </a>

      <a use:inertia href="/projects" class="group cursor-pointer bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-accent-500/50 dark:hover:border-accent-500/30 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
            </svg>
          </div>
          <svg class="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-accent-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </div>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.project_count}</p>
        <p class="text-xs text-slate-500 mt-0.5">Projects</p>
      </a>

      <div class="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <span class="text-[10px] font-medium uppercase tracking-wider text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">aktif</span>
        </div>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.task_ongoing}</p>
        <p class="text-xs text-slate-500 mt-0.5">Tasks Ongoing</p>
      </div>

      <div class="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <svg class="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="text-[10px] font-medium uppercase tracking-wider text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">selesai</span>
        </div>
        <p class="text-2xl font-bold text-slate-900 dark:text-white">{stats.task_done}</p>
        <p class="text-xs text-slate-500 mt-0.5">Tasks Done</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" in:fly={{ y: 20, duration: 500, delay: 120 }}>

      <div class="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6">
        <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-5">Status Tasks</h2>
        {#if totalTasks === 0}
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p class="text-sm text-slate-500">Belum ada tasks</p>
          </div>
        {:else}
          <div class="flex items-center gap-6">
            <div class="relative flex-shrink-0">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="16" class="text-slate-100 dark:text-white/[0.05]"/>
                {#each donutSegments() as seg}
                  {#if seg.d}
                    <path d={seg.d} fill="none" stroke={seg.color} stroke-width="16" stroke-linecap="butt"/>
                  {/if}
                {/each}
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center">
                <span class="text-xl font-bold text-slate-900 dark:text-white">{totalTasks}</span>
                <span class="text-[10px] text-slate-400">total</span>
              </div>
            </div>
            <div class="space-y-3 flex-1">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-slate-500 flex-shrink-0"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Backlog</span>
                </div>
                <span class="text-xs font-semibold text-slate-900 dark:text-white">{stats.task_backlog}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-indigo-500 flex-shrink-0"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Ongoing</span>
                </div>
                <span class="text-xs font-semibold text-slate-900 dark:text-white">{stats.task_ongoing}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-amber-500 flex-shrink-0"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Revisi</span>
                </div>
                <span class="text-xs font-semibold text-slate-900 dark:text-white">{stats.task_revisi}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-purple-500 flex-shrink-0"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Review</span>
                </div>
                <span class="text-xs font-semibold text-slate-900 dark:text-white">{stats.task_review}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500 flex-shrink-0"></span>
                  <span class="text-xs text-slate-600 dark:text-slate-400">Done</span>
                </div>
                <span class="text-xs font-semibold text-slate-900 dark:text-white">{stats.task_done}</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

      <div class="lg:col-span-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6">
        <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-5">Tasks per Project</h2>
        {#if tasks_per_project.length === 0}
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <p class="text-sm text-slate-500">Belum ada data tasks</p>
          </div>
        {:else}
          <div class="space-y-3">
            {#each tasks_per_project.slice(0, 6) as item}
              {@const pct = maxTaskCount > 0 ? (item.count / maxTaskCount) * 100 : 0}
              <div class="flex items-center gap-3">
                <span class="text-xs text-slate-500 dark:text-slate-400 w-28 truncate flex-shrink-0">{item.name}</span>
                <div class="flex-1 bg-slate-100 dark:bg-white/[0.05] rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full bg-primary-500 dark:bg-primary-400 transition-all duration-500"
                    style="width: {pct}%"
                  ></div>
                </div>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-300 w-6 text-right flex-shrink-0">{item.count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6" in:fly={{ y: 20, duration: 500, delay: 180 }}>

      <div class="lg:col-span-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Aktivitas Terkini</h2>
        </div>
        {#if recent_activity.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center px-6">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-sm text-slate-500">Belum ada aktivitas</p>
          </div>
        {:else}
          <ul class="divide-y divide-slate-100 dark:divide-white/[0.05]">
            {#each recent_activity as activity}
              {@const type = activityIcon(activity.event_type)}
              <li class="flex items-start gap-3 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <div class="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 {type === 'task' ? 'bg-indigo-50 dark:bg-indigo-500/10' : type === 'batch' ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-primary-50 dark:bg-primary-500/10'}">
                  {#if type === 'task'}
                    <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                  {:else if type === 'batch'}
                    <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                  {:else}
                    <svg class="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-slate-700 dark:text-slate-300 truncate">{activity.description}</p>
                  <p class="text-xs text-slate-400 mt-0.5">{timeAgo(activity.created_at)}</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      <div class="space-y-4">
        <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 px-0.5">Buat Baru</h2>

        <button
          onclick={() => showCreateWorkspace = true}
          class="cursor-pointer w-full group bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-primary-500/60 dark:hover:border-primary-500/40 rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-100 dark:group-hover:bg-primary-500/20 transition-colors">
              <svg class="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">New Workspace</p>
              <p class="text-xs text-slate-500 truncate">Organisasi tim & proyek</p>
            </div>
            <svg class="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
        </button>

        <button
          onclick={() => showCreateProject = true}
          class="cursor-pointer w-full group bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-accent-500/60 dark:hover:border-accent-500/40 rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div class="flex items-center gap-3 mb-3">
            <div class="w-9 h-9 rounded-xl bg-accent-50 dark:bg-accent-500/10 flex items-center justify-center group-hover:bg-accent-100 dark:group-hover:bg-accent-500/20 transition-colors">
              <svg class="w-4.5 h-4.5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">New Project</p>
              <p class="text-xs text-slate-500 truncate">Mulai project baru</p>
            </div>
            <svg class="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-accent-400 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </div>
        </button>

        <a
          use:inertia href="/workspaces"
          class="cursor-pointer block w-full group bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 rounded-2xl p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
        >
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-white/[0.1] transition-colors">
              <svg class="w-4.5 h-4.5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-100">Semua Workspace</p>
              <p class="text-xs text-slate-500 truncate">Lihat & kelola semua</p>
            </div>
            <svg class="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </div>
        </a>
      </div>
    </div>

  </div>
</AppLayout>

{#if showCreateWorkspace}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
      transition:fly={{ duration: 150, opacity: 0 }}
      onclick={() => showCreateWorkspace = false}
      aria-hidden="true"
    ></div>
    <div
      class="relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden"
      transition:scale={{ duration: 180, start: 0.96 }}
    >
      <div class="px-6 py-5 border-b border-slate-200 dark:border-white/10">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Create New Workspace</h3>
      </div>
      <div class="px-6 py-6 space-y-4">
        <div>
          <label for="ws-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Workspace Name</label>
          <input
            type="text"
            id="ws-name"
            bind:value={newWorkspaceName}
            placeholder="e.g. Design Team"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreateWorkspace()}
          >
        </div>
        <div>
          <label for="ws-desc" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description <span class="text-slate-400 font-normal">(Optional)</span></label>
          <textarea
            id="ws-desc"
            bind:value={newWorkspaceDesc}
            placeholder="Apa tujuan workspace ini?"
            rows="3"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm transition-colors resize-none"
          ></textarea>
        </div>
      </div>
      <div class="px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
        <button type="button" onclick={() => showCreateWorkspace = false} class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors">Cancel</button>
        <button type="button" onclick={handleCreateWorkspace} disabled={!newWorkspaceName.trim() || isCreatingWorkspace} class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 rounded-xl transition-colors">
          {#if isCreatingWorkspace}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Creating...
          {:else}
            Create Workspace
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showCreateProject}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div
      class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm"
      transition:fly={{ duration: 150, opacity: 0 }}
      onclick={() => showCreateProject = false}
      aria-hidden="true"
    ></div>
    <div
      class="relative bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden"
      transition:scale={{ duration: 180, start: 0.96 }}
    >
      <div class="px-6 py-5 border-b border-slate-200 dark:border-white/10">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Create New Project</h3>
      </div>
      <div class="px-6 py-6 space-y-4">
        <div>
          <label for="proj-name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Name</label>
          <input
            type="text"
            id="proj-name"
            bind:value={newProjectName}
            placeholder="e.g. Website Redesign"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreateProject()}
          >
        </div>
        <div>
          <label for="proj-desc" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description <span class="text-slate-400 font-normal">(Optional)</span></label>
          <textarea
            id="proj-desc"
            bind:value={newProjectDesc}
            placeholder="Tentang project ini?"
            rows="3"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm transition-colors resize-none"
          ></textarea>
        </div>
      </div>
      <div class="px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10 flex justify-end gap-3">
        <button type="button" onclick={() => showCreateProject = false} class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors">Cancel</button>
        <button type="button" onclick={handleCreateProject} disabled={!newProjectName.trim() || isCreatingProject} class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-500 hover:bg-accent-600 disabled:opacity-50 rounded-xl transition-colors">
          {#if isCreatingProject}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Creating...
          {:else}
            Create Project
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
