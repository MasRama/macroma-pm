<script lang="ts">
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
  }: {
    task: TaskRecord;
    assignee?: UserRecord;
    columnColor?: 'blue' | 'orange' | 'emerald';
    onAddLog?: (task: TaskRecord) => void;
  } = $props();

  let priorityClass = $derived(
    task.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
    'bg-green-500/20 text-green-400 border-green-500/20'
  );

  let themeClasses = $derived(
    columnColor === 'blue' ? 'bg-gradient-to-br from-blue-500/10 to-slate-900/60 border border-blue-500/20 hover:border-blue-400/40 border-l-2 border-l-blue-400' :
    columnColor === 'orange' ? 'bg-gradient-to-br from-orange-500/10 to-slate-900/60 border border-orange-500/20 hover:border-orange-400/40 border-l-2 border-l-orange-400' :
    'bg-gradient-to-br from-emerald-500/10 to-slate-900/60 border border-emerald-500/20 hover:border-emerald-400/40 border-l-2 border-l-emerald-400'
  );

  let btnColorClass = $derived(
    columnColor === 'blue' ? 'hover:text-blue-400' :
    columnColor === 'orange' ? 'hover:text-orange-400' :
    'hover:text-emerald-400'
  );
</script>

<div data-task-card class="group relative backdrop-blur-sm rounded-xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-0.5 {themeClasses}">
  <div class="flex items-center justify-between">
    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border {priorityClass}">
      {task.priority}
    </span>
  </div>

  <p class="text-sm font-medium text-slate-100 mt-2 mb-3 leading-snug">
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

    <button onclick={() => onAddLog?.(task)} class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 flex items-center gap-1 {btnColorClass}">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
      Log
    </button>
  </div>
</div>
