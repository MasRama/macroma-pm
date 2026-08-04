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
  import TaskDetailModal from '../Components/TaskDetailModal.svelte';
  import { buildCSRFHeaders, Toast, api } from '../Components/helper';
  import realtime, { type RealtimeIncoming } from '../Components/realtime';
  import { onDestroy } from 'svelte';
  import axios from 'axios';

  interface TaskRecord { id: string; project_id: string; batch_id: string | null; title: string; description: string | null; priority: 'low' | 'medium' | 'high'; assignee_id: string | null; column_id: 'backlog' | 'ongoing' | 'revisi' | 'review' | 'done'; sort_order: number; version_major: number; version_minor: number; version_patch: number; created_at: number; updated_at: number; attachment_count?: number; }
  interface BatchRecord { id: string; project_id: string; major: number; minor: number; label: string | null; is_active: boolean; version_string: string; }
  interface Member { id: string; project_id: string; user_id: string; role: string; user?: { id: string; name: string | null; email: string; avatar: string | null; } }
  interface Project { id: string; name: string; description: string | null; owner_id: string; workspace_id: string | null; }
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

  const chatWorkspaceId = project.workspace_id ?? '';
  const chatWorkspaceName = chatWorkspaceId
    ? (nav_workspaces.find((w: any) => w.id === chatWorkspaceId)?.name ?? '')
    : '';

  let tasks = $state<TaskRecord[]>([...initialTasks]);
  let selectedBatch = $state<BatchRecord | null>(activeBatch ? { ...activeBatch } : null);
  let showAddTask = $state(false);
  let addTaskColumn = $state<string>('backlog');

  // Sync tasks when Inertia navigates back to this page (e.g. after create task redirect)
  $effect(() => {
    tasks = [...initialTasks];
  });

  /**
   * Realtime sync — subscribe to the project channel and merge incoming
   * task events into local state without a page reload.
   * The user that fired the action gets the same event echoed to them, so
   * we dedupe by comparing actor_id with the current user where it matters.
   */
  let unsubscribeRealtime: (() => void) | null = null;

  function applyRealtimeEvent(msg: RealtimeIncoming) {
    const actorId = msg.payload?.actor_id as string | undefined;
    const isSelf = actorId && actorId === user.id;

    switch (msg.type) {
      case 'task.created': {
        const incoming = msg.payload?.task as TaskRecord | undefined;
        if (!incoming) return;
        if (tasks.some(t => t.id === incoming.id)) return;
        tasks = [...tasks, incoming];
        if (!isSelf) Toast(`Task baru ditambahkan: ${incoming.title}`, 'info');
        break;
      }
      case 'task.moved':
      case 'task.log_added': {
        const incoming = msg.payload?.task as TaskRecord | undefined;
        if (!incoming) return;
        const idx = tasks.findIndex(t => t.id === incoming.id);
        if (idx >= 0) {
          tasks = tasks.map(t => t.id === incoming.id ? incoming : t);
        } else {
          tasks = [...tasks, incoming];
        }
        if (!isSelf && msg.type === 'task.moved') {
          Toast(`Task "${incoming.title}" dipindah`, 'info');
        }
        break;
      }
      case 'task.deleted': {
        const taskId = msg.payload?.task_id as string | undefined;
        if (!taskId) return;
        const target = tasks.find(t => t.id === taskId);
        tasks = tasks.filter(t => t.id !== taskId);
        if (detailTask?.id === taskId) detailTask = null;
        if (!isSelf && target) Toast(`Task "${target.title}" dihapus`, 'warning');
        break;
      }
      case 'task.attachment_added': {
        const taskId = msg.payload?.task_id as string | undefined;
        if (!taskId) return;
        tasks = tasks.map(t => t.id === taskId
          ? { ...t, attachment_count: (t.attachment_count ?? 0) + (msg.payload?.attachments?.length ?? 1) }
          : t);
        break;
      }
      case 'task.attachment_removed': {
        const taskId = msg.payload?.task_id as string | undefined;
        if (!taskId) return;
        tasks = tasks.map(t => t.id === taskId
          ? { ...t, attachment_count: Math.max(0, (t.attachment_count ?? 0) - 1) }
          : t);
        break;
      }
      // Comments are handled inside TaskDetailModal — ignored here on purpose.
      default:
        break;
    }
  }

  $effect(() => {
    if (!project?.id) return;
    unsubscribeRealtime?.();
    unsubscribeRealtime = realtime.subscribe(`project:${project.id}`, applyRealtimeEvent);
    return () => {
      unsubscribeRealtime?.();
      unsubscribeRealtime = null;
    };
  });

  onDestroy(() => {
    unsubscribeRealtime?.();
    unsubscribeRealtime = null;
  });

  // Move modal state
  let pendingMove = $state<{ taskId: string; fromColumn: string; toColumn: string; items: TaskRecord[] } | null>(null);
  let moveModalTask = $state<TaskRecord | null>(null);

  // Add log modal
  let addLogTask = $state<TaskRecord | null>(null);

  // Activity panel
  let showActivity = $state(false);

  // Task detail modal
  let detailTask = $state<TaskRecord | null>(null);

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

  type KanbanColumn = 'backlog' | 'ongoing' | 'revisi' | 'review' | 'done';

  let backlogTasks = $state<TaskRecord[]>([]);
  let ongoingTasks = $state<TaskRecord[]>([]);
  let revisiTasks = $state<TaskRecord[]>([]);
  let reviewTasks = $state<TaskRecord[]>([]);
  let doneTasks = $state<TaskRecord[]>([]);

  $effect(() => {
    const filtered = selectedBatch 
      ? tasks.filter(t => t.batch_id === selectedBatch!.id)
      : tasks;
    backlogTasks = filtered.filter(t => t.column_id === 'backlog').sort((a,b) => a.sort_order - b.sort_order);
    ongoingTasks = filtered.filter(t => t.column_id === 'ongoing').sort((a,b) => a.sort_order - b.sort_order);
    revisiTasks = filtered.filter(t => t.column_id === 'revisi').sort((a,b) => a.sort_order - b.sort_order);
    reviewTasks = filtered.filter(t => t.column_id === 'review').sort((a,b) => a.sort_order - b.sort_order);
    doneTasks = filtered.filter(t => t.column_id === 'done').sort((a,b) => a.sort_order - b.sort_order);
  });

  function setColumnItems(columnId: KanbanColumn, items: TaskRecord[]) {
    if (columnId === 'backlog') backlogTasks = items;
    else if (columnId === 'ongoing') ongoingTasks = items;
    else if (columnId === 'revisi') revisiTasks = items;
    else if (columnId === 'review') reviewTasks = items;
    else if (columnId === 'done') doneTasks = items;
  }

  function handleDndConsider(columnId: KanbanColumn, e: CustomEvent<{ items: TaskRecord[] }>) {
    setColumnItems(columnId, e.detail.items);
  }

  function handleDndFinalize(columnId: KanbanColumn, e: CustomEvent<{ items: TaskRecord[]; info: { id: string; source?: string } }>) {
    const movedId = e.detail.info.id;
    const movedTask = tasks.find(t => t.id === movedId);
    if (!movedTask) return;

    setColumnItems(columnId, e.detail.items);

    if (movedTask.column_id !== columnId) {
      // Column changed — intercept, show modal (items already applied optimistically)
      pendingMove = { taskId: movedId, fromColumn: movedTask.column_id, toColumn: columnId, items: e.detail.items };
      moveModalTask = movedTask;
    } else {
      // Same column reorder — just update sort_order silently
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
    backlogTasks = filtered.filter(t => t.column_id === 'backlog').sort((a,b) => a.sort_order - b.sort_order);
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
    { id: 'backlog' as const, name: 'Backlog', ref: () => backlogTasks, color: 'slate' as const },
    { id: 'ongoing' as const, name: 'On Going', ref: () => ongoingTasks, color: 'blue' as const },
    { id: 'revisi' as const, name: 'Revisi', ref: () => revisiTasks, color: 'orange' as const },
    { id: 'review' as const, name: 'Review', ref: () => reviewTasks, color: 'purple' as const },
    { id: 'done' as const, name: 'Done', ref: () => doneTasks, color: 'emerald' as const },
  ];
</script>

<AppLayout title={project.name} {nav_workspaces} {nav_projects_standalone} {unread_count} activeProjectId={project.id} chat_workspace_id={chatWorkspaceId} chat_workspace_name={chatWorkspaceName}>
  <div class="px-5 sm:px-8 lg:px-10 py-6 space-y-5" in:fly={{ y: 20, duration: 500 }}>

    <!-- ═══════════════════════════════════════════════════════════
         HEADER CARD: project identity + batch + actions
         ═══════════════════════════════════════════════════════════ -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl p-5">
      <div class="min-w-0">
        <div class="flex items-center gap-2 mb-1.5">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Project</span>
        </div>
        <h1 class="text-xl font-extrabold tracking-[-0.02em] text-stone-900 dark:text-white text-balance truncate">
          {project.name}
        </h1>
        {#if project.description}
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5 truncate">{project.description}</p>
        {/if}
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <!-- Batch dropdown -->
        <select
          data-testid="batch-dropdown"
          class="appearance-none bg-white dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 hover:ring-stone-900/20 dark:hover:ring-white/20 rounded-xl pl-3.5 pr-8 py-2 text-xs font-semibold text-stone-700 dark:text-stone-200 cursor-pointer transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
          onchange={(e) => {
            const val = (e.currentTarget as HTMLSelectElement).value;
            switchBatch(val === '' ? null : batches.find(b => b.id === val) || null);
          }}
        >
          <option value="">All batches</option>
          {#each batches as batch}
            <option value={batch.id} selected={selectedBatch?.id === batch.id}>{batch.version_string}</option>
          {/each}
        </select>

        {#if user.id === project.owner_id}
          <button
            onclick={() => bumpVersion(false)}
            disabled={isBumping}
            title="Bump minor version (x.N.x)"
            class="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 hover:ring-stone-900/20 dark:hover:ring-white/20 text-stone-700 dark:text-stone-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 11l-5-5-5 5M17 18l-5-5-5 5"/></svg>
            Minor
          </button>
          <button
            onclick={() => bumpVersion(true)}
            disabled={isBumping}
            title="Bump major version (N.x.x)"
            class="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 hover:ring-stone-900/20 dark:hover:ring-white/20 text-stone-700 dark:text-stone-200 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
          >
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 11l-5-5-5 5M12 18V6"/></svg>
            Major
          </button>
          <button
            onclick={handleDeleteProject}
            disabled={isDeletingProject}
            title="Hapus project"
            class="inline-flex items-center gap-1.5 bg-white dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 hover:ring-rose-500/40 text-stone-700 dark:text-stone-200 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold px-3 py-2 rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 cursor-pointer"
          >
            {#if isDeletingProject}
              <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {:else}
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
            {/if}
            Hapus
          </button>
        {/if}

        <button
          onclick={() => showActivity = true}
          title="Project activity"
          class="inline-flex items-center gap-2 bg-white dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 hover:ring-stone-900/20 dark:hover:ring-white/20 text-stone-700 dark:text-stone-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-300 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
          Activity
        </button>

        <!-- Primary CTA — dashboard style -->
        <button
          data-testid="add-task-btn-header"
          onclick={() => { addTaskColumn = 'backlog'; showAddTask = true; }}
          class="inline-flex items-center gap-2 bg-brand-500 hover:bg-brand-400 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-[0_8px_20px_-8px_rgba(22,167,102,0.5)] transition-all duration-300 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Tambah task
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         KANBAN BOARD — 5 columns with DnD
         Dashboard segment colors: stone-400 / brand-500 / amber-500 / teal-600 / brand-700
         ═══════════════════════════════════════════════════════════ -->
    <div class="grid grid-cols-5 gap-4 h-[calc(100dvh-220px)]" in:fly={{ y: 20, duration: 500, delay: 60 }}>
      {#each COLUMNS as col}
        {@const colTasks = col.ref()}
        {@const dotClass = col.color === 'slate' ? 'bg-stone-400' : col.color === 'blue' ? 'bg-brand-500' : col.color === 'orange' ? 'bg-amber-500' : col.color === 'purple' ? 'bg-teal-600' : 'bg-brand-700'}
        {@const accentText = col.color === 'slate' ? 'text-stone-600 dark:text-stone-300' : col.color === 'blue' ? 'text-brand-600 dark:text-brand-400' : col.color === 'orange' ? 'text-amber-600 dark:text-amber-400' : col.color === 'purple' ? 'text-teal-600 dark:text-teal-400' : 'text-brand-700 dark:text-brand-300'}

        <div
          data-testid="kanban-column-{col.id}"
          class="flex flex-col h-full min-h-0 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:ring-stone-900/10 dark:hover:ring-white/15"
        >
          <!-- Column header — pinned at top -->
          <div class="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-stone-100 dark:border-white/[0.05]">
            <div class="flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full {dotClass}"></span>
              <h3 class="text-[13px] font-bold {accentText} tracking-tight">{col.name}</h3>
            </div>
            <span class="text-[11px] font-bold tabular-nums text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-white/5 rounded-full px-2 py-0.5">{colTasks.length}</span>
          </div>

          <!-- DnD container — scrollable area -->
          <div
            class="flex-1 overflow-y-auto scroll-smooth min-h-0 px-3 py-3 flex flex-col gap-2.5 kanban-scroll"
            use:dndzone={{ items: colTasks, flipDurationMs: 150, type: 'tasks' }}
            onconsider={(e) => handleDndConsider(col.id, e)}
            onfinalize={(e) => handleDndFinalize(col.id, e)}
          >
            {#each colTasks as task (task.id)}
              <div data-testid="task-card-{task.id}" animate:flip={{ duration: 150 }}>
                <TaskCard
                  {task}
                  assignee={getAssignee(task.assignee_id)}
                  columnColor={col.color}
                  attachmentCount={task.attachment_count ?? 0}
                  onAddLog={() => addLogTask = task}
                  onOpenDetail={() => detailTask = task}
                />
              </div>
            {/each}
          </div>

          <!-- Add task button — pinned at bottom -->
          <div class="shrink-0 px-3 pb-3 pt-1">
            <button
              onclick={() => { addTaskColumn = col.id; showAddTask = true; }}
              class="w-full py-2.5 text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-brand-600 dark:hover:text-brand-400 border border-dashed border-stone-200 dark:border-white/[0.08] hover:border-brand-500/40 dark:hover:border-brand-400/40 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
            >
              + Add task
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Custom scrollbar styling for Kanban columns -->
  <style>
    .kanban-scroll::-webkit-scrollbar { width: 4px; }
    .kanban-scroll::-webkit-scrollbar-track { background: transparent; }
    .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(168, 162, 158, 0.25); border-radius: 10px; }
    .kanban-scroll::-webkit-scrollbar-thumb:hover { background: rgba(168, 162, 158, 0.4); }
    :global(.dark) .kanban-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); }
    :global(.dark) .kanban-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.16); }
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

  {#if detailTask}
    <TaskDetailModal
      task={detailTask}
      assignee={getAssignee(detailTask.assignee_id)}
      currentUser={user}
      isOwner={user.id === project.owner_id}
      initialAttachmentCount={detailTask.attachment_count ?? 0}
      onClose={() => detailTask = null}
      onDeleted={(id) => {
        tasks = tasks.filter(t => t.id !== id);
        detailTask = null;
      }}
    />
  {/if}

  <ActivityPanel
    projectId={project.id}
    isOpen={showActivity}
    onClose={() => showActivity = false}
  />
</AppLayout>
