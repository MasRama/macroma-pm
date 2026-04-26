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
  let copiedId = $state<string | null>(null);

  async function copyNote(log: LogRecord) {
    try {
      await navigator.clipboard.writeText(log.note);
      copiedId = log.id;
      setTimeout(() => { copiedId = null; }, 1500);
    } catch {
      copiedId = null;
    }
  }

  const columnNames: Record<string, string> = { 
    backlog: 'Backlog',
    ongoing: 'On Going', 
    revisi: 'Revisi', 
    review: 'Review',
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
              <div class="flex items-start justify-between gap-2 mt-0.5 group/note">
                <p class="text-xs text-slate-500 dark:text-slate-400 flex-1">{log.note}</p>
                <button
                  onclick={() => copyNote(log)}
                  title="Copy catatan"
                  class="shrink-0 p-1 rounded text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors opacity-0 group-hover/note:opacity-100 focus:opacity-100"
                >
                  {#if copiedId === log.id}
                    <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else}
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></rect>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                    </svg>
                  {/if}
                </button>
              </div>
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
