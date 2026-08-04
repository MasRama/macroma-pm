<script lang="ts">
  import { fly, fade, scale } from 'svelte/transition';

  interface Attachment {
    id: string;
    url: string;
    name: string | null;
  }

  let {
    attachments,
    startIndex = 0,
    onClose,
  }: {
    attachments: Attachment[];
    startIndex?: number;
    onClose: () => void;
  } = $props();

  let currentIndex = $state(0);

  // Sync startIndex changes (e.g. when user clicks a different thumbnail while modal open)
  $effect(() => {
    const start = startIndex;
    currentIndex = start;
  });

  const current = $derived(attachments[currentIndex]);
  const hasPrev = $derived(currentIndex > 0);
  const hasNext = $derived(currentIndex < attachments.length - 1);

  function close() {
    onClose();
  }

  function prev() {
    if (hasPrev) currentIndex -= 1;
  }

  function next() {
    if (hasNext) currentIndex += 1;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') prev();
    else if (e.key === 'ArrowRight') next();
  }

  function onBackdropKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      close();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 sm:p-8"
  onclick={close}
  onkeydown={onBackdropKeydown}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <!-- Top bar: filename + counter + close -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="absolute top-0 left-0 right-0 flex items-center justify-between px-4 sm:px-6 py-3 text-white/90"
    onclick={(e) => e.stopPropagation()}
    role="toolbar"
    aria-label="Image preview controls"
    tabindex="-1"
    transition:fly={{ y: -10, duration: 200 }}
  >
    <div class="flex items-center gap-3 min-w-0">
      <span class="text-xs font-bold tabular-nums text-white/60 shrink-0">
        {currentIndex + 1} / {attachments.length}
      </span>
      <span class="text-xs font-medium truncate text-white/80">{current?.name || 'Image'}</span>
    </div>
    <button
      onclick={close}
      class="shrink-0 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      title="Tutup (Esc)"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>
  </div>

  <!-- Prev button -->
  {#if hasPrev}
    <button
      onclick={(e) => { e.stopPropagation(); prev(); }}
      class="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 active:scale-95 cursor-pointer z-10"
      title="Sebelumnya (←)"
      transition:fly={{ x: -10, duration: 200 }}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/></svg>
    </button>
  {/if}

  <!-- Image -->
  {#if current}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="max-w-full max-h-full flex items-center justify-center"
      onclick={(e) => e.stopPropagation()}
      role="img"
      tabindex="-1"
      transition:scale={{ duration: 200, start: 0.95 }}
      key={current.id}
    >
      <img
        src={current.url}
        alt={current.name || 'Attachment'}
        class="max-w-[92vw] max-h-[80vh] object-contain rounded-lg shadow-2xl"
      />
    </div>
  {/if}

  <!-- Next button -->
  {#if hasNext}
    <button
      onclick={(e) => { e.stopPropagation(); next(); }}
      class="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all duration-200 active:scale-95 cursor-pointer z-10"
      title="Berikutnya (→)"
      transition:fly={{ x: 10, duration: 200 }}
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
    </button>
  {/if}

  <!-- Thumbnail strip -->
  {#if attachments.length > 1}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto"
      onclick={(e) => e.stopPropagation()}
      role="toolbar"
      aria-label="Thumbnail navigation"
      tabindex="-1"
      transition:fly={{ y: 10, duration: 200 }}
    >
      {#each attachments as att, i (att.id)}
        <button
          onclick={() => currentIndex = i}
          class="shrink-0 w-12 h-12 rounded-lg overflow-hidden ring-2 transition-all duration-200 cursor-pointer {i === currentIndex ? 'ring-brand-400 opacity-100' : 'ring-white/10 opacity-50 hover:opacity-90'}"
        >
          <img src={att.url} alt={att.name || ''} class="w-full h-full object-cover" />
        </button>
      {/each}
    </div>
  {/if}
</div>
