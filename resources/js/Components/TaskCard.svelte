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
    onAddLog,
    onShowLogs
  }: {
    task: TaskRecord;
    assignee?: UserRecord;
    onAddLog?: (task: TaskRecord) => void;
    onShowLogs?: (task: TaskRecord) => void;
  } = $props();

  let priorityClass = $derived(
    task.priority === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
    'bg-green-500/20 text-green-400 border-green-500/20'
  );
</script>

<div data-task-card class="group relative bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary-400/30 rounded-xl p-4 transition-all duration-200 cursor-grab active:cursor-grabbing">
  <div class="flex items-center justify-between">
    <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border {priorityClass}">
      {task.priority}
    </span>
    <span class="font-mono text-[10px] bg-slate-700/50 dark:bg-slate-800/80 text-slate-300 px-1.5 py-0.5 rounded" data-testid="version-chip">
      v{task.version_major}.{task.version_minor}.{task.version_patch}
    </span>
  </div>

  <p class="text-sm font-medium text-slate-800 dark:text-slate-100 mt-2 mb-3 leading-snug">
    {task.title}
  </p>

  <div class="flex items-center justify-between mt-auto">
    <div class="flex items-center">
      {#if assignee}
        <div class="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 overflow-hidden" title={assignee.name || assignee.email}>
          {#if assignee.avatar}
            <img src={assignee.avatar} alt={assignee.name || assignee.email} class="w-full h-full object-cover" />
          {:else}
            {((assignee.name || assignee.email)[0] || '').toUpperCase()}
          {/if}
        </div>
      {/if}
    </div>

    <div class="flex items-center gap-2">
      <button onclick={() => onShowLogs?.(task)} class="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 hover:text-primary-400">
        Version Log
      </button>
      <button onclick={() => onAddLog?.(task)} class="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400 hover:text-primary-400 flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
        Log
      </button>
    </div>
  </div>
</div>
