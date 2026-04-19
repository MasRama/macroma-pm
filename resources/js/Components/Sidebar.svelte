<script lang="ts">
  import { inertia, page as inertiaPage } from '@inertiajs/svelte';

  let { 
    projects = [], 
    activeProjectId = '' 
  }: { 
    projects: any[]; 
    activeProjectId?: string 
  } = $props();

  const dotColors = [
    'bg-primary-400',
    'bg-accent-400',
    'bg-info-400',
    'bg-warning-400'
  ];
</script>

<aside data-testid="sidebar" class="fixed left-0 top-0 h-screen w-[260px] bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-40 transition-all duration-300 overflow-hidden">
  <!-- Subtle radial glow -->
  <div class="absolute top-0 left-0 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

  <!-- Top section -->
  <div class="h-16 flex items-center px-6 relative z-10">
    <div class="flex items-center gap-3">
      <svg class="w-6 h-6 text-primary-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1.5"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1.5"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1.5"></rect>
      </svg>
      <span class="text-slate-100 font-bold text-lg">PM Macroma</span>
    </div>
  </div>

  <!-- Project list section -->
  <nav class="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar relative z-10">
    <p class="text-xs uppercase tracking-widest text-slate-600 px-3 mb-3 font-semibold">PROJECTS</p>
    
    <div class="space-y-0.5">
      {#if projects.length > 0}
        {#each projects as project, index}
          <a use:inertia href="/projects/{project.id}" class="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all {activeProjectId === project.id ? 'bg-primary-500/15 text-primary-400 border-l-2 border-primary-500' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] border-l-2 border-transparent'}">
            <span class="w-2 h-2 rounded-full {dotColors[index % 4]} shrink-0"></span>
            <span class="truncate">{project.name}</span>
          </a>
        {/each}
      {:else}
        <p class="px-3 py-2 text-xs italic text-slate-600">No projects yet</p>
      {/if}
    </div>
  </nav>

  <!-- Bottom section -->
  <div class="p-4 relative z-10">
    <a use:inertia href="/projects" class="flex items-center justify-center w-full py-2.5 mb-5 rounded-xl bg-primary-500/10 hover:bg-primary-500/20 border border-primary-500/20 text-sm font-medium text-primary-400 transition-colors">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      New Project
    </a>
    
    <div class="flex items-center gap-3 px-2">
      <div class="w-8 h-8 rounded-full bg-white/5 text-slate-300 flex items-center justify-center font-bold text-xs border border-white/10 shrink-0">
        {(($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'U')[0].toUpperCase()}
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-300 truncate">
          {($inertiaPage.props.user as any)?.name || ($inertiaPage.props.user as any)?.email || 'User'}
        </p>
      </div>
    </div>
  </div>
</aside>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
</style>
