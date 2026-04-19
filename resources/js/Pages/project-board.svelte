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
  import VersionLogAccordion from '../Components/VersionLogAccordion.svelte';
  import { buildCSRFHeaders, Toast } from '../Components/helper';

  interface TaskRecord { id: string; project_id: string; batch_id: string | null; title: string; description: string | null; priority: 'low' | 'medium' | 'high'; assignee_id: string | null; column_id: 'ongoing' | 'revisi' | 'done'; sort_order: number; version_major: number; version_minor: number; version_patch: number; created_at: number; updated_at: number; }
  interface BatchRecord { id: string; project_id: string; major: number; minor: number; label: string | null; is_active: boolean; version_string: string; }
  interface Member { id: string; project_id: string; user_id: string; role: string; user?: { id: string; name: string | null; email: string; avatar: string | null; } }
  interface Project { id: string; name: string; description: string | null; owner_id: string; }
  interface User { id: string; name: string | null; email: string; avatar: string | null; }

  let { project, tasks: initialTasks = [], batches = [], activeBatch, members = [], user, projects = [] }: {
    project: Project;
    tasks: TaskRecord[];
    batches: BatchRecord[];
    activeBatch: BatchRecord | null;
    members: Member[];
    user: User;
    projects: any[];
  } = $props();

  let tasks = $state<TaskRecord[]>([...initialTasks]);
  let selectedBatch = $state<BatchRecord | null>(activeBatch ? { ...activeBatch } : null);
  let showAddTask = $state(false);
  let addTaskColumn = $state<string>('ongoing');

  // Move modal state
  let pendingMove = $state<{ taskId: string; fromColumn: string; toColumn: string; items: TaskRecord[] } | null>(null);
  let moveModalTask = $state<TaskRecord | null>(null);

  // Add log modal
  let addLogTask = $state<TaskRecord | null>(null);

  // Version log accordion state
  let expandedTaskId = $state<string | null>(null);

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
    
    // Optimistic update
    tasks = tasks.map(t => t.id === taskId ? { ...t, column_id: toColumn as any, version_patch: t.version_patch + 1 } : t);
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
    { id: 'ongoing' as const, name: 'On Going', ref: () => ongoingTasks },
    { id: 'revisi' as const, name: 'Revisi', ref: () => revisiTasks },
    { id: 'done' as const, name: 'Done', ref: () => doneTasks },
  ];
</script>

<AppLayout title={project.name} {projects} activeProjectId={project.id}>
  <!-- Background decorations -->
  <div class="fixed inset-0 pointer-events-none z-0">
    <div class="absolute top-0 right-0 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl -mr-64 -mt-64"></div>
    <div class="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-500/5 rounded-full blur-3xl -ml-32 -mb-32"></div>
  </div>

  <!-- Header: Project name + Batch dropdown + Add task button -->
  <header class="relative z-10 flex items-center justify-between px-8 py-5 border-b border-white/5">
    <div>
      <h1 class="text-xl font-bold">{project.name}</h1>
      {#if project.description}
        <p class="text-xs text-slate-400 mt-0.5">{project.description}</p>
      {/if}
    </div>
    
    <div class="flex items-center gap-3">
      <!-- Batch dropdown -->
      <div class="relative">
        <select
          data-testid="batch-dropdown"
          class="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 pr-8 text-sm text-slate-200 focus:outline-none focus:border-primary-400/50 cursor-pointer"
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
  <div class="relative z-10 grid grid-cols-3 gap-5 p-8 min-h-[calc(100vh-80px)]">
    {#each COLUMNS as col}
      {@const colTasks = col.ref()}
      <div data-testid="kanban-column-{col.id}" class="flex flex-col gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <!-- Column header -->
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-400">{col.name}</h3>
          <span class="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{colTasks.length}</span>
        </div>

        <!-- DnD container -->
        <div
          class="flex flex-col gap-3 flex-1 min-h-[60px]"
          use:dndzone={{ items: colTasks, flipDurationMs: 150, type: 'tasks' }}
          onconsider={(e) => handleDndConsider(col.id, e)}
          onfinalize={(e) => handleDndFinalize(col.id, e)}
        >
          {#each colTasks as task (task.id)}
            <div data-testid="task-card-{task.id}" animate:flip={{ duration: 150 }}>
              <TaskCard
                {task}
                assignee={getAssignee(task.assignee_id)}
                onAddLog={() => addLogTask = task}
                onShowLogs={() => expandedTaskId = expandedTaskId === task.id ? null : task.id}
              />
              {#if expandedTaskId === task.id}
                <VersionLogAccordion taskId={task.id} />
              {/if}
            </div>
          {/each}
        </div>

        <!-- Add task shortcut -->
        <button
          onclick={() => { addTaskColumn = col.id; showAddTask = true; }}
          class="w-full mt-1 py-2 text-xs text-slate-500 border border-dashed border-white/10 rounded-lg hover:border-primary-400/50 hover:text-primary-400 transition-all"
        >
          + Add Task
        </button>
      </div>
    {/each}
  </div>

  <!-- Modals -->
  {#if showAddTask}
    <AddTaskModal
      projectId={project.id}
      {members}
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
</AppLayout>
