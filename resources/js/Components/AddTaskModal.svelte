<script lang="ts">
  import { router } from '@inertiajs/svelte';
  import { buildCSRFHeaders, Toast } from '../Components/helper';
  import { fly, fade } from 'svelte/transition';

  interface Member {
    id: string;
    user_id: string;
    role: string;
    user?: { id: string; name: string | null; email: string; }
  }

  let { projectId, members = [], batchId = null, onClose }: {
    projectId: string;
    members: Member[];
    batchId?: string | null;
    onClose: () => void;
  } = $props();

  let title = $state('');
  let priority = $state<'low' | 'medium' | 'high'>('medium');
  let assigneeId = $state('');
  let description = $state('');
  let isSubmitting = $state(false);
  let error = $state('');

  // Attachment state
  let selectedFiles = $state<File[]>([]);
  let isDragOver = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);

  const previewUrls = $derived(
    selectedFiles.map(f => URL.createObjectURL(f))
  );

  // Revoke object URLs when files change or component unmounts to avoid leaks
  $effect(() => {
    const urls = previewUrls;
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  });

  const MAX_FILES = 8;
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  function triggerFileInput() {
    fileInput?.click();
  }

  function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      addFiles(Array.from(input.files));
    }
    input.value = '';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      addFiles(Array.from(files));
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
  }

  function addFiles(files: File[]) {
    const images = files.filter(f => ALLOWED_IMAGE_TYPES.includes(f.type));
    if (images.length === 0) {
      Toast('Pilih file gambar (JPEG/PNG/GIF/WebP)', 'error');
      return;
    }
    const room = MAX_FILES - selectedFiles.length;
    if (room <= 0) {
      Toast(`Maksimal ${MAX_FILES} gambar`, 'error');
      return;
    }
    const toAdd = images.slice(0, room);
    if (toAdd.length < images.length) {
      Toast(`Hanya ${toAdd.length} gambar ditambahkan (maks ${MAX_FILES})`, 'warning');
    }
    selectedFiles = [...selectedFiles, ...toAdd];
  }

  function removeFile(index: number) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
  }

  async function uploadAttachments(taskId: string): Promise<void> {
    if (selectedFiles.length === 0) return;
    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('files', file);
    }
    try {
      const res = await fetch(`/tasks/${taskId}/attachments`, {
        method: 'POST',
        headers: { ...buildCSRFHeaders() },
        body: formData,
      });
      const data = await res.json();
      if (!data.success) {
        Toast(data.message || 'Gagal upload gambar', 'error');
      }
    } catch {
      Toast('Gagal upload gambar', 'error');
    }
  }

  function handleSubmit() {
    if (!title.trim()) {
      error = 'Judul task wajib diisi';
      return;
    }

    isSubmitting = true;
    error = '';

    const payload = {
      title: title.trim(),
      priority,
      assignee_id: assigneeId || null,
      description: description.trim() || null,
      batch_id: batchId || null,
    };

    // Path with attachments: create task via fetch (returns task id), then upload images
    if (selectedFiles.length > 0) {
      createTaskWithAttachments(payload);
    } else {
      // Existing Inertia flow — no attachments
      router.post(`/projects/${projectId}/tasks`, payload, {
        headers: buildCSRFHeaders(),
        onSuccess: () => {
          isSubmitting = false;
          onClose();
        },
        onError: () => {
          isSubmitting = false;
          error = 'Gagal membuat task';
        },
      });
    }
  }

  async function createTaskWithAttachments(payload: Record<string, unknown>) {
    try {
      const res = await fetch(`/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success || !data.data?.task?.id) {
        isSubmitting = false;
        error = data.message || 'Gagal membuat task';
        return;
      }
      const taskId = data.data.task.id;
      await uploadAttachments(taskId);
      isSubmitting = false;
      Toast('Task dibuat dengan gambar', 'success');
      router.reload({ only: ['tasks'] });
      onClose();
    } catch {
      isSubmitting = false;
      error = 'Gagal membuat task';
    }
  }

  function handleBackdropClick() {
    onClose();
  }
</script>

<div
  data-testid="add-task-modal"
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
        <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
        <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Task baru</span>
      </div>
      <h2 class="text-xl font-extrabold tracking-[-0.02em] text-stone-900 dark:text-white">Buat task</h2>
      <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">Tambahkan task ke backlog project ini</p>
    </div>

    <div class="space-y-5">
      <div>
        <label class="block text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 mb-2" for="task-title">Judul <span class="text-danger-500">*</span></label>
        <input
          id="task-title"
          data-testid="task-title-input"
          bind:value={title}
          type="text"
          placeholder="Apa yang perlu dikerjakan?"
          class="w-full bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
          required
        />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 mb-2" for="task-priority">Prioritas</label>
          <div class="relative">
            <select
              id="task-priority"
              bind:value={priority}
              class="w-full bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-all appearance-none cursor-pointer [&>option]:bg-white dark:[&>option]:bg-surface-dark"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-stone-400 dark:text-stone-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 mb-2" for="task-assignee">Assignee</label>
          <div class="relative">
            <select
              id="task-assignee"
              bind:value={assigneeId}
              class="w-full bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-all appearance-none cursor-pointer [&>option]:bg-white dark:[&>option]:bg-surface-dark"
            >
              <option value="">Unassigned</option>
              {#each members as m}
                <option value={m.user_id}>{m.user?.name || m.user?.email || m.user_id}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-stone-400 dark:text-stone-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 mb-2" for="task-desc">Deskripsi</label>
        <textarea
          id="task-desc"
          bind:value={description}
          placeholder="Detail tambahan (opsional)..."
          class="w-full bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-stone-200 resize-none min-h-[100px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
        ></textarea>
      </div>

      <!-- Image attachments -->
      <div>
        <span class="block text-[11px] font-bold uppercase tracking-[0.15em] text-stone-500 dark:text-stone-400 mb-2">Gambar</span>
        <input
          bind:this={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          multiple
          class="hidden"
          onchange={handleFileChange}
        />
        {#if selectedFiles.length === 0}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="rounded-xl border-2 border-dashed transition-all duration-200 {isDragOver ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10' : 'border-stone-200 dark:border-white/[0.08] hover:border-brand-500/40 dark:hover:border-brand-400/40'} cursor-pointer"
            onclick={triggerFileInput}
            ondrop={handleDrop}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            role="button"
            tabindex="0"
            onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
          >
            <div class="flex flex-col items-center justify-center py-5 px-4 text-center">
              <svg class="w-5 h-5 text-stone-400 dark:text-stone-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <p class="text-xs font-semibold text-stone-600 dark:text-stone-300">Klik atau drag gambar ke sini</p>
              <p class="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">JPEG, PNG, GIF, WebP — maks 5MB per file</p>
            </div>
          </div>
        {:else}
          <div class="flex flex-col gap-2.5">
            <div class="grid grid-cols-3 gap-2">
              {#each selectedFiles as file, i (i)}
                <div class="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-stone-900/5 dark:ring-white/10 bg-stone-100 dark:bg-white/[0.04]">
                  <img src={previewUrls[i]} alt={file.name} class="w-full h-full object-cover" />
                  <button
                    type="button"
                    onclick={() => removeFile(i)}
                    class="absolute top-1 right-1 p-1 rounded-lg bg-black/50 text-white hover:bg-rose-500 transition-colors cursor-pointer"
                    title="Hapus"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              {/each}
            </div>
            <button
              type="button"
              onclick={triggerFileInput}
              disabled={selectedFiles.length >= MAX_FILES}
              class="self-start text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              + Tambah gambar
            </button>
          </div>
        {/if}
      </div>

      <div class="h-4">
        {#if error}
          <p class="text-danger-500 text-xs font-medium" transition:fade={{duration: 150}}>{error}</p>
        {/if}
      </div>

      <div class="flex items-center justify-end gap-3 mt-6 pt-2">
        <button
          type="button"
          onclick={onClose}
          class="px-5 py-2.5 text-sm font-semibold text-stone-500 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.08] rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer"
        >
          Batal
        </button>
        <button
          type="button"
          data-testid="task-submit-btn"
          disabled={isSubmitting}
          onclick={handleSubmit}
          class="px-5 py-2.5 bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold rounded-xl transition-all duration-300 active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-brand-500 disabled:cursor-not-allowed shadow-glow-brand-sm flex items-center gap-2 cursor-pointer"
        >
          {#if isSubmitting}
            <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...
          {:else}
            Buat task
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>
