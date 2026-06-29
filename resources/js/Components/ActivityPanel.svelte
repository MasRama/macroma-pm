<script lang="ts">
  import { fly } from 'svelte/transition';

  interface ActivityLog {
    id: string;
    project_id: string;
    event_type: 'project.created' | 'task.created' | 'task.moved' | 'task.log_added' | 'batch.created' | 'batch.activated';
    description: string;
    actor_id: string | null;
    actor_name: string | null;
    task_id: string | null;
    batch_id: string | null;
    meta: string | null;
    created_at: number;
  }

  let { projectId, isOpen = false, onClose }: {
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
  } = $props();

  let logs = $state<ActivityLog[]>([]);
  let isLoading = $state(false);
  let hasLoaded = $state(false);

  $effect(() => {
    if (isOpen && !hasLoaded) {
      loadActivity();
    }
  });

  async function loadActivity() {
    isLoading = true;
    try {
      const res = await fetch(`/projects/${projectId}/activity`);
      const data = await res.json();
      logs = data.data?.logs || [];
      hasLoaded = true;
    } catch {
      logs = [];
    } finally {
      isLoading = false;
    }
  }

  function refresh() {
    hasLoaded = false;
    loadActivity();
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function getVersion(log: ActivityLog): string | null {
    if (!log.meta) return null;
    try {
      const parsed = JSON.parse(log.meta);
      return parsed.version ?? null;
    } catch {
      return null;
    }
  }

  const EVENT_CONFIG: Record<string, { icon: string; color: string; bg: string; label: string }> = {
    'project.created': { icon: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21h18M5 21V7l8-4v18m4 0V11l-4-2"/><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 11v2m0 4v2m4-8v2m0 4v2"/>', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-200 dark:ring-brand-500/25', label: 'Project' },
    'task.created':    { icon: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>', color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-500/15 ring-1 ring-brand-200 dark:ring-brand-500/25', label: 'Task Baru' },
    'task.moved':      { icon: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>', color: 'text-info-600 dark:text-info-400', bg: 'bg-info-50 dark:bg-info-500/15 ring-1 ring-info-200 dark:ring-info-500/25', label: 'Dipindah' },
    'task.log_added':  { icon: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>', color: 'text-secondary-600 dark:text-secondary-400', bg: 'bg-secondary-50 dark:bg-secondary-500/15 ring-1 ring-secondary-200 dark:ring-secondary-500/25', label: 'Log' },
    'batch.created':   { icon: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>', color: 'text-accent-600 dark:text-accent-400', bg: 'bg-accent-50 dark:bg-accent-500/15 ring-1 ring-accent-200 dark:ring-accent-500/25', label: 'Batch Baru' },
    'batch.activated': { icon: '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>', color: 'text-warning-600 dark:text-warning-400', bg: 'bg-warning-50 dark:bg-warning-500/15 ring-1 ring-warning-200 dark:ring-warning-500/25', label: 'Batch Aktif' },
  };
</script>

{#if isOpen}
  <!-- Overlay backdrop (click to close) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-stone-900/30 dark:bg-black/40 backdrop-blur-sm z-40"
    onclick={onClose}
    transition:fly={{ duration: 200, opacity: 0 }}
  ></div>

  <!-- Panel -->
  <div
    class="fixed right-0 top-0 h-screen w-96 bg-white dark:bg-surface-dark ring-1 ring-stone-900/5 dark:ring-white/10 z-50 flex flex-col shadow-modal"
    transition:fly={{ x: 384, duration: 250 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-white/[0.05] bg-stone-50/50 dark:bg-white/[0.02]">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Aktivitas</span>
        </div>
        <h3 class="text-base font-semibold text-stone-900 dark:text-white tracking-tight">Project activity</h3>
        <p class="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">{logs.length} aktivitas terbaru</p>
      </div>
      <div class="flex items-center gap-1.5">
        <!-- Refresh button -->
        <button
          onclick={refresh}
          class="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-all rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
          title="Refresh"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 01-9 9 9.75 9.75 0 01-6.74-2.74L3 16M8 16H3v5"/></svg>
        </button>
        <!-- Close button -->
        <button
          onclick={onClose}
          class="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-all rounded-xl hover:bg-stone-100 dark:hover:bg-white/10 cursor-pointer"
          title="Tutup"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-5">
      {#if isLoading}
        <!-- Loading skeleton: 5 items -->
        <div class="space-y-6">
          {#each [1,2,3,4,5] as _}
            <div class="flex gap-4 animate-pulse">
              <div class="w-8 h-8 rounded-full bg-stone-200 dark:bg-white/[0.08] flex-shrink-0"></div>
              <div class="flex-1 space-y-2 mt-1">
                <div class="h-3 bg-stone-200 dark:bg-white/[0.08] rounded-md w-3/4"></div>
                <div class="h-2.5 bg-stone-100 dark:bg-white/[0.04] rounded-md w-1/2"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if logs.length === 0}
        <div class="flex flex-col items-center justify-center h-full text-center">
          <div class="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 flex items-center justify-center mb-4">
             <svg class="w-8 h-8 text-stone-400 dark:text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2v2M7 7h10" />
             </svg>
          </div>
          <p class="text-sm font-semibold text-stone-700 dark:text-stone-300">Belum ada aktivitas</p>
          <p class="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-[200px]">Aktivitas akan muncul saat project mulai berjalan</p>
        </div>
      {:else}
        <!-- Timeline -->
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-4 top-4 bottom-4 w-px bg-stone-200 dark:bg-white/[0.06]"></div>

          <div class="space-y-6 relative">
            {#each logs as log (log.id)}
              {@const cfg = EVENT_CONFIG[log.event_type] ?? { icon: '<circle cx="12" cy="12" r="4" fill="currentColor"/>', color: 'text-stone-500 dark:text-stone-400', bg: 'bg-stone-100 dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10', label: log.event_type }}
              <div class="flex gap-4 relative group">
                <!-- Icon badge -->
                <div class={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover:scale-110 ${cfg.bg} ${cfg.color}`}>
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    {@html cfg.icon}
                  </svg>
                </div>
 
                <div class="flex-1 min-w-0 pt-1">
                  <div class="flex flex-wrap items-center gap-2 mb-1">
                    <span class={`text-[10px] font-bold uppercase tracking-[0.15em] ${cfg.color}`}>{cfg.label}</span>
                    {#if getVersion(log)}
                      <span class="font-mono text-[10px] bg-stone-100 dark:bg-white/[0.08] text-stone-600 dark:text-stone-300 px-2 py-0.5 rounded-full ring-1 ring-stone-900/5 dark:ring-white/10">{getVersion(log)}</span>
                    {/if}
                  </div>
                  <p class="text-xs text-stone-700 dark:text-stone-200 leading-relaxed mb-2">{log.description}</p>
                  <div class="flex items-center gap-2">
                    {#if log.actor_name}
                      <span class="text-[10px] text-stone-500 dark:text-stone-500 font-medium">{log.actor_name}</span>
                      <span class="text-[10px] text-stone-300 dark:text-stone-500">·</span>
                    {/if}
                    <span class="text-[10px] text-stone-400 dark:text-stone-500">{formatTime(log.created_at)}</span>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}