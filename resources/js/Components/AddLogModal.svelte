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
  class="fixed inset-0 bg-stone-900/30 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    class="bg-white dark:bg-surface-dark ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl p-6 w-full max-w-md shadow-modal"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-secondary-500"></span>
        <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-secondary-600 dark:text-secondary-400">Log entry</span>
      </div>
      <h2 class="text-xl font-extrabold tracking-[-0.02em] text-stone-900 dark:text-white">Tambah log entry</h2>
      <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">Versi akan naik tanpa memindah task</p>
    </div>
 
    <div class="bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-xl p-4 mb-5">
      <p class="text-sm font-medium text-stone-800 dark:text-stone-200 leading-relaxed">{task.title}</p>
    </div>
 
    <div class="flex items-center gap-3 mb-5 px-1">
      <span class="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400">Versi:</span>
      <div class="flex items-center gap-2">
        <span class="font-mono text-xs text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-white/[0.04] px-2 py-1 rounded ring-1 ring-stone-900/5 dark:ring-white/10">{currentVersion}</span>
        <svg class="w-3 h-3 text-stone-400 dark:text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7"/></svg>
        <span class="font-mono text-xs text-secondary-600 dark:text-secondary-400 bg-secondary-50 dark:bg-secondary-500/10 px-2 py-1 rounded ring-1 ring-secondary-200 dark:ring-secondary-500/20">{nextVersion}</span>
      </div>
    </div>
 
    <div class="mb-6">
      <textarea
        data-testid="add-log-note"
        bind:value={note}
        placeholder="Tambahkan catatan log (wajib)..."
        class="w-full bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-xl p-4 text-sm text-stone-900 dark:text-stone-200 resize-none min-h-[100px] focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500/60 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
        required
      ></textarea>
      <div class="h-4 mt-1">
        {#if !canSubmit && note.length > 0}
          <p class="text-xs text-danger-500 font-medium" transition:fade={{duration: 150}}>Catatan wajib diisi</p>
        {/if}
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-2">
      <button
        type="button"
        data-testid="add-log-cancel"
        onclick={onCancel}
        class="px-5 py-2.5 text-sm font-semibold text-stone-500 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.08] rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer"
      >
        Batal
      </button>
      <button
        type="button"
        data-testid="add-log-submit"
        onclick={handleSubmit}
        disabled={!canSubmit}
        class="px-5 py-2.5 text-sm font-semibold bg-secondary-500 hover:bg-secondary-400 text-white rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-secondary-500 disabled:cursor-not-allowed shadow-glow-amber cursor-pointer"
      >
        Simpan log
      </button>
    </div>
  </div>
</div>