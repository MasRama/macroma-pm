<script lang="ts">
  import { inertia, page as inertiaPage } from '@inertiajs/svelte';

  let { 
    projects = [], 
    activeProjectId = '' 
  }: { 
    projects: any[]; 
    activeProjectId?: string 
  } = $props();
</script>

<aside data-testid="sidebar" class="fixed left-0 top-0 h-screen w-[260px] bg-white/10 dark:bg-black/20 backdrop-blur-xl border-r border-white/10 dark:border-white/5 flex flex-col z-40 transition-all duration-300">
  <!-- Top section -->
  <div class="h-16 flex items-center px-6 border-b border-white/10 dark:border-white/5">
    <div class="flex items-center gap-3">
      <svg class="w-6 h-6 text-primary-600 dark:text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>
      <span class="text-primary-600 dark:text-primary-400 font-bold text-lg">PM Macroma</span>
    </div>
  </div>

  <!-- Project list section -->
  <nav class="flex-1 overflow-y-auto px-3 py-4">
    <p class="text-[10px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 px-3 mb-2">Projects</p>
    
    <div class="space-y-1">
      {#if projects.length > 0}
        {#each projects as project}
          <a use:inertia href="/projects/{project.id}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 {activeProjectId === project.id ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-white/10 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-100'}">
            <span class="truncate">{project.name}</span>
          </a>
        {/each}
      {:else}
        <p class="px-3 py-2 text-sm italic text-slate-400 dark:text-slate-500">No projects yet</p>
      {/if}
    </div>
  </nav>

  <!-- Bottom section -->
  <div class="p-4 border-t border-white/10 dark:border-white/5">
    <a use:inertia href="/projects" class="flex items-center justify-center w-full py-2.5 mb-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/10 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-white/20 dark:hover:bg-white/5 transition-colors">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Project
    </a>
    
    <div class="flex items-center gap-3 px-2">
      <div class="w-8 h-8 rounded-full bg-accent-500/20 text-accent-600 dark:text-accent-400 flex items-center justify-center font-bold text-sm border border-accent-500/30">
        {(($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'U')[0].toUpperCase()}
      </div>
      <div class="flex-1 truncate">
        <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
          {($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'User'}
        </p>
      </div>
    </div>
  </div>
</aside>
