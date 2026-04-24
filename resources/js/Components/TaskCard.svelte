<script lang="ts">
  import VersionLogAccordion from './VersionLogAccordion.svelte';

  interface TaskRecord {
    id: string;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    assignee_id: string | null;
    column_id: string;
    version_major: number;
    version_minor: number;
    version_patch: number;
  }

  interface UserRecord {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  let {
    task,
    assignee,
    columnColor = 'blue',
    onAddLog,
    onOpenDetail,
  }: {
    task: TaskRecord;
    assignee?: UserRecord;
    columnColor?: 'slate' | 'blue' | 'orange' | 'emerald';
    onAddLog?: (task: TaskRecord) => void;
    onOpenDetail?: (task: TaskRecord) => void;
  } = $props();

  let priorityClass = $derived(
    task.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
    'bg-green-500/20 text-green-400 border-green-500/20'
  );

  let themeClasses = $derived(
    columnColor === 'slate' ? 'bg-white dark:bg-slate-950/40 border-l-2 border-l-slate-400 border border-slate-200 hover:border-slate-300 dark:border-slate-500/30 dark:hover:border-slate-400/50' :
    columnColor === 'blue' ? 'bg-white dark:bg-blue-950/40 border-l-2 border-l-blue-400 border border-blue-200 hover:border-blue-300 dark:border-blue-500/30 dark:hover:border-blue-400/50' :
    columnColor === 'orange' ? 'bg-white dark:bg-orange-950/40 border-l-2 border-l-orange-400 border border-orange-200 hover:border-orange-300 dark:border-orange-500/30 dark:hover:border-orange-400/50' :
    'bg-white dark:bg-emerald-950/40 border-l-2 border-l-emerald-400 border border-emerald-200 hover:border-emerald-300 dark:border-emerald-500/30 dark:hover:border-emerald-400/50'
  );

  let btnColorClass = $derived(
    columnColor === 'slate' ? 'hover:text-slate-500 dark:hover:text-slate-300' :
    columnColor === 'blue' ? 'hover:text-blue-400' :
    columnColor === 'orange' ? 'hover:text-orange-400' :
    'hover:text-emerald-400'
  );
</script>

<div data-task-card class="group relative backdrop-blur-sm rounded-xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 {themeClasses}">
  <div
    role="button"
    tabindex="0"
    class="cursor-pointer"
    onmousedown={(e) => e.stopPropagation()}
    ontouchstart={(e) => e.stopPropagation()}
    onclick={() => onOpenDetail?.(task)}
    onkeydown={(e) => e.key === 'Enter' && onOpenDetail?.(task)}
  >
    <div class="flex items-center justify-between">
      <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border {priorityClass}">
        {task.priority}
      </span>
    </div>

    <p class="text-sm font-medium text-slate-800 dark:text-slate-100 mt-2 mb-3 leading-snug">
      {task.title}
    </p>

    <div class="flex items-center justify-between mt-auto">
      <div class="flex items-center">
        {#if assignee}
          <div class="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 overflow-hidden" title={assignee.name || assignee.email}>
            {#if assignee.avatar}
              <img src={assignee.avatar} alt={assignee.name || assignee.email} class="w-full h-full object-cover" />
            {:else}
              {((assignee.name || assignee.email)[0] || '').toUpperCase()}
            {/if}
          </div>
        {/if}
      </div>

      <button
        onmousedown={(e) => e.stopPropagation()}
        ontouchstart={(e) => e.stopPropagation()}
        onclick={(e) => { e.stopPropagation(); onAddLog?.(task); }}
        class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 flex items-center gap-1 {btnColorClass}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Log
      </button>
    </div>
  </div>

  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    onmousedown={(e) => e.stopPropagation()}
    ontouchstart={(e) => e.stopPropagation()}
  >
    <VersionLogAccordion taskId={task.id} />
  </div>
</div>
