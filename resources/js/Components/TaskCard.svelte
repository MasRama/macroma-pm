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

  type ColumnColor = 'slate' | 'blue' | 'orange' | 'emerald';

  let {
    task,
    assignee,
    columnColor = 'blue',
    attachmentCount = 0,
    onAddLog,
    onOpenDetail,
  }: {
    task: TaskRecord;
    assignee?: UserRecord;
    columnColor?: ColumnColor;
    attachmentCount?: number;
    onAddLog?: (task: TaskRecord) => void;
    onOpenDetail?: (task: TaskRecord) => void;
  } = $props();

  // Priority → single dot, dashboard palette (brand/amber/rose)
  const priorityDot = $derived(
    task.priority === 'high'
      ? 'bg-rose-500'
      : task.priority === 'medium'
        ? 'bg-amber-500'
        : 'bg-brand-500'
  );

  const versionString = $derived(
    `v${task.version_major}.${task.version_minor}.${task.version_patch}`
  );

  const initials = $derived(
    ((assignee?.name || assignee?.email || '?')[0] || '?').toUpperCase()
  );
</script>

<div
  data-task-card
  class="group relative bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 hover:ring-stone-900/15 dark:hover:ring-white/20 hover:shadow-[0_8px_20px_-12px_rgba(22,167,102,0.2)] rounded-xl p-4 transition-all duration-300 cursor-grab active:cursor-grabbing active:scale-[0.99]"
>
  <div
    role="button"
    tabindex="0"
    class="cursor-pointer rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60"
    onmousedown={(e) => e.stopPropagation()}
    ontouchstart={(e) => e.stopPropagation()}
    onclick={() => onOpenDetail?.(task)}
    onkeydown={(e) => e.key === 'Enter' && onOpenDetail?.(task)}
  >
    <!-- Meta row: priority dot + label + version -->
    <div class="flex items-center justify-between mb-2.5">
      <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">
        <span class="w-1.5 h-1.5 rounded-full {priorityDot}"></span>
        {task.priority}
      </span>
      <span class="text-[10px] font-bold tabular-nums text-stone-400 dark:text-stone-500">
        {versionString}
      </span>
    </div>

    <!-- Title -->
    <p class="text-sm font-semibold text-stone-900 dark:text-white leading-snug text-balance">
      {task.title}
    </p>

    <!-- Footer: assignee + log action -->
    <div class="flex items-center justify-between mt-3.5">
      <div class="flex items-center gap-2">
        {#if attachmentCount > 0}
          <span
            class="inline-flex items-center gap-1 text-[10px] font-semibold text-stone-400 dark:text-stone-500"
            title={`${attachmentCount} gambar`}
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            {attachmentCount}
          </span>
        {/if}
        {#if assignee}
          <div
            class="w-6 h-6 rounded-full bg-stone-100 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-stone-600 dark:text-stone-200 overflow-hidden ring-1 ring-stone-900/5 dark:ring-white/10"
            title={assignee.name || assignee.email}
          >
            {#if assignee.avatar}
              <img src={assignee.avatar} alt={assignee.name || assignee.email} class="w-full h-full object-cover" />
            {:else}
              {initials}
            {/if}
          </div>
        {/if}
      </div>

      <button
        onmousedown={(e) => e.stopPropagation()}
        ontouchstart={(e) => e.stopPropagation()}
        onclick={(e) => { e.stopPropagation(); onAddLog?.(task); }}
        class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-200 text-[11px] font-semibold text-stone-400 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 cursor-pointer"
        title="Tambah log"
      >
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
        Log
      </button>
    </div>
  </div>
</div>
