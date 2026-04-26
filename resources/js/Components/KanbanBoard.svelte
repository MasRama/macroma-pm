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

<div class="grid grid-cols-4 gap-6 p-6 h-full">
  {#each columns as column}
    <div
      data-column={column.id}
      data-testid="kanban-column-{column.id}"
      class="flex flex-col gap-3 bg-white/5 dark:bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-xl p-4"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {column.name}
        </h3>
        <span class="text-xs bg-white/10 dark:bg-white/5 px-2 py-0.5 rounded-full">
          {column.tasks().length}
        </span>
      </div>

      <div class="flex flex-col gap-3 flex-1">
        {#each column.tasks() as task (task.id)}
          <TaskCard {task} assignee={getAssignee(task.assignee_id)} />
        {/each}
        
        <button
          onclick={() => onAddTask?.(column.id)}
          data-testid="add-task-btn"
          class="w-full mt-2 py-2 text-xs text-slate-400 border border-dashed border-white/10 rounded-lg hover:border-primary-400/50 hover:text-primary-400 transition-all"
        >
          + Add Task
        </button>
      </div>
    </div>
  {/each}
</div>
