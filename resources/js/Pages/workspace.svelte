<script lang="ts">
  import { router, page as inertiaPage, inertia } from '@inertiajs/svelte';
  import { buildCSRFHeaders, Toast, api } from '../Components/helper';
  import axios from 'axios';
  import { fly, scale, slide } from 'svelte/transition';
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

  let showCreateModal = $state(false);
  let newProjectName = $state('');
  let newProjectDesc = $state('');
  let isCreatingProject = $state(false);
  let inviteEmail = $state('');
  let isInviting = $state(false);
  let removingMemberId = $state<string | null>(null);
  let cancellingInviteId = $state<string | null>(null);
  let isDeletingWorkspace = $state(false);
  let showMembersPanel = $state(false);

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
      Toast('Undangan terkirim', 'success');
      router.reload();
    }
  }

  async function handleRemoveMember(memberId: string, userId: string) {
    if (!confirm('Yakin ingin mengeluarkan member ini dari workspace?')) return;
    removingMemberId = memberId;
    const result = await api(() => axios.delete(`/workspaces/${workspace.id}/members/${userId}`, { headers: buildCSRFHeaders() }));
    removingMemberId = null;
    if (result.success) router.reload();
  }

  async function handleDeleteWorkspace() {
    if (!confirm('Yakin ingin menghapus workspace ini? Semua project dan data di dalamnya akan ikut terhapus.')) return;
    isDeletingWorkspace = true;
    const result = await api(() => axios.delete(`/workspaces/${workspace.id}`, { headers: buildCSRFHeaders() }));
    isDeletingWorkspace = false;
    if (result.success) router.visit('/workspaces');
  }

  async function handleCancelInvite(invitationId: string) {
    if (!confirm('Yakin ingin membatalkan undangan ini?')) return;
    cancellingInviteId = invitationId;
    const result = await api(() => axios.delete(`/workspaces/${workspace.id}/invitations/${invitationId}`, { headers: buildCSRFHeaders() }));
    cancellingInviteId = null;
    if (result.success) router.reload();
  }

  function getInitials(name: string | null, email: string) {
    if (name) return name.substring(0, 2).toUpperCase();
    return email.substring(0, 2).toUpperCase();
  }

  const isOwner = $derived(workspace.owner_id === user.id);
  const createdLabel = $derived(new Date(workspace.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
</script>

<AppLayout title={workspace.name} {nav_workspaces} {nav_projects_standalone} {unread_count} activeWorkspaceId={workspace.id} activeProjectId="" chat_workspace_id={workspace.id} chat_workspace_name={workspace.name}>
  <div class="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8 space-y-8">

    <!-- ═══════════════════════════════════════════════════════════
         HERO STRIP — workspace identity, editorial
         ═══════════════════════════════════════════════════════════ -->
    <div class="relative" in:fly={{ y: 20, duration: 500 }}>
      <!-- Mesh bg -->
      <div class="absolute inset-0 bg-[radial-gradient(50%_60%_at_10%_20%,rgba(22,167,102,0.10),transparent_60%)] dark:bg-[radial-gradient(50%_60%_at_10%_20%,rgba(22,167,102,0.14),transparent_60%)] rounded-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pt-2">
        <div class="flex items-start gap-5">
          <div class="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shadow-[0_10px_30px_-8px_rgba(22,167,102,0.5)] shrink-0">
            <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Workspace</span>
            </div>
            <h1 class="text-3xl lg:text-4xl font-extrabold tracking-[-0.02em] text-stone-900 dark:text-white leading-tight">
              {workspace.name}
            </h1>
            {#if workspace.description}
              <p class="text-stone-500 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">{workspace.description}</p>
            {/if}
            <p class="text-xs text-stone-400 dark:text-stone-500 mt-3">Dibuat {createdLabel}</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2.5 shrink-0">
          {#if isOwner}
            <button
              onclick={handleDeleteWorkspace}
              disabled={isDeletingWorkspace}
              class="inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 ring-1 ring-red-200 dark:ring-red-500/20 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
            >
              {#if isDeletingWorkspace}
                <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {:else}
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              {/if}
              Hapus
            </button>
          {/if}
          <button
            onclick={() => showCreateModal = true}
            class="group flex items-center gap-2 pl-4 pr-2.5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(22,167,102,0.5)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Project baru
            <span class="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </span>
          </button>
        </div>
      </div>

      <!-- Stat pills row -->
      <div class="relative z-10 flex flex-wrap gap-2.5 mt-6">
        <span class="inline-flex items-center gap-2 rounded-full bg-white dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <svg class="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          {projects.length} project
        </span>
        <span class="inline-flex items-center gap-2 rounded-full bg-white dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <svg class="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
          {members.length} anggota
        </span>
        {#if invitations.length > 0}
          <span class="inline-flex items-center gap-2 rounded-full bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-200 dark:ring-amber-500/20 px-3.5 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {invitations.length} undangan tertunda
          </span>
        {/if}
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         PROJECTS — bento grid, asymmetric
         ═══════════════════════════════════════════════════════════ -->
    <section in:fly={{ y: 20, duration: 500, delay: 80 }}>
      <div class="flex items-center justify-between mb-5">
        <h2 class="text-sm font-bold text-stone-700 dark:text-stone-200">Project</h2>
        <a use:inertia href="/projects" class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">Lihat semua</a>
      </div>

      {#if projects.length === 0}
        <!-- Empty state — full-width designed CTA -->
        <div class="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl text-center">
          <div class="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-5">
            <svg class="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
          </div>
          <p class="text-base font-bold text-stone-900 dark:text-white">Mulai project pertama</p>
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-1.5 mb-6 max-w-sm leading-relaxed">Buat project di workspace ini untuk mulai mengelola task, versi, dan rilis tim.</p>
          <button onclick={() => showCreateModal = true} class="group inline-flex items-center gap-2 pl-5 pr-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(22,167,102,0.5)] transition-all duration-300 active:scale-[0.98] cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
            Buat project
            <span class="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
            </span>
          </button>
        </div>
      {:else}
        <!-- Bento: first project = wide feature, rest = compact -->
        <div class="grid grid-cols-1 lg:grid-cols-6 gap-4">
          {#each projects as project, i (project.id)}
            <a
              use:inertia
              href="/projects/{project.id}"
              class="group {i === 0 ? 'lg:col-span-4' : 'lg:col-span-2'} flex flex-col bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 hover:ring-brand-500/30 dark:hover:ring-brand-400/30 rounded-2xl {i === 0 ? 'p-7' : 'p-5'} transition-all duration-300 hover:shadow-[0_16px_40px_-20px_rgba(22,167,102,0.3)] cursor-pointer"
            >
              <div class="flex-grow">
                {#if i === 0}
                  <div class="flex items-center gap-2 mb-3">
                    <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                    <span class="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Project utama</span>
                  </div>
                  <h3 class="text-xl font-extrabold tracking-tight text-stone-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mb-2">
                    {project.name}
                  </h3>
                  <p class="text-stone-500 dark:text-stone-400 leading-relaxed line-clamp-3">
                    {project.description || 'Tanpa deskripsi'}
                  </p>
                {:else}
                  <h3 class="text-base font-bold text-stone-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 mb-1.5">
                    {project.name}
                  </h3>
                  <p class="text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {project.description || 'Tanpa deskripsi'}
                  </p>
                {/if}
              </div>
              <div class="mt-4 pt-4 border-t border-stone-100 dark:border-white/[0.05] flex items-center justify-between text-xs text-stone-400">
                <span>{new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                <span class="group-hover:text-brand-500 transition-colors inline-flex items-center font-semibold">
                  Buka
                  <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </div>
            </a>
          {/each}
        </div>
      {/if}
    </section>

    <!-- ═══════════════════════════════════════════════════════════
         MEMBERS — horizontal strip + expandable detail
         ═══════════════════════════════════════════════════════════ -->
    <section in:fly={{ y: 20, duration: 500, delay: 140 }}>
      <div class="bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl overflow-hidden">

        <!-- Strip: avatar stack + invite form + expand toggle -->
        <div class="flex flex-col sm:flex-row sm:items-center gap-4 p-5">
          <!-- Avatar stack -->
          <button onclick={() => showMembersPanel = !showMembersPanel} class="flex items-center gap-3 cursor-pointer group min-w-0">
            <div class="flex -space-x-2.5">
              {#each members.slice(0, 5) as member (member.id)}
                <div class="w-9 h-9 rounded-full bg-brand-500 ring-2 ring-white dark:ring-stone-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {#if member.user.avatar}
                    <img src={member.user.avatar} alt={member.user.name || member.user.email} class="w-9 h-9 rounded-full object-cover">
                  {:else}
                    {getInitials(member.user.name, member.user.email)}
                  {/if}
                </div>
              {/each}
              {#if members.length > 5}
                <div class="w-9 h-9 rounded-full bg-stone-200 dark:bg-white/10 ring-2 ring-white dark:ring-stone-900 flex items-center justify-center text-stone-600 dark:text-stone-300 text-xs font-bold shrink-0">
                  +{members.length - 5}
                </div>
              {/if}
            </div>
            <div class="text-left min-w-0">
              <p class="text-sm font-bold text-stone-900 dark:text-white">{members.length} anggota</p>
              <p class="text-xs text-stone-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{showMembersPanel ? 'Tutup' : 'Lihat detail'}</p>
            </div>
          </button>

          <div class="hidden sm:block w-px h-8 bg-stone-200 dark:bg-white/10"></div>

          <!-- Invite form inline -->
          <form onsubmit={handleInviteMember} class="flex gap-2 flex-1 sm:max-w-xs">
            <input
              type="email"
              bind:value={inviteEmail}
              placeholder="Undang via email..."
              required
              class="flex-1 min-w-0 px-3 py-2 text-sm bg-stone-50 dark:bg-white/[0.03] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 transition-colors"
            >
            <button
              type="submit"
              disabled={isInviting || !inviteEmail.trim()}
              class="inline-flex items-center px-3.5 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-400 rounded-xl transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            >
              {#if isInviting}
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {:else}
                Undang
              {/if}
            </button>
          </form>
        </div>

        <!-- Expandable members list -->
        {#if showMembersPanel}
          <div transition:slide={{ duration: 250 }}>
            <ul class="divide-y divide-stone-100 dark:divide-white/[0.05] border-t border-stone-100 dark:border-white/[0.05]">
              {#each members as member (member.id)}
                <li class="p-4 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-white/[0.02] transition-colors group">
                  <div class="flex items-center min-w-0 gap-3">
                    <div class="shrink-0 h-9 w-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                      {#if member.user.avatar}
                        <img src={member.user.avatar} alt={member.user.name || member.user.email} class="h-9 w-9 rounded-full object-cover">
                      {:else}
                        {getInitials(member.user.name, member.user.email)}
                      {/if}
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {member.user.name || 'User'}
                        {#if member.user.id === user.id}
                          <span class="ml-1 text-xs font-normal text-stone-400">(kamu)</span>
                        {/if}
                      </p>
                      <p class="text-xs text-stone-500 dark:text-stone-400 truncate">{member.user.email}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2 pl-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider {member.role === 'owner' ? 'bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 ring-1 ring-brand-200 dark:ring-brand-500/20' : 'bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 ring-1 ring-stone-200 dark:ring-white/10'}">
                      {member.role}
                    </span>
                    {#if isOwner && member.role !== 'owner'}
                      <button
                        onclick={() => handleRemoveMember(member.id, member.user_id)}
                        disabled={removingMemberId === member.id}
                        class="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg disabled:opacity-50 cursor-pointer"
                        title="Keluarkan"
                      >
                        {#if removingMemberId === member.id}
                          <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        {:else}
                          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        {/if}
                      </button>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          </div>
        {/if}

        <!-- Pending invitations row -->
        {#if invitations.length > 0}
          <div class="border-t border-stone-100 dark:border-white/[0.05] p-5 bg-amber-50/30 dark:bg-amber-500/[0.03]">
            <div class="flex items-center gap-2 mb-3">
              <svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <p class="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Undangan tertunda</p>
            </div>
            <div class="space-y-2">
              {#each invitations as invite (invite.id)}
                <div class="flex items-center justify-between bg-white dark:bg-white/[0.04] rounded-xl p-3 ring-1 ring-amber-200/50 dark:ring-amber-500/10">
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{invite.invitee_email}</p>
                    <p class="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Berakhir {new Date(invite.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <button
                    onclick={() => handleCancelInvite(invite.id)}
                    disabled={cancellingInviteId === invite.id}
                    class="p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                    title="Batalkan"
                  >
                    {#if cancellingInviteId === invite.id}
                      <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {:else}
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    {/if}
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </section>

  </div>
</AppLayout>

{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" transition:fly={{ duration: 200, opacity: 0 }} onclick={() => showCreateModal = false} aria-hidden="true"></div>
    <div class="relative bg-white dark:bg-stone-900 ring-1 ring-stone-900/10 dark:ring-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden" transition:scale={{ duration: 200, start: 0.95 }}>
      <div class="px-6 py-5 border-b border-stone-200 dark:border-white/10">
        <h3 class="text-lg font-bold text-stone-900 dark:text-white">Project baru</h3>
        <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">Tambahkan project ke <span class="font-semibold text-stone-700 dark:text-stone-300">{workspace.name}</span></p>
      </div>
      <div class="px-6 py-6 space-y-5">
        <div>
          <label for="name" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Nama project</label>
          <input type="text" id="name" bind:value={newProjectName} placeholder="mis. Website Redesign"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 sm:text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreateProject()}>
        </div>
        <div>
          <label for="description" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Deskripsi <span class="text-stone-400 font-normal">(opsional)</span></label>
          <textarea id="description" bind:value={newProjectDesc} placeholder="Project ini tentang apa?" rows="3"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 sm:text-sm transition-colors resize-none"></textarea>
        </div>
      </div>
      <div class="px-6 py-5 bg-stone-50 dark:bg-white/[0.03] border-t border-stone-200 dark:border-white/10 flex items-center justify-end space-x-3">
        <button type="button" onclick={() => showCreateModal = false} class="px-4 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-transparent hover:bg-stone-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer">Batal</button>
        <button type="button" onclick={handleCreateProject} disabled={!newProjectName.trim() || isCreatingProject} class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded-xl transition-colors cursor-pointer">
          {#if isCreatingProject}
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Membuat...
          {:else}
            Buat project
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
