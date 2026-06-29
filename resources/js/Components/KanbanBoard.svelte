<script lang="ts">
  import TaskCard from './TaskCard.svelte';

  interface TaskRecord {
    id: string;
    project_id: string;
    batch_id: string | null;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    assignee_id: string | null;
    column_id: 'backlog' | 'ongoing' | 'revisi' | 'review' | 'done';
    sort_order: number;
    version_major: number;
    version_minor: number;
    version_patch: number;
    created_at: number;
    updated_at: number;
  }

  interface Member {
    id: string;
    project_id: string;
    user_id: string;
    role: string;
    user?: {
      id: string;
      name: string | null;
      email: string;
      avatar: string | null;
    };
  }

  let {
    tasks = [],
    members = [],
    onAddTask
  }: {
    tasks: TaskRecord[];
    members: Member[];
    onAddTask?: (columnId: string) => void;
  } = $props();

  let ongoingTasks = $state<TaskRecord[]>([]);
  let revisiTasks = $state<TaskRecord[]>([]);
  let reviewTasks = $state<TaskRecord[]>([]);
  let doneTasks = $state<TaskRecord[]>([]);

  $effect(() => {
    ongoingTasks = tasks.filter(t => t.column_id === 'ongoing').sort((a, b) => a.sort_order - b.sort_order);
    revisiTasks = tasks.filter(t => t.column_id === 'revisi').sort((a, b) => a.sort_order - b.sort_order);
    reviewTasks = tasks.filter(t => t.column_id === 'review').sort((a, b) => a.sort_order - b.sort_order);
    doneTasks = tasks.filter(t => t.column_id === 'done').sort((a, b) => a.sort_order - b.sort_order);
  });

  const columns = [
    { id: 'ongoing', name: 'On Going', tasks: () => ongoingTasks },
    { id: 'revisi', name: 'Revisi', tasks: () => revisiTasks },
    { id: 'review', name: 'Review', tasks: () => reviewTasks },
    { id: 'done', name: 'Done', tasks: () => doneTasks }
  ];

  function getAssignee(assigneeId: string | null) {
    if (!assigneeId) return undefined;
    const member = members.find(m => m.user_id === assigneeId);
    return member?.user;
  }
</script>

<div class="grid grid-cols-4 gap-4 p-5 h-full">
  {#each columns as column}
    {@const isDone = column.id === 'done'}
    <div
      data-column={column.id}
      data-testid="kanban-column-{column.id}"
      class="flex flex-col h-full min-h-0 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl overflow-hidden"
    >
      <div class="shrink-0 flex items-center justify-between px-4 pt-4 pb-3 border-b border-stone-100 dark:border-white/[0.05]">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full {isDone ? 'bg-brand-700' : 'bg-stone-400'}"></span>
          <h3 class="text-[13px] font-bold text-stone-700 dark:text-stone-200 tracking-tight">{column.name}</h3>
        </div>
        <span class="text-[11px] font-bold tabular-nums text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-white/5 rounded-full px-2 py-0.5">{column.tasks().length}</span>
      </div>

      <div class="flex-1 overflow-y-auto min-h-0 px-3 py-3 flex flex-col gap-2.5">
        {#each column.tasks() as task (task.id)}
          <TaskCard {task} assignee={getAssignee(task.assignee_id)} />
        {/each}

        <button
          onclick={() => onAddTask?.(column.id)}
          data-testid="add-task-btn"
          class="w-full py-2.5 text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-brand-600 dark:hover:text-brand-400 border border-dashed border-stone-200 dark:border-white/[0.08] hover:border-brand-500/40 dark:hover:border-brand-400/40 rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
        >
          + Add task
        </button>
      </div>
    </div>
  {/each}
</div>
