<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  interface TaskRecord {
    id: string;
    title: string;
    column_id: string;
    version_major: number;
    version_minor: number;
    version_patch: number;
  }

  let {
    task,
    targetColumn,
    onConfirm,
    onCancel,
  }: {
    task: TaskRecord;
    targetColumn: string;
    onConfirm: (note: string) => void;
    onCancel: () => void;
  } = $props();

  let note = $state('');
  let canSubmit = $derived(note.trim().length > 0);

  const columnNames: Record<string, string> = {
    ongoing: 'On Going',
    revisi: 'Revisi',
    done: 'Done',
  };

  let currentVersion = $derived(`v${task.version_major}.${task.version_minor}.${task.version_patch}`);
  let nextVersion = $derived(`v${task.version_major}.${task.version_minor}.${task.version_patch + 1}`);

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm(note.trim());
  }

  function handleBackdropClick() {
    onCancel();
  }
</script>

<div
  data-testid="move-modal"
  class="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    class="bg-white dark:bg-[#0a0a0a]/98 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="mb-6">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-wide">Pindah Task</h2>
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
        <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200">{columnNames[task.column_id] ?? task.column_id}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200">{columnNames[targetColumn] ?? targetColumn}</span>
      </div>
    </div>
 
    <div class="bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 mb-5 shadow-inner">
      <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{task.title}</p>
    </div>
 
    <div class="flex items-center gap-3 mb-5 px-1">
      <span class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Versi:</span>
      <div class="flex items-center gap-2">
        <span class="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] px-2 py-1 rounded border border-slate-200 dark:border-white/[0.08]">{currentVersion}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span class="font-mono text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-500/20">{nextVersion}</span>
      </div>
    </div>
 
    <div class="mb-6">
      <textarea
        data-testid="move-modal-note"
        bind:value={note}
        placeholder="Tambahkan catatan (wajib)..."
        class="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 text-sm text-slate-900 dark:text-slate-200 resize-none min-h-[100px] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        required
      ></textarea>
      <div class="h-4 mt-1">
        {#if !canSubmit && note.length > 0}
          <p class="text-xs text-red-400" transition:fade={{duration: 150}}>Catatan wajib diisi</p>
        {/if}
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        data-testid="move-modal-cancel"
        onclick={onCancel}
        class="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-all"
      >
        Batal
      </button>
      <button
        type="button"
        data-testid="move-modal-submit"
        onclick={handleSubmit}
        disabled={!canSubmit}
        class="px-5 py-2.5 text-sm font-medium bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)]"
      >
        Simpan & Pindah
      </button>
    </div>
  </div>
</div>