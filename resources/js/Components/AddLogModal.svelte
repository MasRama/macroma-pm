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
    onConfirm,
    onCancel,
  }: {
    task: TaskRecord;
    onConfirm: (note: string) => void;
    onCancel: () => void;
  } = $props();

  let note = $state('');
  let canSubmit = $derived(note.trim().length > 0);

  let currentVersion = $derived(`v0.0.${task.version_patch}`);
  let nextVersion = `v0.0.?`;

  function handleSubmit() {
    if (!canSubmit) return;
    onConfirm(note.trim());
  }

  function handleBackdropClick() {
    onCancel();
  }
</script>

<div
  data-testid="add-log-modal"
  class="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    class="bg-white dark:bg-surface-dark backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 w-full max-w-md shadow-2xl"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="mb-6">
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-wide">Tambah Log Entry</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Versi akan naik tanpa memindah task</p>
    </div>
 
    <div class="bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 mb-5 shadow-inner">
      <p class="text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{task.title}</p>
    </div>
 
    <div class="flex items-center gap-3 mb-5 px-1">
      <span class="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">Versi:</span>
      <div class="flex items-center gap-2">
        <span class="font-mono text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] px-2 py-1 rounded border border-slate-200 dark:border-white/[0.08]">{currentVersion}</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span class="font-mono text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded border border-amber-200 dark:border-amber-500/20">{nextVersion}</span>
      </div>
    </div>
 
    <div class="mb-6">
      <textarea
        data-testid="add-log-note"
        bind:value={note}
        placeholder="Tambahkan catatan log (wajib)..."
        class="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl p-4 text-sm text-slate-900 dark:text-slate-200 resize-none min-h-[100px] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
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
        data-testid="add-log-cancel"
        onclick={onCancel}
        class="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-all"
      >
        Batal
      </button>
      <button
        type="button"
        data-testid="add-log-submit"
        onclick={handleSubmit}
        disabled={!canSubmit}
        class="px-5 py-2.5 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-[#0a0a0a] rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-amber-500 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.2)]"
      >
        Simpan Log
      </button>
    </div>
  </div>
</div>