<script lang="ts">
  import { router, page as inertiaPage, inertia } from '@inertiajs/svelte';
  import { buildCSRFHeaders, Toast } from '../Components/helper';
  import { fly, scale } from 'svelte/transition';
  import AppLayout from '../Components/AppLayout.svelte';

  interface ProjectWithMeta {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    active_batch_label: string | null;
    task_counts: { ongoing: number; revisi: number; done: number };
    member_count: number;
    created_at: number;
    updated_at: number;
  }

  interface User {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  let { projects = [], user }: { projects: ProjectWithMeta[]; user: User } = $props();

  let showCreateModal = $state(false);
  let newProjectName = $state('');
  let newProjectDesc = $state('');
  let isCreating = $state(false);

  function handleCreate() {
    if (!newProjectName.trim()) return;
    isCreating = true;
    router.post('/projects', { name: newProjectName.trim(), description: newProjectDesc.trim() || null }, {
      headers: buildCSRFHeaders(),
      onSuccess: () => { 
        showCreateModal = false; 
        newProjectName = ''; 
        newProjectDesc = ''; 
        isCreating = false; 
        Toast('Project berhasil dibuat!', 'success'); 
      },
      onError: () => { 
        isCreating = false; 
        Toast('Gagal membuat project', 'error'); 
      },
    });
  }
</script>

<AppLayout title="Projects" {projects} activeProjectId="">
  <!-- Background blur decorations -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10">
    <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px]"></div>
    <div class="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-purple-500/10 blur-[120px]"></div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-100">Projects</h1>
        <p class="text-sm text-slate-400 mt-1">Manage your team projects and batches.</p>
      </div>
      <button 
        data-testid="new-project-btn" 
        onclick={() => showCreateModal = true}
        class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark focus:ring-primary-500 transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Project
      </button>
    </div>

    <!-- Content -->
    {#if projects.length === 0}
      <!-- Empty State -->
      <div class="flex flex-col items-center justify-center py-16 px-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl text-center">
        <div class="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-200">Belum ada project</h3>
        <p class="text-sm text-slate-400 mt-2 mb-6 max-w-sm">
          Get started by creating a new project to organize tasks, batches, and team members.
        </p>
        <button 
          onclick={() => showCreateModal = true}
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-primary-400 bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 rounded-lg transition-colors"
        >
          Create your first project
        </button>
      </div>
    {:else}
      <!-- Project Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {#each projects as project (project.id)}
          <div data-testid="project-card" class="bg-white/10 backdrop-blur-sm border border-white/10 hover:border-primary-400/30 rounded-xl p-6 transition-all duration-200 group flex flex-col h-full relative overflow-hidden">
            <!-- Glow effect on hover -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div class="flex justify-between items-start mb-3">
              <h3 class="text-base font-semibold text-slate-200 group-hover:text-primary-400 transition-colors line-clamp-1">{project.name}</h3>
              {#if project.active_batch_label}
                <span class="text-[10px] font-mono bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full whitespace-nowrap ml-2 shrink-0 border border-primary-500/20">
                  {project.active_batch_label}
                </span>
              {/if}
            </div>
            
            <p class="text-xs text-slate-400 mt-1 mb-5 line-clamp-2 flex-grow">
              {project.description || 'Tidak ada deskripsi'}
            </p>

            <div class="mt-auto space-y-4">
              <!-- Task Stats -->
              <div class="flex flex-wrap gap-2">
                <div class="flex items-center space-x-1.5 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Ongoing Tasks">
                  <div class="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span class="text-[10px] text-slate-300 font-medium">{project.task_counts.ongoing}</span>
                </div>
                <div class="flex items-center space-x-1.5 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Revisi Tasks">
                  <div class="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                  <span class="text-[10px] text-slate-300 font-medium">{project.task_counts.revisi}</span>
                </div>
                <div class="flex items-center space-x-1.5 bg-white/5 border border-white/5 px-2 py-1 rounded-md" title="Done Tasks">
                  <div class="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <span class="text-[10px] text-slate-300 font-medium">{project.task_counts.done}</span>
                </div>
              </div>

              <!-- Footer (Members & Action) -->
              <div class="flex items-center justify-between pt-4 border-t border-white/5">
                <div class="flex items-center text-xs text-slate-400">
                  <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {project.member_count} {project.member_count === 1 ? 'member' : 'members'}
                </div>
                
                <a 
                  use:inertia 
                  href="/projects/{project.id}" 
                  class="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors inline-flex items-center"
                >
                  Open Board
                  <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</AppLayout>

<!-- Create Project Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/60 backdrop-blur-sm" 
      transition:fly={{ duration: 200, opacity: 0 }}
      onclick={() => showCreateModal = false}
      aria-hidden="true"
    ></div>

    <!-- Modal Panel -->
    <div 
      class="relative bg-surface-dark border border-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <div class="px-6 py-5 border-b border-white/10">
        <h3 class="text-lg font-medium text-slate-200">Create New Project</h3>
      </div>
      
      <div class="px-6 py-6 space-y-4">
        <div>
          <label for="name" class="block text-sm font-medium text-slate-300 mb-1.5">Project Name</label>
          <input 
            type="text" 
            id="name"
            data-testid="project-name-input" 
            bind:value={newProjectName} 
            placeholder="e.g. Website Redesign"
            class="block w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreate()}
          >
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-slate-300 mb-1.5">Description (Optional)</label>
          <textarea 
            id="description"
            data-testid="project-desc-input" 
            bind:value={newProjectDesc} 
            placeholder="What is this project about?"
            rows="3"
            class="block w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm transition-colors resize-none"
          ></textarea>
        </div>
      </div>
      
      <div class="px-6 py-4 bg-black/20 border-t border-white/10 flex items-center justify-end space-x-3">
        <button 
          type="button" 
          onclick={() => showCreateModal = false}
          class="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-white/5 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button 
          type="button" 
          data-testid="create-project-submit" 
          onclick={handleCreate} 
          disabled={!newProjectName.trim() || isCreating}
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent rounded-lg shadow-sm transition-colors"
        >
          {#if isCreating}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          {:else}
            Create Project
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
