<script lang="ts">
  import { router, page as inertiaPage, inertia } from '@inertiajs/svelte';
  import { buildCSRFHeaders, Toast, api } from '../Components/helper';
  import axios from 'axios';
  import { fly, scale } from 'svelte/transition';
  import AppLayout from '../Components/AppLayout.svelte';

  interface ProjectWithMeta {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    active_batch_label: string | null;
    task_counts: { backlog: number; ongoing: number; revisi: number; review: number; done: number };
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

  let { projects = [], nav_workspaces = [], nav_projects_standalone = [], unread_count = 0, user }: { projects: ProjectWithMeta[]; nav_workspaces: any[]; nav_projects_standalone: any[]; unread_count: number; user: User } = $props();

  let showCreateModal = $state(false);
  let newProjectName = $state('');
  let newProjectDesc = $state('');
  let isCreating = $state(false);
  let deletingProjectId = $state<string | null>(null);

  async function handleDelete(e: MouseEvent, projectId: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Yakin ingin menghapus project ini? Semua task dan data akan ikut terhapus.')) return;
    deletingProjectId = projectId;
    const result = await api(() => axios.delete(`/projects/${projectId}`, { headers: buildCSRFHeaders() }));
    deletingProjectId = null;
    if (result.success) {
      router.visit('/projects', { preserveScroll: true });
    }
  }

  async function handleCreate() {
    if (!newProjectName.trim()) return;
    isCreating = true;
    try {
      const res = await fetch('/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ name: newProjectName.trim(), description: newProjectDesc.trim() || null }),
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
      isCreating = false;
    }
  }

  // Aggregate stats
  const totalProjects = $derived(projects.length);
  const totalTasks = $derived(projects.reduce((sum, p) => sum + p.task_counts.backlog + p.task_counts.ongoing + p.task_counts.revisi + p.task_counts.review + p.task_counts.done, 0));
  const totalDone = $derived(projects.reduce((sum, p) => sum + p.task_counts.done, 0));

  function projectTotal(p: ProjectWithMeta) {
    return p.task_counts.backlog + p.task_counts.ongoing + p.task_counts.revisi + p.task_counts.review + p.task_counts.done;
  }

  function projectCompletion(p: ProjectWithMeta) {
    const t = projectTotal(p);
    return t > 0 ? Math.round((p.task_counts.done / t) * 100) : 0;
  }
</script>

<AppLayout title="Project" {nav_workspaces} {nav_projects_standalone} {unread_count} activeProjectId="">
  <div class="max-w-6xl mx-auto px-5 sm:px-8 lg:px-10 py-8 space-y-7">

    <!-- ═══════════════════════════════════════════════════════════
         HERO STRIP — title + stats + CTA
         ═══════════════════════════════════════════════════════════ -->
    <div class="relative" in:fly={{ y: 20, duration: 500 }}>
      <div class="absolute inset-0 bg-[radial-gradient(50%_60%_at_10%_20%,rgba(22,167,102,0.10),transparent_60%)] dark:bg-[radial-gradient(50%_60%_at_10%_20%,rgba(22,167,102,0.14),transparent_60%)] rounded-3xl pointer-events-none"></div>

      <div class="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pt-2">
        <div>
          <div class="flex items-center gap-2 mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">Semua project</span>
          </div>
          <h1 class="text-3xl lg:text-4xl font-extrabold tracking-[-0.02em] text-stone-900 dark:text-white leading-tight">
            Project
          </h1>
          <p class="text-stone-500 dark:text-stone-400 mt-2 max-w-xl leading-relaxed">Kelola semua project tim, task, dan rilis dari satu tempat.</p>
        </div>

        <div class="flex items-center gap-2.5 shrink-0">
          <!-- Stat pills -->
          <span class="inline-flex items-center gap-2 rounded-full bg-white dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 px-3.5 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
            {totalProjects} project
          </span>
          <span class="inline-flex items-center gap-2 rounded-full bg-white dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 px-3.5 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300">
            {totalTasks} task
          </span>
          <span class="inline-flex items-center gap-2 rounded-full bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-200 dark:ring-brand-500/20 px-3.5 py-2 text-xs font-semibold text-brand-600 dark:text-brand-400">
            {totalDone} selesai
          </span>

          <button
            data-testid="new-project-btn"
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
    </div>

    <!-- ═══════════════════════════════════════════════════════════
         PROJECT LIST — rich cards with progress
         ═══════════════════════════════════════════════════════════ -->
    {#if projects.length === 0}
      <div class="flex flex-col items-center justify-center py-20 bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl text-center" in:fly={{ y: 20, duration: 500, delay: 80 }}>
        <div class="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-5">
          <svg class="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
        </div>
        <p class="text-base font-bold text-stone-900 dark:text-white">Mulai project pertama</p>
        <p class="text-sm text-stone-500 dark:text-stone-400 mt-1.5 mb-6 max-w-sm leading-relaxed">Buat project untuk mengelola task, versi, dan rilis tim dalam satu board.</p>
        <button onclick={() => showCreateModal = true} class="group inline-flex items-center gap-2 pl-5 pr-2 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold shadow-[0_8px_20px_-8px_rgba(22,167,102,0.5)] transition-all duration-300 active:scale-[0.98] cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
          Buat project
          <span class="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/></svg>
          </span>
        </button>
      </div>
    {:else}
      <div class="space-y-4" in:fly={{ y: 20, duration: 500, delay: 80 }}>
        {#each projects as project, i (project.id)}
          {@const total = projectTotal(project)}
          {@const completion = projectCompletion(project)}
          {@const segments = [
            { value: project.task_counts.backlog, bg: 'bg-stone-400' },
            { value: project.task_counts.ongoing, bg: 'bg-brand-500' },
            { value: project.task_counts.revisi, bg: 'bg-amber-500' },
            { value: project.task_counts.review, bg: 'bg-teal-600' },
            { value: project.task_counts.done, bg: 'bg-brand-700' },
          ]}

          <a
            use:inertia
            href="/projects/{project.id}"
            data-testid="project-card"
            class="group block bg-white dark:bg-white/[0.04] ring-1 ring-stone-900/5 dark:ring-white/10 hover:ring-brand-500/30 dark:hover:ring-brand-400/30 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:shadow-[0_12px_30px_-15px_rgba(22,167,102,0.25)] cursor-pointer"
          >
            <div class="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              <!-- Left: identity -->
              <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2.5 mb-2">
                  {#if project.active_batch_label}
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-brand-200 dark:ring-brand-500/20">
                      <span class="w-1 h-1 rounded-full bg-brand-500"></span>
                      {project.active_batch_label}
                    </span>
                  {/if}
                  {#if user.id === project.owner_id}
                    <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Owner</span>
                  {/if}
                </div>

                <h3 class="text-lg font-extrabold tracking-tight text-stone-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1">
                  {project.name}
                </h3>
                <p class="text-sm text-stone-500 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {project.description || 'Tanpa deskripsi'}
                </p>
              </div>

              <!-- Right: completion ring + delete -->
              <div class="flex items-center gap-4 shrink-0">
                <!-- Mini completion ring -->
                <div class="relative w-12 h-12">
                  <svg class="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                    <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="4" class="text-stone-200 dark:text-white/10"/>
                    <circle
                      cx="24" cy="24" r="20"
                      fill="none"
                      stroke="#16a766"
                      stroke-width="4"
                      stroke-linecap="round"
                      stroke-dasharray={2 * Math.PI * 20}
                      stroke-dashoffset={2 * Math.PI * 20 - (completion / 100) * 2 * Math.PI * 20}
                      style="transition: stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1);"
                    />
                  </svg>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <span class="text-[11px] font-bold text-stone-900 dark:text-white">{completion}%</span>
                  </div>
                </div>

                {#if user.id === project.owner_id}
                  <button
                    onclick={(e) => handleDelete(e, project.id)}
                    disabled={deletingProjectId === project.id}
                    class="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-40 cursor-pointer"
                    title="Hapus project"
                  >
                    {#if deletingProjectId === project.id}
                      <svg class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    {:else}
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    {/if}
                  </button>
                {/if}
              </div>
            </div>

            <!-- Bottom: stacked bar + meta -->
            <div class="mt-5 pt-5 border-t border-stone-100 dark:border-white/[0.05] flex flex-col sm:flex-row sm:items-center gap-4">
              <!-- Stacked bar -->
              <div class="flex-1 min-w-0">
                {#if total > 0}
                  <div class="flex h-2 rounded-full overflow-hidden bg-stone-100 dark:bg-white/5 mb-2.5">
                    {#each segments as seg}
                      {#if seg.value > 0}
                        <div class="{seg.bg} transition-all duration-500" style="width: {(seg.value / total) * 100}%"></div>
                      {/if}
                    {/each}
                  </div>
                {/if}
                <div class="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
                  <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-stone-400"></span>{project.task_counts.backlog} Backlog</span>
                  <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-brand-500"></span>{project.task_counts.ongoing} On Going</span>
                  <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-amber-500"></span>{project.task_counts.revisi} Revisi</span>
                  <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-teal-600"></span>{project.task_counts.review} Review</span>
                  <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-sm bg-brand-700"></span>{project.task_counts.done} Done</span>
                </div>
              </div>

              <!-- Meta: members + open -->
              <div class="flex items-center gap-4 shrink-0">
                <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 dark:text-stone-400">
                  <svg class="w-4 h-4 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z"/></svg>
                  {project.member_count}
                </span>
                <span class="group-hover:text-brand-500 transition-colors inline-flex items-center text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Buka board
                  <svg class="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</AppLayout>

{#if showCreateModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="fixed inset-0 bg-black/20 dark:bg-black/60 backdrop-blur-sm" transition:fly={{ duration: 200, opacity: 0 }} onclick={() => showCreateModal = false} aria-hidden="true"></div>
    <div class="relative bg-white dark:bg-stone-900 ring-1 ring-stone-900/10 dark:ring-white/10 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden" transition:scale={{ duration: 200, start: 0.95 }}>
      <div class="px-6 py-5 border-b border-stone-200 dark:border-white/10">
        <h3 class="text-lg font-bold text-stone-900 dark:text-white">Project baru</h3>
      </div>
      <div class="px-6 py-6 space-y-5">
        <div>
          <label for="name" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Nama project</label>
          <input
            type="text"
            id="name"
            data-testid="project-name-input"
            bind:value={newProjectName}
            placeholder="mis. Website Redesign"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 sm:text-sm transition-colors"
            onkeydown={(e) => e.key === 'Enter' && handleCreate()}
          >
        </div>
        <div>
          <label for="description" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Deskripsi <span class="text-stone-400 font-normal">(opsional)</span></label>
          <textarea
            id="description"
            data-testid="project-desc-input"
            bind:value={newProjectDesc}
            placeholder="Project ini tentang apa?"
            rows="3"
            class="block w-full px-4 py-2.5 bg-stone-50 dark:bg-white/[0.05] border border-stone-200 dark:border-white/10 rounded-xl text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 sm:text-sm transition-colors resize-none"
          ></textarea>
        </div>
      </div>
      <div class="px-6 py-5 bg-stone-50 dark:bg-white/[0.03] border-t border-stone-200 dark:border-white/10 flex items-center justify-end space-x-3">
        <button type="button" onclick={() => showCreateModal = false} class="px-4 py-2 text-sm font-semibold text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white bg-transparent hover:bg-stone-100 dark:hover:bg-white/[0.05] rounded-xl transition-colors cursor-pointer">Batal</button>
        <button
          type="button"
          data-testid="create-project-submit"
          onclick={handleCreate}
          disabled={!newProjectName.trim() || isCreating}
          class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-brand-500 hover:bg-brand-400 disabled:opacity-50 rounded-xl transition-colors cursor-pointer"
        >
          {#if isCreating}
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
