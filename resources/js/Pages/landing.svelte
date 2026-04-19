<script lang="ts">
  import { inertia, page } from '@inertiajs/svelte'
  import { fade, fly } from 'svelte/transition'
  import DarkModeToggle from '../Components/DarkModeToggle.svelte'

  interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    is_verified: boolean;
  }

  let user = $page.props.user as User | undefined
  let scrollY = $state(0);
  let scrolled = $derived(scrollY > 50);
</script>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-surface-light dark:bg-surface-dark text-slate-900 dark:text-slate-100 transition-colors duration-500 overflow-x-hidden selection:bg-primary-400 selection:text-black">
  
  <!-- Floating Navigation -->
  <nav 
    class="fixed top-0 left-0 right-0 z-50 px-6 py-6 flex justify-between items-start transition-all duration-500 {scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-slate-200 dark:border-white/10 py-4' : 'mix-blend-difference text-white'}"
  >
    <div class="flex flex-col relative z-10">
      <a href="/" class="text-xl font-bold tracking-tighter hover:opacity-70 transition-opacity">PM Macroma</a>
    </div>

    <div class="flex items-center gap-6 text-sm font-medium relative z-10">
      {#if user}
        <a href="/dashboard" use:inertia class="hover:underline decoration-1 underline-offset-4">Dashboard</a>
      {:else}
        <a href="/login" use:inertia class="hover:underline decoration-1 underline-offset-4">Login</a>
      {/if}
      
      <div class="pl-2">
        <DarkModeToggle />
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="relative min-h-screen flex flex-col justify-center px-6 sm:px-12 lg:px-24 pt-20">
    <div class="max-w-[90rem] mx-auto w-full">
      <div in:fly={{ y: 50, duration: 1000, delay: 200 }} class="flex flex-col gap-2">
        <h1 class="text-[13vw] leading-[0.8] font-bold tracking-tighter -ml-[0.05em] uppercase">
          PM MACROMA
        </h1>
        <h2 class="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tighter mt-4 text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-300 dark:from-primary-400 dark:to-info-300 w-fit">
          Project Management
        </h2>
      </div>

      <div class="mt-12 sm:mt-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
        <div class="lg:col-span-5 text-lg sm:text-xl leading-relaxed font-serif italic text-slate-600 dark:text-slate-400">
          <p in:fly={{ y: 20, duration: 1000, delay: 600 }}>
            Kelola project, track progress, dan kontrol versi task dalam satu kanban board yang elegan.
          </p>
        </div>
        <div class="lg:col-span-7 flex flex-col items-start lg:items-end gap-6">
          <div in:fly={{ y: 20, duration: 1000, delay: 1000 }} class="flex flex-col sm:flex-row gap-4">
            <a 
              href="/register" 
              use:inertia 
              class="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors text-center"
            >
              Mulai Gratis
            </a>
            <a 
              href="/login" 
              use:inertia 
              class="px-6 py-3 border border-slate-200 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-center"
            >
              Masuk
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-12 left-6 sm:left-12 animate-bounce opacity-50">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
      </svg>
    </div>
  </header>

  <!-- Features Section -->
  <section class="py-24 sm:py-32 border-y border-slate-200 dark:border-white/5 relative overflow-hidden bg-white dark:bg-surface-card-dark">
    <div class="px-6 sm:px-12 lg:px-24 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
       <div>
         <span class="block text-xs font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-4">Fitur Unggulan</span>
         <h3 class="text-5xl sm:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white">
          KENDALI PENUH
        </h3>
       </div>
    </div>
    
    <div class="px-6 sm:px-12 lg:px-24">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <!-- Feature 1: Kanban Board -->
        <div class="bg-surface-card-light dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-8 hover:border-primary-500/30 transition-colors group">
          <div class="h-12 w-12 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H9V4Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 4H15V20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 4H9V20H15V4Z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h4 class="text-xl font-bold mb-3">Kanban Board</h4>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
            Visualisasi alur kerja dengan 3 kolom: On Going, Revisi, dan Done. Drag-and-drop task antar kolom dengan mudah.
          </p>
        </div>

        <!-- Feature 2: Version Control -->
        <div class="bg-surface-card-light dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-8 hover:border-accent-500/30 transition-colors group">
          <div class="h-12 w-12 bg-accent-500/10 text-accent-600 dark:text-accent-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 3V21" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 9V21" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 9C9.31371 9 12 11.6863 12 15C12 18.3137 14.6863 21 18 21" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="6" cy="6" r="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="18" cy="6" r="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h4 class="text-xl font-bold mb-3">Version Control</h4>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
            Setiap task punya riwayat versi otomatis. Tiap perpindahan kolom mencatat log dan menaikkan versi task.
          </p>
        </div>

        <!-- Feature 3: Batch Updates -->
        <div class="bg-surface-card-light dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl p-8 hover:border-warning-500/30 transition-colors group">
          <div class="h-12 w-12 bg-warning-500/10 text-warning-600 dark:text-warning-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h4 class="text-xl font-bold mb-3">Batch Updates</h4>
          <p class="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
            Kelompokkan task per batch release (v1.0 MVP, v1.1 Payment Gateway) untuk tracking progress yang lebih terstruktur.
          </p>
        </div>

      </div>
    </div>
  </section>

  <!-- How it Works Section -->
  <section class="py-32 px-6 sm:px-12 lg:px-24 relative overflow-hidden flex flex-col transition-colors duration-500">
     <!-- Background Effects -->
     <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(var(--color-primary-rgb,16,185,129),0.05),_transparent_70%)]"></div>
     
     <div class="relative z-10 max-w-5xl mx-auto w-full">
        <h3 class="text-4xl sm:text-6xl font-bold tracking-tighter mb-16 text-center">
          Cara Kerja
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-12">
           <!-- Step 1 -->
           <div class="flex flex-col items-center text-center">
              <div class="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-bold mb-6 font-serif">1</div>
              <h4 class="text-2xl font-bold mb-3">Buat Project</h4>
              <p class="text-slate-600 dark:text-slate-400">Inisiasi project baru dan undang anggota tim untuk berkolaborasi.</p>
           </div>

           <!-- Step 2 -->
           <div class="flex flex-col items-center text-center">
              <div class="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-bold mb-6 font-serif">2</div>
              <h4 class="text-2xl font-bold mb-3">Tambah Task</h4>
              <p class="text-slate-600 dark:text-slate-400">Buat task, tentukan prioritas, assign ke anggota tim, dan masuk ke batch rilis.</p>
           </div>

           <!-- Step 3 -->
           <div class="flex flex-col items-center text-center">
              <div class="w-16 h-16 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-2xl font-bold mb-6 font-serif">3</div>
              <h4 class="text-2xl font-bold mb-3">Track Progress</h4>
              <p class="text-slate-600 dark:text-slate-400">Pindahkan task antar kolom. Sistem akan mencatat versi dan riwayat otomatis.</p>
           </div>
        </div>
     </div>
  </section>

  <!-- Minimal Footer -->
  <footer class="border-t border-slate-200 dark:border-white/5 py-12 px-6 text-center text-sm text-slate-500 dark:text-slate-400 font-mono relative z-10 bg-white/50 dark:bg-black/50 backdrop-blur-md">
    &copy; 2026 PM Macroma. Dibangun dengan &hearts;
  </footer>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
</style>