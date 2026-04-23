<script lang="ts">
  import { router, page as inertiaPage, inertia } from '@inertiajs/svelte';
  import { buildCSRFHeaders, Toast, api } from '../Components/helper';
  import axios from 'axios';
  import { fly, scale } from 'svelte/transition';
  import AppLayout from '../Components/AppLayout.svelte';

  interface Workspace {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: number;
    updated_at: number;
  }

  interface User {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  interface Member {
    id: string;
    workspace_id: string;
    user_id: string;
    role: string;
    created_at: number;
    user: User;
  }

  interface Project {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    workspace_id: string;
    created_at: number;
  }

  interface Invitation {
    id: string;
    invitee_email: string;
    status: string;
    expires_at: number;
    created_at: number;
  }

  let { 
    workspace, 
    members = [], 
    projects = [], 
    invitations = [], 
    nav_workspaces = [],
    nav_projects_standalone = [],
    unread_count = 0, 
    user 
  }: { 
    workspace: Workspace;
    members: Member[];
    projects: Project[];
    invitations: Invitation[];
    nav_workspaces: any[];
    nav_projects_standalone: any[];
    unread_count: number;
    user: User;
  } = $props();

  // Project Modal State
  let showCreateModal = $state(false);
  let newProjectName = $state('');
  let newProjectDesc = $state('');
  let isCreatingProject = $state(false);

  // Invite Member State
  let inviteEmail = $state('');
  let isInviting = $state(false);

  // Remove Member State
  let removingMemberId = $state<string | null>(null);

  // Cancel Invitation State
  let cancellingInviteId = $state<string | null>(null);

  // Delete Workspace State
  let isDeletingWorkspace = $state(false);

  // Actions
  async function handleCreateProject() {
    if (!newProjectName.trim()) return;
    isCreatingProject = true;
    try {
      const res = await fetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDesc.trim() || null, workspace_id: workspace.id }),
      });
      const data = await res.json();
      if (res.ok && data.data?.id) {
        showCreateModal = false;
        newProjectName = '';
        newProjectDesc = '';
        Toast('Project berhasil dibuat!', 'success');
        router.visit(`/projects/${data.data.id}`);
      } else {
        Toast(data.message || 'Gagal membuat project', 'error');
      }
    } catch {
      Toast('Gagal membuat project', 'error');
    } finally {
      isCreatingProject = false;
    }
  }

  async function handleInviteMember(e: Event) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    isInviting = true;
    const result = await api(() => axios.post(
      `/workspaces/${workspace.id}/invite`,
      { email: inviteEmail.trim() },
      { headers: buildCSRFHeaders() }
    ));
    isInviting = false;
    if (result.success) {
      inviteEmail = '';
      router.reload();
    }
  }

  async function handleRemoveMember(memberId: string, userId: string) {
    if (!confirm('Yakin ingin mengeluarkan member ini dari workspace?')) return;
    removingMemberId = memberId;
    const result = await api(() => axios.delete(`/workspaces/${workspace.id}/members/${userId}`, { headers: buildCSRFHeaders() }));
    removingMemberId = null;
    if (result.success) {
      router.reload();
    }
  }

  async function handleDeleteWorkspace() {
    if (!confirm('Yakin ingin menghapus workspace ini? Semua project dan data di dalamnya akan ikut terhapus.')) return;
    isDeletingWorkspace = true;
    const result = await api(() => axios.delete(`/workspaces/${workspace.id}`, { headers: buildCSRFHeaders() }));
    isDeletingWorkspace = false;
    if (result.success) {
      router.visit('/workspaces');
    }
  }

  async function handleCancelInvite(invitationId: string) {
    if (!confirm('Yakin ingin membatalkan undangan ini?')) return;
    cancellingInviteId = invitationId;
    const result = await api(() => axios.delete(`/workspaces/${workspace.id}/invitations/${invitationId}`, { headers: buildCSRFHeaders() }));
    cancellingInviteId = null;
    if (result.success) {
      router.reload();
    }
  }

  // Helpers
  function getInitials(name: string | null, email: string) {
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }
</script>

<AppLayout title={workspace.name} {nav_workspaces} {nav_projects_standalone} {unread_count} activeWorkspaceId={workspace.id} activeProjectId="">
  <!-- Aurora blur blobs background -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-slate-50 dark:bg-[#020617]">
    <div class="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-500/10 blur-[120px] opacity-30 dark:opacity-100"></div>
    <div class="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-500/10 blur-[120px] opacity-30 dark:opacity-100"></div>
    <div class="absolute bottom-[0%] left-[20%] w-[40%] h-[40%] rounded-full bg-info-500/5 blur-[120px] opacity-30 dark:opacity-100"></div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
    <!-- Page Header & Breadcrumb -->
    <div>
      <nav class="flex text-sm text-slate-500 font-medium mb-3" aria-label="Breadcrumb">
        <a use:inertia href="/workspaces" class="hover:text-primary-600 transition-colors">Workspaces</a>
        <span class="mx-2 text-slate-400">/</span>
        <span class="text-slate-900 dark:text-slate-200">{workspace.name}</span>
      </nav>
      
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-white">{workspace.name}</h1>
          {#if workspace.description}
            <p class="text-sm text-slate-500 mt-2 max-w-2xl">{workspace.description}</p>
          {/if}
        </div>
        {#if workspace.owner_id === user.id}
          <button
            onclick={handleDeleteWorkspace}
            disabled={isDeletingWorkspace}
            class="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-500/10 hover:bg-danger-100 dark:hover:bg-danger-500/20 border border-danger-200 dark:border-danger-500/20 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Hapus workspace"
          >
            {#if isDeletingWorkspace}
              <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Menghapus...
            {:else}
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Hapus Workspace
            {/if}
          </button>
        {/if}
      </div>
    </div>

    <!-- Two Column Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- Main Area: Projects (Takes 2/3 width on lg) -->
      <div class="lg:col-span-2 space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
            <svg class="w-5 h-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Projects
            <span class="ml-2.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-xs font-medium text-slate-600 dark:text-slate-400">
              {projects.length}
            </span>
          </h2>
          <button 
            onclick={() => showCreateModal = true}
            class="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-500/10 hover:bg-primary-100 dark:hover:bg-primary-500/20 rounded-lg transition-colors"
          >
            <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {#if projects.length === 0}
          <!-- Empty State for Projects -->
          <div class="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl text-center shadow-sm">
            <div class="w-14 h-14 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] rounded-2xl flex items-center justify-center mb-4">
              <svg class="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">No projects yet</h3>
            <p class="text-sm text-slate-500 mt-2 mb-5 max-w-xs mx-auto">
              Create a project in this workspace to start collaborating with your team.
            </p>
            <button 
              onclick={() => showCreateModal = true}
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 rounded-xl shadow-sm transition-colors"
            >
              Create Project
            </button>
          </div>
        {:else}
          <!-- Project Grid -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each projects as project, index (project.id)}
              {@const colorIndex = index % 4}
              {@const borderColors = ['border-primary-500/60', 'border-accent-500/60', 'border-info-500/60', 'border-warning-500/60']}
              {@const glowColors = ['from-primary-500/10', 'from-accent-500/10', 'from-info-500/10', 'from-warning-500/10']}

              <a 
                use:inertia 
                href="/projects/{project.id}"
                class="group relative flex flex-col bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-50 dark:hover:bg-white/[0.07] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden border-l-2 {borderColors[colorIndex]}"
              >
                <div class="absolute inset-0 bg-gradient-to-br {glowColors[colorIndex]} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                <div class="relative z-10 flex-grow">
                  <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-white transition-colors line-clamp-1 mb-2">
                    {project.name}
                  </h3>
                  <p class="text-sm text-slate-500 line-clamp-2">
                    {project.description || 'No description'}
                  </p>
                </div>
                
                <div class="relative z-10 mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
                  <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  <span class="group-hover:text-primary-500 transition-colors inline-flex items-center font-medium">
                    View
                    <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </a>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Sidebar Area: Members & Invites (Takes 1/3 width on lg) -->
      <div class="space-y-6">
        
        <!-- Members Section -->
        <div class="bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.05] flex justify-between items-center bg-slate-50/50 dark:bg-transparent">
            <h2 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
              <svg class="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Members
              <span class="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-xs font-medium text-slate-600 dark:text-slate-400">
                {members.length}
              </span>
            </h2>
          </div>
          
          <!-- Invite Form -->
          <div class="p-4 border-b border-slate-100 dark:border-white/[0.05]">
            <form onsubmit={handleInviteMember} class="flex gap-2">
              <input 
                type="email" 
                bind:value={inviteEmail}
                placeholder="Invite by email..." 
                required
                class="flex-1 min-w-0 block w-full px-3 py-2 text-sm bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-colors"
              >
              <button 
                type="submit"
                disabled={isInviting || !inviteEmail.trim()}
                class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-white bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] border border-transparent rounded-lg transition-colors disabled:opacity-50"
              >
                {#if isInviting}
                  <svg class="animate-spin h-4 w-4 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {:else}
                  Invite
                {/if}
              </button>
            </form>
          </div>

          <!-- Members List -->
          <ul class="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-[400px] overflow-y-auto">
            {#each members as member (member.id)}
              <li class="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                <div class="flex items-center min-w-0 gap-3">
                  <!-- Avatar -->
                  <div class="shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                    {#if member.user.avatar}
                      <img src={member.user.avatar} alt={member.user.name || member.user.email} class="h-9 w-9 rounded-full object-cover">
                    {:else}
                      {getInitials(member.user.name, member.user.email)}
                    {/if}
                  </div>
                  
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {member.user.name || 'Unknown User'}
                      {#if member.user.id === user.id}
                        <span class="ml-1 text-xs font-normal text-slate-400">(You)</span>
                      {/if}
                    </p>
                    <p class="text-xs text-slate-500 truncate">{member.user.email}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2 pl-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider {member.role === 'owner' ? 'bg-primary-500/10 text-primary-500 dark:text-primary-400 border border-primary-500/20' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.1]'}">
                    {member.role}
                  </span>

                  <!-- Remove Button (Only owner can remove non-owners) -->
                  {#if workspace.owner_id === user.id && member.role !== 'owner'}
                    <button
                      onclick={() => handleRemoveMember(member.id, member.user_id)}
                      disabled={removingMemberId === member.id}
                      class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-md disabled:opacity-50 focus:opacity-100"
                      title="Remove member"
                    >
                      {#if removingMemberId === member.id}
                        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {:else}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      {/if}
                    </button>
                  {/if}
                </div>
              </li>
            {/each}
          </ul>
        </div>

        <!-- Pending Invitations -->
        {#if invitations.length > 0}
          <div class="bg-white dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
            <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-transparent">
              <h2 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
                <svg class="w-4 h-4 mr-2 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending Invitations
                <span class="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-warning-500/10 text-xs font-medium text-warning-600 dark:text-warning-400">
                  {invitations.length}
                </span>
              </h2>
            </div>
            
            <ul class="divide-y divide-slate-100 dark:divide-white/[0.05] max-h-[300px] overflow-y-auto">
              {#each invitations as invite (invite.id)}
                <li class="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{invite.invitee_email}</p>
                    <p class="text-xs text-slate-500 mt-0.5 flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 pl-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-white/[0.05] text-slate-500 border border-slate-200 dark:border-white/[0.1]">
                      Pending
                    </span>
                    <button
                      onclick={() => handleCancelInvite(invite.id)}
                      disabled={cancellingInviteId === invite.id}
                      class="p-1.5 text-slate-400 hover:text-danger-500 hover:bg-danger-500/10 rounded-md disabled:opacity-50 transition-colors"
                      title="Batalkan undangan"
                    >
                      {#if cancellingInviteId === invite.id}
                        <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {:else}
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      {/if}
                    </button>
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

      </div>
    </div>
  </div>
</AppLayout>

<!-- Create Project Modal -->
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
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Create New Project</h3>
        <p class="text-sm text-slate-500 mt-1">Add a new project to <span class="font-medium text-slate-700 dark:text-slate-300">{workspace.name}</span></p>
      </div>
      
      <div class="px-6 py-6 space-y-5">
        <div>
          <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Project Name</label>
          <input 
            type="text" 
            id="name"
            bind:value={newProjectName} 
            placeholder="e.g. Website Redesign"
            class="block w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 sm:text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreateProject()}
          >
        </div>
        
        <div>
          <label for="description" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Description <span class="text-slate-500 font-normal">(Optional)</span></label>
          <textarea 
            id="description"
            bind:value={newProjectDesc} 
            placeholder="What is this project about?"
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
          onclick={handleCreateProject} 
          disabled={!newProjectName.trim() || isCreatingProject}
          class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent rounded-xl shadow-sm transition-colors"
        >
          {#if isCreatingProject}
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
