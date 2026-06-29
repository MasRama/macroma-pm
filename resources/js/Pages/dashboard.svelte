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

  interface TrendPoint {
    day: string;
    workspace: number;
    project: number;
    active: number;
    done: number;
  }

  let {
    user,
    stats,
    trends = [],
    tasks_per_project = [],
    recent_activity = [],
    nav_workspaces = [],
    nav_projects_standalone = [],
    unread_count = 0,
  }: {
    user: User;
    stats: Stats;
    trends: TrendPoint[];
    tasks_per_project: TasksPerProject[];
    recent_activity: RecentActivity[];
    nav_workspaces: any[];
    nav_projects_standalone: any[];
    unread_count: number;
  } = $props();

  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

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

  // ── Derived metrics ────────────────────────────────────────────
  const totalTasks = $derived(stats.task_backlog + stats.task_ongoing + stats.task_revisi + stats.task_review + stats.task_done);
  const activeTasks = $derived(stats.task_ongoing + stats.task_review + stats.task_revisi);
  const completionRate = $derived(totalTasks > 0 ? Math.round((stats.task_done / totalTasks) * 100) : 0);

  // Stacked bar segments — proportionate task distribution
  const segments = $derived([
    { label: 'Backlog', value: stats.task_backlog, color: '#a8a29e', bg: 'bg-stone-400' },
    { label: 'On Going', value: stats.task_ongoing, color: '#16a766', bg: 'bg-brand-500' },
    { label: 'Revisi', value: stats.task_revisi, color: '#f59e0b', bg: 'bg-amber-500' },
    { label: 'Review', value: stats.task_review, color: '#0d9488', bg: 'bg-teal-600' },
    { label: 'Done', value: stats.task_done, color: '#0a6a44', bg: 'bg-brand-700' },
  ]);

  // Completion ring SVG arc
  const ringRadius = 34;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = $derived(ringCircumference - (completionRate / 100) * ringCircumference);

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

  // Sparkline data — real 7-day cumulative trends from backend
  const sparkData = $derived([
    { label: 'Workspace', value: stats.workspace_count, trend: trends.map(t => t.workspace), href: '/workspaces' },
    { label: 'Project', value: stats.project_count, trend: trends.map(t => t.project), href: '/projects' },
    { label: 'Aktif', value: activeTasks, trend: trends.map(t => t.active), href: '/projects' },
    { label: 'Selesai', value: stats.task_done, trend: trends.map(t => t.done), href: '/projects' },
  ]);
</script>

<AppLayout title="Dashboard" {nav_workspaces} {nav_projects_standalone} {unread_count}>
  <div class="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8 space-y-6">

    <!-- ═══════════════════════════════════════════════════════════
         TOP STRIP: greeting + completion ring + quick actions
         ═══════════════════════════════════════════════════════════ -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5" in:fly={{ y: 20, duration: 500 }}>
      <div class="flex items-center gap-5">
        <!-- Completion ring -->
        <div class="relative w-20 h-20 flex-shrink-0">
          <svg class="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r={ringRadius} fill="none" stroke="currentColor" stroke-width="6" class="text-stone-200 dark:text-white/10"/>
            <circle
              cx="40" cy="40" r={ringRadius}
              fill="none"
              stroke="#16a766"
              stroke-width="6"
              stroke-linecap="round"
              stroke-dasharray={ringCircumference}
              stroke-dashoffset={ringOffset}
              style="transition: stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1);"
            />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span class="text-lg font-extrabold tracking-tight text-stone-900 dark:text-white">{completionRate}%</span>
            <span class="text-[8px] font-bold uppercase tracking-wider text-stone-400">selesai</span>
          </div>
        </div>

        <div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">{greeting}</span>
          </div>
          <h1 class="text-2xl font-extrabold tracking-[-0.02em] text-stone-900 dark:text-white">
            {user.name || user.email}
          </h1>
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{today}</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="flex gap-2.5">
        <button
          onclick={() => showCreateWorkspace = true}
          class="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 hover:ring-stone-900/20 dark:hover:ring-white/20 text-sm font-semibold text-stone-700 dark:text-stone-200 transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          <svg class="w-4 h-4 text-stone-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          Workspace
        </button>
        <button
          onclick={() => showCreateProject = true}
          class="group flex items-center gap-2 pl-4 pr-2.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(22,167,102,0.5)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Project baru
          <span class="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         FOCUS ROW: Board health — horizontal stacked bar
         ═══════════════════════════════════════════════════════════ -->
    <div class="bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl p-6" in:fly={{ y: 20, duration: 500, delay: 60 }}>
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-sm font-bold text-stone-700 dark:text-stone-200">Board health</h2>
        <span class="text-xs font-semibold text-stone-400 dark:text-stone-500">{totalTasks} task total</span>
      </div>

      {#if totalTasks === 0}
        <div class="flex flex-col items-center justify-center py-10 text-center">
          <div class="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-4">
            <svg class="w-7 h-7 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          </div>
          <p class="text-sm font-semibold text-stone-700 dark:text-stone-200">Belum ada tasks</p>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-xs">Buat project pertama dan tambahkan task untuk mulai melihat progres di sini.</p>
          <button onclick={() => showCreateProject = true} class="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold transition-colors cursor-pointer">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Buat project
          </button>
        </div>
      {:else}
        <!-- Stacked bar -->
        <div class="flex h-3 rounded-full overflow-hidden mb-5 bg-stone-100 dark:bg-white/5">
          {#each segments as seg}
            {#if seg.value > 0}
              <div
                class="{seg.bg} transition-all duration-700"
                style="width: {(seg.value / totalTasks) * 100}%"
                title="{seg.label}: {seg.value}"
              ></div>
            {/if}
          {/each}
        </div>

        <!-- Legend with counts -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {#each segments as seg}
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-sm {seg.bg} shrink-0"></span>
              <div class="min-w-0">
                <div class="text-xs font-semibold text-stone-900 dark:text-white">{seg.value}</div>
                <div class="text-[10px] text-stone-500 dark:text-stone-400 truncate">{seg.label}</div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         KPI ROW: 4 stat cards with sparklines
         ═══════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" in:fly={{ y: 20, duration: 500, delay: 120 }}>
      {#each sparkData as card, i}
        <a
          use:inertia
          href={card.href}
          class="group cursor-pointer bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 hover:ring-brand-500/30 dark:hover:ring-brand-400/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_12px_30px_-15px_rgba(22,167,102,0.25)]"
        >
          <div class="flex items-start justify-between mb-3">
            <div>
              <div class="text-3xl font-extrabold tracking-tight text-stone-900 dark:text-white">{card.value}</div>
              <div class="text-xs font-semibold text-stone-500 dark:text-stone-400 mt-1">{card.label}</div>
            </div>
            <svg class="w-16 h-10" viewBox="0 0 64 40" fill="none" aria-hidden="true">
              {#if card.trend.length > 1}
                <polyline
                  points={card.trend.map((v, idx) => {
                    const max = Math.max(...card.trend, 1);
                    return `${idx * (60 / (card.trend.length - 1))},${36 - (v / max) * 30}`;
                  }).join(' ')}
                  stroke={i === 3 ? '#16a766' : '#a8a29e'}
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <circle
                  cx="60"
                  cy={36 - (card.trend[card.trend.length - 1] / Math.max(...card.trend, 1)) * 30}
                  r="2.5"
                  fill={i === 3 ? '#16a766' : '#a8a29e'}
                  class="opacity-60 group-hover:opacity-100 transition-opacity"
                />
              {/if}
            </svg>
          </div>
        </a>
      {/each}
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         MAIN GRID: tasks per project (left) + activity feed (right)
         ═══════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-5" in:fly={{ y: 20, duration: 500, delay: 180 }}>

      <!-- Left: tasks per project -->
      <div class="lg:col-span-3 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-sm font-bold text-stone-700 dark:text-stone-200">Tasks per project</h2>
          <a use:inertia href="/projects" class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">Lihat semua</a>
        </div>
        {#if tasks_per_project.length === 0}
          <div class="flex flex-col items-center justify-center py-10 text-center">
            <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
            </div>
            <p class="text-sm font-semibold text-stone-700 dark:text-stone-200">Belum ada project</p>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">Project dengan tasks akan muncul di sini.</p>
          </div>
        {:else}
          <div class="space-y-4">
            {#each tasks_per_project.slice(0, 6) as item}
              {@const pct = maxTaskCount > 0 ? (item.count / maxTaskCount) * 100 : 0}
              <div class="flex items-center gap-3">
                <span class="text-xs font-medium text-stone-600 dark:text-stone-300 w-32 truncate flex-shrink-0">{item.name}</span>
                <div class="flex-1 bg-stone-100 dark:bg-white/[0.05] rounded-full h-2 overflow-hidden">
                  <div class="h-2 rounded-full bg-brand-500 transition-all duration-500" style="width: {pct}%"></div>
                </div>
                <span class="text-xs font-bold text-stone-900 dark:text-white w-6 text-right flex-shrink-0">{item.count}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Right: activity feed (timeline) -->
      <div class="lg:col-span-2 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl overflow-hidden flex flex-col">
        <div class="px-6 py-5 border-b border-stone-100 dark:border-white/[0.05] flex items-center justify-between">
          <h2 class="text-sm font-bold text-stone-700 dark:text-stone-200">Aktivitas</h2>
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
        </div>
        {#if recent_activity.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center px-6 flex-1">
            <div class="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-white/5 flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-sm font-semibold text-stone-700 dark:text-stone-200">Belum ada aktivitas</p>
            <p class="text-xs text-stone-500 dark:text-stone-400 mt-1">Aksi tim akan muncul di sini.</p>
          </div>
        {:else}
          <ul class="overflow-y-auto max-h-[380px] custom-scrollbar">
            {#each recent_activity as activity}
              {@const type = activityIcon(activity.event_type)}
              <li class="flex items-start gap-3 px-5 py-3.5 hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors border-b border-stone-50 dark:border-white/[0.03] last:border-0">
                <div class="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 {type === 'task' ? 'bg-brand-50 dark:bg-brand-500/10' : type === 'batch' ? 'bg-amber-50 dark:bg-amber-500/10' : 'bg-stone-100 dark:bg-white/5'}">
                  {#if type === 'task'}
                    <svg class="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
                  {:else if type === 'batch'}
                    <svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                  {:else}
                    <svg class="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-stone-700 dark:text-stone-300 leading-snug">{activity.description}</p>
                  <p class="text-xs text-stone-400 mt-0.5">{timeAgo(activity.created_at)}</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>

  </div>
</AppLayout>

{#if showCreateWorkspace}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" transition:fly={{ duration: 150, opacity: 0 }} onclick={() => showCreateWorkspace = false} aria-hidden="true"></div>
    <div class="relative bg-white dark:bg-stone-900 ring-1 ring-stone-900/10 dark:ring-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden" transition:scale={{ duration: 180, start: 0.96 }}>
      <div class="px-6 py-5 border-b border-stone-200 dark:border-white/10">
        <h3 class="text-lg font-bold text-stone-900 dark:text-white">Workspace baru</h3>
      </div>
      <div class="px-6 py-6 space-y-4">
        <div>
          <label for="ws-name" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Nama workspace</label>
          <input type="text" id="ws-name" bind:value={newWorkspaceName} placeholder="mis. Design Team"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreateWorkspace()}>
        </div>
        <div>
          <label for="ws-desc" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Deskripsi <span class="text-stone-400 font-normal">(opsional)</span></label>
          <textarea id="ws-desc" bind:value={newWorkspaceDesc} placeholder="Apa tujuan workspace ini?" rows="3"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 text-sm transition-colors resize-none"></textarea>
        </div>
      </div>
      <div class="px-6 py-4 bg-stone-50 dark:bg-white/[0.03] border-t border-stone-200 dark:border-white/10 flex justify-end gap-3">
        <button type="button" onclick={() => showCreateWorkspace = false} class="px-4 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer">Batal</button>
        <button type="button" onclick={handleCreateWorkspace} disabled={!newWorkspaceName.trim() || isCreatingWorkspace} class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded-xl transition-colors cursor-pointer">
          {#if isCreatingWorkspace}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Membuat...
          {:else}
            Buat workspace
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showCreateProject}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" transition:fly={{ duration: 150, opacity: 0 }} onclick={() => showCreateProject = false} aria-hidden="true"></div>
    <div class="relative bg-white dark:bg-stone-900 ring-1 ring-stone-900/10 dark:ring-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden" transition:scale={{ duration: 180, start: 0.96 }}>
      <div class="px-6 py-5 border-b border-stone-200 dark:border-white/10">
        <h3 class="text-lg font-bold text-stone-900 dark:text-white">Project baru</h3>
      </div>
      <div class="px-6 py-6 space-y-4">
        <div>
          <label for="proj-name" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Nama project</label>
          <input type="text" id="proj-name" bind:value={newProjectName} placeholder="mis. Website Redesign"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreateProject()}>
        </div>
        <div>
          <label for="proj-desc" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Deskripsi <span class="text-stone-400 font-normal">(opsional)</span></label>
          <textarea id="proj-desc" bind:value={newProjectDesc} placeholder="Tentang project ini?" rows="3"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 text-sm transition-colors resize-none"></textarea>
        </div>
      </div>
      <div class="px-6 py-4 bg-stone-50 dark:bg-white/[0.03] border-t border-stone-200 dark:border-white/10 flex justify-end gap-3">
        <button type="button" onclick={() => showCreateProject = false} class="px-4 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer">Batal</button>
        <button type="button" onclick={handleCreateProject} disabled={!newProjectName.trim() || isCreatingProject} class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded-xl transition-colors cursor-pointer">
          {#if isCreatingProject}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Membuat...
          {:else}
            Buat project
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
  :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(22,167,102,0.3); }
</style>
