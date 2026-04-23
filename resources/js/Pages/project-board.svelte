<script lang="ts">
  import { router, page as inertiaPage, inertia } from '@inertiajs/svelte';
  import { dndzone } from 'svelte-dnd-action';
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import AppLayout from '../Components/AppLayout.svelte';
  import TaskCard from '../Components/TaskCard.svelte';
  import MoveModal from '../Components/MoveModal.svelte';
  import AddLogModal from '../Components/AddLogModal.svelte';
  import AddTaskModal from '../Components/AddTaskModal.svelte';
  import ActivityPanel from '../Components/ActivityPanel.svelte';
  import { buildCSRFHeaders, Toast, api } from '../Components/helper';
  import axios from 'axios';

  interface TaskRecord { id: string; project_id: string; batch_id: string | null; title: string; description: string | null; priority: 'low' | 'medium' | 'high'; assignee_id: string | null; column_id: 'ongoing' | 'revisi' | 'done'; sort_order: number; version_major: number; version_minor: number; version_patch: number; created_at: number; updated_at: number; }
  interface BatchRecord { id: string; project_id: string; major: number; minor: number; label: string | null; is_active: boolean; version_string: string; }
  interface Member { id: string; project_id: string; user_id: string; role: string; user?: { id: string; name: string | null; email: string; avatar: string | null; } }
  interface Project { id: string; name: string; description: string | null; owner_id: string; }
  interface User { id: string; name: string | null; email: string; avatar: string | null; }

  let { project, tasks: initialTasks = [], batches = [], activeBatch, members = [], user, nav_workspaces = [], nav_projects_standalone = [], unread_count = 0 }: {
    project: Project;
    tasks: TaskRecord[];
    batches: BatchRecord[];
    activeBatch: BatchRecord | null;
    members: Member[];
    user: User;
    nav_workspaces: any[];
    nav_projects_standalone: any[];
    unread_count: number;
  } = $props();

  let tasks = $state<TaskRecord[]>([...initialTasks]);
  let selectedBatch = $state<BatchRecord | null>(activeBatch ? { ...activeBatch } : null);
  let showAddTask = $state(false);
  let addTaskColumn = $state<string>('ongoing');

  // Sync tasks when Inertia navigates back to this page (e.g. after create task redirect)
  $effect(() => {
    tasks = [...initialTasks];
  });

  // Move modal state
  let pendingMove = $state<{ taskId: string; fromColumn: string; toColumn: string; items: TaskRecord[] } | null>(null);
  let moveModalTask = $state<TaskRecord | null>(null);

  // Add log modal
  let addLogTask = $state<TaskRecord | null>(null);

  // Activity panel
  let showActivity = $state(false);

  // Delete project
  let isDeletingProject = $state(false);

  async function handleDeleteProject() {
    if (!confirm('Yakin ingin menghapus project ini? Semua task dan data akan ikut terhapus.')) return;
    isDeletingProject = true;
    const result = await api(() => axios.delete(`/projects/${project.id}`, { headers: buildCSRFHeaders() }));
    isDeletingProject = false;
    if (result.success) {
      router.visit('/projects');
    }
  }

  // Bump version
  let isBumping = $state(false);

  async function bumpVersion(bumpMajor: boolean) {
    if (isBumping) return;
    const label = bumpMajor ? 'major' : 'minor';
    if (!confirm(`Bump ${label} version? Ini akan membuat batch versi baru.`)) return;
    isBumping = true;
    const result = await api(() => axios.post(
      `/projects/${project.id}/batches`,
      { bump_major: bumpMajor },
      { headers: buildCSRFHeaders() }
    ));
    isBumping = false;
    if (result.success) {
      router.reload({ only: ['batches', 'activeBatch'] });
    }
  }

  let ongoingTasks = $state<TaskRecord[]>([]);
  let revisiTasks = $state<TaskRecord[]>([]);
  let doneTasks = $state<TaskRecord[]>([]);

  $effect(() => {
    const filtered = selectedBatch 
      ? tasks.filter(t => t.batch_id === selectedBatch!.id)
      : tasks;
    ongoingTasks = filtered.filter(t => t.column_id === 'ongoing').sort((a,b) => a.sort_order - b.sort_order);
    revisiTasks = filtered.filter(t => t.column_id === 'revisi').sort((a,b) => a.sort_order - b.sort_order);
    doneTasks = filtered.filter(t => t.column_id === 'done').sort((a,b) => a.sort_order - b.sort_order);
  });

  function handleDndConsider(columnId: 'ongoing' | 'revisi' | 'done', e: CustomEvent<{ items: TaskRecord[] }>) {
    if (columnId === 'ongoing') ongoingTasks = e.detail.items;
    else if (columnId === 'revisi') revisiTasks = e.detail.items;
    else if (columnId === 'done') doneTasks = e.detail.items;
  }

  function handleDndFinalize(columnId: 'ongoing' | 'revisi' | 'done', e: CustomEvent<{ items: TaskRecord[]; info: { id: string; source?: string } }>) {
    const movedId = e.detail.info.id;
    const movedTask = tasks.find(t => t.id === movedId);
    if (!movedTask) return;

    if (movedTask.column_id !== columnId) {
      // Column changed — intercept, restore, show modal
      if (columnId === 'ongoing') ongoingTasks = e.detail.items;
      else if (columnId === 'revisi') revisiTasks = e.detail.items;
      else if (columnId === 'done') doneTasks = e.detail.items;

      pendingMove = { taskId: movedId, fromColumn: movedTask.column_id, toColumn: columnId, items: e.detail.items };
      moveModalTask = movedTask;
    } else {
      // Same column reorder — just update sort_order silently
      if (columnId === 'ongoing') ongoingTasks = e.detail.items;
      else if (columnId === 'revisi') revisiTasks = e.detail.items;
      else if (columnId === 'done') doneTasks = e.detail.items;
      updateSortOrder(e.detail.items, columnId);
    }
  }

  async function commitMove(note: string) {
    if (!pendingMove || !moveModalTask) return;
    const { taskId, toColumn } = pendingMove;
    
    // Optimistic update (column only — version comes from server)
    tasks = tasks.map(t => t.id === taskId ? { ...t, column_id: toColumn as any } : t);
    pendingMove = null;
    moveModalTask = null;

    try {
      const res = await fetch(`/tasks/${taskId}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ column_id: toColumn, note }),
      });
      const data = await res.json();
      if (data.success && data.data?.task) {
        tasks = tasks.map(t => t.id === taskId ? data.data.task : t);
        Toast('Task dipindah', 'success');
      } else {
        Toast(data.message || 'Gagal memindah task', 'error');
        router.reload({ only: ['tasks'] });
      }
    } catch {
      Toast('Gagal memindah task', 'error');
      router.reload({ only: ['tasks'] });
    }
  }

  function cancelMove() {
    // Restore columns from tasks state
    const filtered = selectedBatch ? tasks.filter(t => t.batch_id === selectedBatch!.id) : tasks;
    ongoingTasks = filtered.filter(t => t.column_id === 'ongoing').sort((a,b) => a.sort_order - b.sort_order);
    revisiTasks = filtered.filter(t => t.column_id === 'revisi').sort((a,b) => a.sort_order - b.sort_order);
    doneTasks = filtered.filter(t => t.column_id === 'done').sort((a,b) => a.sort_order - b.sort_order);
    pendingMove = null;
    moveModalTask = null;
  }

  async function commitAddLog(note: string) {
    if (!addLogTask) return;
    const taskId = addLogTask.id;
    addLogTask = null;

    try {
      const res = await fetch(`/tasks/${taskId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ note }),
      });
      const data = await res.json();
      if (data.success && data.data?.task) {
        tasks = tasks.map(t => t.id === taskId ? data.data.task : t);
        Toast('Log ditambahkan', 'success');
      } else {
        Toast(data.message || 'Gagal menambah log', 'error');
      }
    } catch {
      Toast('Gagal menambah log', 'error');
    }
  }

  async function updateSortOrder(items: TaskRecord[], columnId: string) {
    const updates = items.map((task, index) => ({ id: task.id, sort_order: index }));
    // Fire-and-forget, no UI feedback needed
    fetch(`/projects/${project.id}/tasks/reorder`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
      body: JSON.stringify({ updates }),
    }).catch(() => {});
  }

  function switchBatch(batch: BatchRecord | null) {
    selectedBatch = batch;
    const url = batch ? `/projects/${project.id}?batch_id=${batch.id}` : `/projects/${project.id}`;
    router.get(url, {}, { preserveState: true, only: ['tasks'] });
  }

  function getAssignee(assigneeId: string | null) {
    if (!assigneeId) return undefined;
    return members.find(m => m.user_id === assigneeId)?.user;
  }

  const COLUMNS = [
    { id: 'ongoing' as const, name: 'On Going', ref: () => ongoingTasks, color: 'blue' as const },
    { id: 'revisi' as const, name: 'Revisi', ref: () => revisiTasks, color: 'orange' as const },
    { id: 'done' as const, name: 'Done', ref: () => doneTasks, color: 'emerald' as const },
  ];
</script>

<AppLayout title={project.name} {nav_workspaces} {nav_projects_standalone} {unread_count} activeProjectId={project.id}>
  <!-- Background decorations -->
  <div class="fixed inset-0 pointer-events-none z-0">
    <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/20 dark:bg-primary-500/10 rounded-full blur-3xl -mr-64 -mt-64"></div>
    <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/20 dark:bg-accent-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-info-500/20 dark:bg-info-500/10 rounded-full blur-3xl"></div>
  </div>

  <!-- Header: Project name + Batch dropdown + Add task button -->
  <header class="relative z-10 flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-white/5">
    <div>
      <h1 class="text-xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
      {#if project.description}
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{project.description}</p>
      {/if}
    </div>
    
    <div class="flex items-center gap-3">
      <!-- Batch dropdown -->
      <div class="relative">
        <select
          data-testid="batch-dropdown"
          class="appearance-none bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-4 py-2 pr-8 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-primary-400/50 cursor-pointer"
          onchange={(e) => {
            const val = (e.currentTarget as HTMLSelectElement).value;
            switchBatch(val === '' ? null : batches.find(b => b.id === val) || null);
          }}
        >
          <option value="">All Batches</option>
          {#each batches as batch}
            <option value={batch.id} selected={selectedBatch?.id === batch.id}>{batch.version_string}</option>
          {/each}
        </select>
      </div>

      {#if user.id === project.owner_id}
        <div class="flex items-center gap-1.5">
          <button
            onclick={() => bumpVersion(false)}
            disabled={isBumping}
            title="Bump minor version (x.N.x)"
            class="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 hover:bg-info-500/10 dark:hover:bg-info-500/10 border border-slate-200 dark:border-white/10 hover:border-info-500/40 text-slate-600 dark:text-slate-300 hover:text-info-500 dark:hover:text-info-400 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/></svg>
            Minor
          </button>
          <button
            onclick={() => bumpVersion(true)}
            disabled={isBumping}
            title="Bump major version (N.x.x)"
            class="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 hover:bg-accent-500/10 dark:hover:bg-accent-500/10 border border-slate-200 dark:border-white/10 hover:border-accent-500/40 text-slate-600 dark:text-slate-300 hover:text-accent-500 dark:hover:text-accent-400 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"/><line x1="12" y1="18" x2="12" y2="6"/></svg>
            Major
          </button>
          <button
            onclick={handleDeleteProject}
            disabled={isDeletingProject}
            title="Hapus project"
            class="flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 hover:bg-danger-500/10 dark:hover:bg-danger-500/10 border border-slate-200 dark:border-white/10 hover:border-danger-500/40 text-slate-600 dark:text-slate-300 hover:text-danger-500 dark:hover:text-danger-400 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isDeletingProject}
              <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {:else}
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            {/if}
            Hapus
          </button>
        </div>
      {/if}

      <button
        onclick={() => showActivity = true}
        title="Project Activity"
        class="flex items-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Activity
      </button>

      <!-- Add Task button -->
      <button 
        data-testid="add-task-btn-header"
        onclick={() => { addTaskColumn = 'ongoing'; showAddTask = true; }}
        class="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Tambah Task
      </button>
    </div>
  </header>

  <!-- Kanban Board — 3 columns with DnD -->
  <div class="relative z-10 grid grid-cols-3 gap-6 p-8 h-[calc(100vh-80px)]">
    {#each COLUMNS as col}
      {@const colTasks = col.ref()}
      {@const bgClass = col.color === 'blue' ? 'bg-blue-50/80 border-blue-200/60 dark:bg-blue-500/[0.06] dark:border-blue-500/15' : col.color === 'orange' ? 'bg-orange-50/80 border-orange-200/60 dark:bg-orange-500/[0.06] dark:border-orange-500/15' : 'bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-500/[0.06] dark:border-emerald-500/15'}
      {@const headerBg = col.color === 'blue' ? 'from-blue-500/[0.07] to-transparent dark:from-blue-500/[0.12]' : col.color === 'orange' ? 'from-orange-500/[0.07] to-transparent dark:from-orange-500/[0.12]' : 'from-emerald-500/[0.07] to-transparent dark:from-emerald-500/[0.12]'}
      {@const dotClass = col.color === 'blue' ? 'bg-blue-500 dark:bg-blue-400' : col.color === 'orange' ? 'bg-orange-500 dark:bg-orange-400' : 'bg-emerald-500 dark:bg-emerald-400'}
      {@const textClass = col.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : col.color === 'orange' ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400'}
      {@const badgeClass = col.color === 'blue' ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' : col.color === 'orange' ? 'bg-orange-500/15 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' : 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'}
      {@const addBtnClass = col.color === 'blue' ? 'border-blue-300/40 hover:border-blue-400/60 hover:text-blue-500 hover:bg-blue-50/50 dark:border-blue-500/20 dark:hover:border-blue-400/50 dark:hover:text-blue-400 dark:hover:bg-blue-500/[0.06]' : col.color === 'orange' ? 'border-orange-300/40 hover:border-orange-400/60 hover:text-orange-500 hover:bg-orange-50/50 dark:border-orange-500/20 dark:hover:border-orange-400/50 dark:hover:text-orange-400 dark:hover:bg-orange-500/[0.06]' : 'border-emerald-300/40 hover:border-emerald-400/60 hover:text-emerald-500 hover:bg-emerald-50/50 dark:border-emerald-500/20 dark:hover:border-emerald-400/50 dark:hover:text-emerald-400 dark:hover:bg-emerald-500/[0.06]'}
      {@const shadowClass = col.color === 'blue' ? 'shadow-blue-500/[0.04] dark:shadow-blue-500/[0.06]' : col.color === 'orange' ? 'shadow-orange-500/[0.04] dark:shadow-orange-500/[0.06]' : 'shadow-emerald-500/[0.04] dark:shadow-emerald-500/[0.06]'}

      <div data-testid="kanban-column-{col.id}" class="flex flex-col h-full backdrop-blur-md border rounded-2xl overflow-hidden shadow-lg {bgClass} {shadowClass} transition-shadow duration-300 hover:shadow-xl">
        <!-- Column header — pinned at top -->
        <div class="shrink-0 px-5 pt-4 pb-3 bg-gradient-to-b {headerBg} border-b border-black/[0.04] dark:border-white/[0.04]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <span class="w-2.5 h-2.5 rounded-full {dotClass} shadow-sm ring-2 ring-white/50 dark:ring-white/10"></span>
              <h3 class="text-xs font-bold uppercase tracking-widest {textClass}">{col.name}</h3>
            </div>
            <span class="text-[10px] font-bold px-2.5 py-1 rounded-full {badgeClass}">{colTasks.length}</span>
          </div>
        </div>

        <!-- DnD container — scrollable area -->
        <div
          class="flex-1 overflow-y-auto scroll-smooth min-h-0 p-3 flex flex-col gap-2.5 kanban-scroll"
          use:dndzone={{ items: colTasks, flipDurationMs: 150, type: 'tasks' }}
          onconsider={(e) => handleDndConsider(col.id, e)}
          onfinalize={(e) => handleDndFinalize(col.id, e)}
        >
          {#each colTasks as task (task.id)}
            <div data-testid="task-card-{task.id}" animate:flip={{ duration: 150 }} class="transition-transform duration-150 hover:scale-[1.01]">
              <TaskCard
                {task}
                assignee={getAssignee(task.assignee_id)}
                columnColor={col.color}
                onAddLog={() => addLogTask = task}
              />
            </div>
          {/each}
        </div>

        <!-- Add task button — pinned at bottom -->
        <div class="shrink-0 px-3 pb-3 pt-1">
          <button
            onclick={() => { addTaskColumn = col.id; showAddTask = true; }}
            class="w-full py-2.5 text-xs font-medium text-slate-400 border border-dashed rounded-xl transition-all duration-200 {addBtnClass}"
          >
            + Add Task
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Custom scrollbar styling for Kanban columns -->
  <style>
    .kanban-scroll::-webkit-scrollbar { width: 5px; }
    .kanban-scroll::-webkit-scrollbar-track { background: transparent; }
    .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 10px; }
    .kanban-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
    :global(.dark) .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); }
    :global(.dark) .kanban-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
  </style>

  <!-- Modals -->
  {#if showAddTask}
    <AddTaskModal
      projectId={project.id}
      {members}
      batchId={selectedBatch?.id ?? null}
      onClose={() => { showAddTask = false; router.reload({ only: ['tasks'] }); }}
    />
  {/if}

  {#if moveModalTask && pendingMove}
    <MoveModal
      task={moveModalTask}
      targetColumn={pendingMove.toColumn}
      onConfirm={commitMove}
      onCancel={cancelMove}
    />
  {/if}

  {#if addLogTask}
    <AddLogModal
      task={addLogTask}
      onConfirm={commitAddLog}
      onCancel={() => addLogTask = null}
    />
  {/if}

  <ActivityPanel
    projectId={project.id}
    isOpen={showActivity}
    onClose={() => showActivity = false}
  />
</AppLayout>
