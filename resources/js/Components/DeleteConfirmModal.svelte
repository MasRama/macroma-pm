<script lang="ts">
  import { fly, fade } from 'svelte/transition';

  let {
    title,
    targetName,
    warningText,
    confirmLabel = 'Hapus',
    isDeleting = false,
    onConfirm,
    onCancel,
  }: {
    title: string;
    targetName: string;
    warningText: string;
    confirmLabel?: string;
    isDeleting?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  } = $props();

  let confirmInput = $state('');

  let canConfirm = $derived(confirmInput.trim() === targetName.trim());

  function handleSubmit() {
    if (!canConfirm || isDeleting) return;
    onConfirm();
  }

  function handleBackdropClick() {
    if (!isDeleting) onCancel();
  }
</script>

<div
  data-testid="delete-confirm-modal"
  class="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
    <div class="flex items-start gap-3 mb-5">
      <div class="shrink-0 w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 ring-1 ring-rose-200 dark:ring-rose-500/20 flex items-center justify-center">
        <svg class="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
      </div>
      <div class="min-w-0">
        <h2 class="text-lg font-bold tracking-[-0.01em] text-stone-900 dark:text-white">{title}</h2>
        <p class="text-sm text-stone-500 dark:text-stone-400 mt-0.5 leading-relaxed">{warningText}</p>
      </div>
    </div>

    <div class="bg-rose-50/50 dark:bg-rose-500/[0.06] ring-1 ring-rose-200/60 dark:ring-rose-500/15 rounded-xl p-4 mb-5">
      <p class="text-xs font-semibold text-stone-600 dark:text-stone-300 mb-1">
        Ketik <span class="font-bold text-rose-600 dark:text-rose-400">{targetName}</span> untuk konfirmasi
      </p>
      <input
        data-testid="delete-confirm-input"
        bind:value={confirmInput}
        type="text"
        placeholder={targetName}
        autocomplete="off"
        spellcheck="false"
        class="w-full bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
        onkeydown={(e) => e.key === 'Enter' && handleSubmit()}
      />
    </div>

    <div class="flex items-center justify-end gap-3">
      <button
        type="button"
        onclick={onCancel}
        disabled={isDeleting}
        class="px-5 py-2.5 text-sm font-semibold text-stone-500 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.08] rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
      >
        Batal
      </button>
      <button
        type="button"
        data-testid="delete-confirm-submit"
        onclick={handleSubmit}
        disabled={!canConfirm || isDeleting}
        class="px-5 py-2.5 text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-rose-500 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
      >
        {#if isDeleting}
          <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          Menghapus...
        {:else}
          {confirmLabel}
        {/if}
      </button>
    </div>
  </div>
</div>
