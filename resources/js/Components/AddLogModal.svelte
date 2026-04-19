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
  data-testid="add-log-modal"
  class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={handleBackdropClick}
  onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    class="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white mb-1">Tambah Log Entry</h2>
      <p class="text-sm text-slate-400">Versi akan naik tanpa memindah task</p>
    </div>

    <div class="bg-white/5 border border-white/10 rounded-lg p-3 mb-4">
      <p class="text-sm font-medium text-slate-200">{task.title}</p>
    </div>

    <p class="text-xs text-slate-400 mb-4">
      Versi: <span class="font-mono">{currentVersion}</span> → <span class="font-mono text-primary-400">{nextVersion}</span>
    </p>

    <div class="mb-6">
      <textarea
        data-testid="add-log-note"
        bind:value={note}
        placeholder="Tambahkan catatan..."
        class="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-slate-200 resize-none h-28 focus:outline-none focus:border-primary-400/50 transition-colors"
        required
      ></textarea>
      {#if !canSubmit && note.length > 0}
        <p class="text-xs text-red-400 mt-1">Catatan wajib diisi</p>
      {:else if !canSubmit}
        <p class="text-xs text-red-400 mt-1 opacity-0">Catatan wajib diisi</p>
      {/if}
    </div>

    <div class="flex justify-end gap-3">
      <button
        type="button"
        data-testid="add-log-cancel"
        onclick={onCancel}
        class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      >
        Batal
      </button>
      <button
        type="button"
        data-testid="add-log-submit"
        onclick={handleSubmit}
        disabled={!canSubmit}
        class="px-4 py-2 text-sm font-medium bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Simpan Log
      </button>
    </div>
  </div>
</div>
