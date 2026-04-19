<script lang="ts">
  import { router } from '@inertiajs/svelte';
  import { buildCSRFHeaders } from '../Components/helper';
  import { fly, fade } from 'svelte/transition';

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

  function handleBackdropClick() {
    onClose();
  }
</script>

<div 
  data-testid="add-task-modal" 
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
      <h2 class="text-xl font-bold text-slate-900 dark:text-white mb-1 tracking-wide">Buat Task Baru</h2>
      <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Tambahkan task ke backlog project ini</p>
    </div>
    
    <div class="space-y-5">
      <div>
        <label class="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2" for="task-title">Judul <span class="text-red-400">*</span></label>
        <input 
          id="task-title" 
          data-testid="task-title-input" 
          bind:value={title} 
          type="text" 
          placeholder="Apa yang perlu dikerjakan?" 
          class="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500" 
          required 
        />
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2" for="task-priority">Prioritas</label>
          <div class="relative">
            <select 
              id="task-priority" 
              bind:value={priority} 
              class="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none [&>option]:bg-white dark:[&>option]:bg-slate-900"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 dark:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
 
        <div>
          <label class="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2" for="task-assignee">Assignee</label>
          <div class="relative">
            <select 
              id="task-assignee" 
              bind:value={assigneeId} 
              class="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none [&>option]:bg-white dark:[&>option]:bg-slate-900"
            >
              <option value="">Unassigned</option>
              {#each members as m}
                <option value={m.user_id}>{m.user?.name || m.user?.email || m.user_id}</option>
              {/each}
            </select>
            <div class="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-400 dark:text-slate-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      </div>
 
      <div>
        <label class="block text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2" for="task-desc">Deskripsi</label>
        <textarea 
          id="task-desc" 
          bind:value={description} 
          placeholder="Detail tambahan (opsional)..." 
          class="w-full bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-slate-200 resize-none min-h-[100px] focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
        ></textarea>
      </div>

      <div class="h-4">
        {#if error}
          <p class="text-red-400 text-xs" transition:fade={{duration: 150}}>{error}</p>
        {/if}
      </div>

      <div class="flex items-center justify-end gap-3 mt-6 pt-2">
        <button 
          type="button" 
          onclick={onClose} 
          class="px-5 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.08] rounded-xl transition-all"
        >
          Batal
        </button>
        <button 
          type="button" 
          data-testid="task-submit-btn" 
          disabled={isSubmitting} 
          onclick={handleSubmit} 
          class="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-emerald-500 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2"
        >
          {#if isSubmitting}
            <svg class="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Menyimpan...
          {:else}
            Buat Task
          {/if}
        </button>
      </div>
    </div>
  </div>
</div>