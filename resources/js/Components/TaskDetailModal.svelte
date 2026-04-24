<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { buildCSRFHeaders, Toast, api } from './helper';
  import axios from 'axios';

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
    created_at: number;
  }

  interface UserRecord {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  let { task, assignee, isOwner = false, onClose, onDeleted }: {
    task: TaskRecord;
    assignee?: UserRecord;
    isOwner?: boolean;
    onClose: () => void;
    onDeleted: (taskId: string) => void;
  } = $props();

  let isDeleting = $state(false);

  const priorityLabel = $derived(
    task.priority === 'high' ? 'High' :
    task.priority === 'medium' ? 'Medium' : 'Low'
  );

  const priorityClass = $derived(
    task.priority === 'high' ? 'bg-red-500/15 text-red-500 border-red-500/20' :
    task.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20' :
    'bg-green-500/15 text-green-500 border-green-500/20'
  );

  const columnLabel: Record<string, string> = {
    backlog: 'Backlog',
    ongoing: 'On Going',
    revisi: 'Revisi',
    done: 'Done',
  };

  const versionString = $derived(
    `${task.version_major}.${task.version_minor}.${task.version_patch}`
  );

  async function handleDelete() {
    if (!confirm(`Yakin ingin menghapus task "${task.title}"?`)) return;
    isDeleting = true;
    const result = await api(() => axios.delete(`/tasks/${task.id}`, { headers: buildCSRFHeaders() }));
    isDeleting = false;
    if (result.success) {
      onDeleted(task.id);
    }
  }
</script>

<div
  class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    class="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">v{versionString}</p>
        <h2 class="text-base font-semibold text-slate-900 dark:text-white leading-snug">{task.title}</h2>
      </div>
      <button
        onclick={onClose}
        class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <div class="px-6 py-4 space-y-4 overflow-y-auto flex-1">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border {priorityClass}">
          {priorityLabel}
        </span>
        <span class="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
          {columnLabel[task.column_id] ?? task.column_id}
        </span>
        {#if assignee}
          <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <div class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold overflow-hidden">
              {#if assignee.avatar}
                <img src={assignee.avatar} alt={assignee.name || assignee.email} class="w-full h-full object-cover" />
              {:else}
                {((assignee.name || assignee.email)[0] || '').toUpperCase()}
              {/if}
            </div>
            <span>{assignee.name || assignee.email}</span>
          </div>
        {/if}
      </div>

      <div>
        <p class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Deskripsi</p>
        {#if task.description}
          <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
        {:else}
          <p class="text-sm text-slate-400 dark:text-slate-500 italic">Tidak ada deskripsi</p>
        {/if}
      </div>

      <p class="text-[11px] text-slate-400 dark:text-slate-500">
        Dibuat {new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>

    {#if isOwner}
      <div class="px-6 pb-5 pt-1 flex justify-end shrink-0 border-t border-slate-100 dark:border-white/[0.06]">
        <button
          onclick={handleDelete}
          disabled={isDeleting}
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isDeleting}
            <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          {/if}
          Hapus Task
        </button>
      </div>
    {/if}
  </div>
</div>
