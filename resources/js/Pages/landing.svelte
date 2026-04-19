<script lang="ts">
  import { inertia, page } from '@inertiajs/svelte'
  import { fade, fly } from 'svelte/transition'
  import DarkModeToggle from '../Components/DarkModeToggle.svelte'
  import { onMount } from 'svelte'

  interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    is_verified: boolean;
  }

  let user = $page.props.user as User | undefined;
  let scrollY = $state(0);
  let scrolled = $derived(scrollY > 50);
  let mounted = $state(false);

  onMount(() => {
    mounted = true;
  });
</script>

<svelte:window bind:scrollY />

<div class="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-x-hidden selection:bg-primary-500/30 selection:text-white font-sans relative">

  <!-- Floating Navigation -->
  <nav class="fixed top-4 left-4 right-4 md:left-8 md:right-8 z-50 transition-all duration-300 {scrolled ? 'bg-white/90 dark:bg-[#0f0f0f]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl py-4 px-6 rounded-2xl' : 'bg-transparent py-6 px-4'}">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <a href="/" class="text-xl font-bold tracking-tighter text-slate-900 dark:text-white hover:opacity-80 transition-opacity duration-200 cursor-pointer flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-info-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        PM Macroma
      </a>

      <div class="flex items-center gap-4 sm:gap-6 text-sm font-medium">
        {#if user}
          <a href="/dashboard" use:inertia class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 cursor-pointer">Dashboard</a>
        {:else}
          <a href="/login" use:inertia class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 cursor-pointer hidden sm:block">Login</a>
          <a href="/register" use:inertia class="px-5 py-2.5 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 rounded-lg transition-all duration-200 text-slate-900 dark:text-white cursor-pointer backdrop-blur-md">Get Started</a>
        {/if}
        
        <div class="pl-2 border-l border-slate-200 dark:border-white/10">
          <DarkModeToggle />
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <header class="relative min-h-screen flex flex-col justify-center pt-24 pb-12 overflow-hidden">
    <!-- Aurora Background -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none opacity-60 dark:opacity-100">
      <div class="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary-500/20 rounded-full blur-[120px] animate-pulse" style="animation-duration: 8s;"></div>
      <div class="absolute top-[20%] -right-[10%] w-[50%] h-[70%] bg-accent-500/15 rounded-full blur-[120px] animate-pulse" style="animation-duration: 12s; animation-delay: 2s;"></div>
      <div class="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] bg-info-500/10 rounded-full blur-[120px] animate-pulse" style="animation-duration: 10s; animation-delay: 1s;"></div>
    </div>

    <div class="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full flex flex-col">
      {#if mounted}
        <div in:fly={{ y: 40, duration: 1200, delay: 100 }} class="flex flex-col gap-6 max-w-4xl">
          <div class="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-xl w-fit mb-2 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            <span class="text-xs font-mono text-slate-600 dark:text-slate-300 tracking-widest uppercase">Macroma v2.0 Live</span>
          </div>

          <h1 class="text-[clamp(3.5rem,9vw,9rem)] leading-[0.9] font-bold tracking-tighter text-slate-900 dark:text-white">
            PM MACROMA
          </h1>
          
          <p in:fly={{ y: 20, duration: 1000, delay: 400 }} class="text-xl sm:text-3xl leading-relaxed text-slate-500 dark:text-slate-400 mt-2 max-w-2xl font-light">
            Project management yang <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-info-400 font-medium">dirancang untuk manusia</span>.
          </p>

          <div in:fly={{ y: 20, duration: 1000, delay: 600 }} class="flex flex-col sm:flex-row gap-5 mt-12">
            <a 
              href="/register" 
              use:inertia 
              class="px-8 py-4 bg-primary-500 hover:bg-primary-400 text-white font-medium rounded-xl transition-all duration-300 cursor-pointer text-center shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3 group"
            >
              Mulai Gratis
              <svg class="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <a 
              href="/login" 
              use:inertia 
              class="px-8 py-4 bg-white dark:bg-surface-card-dark/50 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium rounded-xl transition-all duration-300 cursor-pointer text-center backdrop-blur-xl flex items-center justify-center"
            >
              Masuk
            </a>
          </div>
        </div>
      {/if}
    </div>

    <!-- Scroll Indicator -->
    <div class="absolute bottom-12 left-1/2 -translate-x-1/2 animate-bounce opacity-50 text-slate-500 dark:text-slate-400 flex flex-col items-center gap-3 cursor-pointer" onclick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}>
      <span class="text-[10px] font-mono tracking-[0.3em] uppercase">Scroll</span>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
      </svg>
    </div>
  </header>

  <!-- Features Section -->
  <section class="py-32 relative z-10 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#0a0a0a]/50">
    <div class="max-w-7xl mx-auto px-6 md:px-12">
      <div class="mb-24 md:flex justify-between items-end gap-8">
        <div>
          <span class="block text-xs font-mono font-bold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-400 mb-6">Fitur Unggulan</span>
          <h2 class="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white">
            KENDALI PENUH
          </h2>
        </div>
        <p class="text-slate-500 dark:text-slate-400 text-lg max-w-md pb-2 mt-6 md:mt-0 leading-relaxed font-light">
          Sistem manajemen project yang dirancang untuk kecepatan, transparansi, dan kolaborasi tanpa batas.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Feature 1: Kanban Board -->
        <div class="bg-white/90 dark:bg-surface-card-dark/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-10 hover:-translate-y-2 hover:bg-white dark:hover:bg-surface-card-dark transition-all duration-500 group cursor-pointer relative overflow-hidden h-full flex flex-col">
          <div class="absolute -top-32 -right-32 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl group-hover:bg-primary-500/20 dark:group-hover:bg-primary-500/30 transition-colors duration-700"></div>
          
          <div class="h-16 w-16 bg-white dark:bg-[#020617] border border-primary-500/20 text-primary-500 dark:text-primary-400 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all duration-500 relative z-10">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M9 4H5C4.44772 4 4 4.44772 4 5V19C4 19.5523 4.44772 20 5 20H9V4Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M19 4H15V20H19C19.5523 20 20 19.5523 20 19V5C20 4.44772 19.5523 4 19 4Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M15 4H9V20H15V4Z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-5 relative z-10 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-300 tracking-tight">Kanban Board</h3>
          <p class="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 flex-grow font-light">
            Visualisasi alur kerja dengan 3 kolom utama: On Going, Revisi, dan Done. Drag-and-drop task antar kolom dengan memuaskan.
          </p>
        </div>

        <!-- Feature 2: Version Control -->
        <div class="bg-white/90 dark:bg-surface-card-dark/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-10 hover:-translate-y-2 hover:bg-white dark:hover:bg-surface-card-dark transition-all duration-500 group cursor-pointer relative overflow-hidden md:translate-y-12 h-full flex flex-col">
          <div class="absolute -bottom-32 -right-32 w-64 h-64 bg-accent-500/10 dark:bg-accent-500/20 rounded-full blur-3xl group-hover:bg-accent-500/20 dark:group-hover:bg-accent-500/30 transition-colors duration-700"></div>

          <div class="h-16 w-16 bg-white dark:bg-[#020617] border border-accent-500/20 text-accent-500 dark:text-accent-400 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] transition-all duration-500 relative z-10">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M6 3V21" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M18 9V21" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M6 9C9.31371 9 12 11.6863 12 15C12 18.3137 14.6863 21 18 21" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="6" cy="6" r="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="18" cy="6" r="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-5 relative z-10 group-hover:text-accent-500 dark:group-hover:text-accent-400 transition-colors duration-300 tracking-tight">Version Control</h3>
          <p class="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 flex-grow font-light">
            Setiap task punya riwayat versi otomatis. Tiap perpindahan kolom mencatat log dan menaikkan versi task secara pintar.
          </p>
        </div>

        <!-- Feature 3: Batch Updates -->
        <div class="bg-white/90 dark:bg-surface-card-dark/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-[2rem] p-10 hover:-translate-y-2 hover:bg-white dark:hover:bg-surface-card-dark transition-all duration-500 group cursor-pointer relative overflow-hidden md:translate-y-24 h-full flex flex-col">
          <div class="absolute top-1/2 -left-32 w-64 h-64 bg-info-500/10 dark:bg-info-500/20 rounded-full blur-3xl group-hover:bg-info-500/20 dark:group-hover:bg-info-500/30 transition-colors duration-700 -translate-y-1/2"></div>

          <div class="h-16 w-16 bg-white dark:bg-[#020617] border border-info-500/20 text-info-500 dark:text-info-400 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-500 relative z-10">
            <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-5 relative z-10 group-hover:text-info-500 dark:group-hover:text-info-400 transition-colors duration-300 tracking-tight">Batch Releases</h3>
          <p class="text-slate-500 dark:text-slate-400 leading-relaxed relative z-10 flex-grow font-light">
            Kelompokkan task per batch release (v1.0 MVP, v1.1 Payment Gateway) untuk tracking progress yang jauh lebih terstruktur.
          </p>
        </div>

      </div>
    </div>
  </section>

  <!-- How it Works Section -->
  <section class="py-40 relative z-10 overflow-hidden">
    <!-- Mesh gradient accent -->
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.02)_0%,_transparent_70%)] dark:bg-[radial-gradient(circle_at_center,_rgba(168,85,247,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
    
    <div class="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
      <div class="text-center mb-32">
        <h2 class="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-slate-900 dark:text-white mb-6">
          ALUR KERJA <span class="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-info-400">YANG LOGIS.</span>
        </h2>
        <p class="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
          Tiga langkah sederhana untuk mentransformasi cara tim Anda berkolaborasi dan menyelesaikan masalah.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
        <!-- Connecting Line -->
        <div class="hidden md:block absolute top-[44px] left-[16.66%] right-[16.66%] h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-white/20 to-transparent z-0"></div>

        <!-- Step 1 -->
        <div class="flex flex-col items-center text-center relative z-10 group cursor-pointer">
          <div class="w-24 h-24 rounded-full bg-white dark:bg-surface-card-dark border border-slate-200 dark:border-white/10 flex items-center justify-center text-3xl font-light text-slate-900 dark:text-white mb-8 group-hover:border-primary-500/50 group-hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-500 relative overflow-hidden backdrop-blur-xl">
            <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 dark:from-primary-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span class="relative z-10 font-mono text-primary-500 dark:text-primary-400">01</span>
          </div>
          <h4 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Buat Project</h4>
          <p class="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed font-light max-w-xs">
            Inisiasi ruang kerja baru. Undang anggota tim, atur role, dan mulai mendefinisikan visi produk Anda.
          </p>
        </div>

        <!-- Step 2 -->
        <div class="flex flex-col items-center text-center relative z-10 group cursor-pointer md:mt-16">
          <div class="w-24 h-24 rounded-full bg-white dark:bg-surface-card-dark border border-slate-200 dark:border-white/10 flex items-center justify-center text-3xl font-light text-slate-900 dark:text-white mb-8 group-hover:border-accent-500/50 group-hover:shadow-[0_0_40px_rgba(168,85,247,0.3)] transition-all duration-500 relative overflow-hidden backdrop-blur-xl">
            <div class="absolute inset-0 bg-gradient-to-br from-accent-500/10 dark:from-accent-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span class="relative z-10 font-mono text-accent-500 dark:text-accent-400">02</span>
          </div>
          <h4 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Tambah Task</h4>
          <p class="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed font-light max-w-xs">
            Pecah masalah menjadi task kecil. Tentukan prioritas, assign, dan kelompokkan dalam batch rilis.
          </p>
        </div>

        <!-- Step 3 -->
        <div class="flex flex-col items-center text-center relative z-10 group cursor-pointer md:mt-32">
          <div class="w-24 h-24 rounded-full bg-white dark:bg-surface-card-dark border border-slate-200 dark:border-white/10 flex items-center justify-center text-3xl font-light text-slate-900 dark:text-white mb-8 group-hover:border-info-500/50 group-hover:shadow-[0_0_40px_rgba(6,182,212,0.3)] transition-all duration-500 relative overflow-hidden backdrop-blur-xl">
            <div class="absolute inset-0 bg-gradient-to-br from-info-500/10 dark:from-info-500/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            <span class="relative z-10 font-mono text-info-500 dark:text-info-400">03</span>
          </div>
          <h4 class="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">Track Progress</h4>
          <p class="text-slate-500 dark:text-slate-400 text-sm md:text-base leading-relaxed font-light max-w-xs">
            Pindahkan kartu di papan kanban. Biarkan sistem mencatat versi dan riwayat perubahan secara otomatis.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-32 relative z-10 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="bg-white/90 dark:bg-surface-card-dark/80 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.05)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.15)_0%,_transparent_50%)]"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.05)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.15)_0%,_transparent_50%)]"></div>
        
        <div class="relative z-10 flex flex-col items-center">
          <h2 class="text-4xl md:text-6xl font-bold tracking-tighter text-slate-900 dark:text-white mb-8 max-w-3xl">
            Siap Meningkatkan Produktivitas Tim?
          </h2>
          <p class="text-slate-500 dark:text-slate-400 text-xl mb-12 max-w-2xl font-light">
            Bergabung dengan developer modern lainnya yang telah mengubah cara mereka mengelola project IT.
          </p>
          <a href="/register" use:inertia class="inline-flex items-center justify-center px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-[#020617] font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-200 hover:scale-105 transition-all duration-300 cursor-pointer shadow-[0_0_40px_rgba(15,23,42,0.15)] dark:shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(15,23,42,0.3)] dark:hover:shadow-[0_0_60px_rgba(255,255,255,0.3)] text-lg">
            Mulai Sekarang — Gratis
          </a>
        </div>
      </div>
    </div>
  </section>

  <!-- Minimal Footer -->
  <footer class="border-t border-slate-200 dark:border-white/10 py-16 px-6 relative z-10 bg-slate-50 dark:bg-[#020617]">
    <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
      <div class="flex items-center gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
        <div class="w-6 h-6 rounded-md bg-gradient-to-br from-primary-500 to-info-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
          <svg class="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <span class="text-slate-900 dark:text-white font-bold tracking-tighter text-lg">PM Macroma</span>
      </div>
      <div class="text-sm text-slate-500 dark:text-slate-500 font-mono">
        &copy; {new Date().getFullYear()} PM Macroma. Handcrafted with &hearts;
      </div>
      <div class="flex gap-8 text-sm text-slate-500 dark:text-slate-500 font-mono">
        <a href="#" class="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Privacy</a>
        <a href="#" class="hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Terms</a>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  
  :global(html.dark) {
    background-color: #020617;
  }
</style>