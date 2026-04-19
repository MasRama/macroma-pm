<script lang="ts">
  import Sidebar from './Sidebar.svelte';

  let {
    title = 'PM Macroma',
    children,
    projects = [],
    activeProjectId = ''
  }: {
    title?: string;
    children: import('svelte').Snippet;
    projects?: any[];
    activeProjectId?: string;
  } = $props();
</script>

<svelte:head>
  <title>{title} — PM Macroma</title>
</svelte:head>

<div class="flex min-h-screen bg-[#020617] text-slate-100 transition-colors duration-300">
  <Sidebar {projects} {activeProjectId} />

  <main class="flex-1 ml-[260px] min-h-screen">
    {@render children()}
  </main>
</div>
