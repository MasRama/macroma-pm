<script lang="ts">
  import { router, page as inertiaPage, inertia } from '@inertiajs/svelte';
  import { buildCSRFHeaders, Toast, api } from '../Components/helper';
  import axios from 'axios';
  import { fly, scale } from 'svelte/transition';
  import AppLayout from '../Components/AppLayout.svelte';

  interface WorkspaceWithMeta {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    member_count: number;
    project_count: number;
    created_at: number;
    updated_at: number;
  }

  interface User {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  let { workspaces = [], nav_workspaces = [], nav_projects_standalone = [], unread_count = 0, user }: { workspaces: WorkspaceWithMeta[]; nav_workspaces: any[]; nav_projects_standalone: any[]; unread_count: number; user: User } = $props();

  let showCreateModal = $state(false);
  let newWorkspaceName = $state('');
  let newWorkspaceDesc = $state('');
  let isCreating = $state(false);
  let deletingWorkspaceId = $state<string | null>(null);

  async function handleDelete(e: MouseEvent, workspaceId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus workspace ini? Semua project dan data di dalamnya akan ikut terhapus.')) return;
    deletingWorkspaceId = workspaceId;
    const result = await api(() => axios.delete(`/workspaces/${workspaceId}`, { headers: buildCSRFHeaders() }));
    deletingWorkspaceId = null;
    if (result.success) {
      router.visit('/workspaces', { preserveScroll: true });
    }
  }

  async function handleCreate() {
    if (!newWorkspaceName.trim()) return;
    isCreating = true;
    try {
      const res = await fetch('/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ name: newWorkspaceName.trim(), description: newWorkspaceDesc.trim() || null }),
      });
      const data = await res.json();
      if (res.ok && data.data?.id) {
        showCreateModal = false;
        newWorkspaceName = '';
        newWorkspaceDesc = '';
        Toast('Workspace berhasil dibuat!', 'success');
        router.visit(`/workspaces/${data.data.id}`);
      } else {
        Toast(data.message || 'Gagal membuat workspace', 'error');
      }
    } catch {
      Toast('Gagal membuat workspace', 'error');
    } finally {
      isCreating = false;
    }
  }
</script>

<AppLayout title="Workspaces" {nav_workspaces} {nav_projects_standalone} {unread_count} activeProjectId="">
  <!-- Aurora blur blobs background -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50 dark:bg-[#020617]">
    <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] opacity-30 dark:opacity-100"></div>
    <div class="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px] opacity-30 dark:opacity-100"></div>
    <div class="absolute bottom-[0%] left-[20%] w-[40%] h-[40%] rounded-full bg-info-500/5 blur-[120px] opacity-30 dark:opacity-100"></div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Workspaces</h1>
        <p class="text-sm text-slate-500 mt-1">Manage your team workspaces and projects.</p>
      </div>
      <button 
        data-testid="new-workspace-btn" 
        onclick={() => showCreateModal = true}
        class="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-dark focus:ring-primary-500 transition-colors"
      >
        <svg class="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        New Workspace
      </button>
    </div>

    <!-- Content -->
    {#if workspaces.length === 0}
      <!-- Empty State -->
      <div class="flex flex-col items-center justify-center py-20 px-4 bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl text-center shadow-lg">
        <div class="w-16 h-16 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-2xl flex items-center justify-center mb-5">
          <svg class="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 class="text-xl font-semibold text-slate-900 dark:text-slate-100">No workspaces yet</h3>
        <p class="text-sm text-slate-500 mt-2 mb-6 max-w-sm leading-relaxed">
          Get started by creating a new workspace to organize your projects and team members.
        </p>
        <button 
          onclick={() => showCreateModal = true}
          class="inline-flex items-center px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white bg-slate-50 dark:bg-white/[0.05] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.1] rounded-xl transition-all"
        >
          Create your first workspace
        </button>
      </div>
    {:else}
      <!-- Workspace Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {#each workspaces as workspace, index (workspace.id)}
          {@const colorIndex = index % 4}
          {@const borderColors = ['border-primary-500/60', 'border-accent-500/60', 'border-info-500/60', 'border-warning-500/60']}
          {@const glowColors = ['from-primary-500/10', 'from-accent-500/10', 'from-info-500/10', 'from-warning-500/10']}

          <a 
            use:inertia 
            href="/workspaces/{workspace.id}"
            data-testid="workspace-card" 
            class="group relative flex flex-col h-full bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-50 dark:hover:bg-white/[0.07] rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] overflow-hidden cursor-pointer border-l-2 {borderColors[colorIndex]}"
          >
            <!-- Glow effect on hover -->
            <div class="absolute inset-0 bg-gradient-to-br {glowColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div class="relative z-10 flex flex-col h-full">
              <div class="flex justify-between items-start mb-3 gap-3">
                <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-white transition-colors line-clamp-1">{workspace.name}</h3>
                <div class="flex items-center gap-1.5 shrink-0">
                  {#if user.id === workspace.owner_id}
                    <button
                      onclick={(e) => handleDelete(e, workspace.id)}
                      disabled={deletingWorkspaceId === workspace.id}
                      class="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-slate-400 hover:text-danger-500 hover:bg-danger-500/10 disabled:opacity-40"
                      title="Hapus workspace"
                    >
                      {#if deletingWorkspaceId === workspace.id}
                        <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {:else}
                        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      {/if}
                    </button>
                  {/if}
                </div>
              </div>
              
              <p class="text-xs text-slate-500 mt-1 mb-6 line-clamp-2 flex-grow leading-relaxed">
                {workspace.description || 'No description provided'}
              </p>

              <div class="mt-auto space-y-5">
                <!-- Workspace Stats -->
                <div class="flex flex-wrap gap-2">
                  <div class="flex items-center space-x-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] px-2 py-1 rounded-lg" title="Members">
                    <svg class="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">{workspace.member_count}</span>
                  </div>
                  <div class="flex items-center space-x-1.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.05] px-2 py-1 rounded-lg" title="Projects">
                    <svg class="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    <span class="text-xs text-slate-700 dark:text-slate-300 font-medium">{workspace.project_count}</span>
                  </div>
                </div>

                <!-- Footer (Summary & Action) -->
                <div class="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-white/[0.08]">
                  <div class="flex items-center text-xs font-medium text-slate-400">
                    {workspace.member_count} {workspace.member_count === 1 ? 'member' : 'members'} &middot; {workspace.project_count} {workspace.project_count === 1 ? 'project' : 'projects'}
                  </div>
                  
                  <div class="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-primary-600 dark:group-hover:text-white transition-colors inline-flex items-center">
                    Open
                    <svg class="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</AppLayout>

<!-- Create Workspace Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" 
      transition:fly={{ duration: 200, opacity: 0 }}
      onclick={() => showCreateModal = false}
      aria-hidden="true"
    ></div>

    <!-- Modal Panel -->
    <div 
      class="relative bg-white dark:bg-surface-dark backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl dark:shadow-black/40 rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <div class="px-6 py-5 border-b border-slate-200 dark:border-white/10">
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Create New Workspace</h3>
      </div>
      
      <div class="px-6 py-6 space-y-5">
        <div>
          <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Workspace Name</label>
          <input 
            type="text" 
            id="name"
            data-testid="workspace-name-input" 
            bind:value={newWorkspaceName} 
            placeholder="e.g. Design Team"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreate()}
          >
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description <span class="text-slate-500 font-normal">(Optional)</span></label>
          <textarea 
            id="description"
            data-testid="workspace-desc-input" 
            bind:value={newWorkspaceDesc} 
            placeholder="What is this workspace for?"
            rows="3"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm transition-colors resize-none"
          ></textarea>
        </div>
      </div>
      
      <div class="px-6 py-5 bg-slate-50 dark:bg-white/[0.04] border-t border-slate-200 dark:border-white/10 flex items-center justify-end space-x-3">
        <button 
          type="button" 
          onclick={() => showCreateModal = false}
          class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button 
          type="button" 
          data-testid="create-workspace-submit" 
          onclick={handleCreate} 
          disabled={!newWorkspaceName.trim() || isCreating}
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent rounded-xl shadow-sm transition-colors"
        >
          {#if isCreating}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Creating...
          {:else}
            Create Workspace
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}