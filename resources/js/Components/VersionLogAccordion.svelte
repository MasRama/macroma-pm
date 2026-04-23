<script lang="ts">
  import { slide } from 'svelte/transition';

  let { taskId }: { taskId: string } = $props();

  interface LogRecord { 
    id: string; 
    task_id: string; 
    version: string; 
    column_from: string | null; 
    column_to: string; 
    note: string; 
    created_by: string | null; 
    created_at: number; 
  }

  let isOpen = $state(false);
  let logs = $state<LogRecord[]>([]);
  let isLoading = $state(false);

  const columnNames: Record<string, string> = { 
    ongoing: 'On Going', 
    revisi: 'Revisi', 
    done: 'Done' 
  };

  async function toggle() {
    isOpen = !isOpen;
    if (isOpen && logs.length === 0) {
      isLoading = true;
      try {
        const res = await fetch(`/tasks/${taskId}/logs`);
        const data = await res.json();
        logs = data.data?.logs || [];
      } catch { 
        logs = []; 
      } finally { 
        isLoading = false; 
      }
    }
  }
</script>

<div data-testid="version-log-accordion" class="mt-3 border-t border-slate-200 dark:border-white/5 pt-3">
  <button onclick={toggle} class="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors w-full text-left cursor-pointer">
    <svg class="w-4 h-4 transition-transform duration-200" class:rotate-180={isOpen} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
    </svg>
    <span>Version History</span>
  </button>
  
  {#if isOpen}
    <div transition:slide={{ duration: 200 }} class="mt-3 space-y-3">
      {#if isLoading}
        <div class="text-xs text-slate-500 animate-pulse">Loading...</div>
      {:else if logs.length === 0}
        <div class="text-xs text-slate-500">Tidak ada log versi.</div>
      {:else}
        {#each logs as log}
          <div class="flex flex-col gap-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/[0.06] p-2 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="font-mono text-[10px] bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">{log.version}</span>
              <span class="text-xs text-slate-600 dark:text-slate-300">
                {log.column_from ? (columnNames[log.column_from] || log.column_from) : 'Created'} &rarr; {columnNames[log.column_to] || log.column_to}
              </span>
            </div>
            {#if log.note}
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{log.note}</div>
            {/if}
            <div class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        {/each}
      {/if}
    </div>
  {/if}
</div>
