<script lang="ts">
  import { router } from '@inertiajs/svelte';
  import { buildCSRFHeaders } from '../Components/helper';
  import { scale } from 'svelte/transition';

  interface Member {
    id: string;
    user_id: string;
    role: string;
    user?: { id: string; name: string | null; email: string; }
  }

  let { projectId, members = [], onClose }: {
    projectId: string;
    members: Member[];
    onClose: () => void;
  } = $props();

  let title = $state('');
  let priority = $state<'low' | 'medium' | 'high'>('medium');
  let assigneeId = $state('');
  let description = $state('');
  let isSubmitting = $state(false);
  let error = $state('');

  function handleSubmit() {
    if (!title.trim()) { 
      error = 'Judul task wajib diisi'; 
      return; 
    }
    
    isSubmitting = true;
    router.post(`/projects/${projectId}/tasks`, {
      title: title.trim(),
      priority,
      assignee_id: assigneeId || null,
      description: description.trim() || null,
    }, {
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
</script>

<div data-testid="add-task-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
  <div class="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" transition:scale={{ duration: 200, start: 0.95 }}>
    <h2 class="text-xl font-semibold text-white mb-4">Buat Task Baru</h2>
    
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1" for="task-title">Judul <span class="text-red-400">*</span></label>
        <input id="task-title" data-testid="task-title-input" bind:value={title} type="text" placeholder="Judul task..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-400/50" required />
      </div>
      
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1" for="task-priority">Prioritas</label>
        <select id="task-priority" bind:value={priority} class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-400/50 dark:bg-slate-800/50">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1" for="task-assignee">Assignee</label>
        <select id="task-assignee" bind:value={assigneeId} class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-400/50 dark:bg-slate-800/50">
          <option value="">Tidak ada assignee</option>
          {#each members as m}
            <option value={m.user_id}>{m.user?.name || m.user?.email || m.user_id}</option>
          {/each}
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1" for="task-desc">Deskripsi</label>
        <textarea id="task-desc" bind:value={description} placeholder="Deskripsi (opsional)..." class="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white resize-none h-20 focus:outline-none focus:border-primary-400/50"></textarea>
      </div>

      {#if error}
        <p class="text-red-400 text-xs mt-1">{error}</p>
      {/if}

      <div class="flex items-center justify-end gap-3 mt-6 pt-2">
        <button type="button" onclick={onClose} class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">Batal</button>
        <button type="button" data-testid="task-submit-btn" disabled={isSubmitting} onclick={handleSubmit} class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? 'Menyimpan...' : 'Buat Task'}
        </button>
      </div>
    </div>
  </div>
</div>
