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

  const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
    'project.created': { icon: '🏗️', color: 'text-primary-400', label: 'Project' },
    'task.created':    { icon: '✅', color: 'text-green-400',   label: 'Task Baru' },
    'task.moved':      { icon: '🔀', color: 'text-blue-400',    label: 'Dipindah' },
    'task.log_added':  { icon: '📝', color: 'text-yellow-400',  label: 'Log' },
    'batch.created':   { icon: '📦', color: 'text-purple-400',  label: 'Batch Baru' },
    'batch.activated': { icon: '🚀', color: 'text-orange-400',  label: 'Batch Aktif' },
  };
</script>

{#if isOpen}
  <!-- Overlay backdrop (click to close) -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
    onclick={onClose}
    transition:fly={{ duration: 200, opacity: 0 }}
  ></div>

  <!-- Panel -->
  <div
    class="fixed right-0 top-0 h-screen w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
    transition:fly={{ x: 320, duration: 250 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-5 py-4 border-b border-white/10">
      <div>
        <h3 class="text-sm font-semibold text-white">Project Activity</h3>
        <p class="text-[10px] text-slate-400 mt-0.5">{logs.length} aktivitas terbaru</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- Refresh button -->
        <button
          onclick={refresh}
          class="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          title="Refresh"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
        </button>
        <!-- Close button -->
        <button
          onclick={onClose}
          class="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          title="Tutup"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-4 py-3">
      {#if isLoading}
        <!-- Loading skeleton: 5 items -->
        <div class="space-y-3">
          {#each [1,2,3,4,5] as _}
            <div class="flex gap-3 animate-pulse">
              <div class="w-7 h-7 rounded-full bg-white/10 flex-shrink-0"></div>
              <div class="flex-1 space-y-1.5">
                <div class="h-3 bg-white/10 rounded w-3/4"></div>
                <div class="h-2.5 bg-white/5 rounded w-1/2"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if logs.length === 0}
        <div class="flex flex-col items-center justify-center h-48 text-center">
          <span class="text-3xl mb-3">📋</span>
          <p class="text-sm text-slate-400">Belum ada aktivitas</p>
          <p class="text-[11px] text-slate-500 mt-1">Aktivitas akan muncul saat task dibuat atau dipindah</p>
        </div>
      {:else}
        <!-- Timeline -->
        <div class="relative">
          <!-- Vertical line -->
          <div class="absolute left-3 top-0 bottom-0 w-px bg-white/10"></div>

          <div class="space-y-1">
            {#each logs as log (log.id)}
              {@const cfg = EVENT_CONFIG[log.event_type] ?? { icon: '•', color: 'text-slate-400', label: log.event_type }}
              <div class="flex gap-3 py-2.5 relative">
                <!-- Icon dot -->
                <div class="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0 text-sm z-10">
                  {cfg.icon}
                </div>

                <div class="flex-1 min-w-0 pt-0.5">
                  <!-- Event label badge -->
                  <span class="text-[9px] font-bold uppercase tracking-wider {cfg.color} opacity-80">{cfg.label}</span>
                  <!-- Description -->
                  <p class="text-xs text-slate-200 leading-relaxed mt-0.5">{log.description}</p>
                  <!-- Footer: actor + time -->
                  <div class="flex items-center gap-2 mt-1">
                    {#if log.actor_name}
                      <span class="text-[10px] text-slate-500">{log.actor_name}</span>
                      <span class="text-[10px] text-slate-600">·</span>
                    {/if}
                    <span class="text-[10px] text-slate-500">{formatTime(log.created_at)}</span>
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