<script lang="ts">
  import { inertia, page } from '@inertiajs/svelte'
  import DarkModeToggle from '../Components/DarkModeToggle.svelte'
  import LogoMark from '../Components/LogoMark.svelte'

  interface User {
    id: string;
    name: string;
    email: string;
    roles: string[];
    is_verified: boolean;
  }

  let user = $page.props.user as User | undefined;
  let scrollY = $state(0);
  let scrolled = $derived(scrollY > 24);

  // 3D hero parallax — mouse-driven rotate on the scene. Reduced-motion disables it.
  let mx = $state(0);
  let my = $state(0);
  let parallaxOn = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function onMove(e: MouseEvent) {
    if (!parallaxOn) return;
    const w = window.innerWidth, h = window.innerHeight;
    mx = (e.clientX / w - 0.5) * 2;   // -1..1
    my = (e.clientY / h - 0.5) * 2;
  }

  // Soft fade-up on scroll. Native IntersectionObserver, honors reduced-motion.
  // ponytail: no motion lib in the project, IO covers reveal fine.
  function reveal(node: HTMLElement, params: { delay?: number } = {}) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const delay = params.delay ?? 0;
    node.style.opacity = '0';
    node.style.transform = 'translateY(24px)';
    node.style.transition = `opacity .8s cubic-bezier(.16,1,.3,1) ${delay}ms, transform .8s cubic-bezier(.16,1,.3,1) ${delay}ms`;
    const obs = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          node.style.opacity = '1';
          node.style.transform = 'translateY(0)';
          obs.unobserve(node);
        }
      }
    }, { threshold: 0.12 });
    obs.observe(node);
    return { destroy() { obs.disconnect(); } };
  }

</script>

<svelte:window bind:scrollY on:mousemove={onMove} />

<!-- Warm soft structuralism: stone neutrals, coral accent, soft shadows, squircles -->
<div class="min-h-screen bg-stone-50 dark:bg-[#16130f] text-stone-800 dark:text-stone-100 font-display antialiased selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden">

  <!-- Soft warm glow, decorative -->
  <div class="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
    <div class="absolute -top-[20%] right-[5%] w-[50rem] h-[50rem] bg-brand-200/40 dark:bg-brand-500/10 rounded-full blur-[140px]"></div>
    <div class="absolute top-[40%] -left-[15%] w-[40rem] h-[40rem] bg-teal-100/40 dark:bg-teal-500/5 rounded-full blur-[140px]"></div>
  </div>

  <!-- Floating pill nav -->
  <nav class="fixed top-4 inset-x-3 md:inset-x-0 z-50 flex justify-center">
    <div class="w-full max-w-3xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] {scrolled ? 'bg-white/80 dark:bg-stone-900/70 backdrop-blur-xl ring-1 ring-stone-900/5 dark:ring-white/10 shadow-[0_8px_30px_-12px_rgba(16,90,60,0.18)]' : 'bg-transparent'} rounded-full px-2.5 py-2">
      <div class="flex items-center justify-between">
        <a href="/" use:inertia class="flex items-center gap-2.5 pl-2">
          <div class="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(22,167,102,0.45)]">
            <LogoMark class="w-4 h-4 text-white" />
          </div>
          <span class="font-bold tracking-tight text-stone-900 dark:text-white">Project Master</span>
        </a>

        <div class="flex items-center gap-1.5 text-sm">
          {#if user}
            <a href="/dashboard" use:inertia class="px-4 py-2 rounded-full font-semibold hover:bg-stone-100 dark:hover:bg-white/5 transition-colors">Dashboard</a>
          {:else}
            <a href="/login" use:inertia class="hidden sm:block px-4 py-2 rounded-full font-semibold text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors">Masuk</a>
            <a href="/register" use:inertia class="group flex items-center gap-2 pl-4 pr-2 py-2 rounded-xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97]">
              Mulai
              <span class="w-7 h-7 rounded-lg bg-white/15 dark:bg-stone-900/10 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-0.5">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </a>
          {/if}
          <div class="pl-1.5 ml-0.5 border-l border-stone-200 dark:border-white/10">
            <DarkModeToggle />
          </div>
        </div>
      </div>
    </div>
  </nav>

  <!-- Hero: 3D motion scene. Floating kanban cards in perspective, mouse-driven parallax, gradient mesh + grain. -->
  <header class="relative z-10 min-h-[100dvh] flex items-center pt-36 md:pt-44 pb-28 md:pb-36 overflow-hidden">
    <!-- Gradient mesh background (radial, not flat) -->
    <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div class="absolute inset-0 bg-[radial-gradient(60%_50%_at_15%_20%,rgba(22,167,102,0.18),transparent_60%),radial-gradient(55%_45%_at_85%_30%,rgba(13,148,136,0.16),transparent_60%),radial-gradient(45%_40%_at_50%_95%,rgba(22,167,102,0.12),transparent_60%)] dark:bg-[radial-gradient(60%_50%_at_15%_20%,rgba(22,167,102,0.22),transparent_60%),radial-gradient(55%_45%_at_85%_30%,rgba(13,148,136,0.18),transparent_60%),radial-gradient(45%_40%_at_50%_95%,rgba(22,167,102,0.14),transparent_60%)]"></div>
    </div>
    <!-- Grain overlay -->
    <div class="hero-grain absolute inset-0 pointer-events-none opacity-[0.5] dark:opacity-[0.35] mix-blend-soft-light" aria-hidden="true"></div>

    <div class="relative z-10 max-w-[1240px] mx-auto px-5 md:px-8 w-full">

      <!-- 3D scene: perspective wrapper, rotates with mouse -->
      <div
        class="hero-scene [perspective:1600px] relative"
        style="transform: rotateX({(-my * 6).toFixed(2)}deg) rotateY({(mx * 9).toFixed(2)}deg); transition: transform .4s cubic-bezier(.16,1,.3,1);"
        use:reveal
      >

        <!-- Centered headline + CTAs (depth layer 0) -->
        <div class="relative text-center max-w-3xl mx-auto [transform:translateZ(40px)]">
          <div class="inline-flex items-center gap-2 mb-7 rounded-full bg-white/70 dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
            Project management v2.0
          </div>

          <h1 class="text-5xl sm:text-6xl lg:text-[5.5rem] font-extrabold tracking-[-0.03em] leading-[0.95] text-stone-900 dark:text-white [text-wrap:balance]">
            Kelola project tim
            <span class="block mt-1 italic font-serif text-brand-500">dengan tenang.</span>
          </h1>

          <p class="mt-7 text-lg text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Task, riwayat versi, dan rilis tim jadi satu alur yang jelas. Dirancang untuk manusia, bukan robot.
          </p>

          <div class="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/register" use:inertia class="group flex items-center justify-center gap-2.5 pl-7 pr-3 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold shadow-[0_18px_40px_-12px_rgba(22,167,102,0.55)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
              Mulai gratis
              <span class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-px">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </span>
            </a>
            <a href="/login" use:inertia class="flex items-center justify-center px-7 py-3.5 rounded-xl bg-white/80 dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 backdrop-blur-md hover:ring-stone-900/20 dark:hover:ring-white/20 font-semibold transition-all duration-500 active:scale-[0.98]">
              Masuk
            </a>
          </div>
        </div>

        <!-- Floating kanban cards — depth layers, parallax via translateZ + offset -->
        <!-- Card: Backlog (far left, shallow depth) — desktop only -->
        <div
          class="hero-card hidden lg:block absolute left-[-3%] top-[8%] w-[210px] rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-900/5 dark:ring-white/10 p-4 shadow-[0_30px_60px_-25px_rgba(16,90,60,0.35)] [transform:translateZ(120px)_rotateY(18deg)_rotateX(6deg)]"
          style="animation: float-a 7s ease-in-out infinite;"
          aria-hidden="true"
        >
          <div class="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Backlog</div>
          <div class="rounded-lg bg-stone-100 dark:bg-white/5 p-2.5 mb-2">
            <div class="text-xs font-semibold text-stone-700 dark:text-stone-200">Riset kompetitor</div>
            <div class="mt-1.5 text-[10px] text-stone-400">TSK-098</div>
          </div>
          <div class="rounded-lg bg-stone-100 dark:bg-white/5 p-2.5">
            <div class="text-xs font-semibold text-stone-700 dark:text-stone-200">Desain onboarding</div>
            <div class="mt-1.5 text-[10px] text-stone-400">TSK-101</div>
          </div>
        </div>

        <!-- Card: On Going (right, mid depth, accent) — desktop only -->
        <div
          class="hero-card hidden lg:block absolute right-[-2%] top-[2%] w-[230px] rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-brand-500/20 dark:ring-brand-400/20 p-4 shadow-[0_40px_80px_-30px_rgba(22,167,102,0.5)] [transform:translateZ(200px)_rotateY(-16deg)_rotateX(4deg)]"
          style="animation: float-b 8s ease-in-out infinite;"
          aria-hidden="true"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="text-[10px] font-bold uppercase tracking-wider text-brand-500">On Going</div>
            <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
          </div>
          <div class="rounded-lg bg-brand-50 dark:bg-brand-500/10 p-3 ring-1 ring-brand-500/20">
            <div class="text-sm font-bold text-stone-900 dark:text-white">Refactor auth service</div>
            <div class="mt-1.5 flex items-center justify-between">
              <span class="text-[10px] text-stone-400">TSK-104</span>
              <span class="text-[10px] font-semibold text-brand-600 dark:text-brand-400">v2.2 → v2.3</span>
            </div>
            <div class="mt-2.5 h-1 rounded-full bg-brand-100 dark:bg-brand-500/20 overflow-hidden">
              <div class="h-full w-2/3 bg-brand-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <!-- Card: Done (bottom right, deep) — desktop only -->
        <div
          class="hero-card hidden lg:block absolute right-[12%] bottom-[-6%] w-[170px] rounded-2xl bg-stone-900 dark:bg-white/5 ring-1 ring-white/10 p-4 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.5)] [transform:translateZ(70px)_rotateY(-10deg)_rotateX(-4deg)]"
          style="animation: float-c 9s ease-in-out infinite;"
          aria-hidden="true"
        >
          <div class="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Done</div>
          <div class="rounded-lg bg-white/5 p-2.5">
            <div class="flex items-center gap-1.5">
              <svg class="w-3 h-3 text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <div class="text-xs font-semibold text-white">Setup CI pipeline</div>
            </div>
            <div class="mt-1.5 text-[10px] text-stone-400">TSK-091</div>
          </div>
        </div>

        <!-- Card: Revisi (bottom left, mid) — desktop only -->
        <div
          class="hero-card hidden lg:block absolute left-[8%] bottom-[-4%] w-[170px] rounded-2xl bg-white dark:bg-stone-900 ring-1 ring-stone-900/5 dark:ring-white/10 p-4 shadow-[0_30px_60px_-25px_rgba(16,90,60,0.3)] [transform:translateZ(90px)_rotateY(14deg)_rotateX(-5deg)]"
          style="animation: float-d 7.5s ease-in-out infinite;"
          aria-hidden="true"
        >
          <div class="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-2">Revisi</div>
          <div class="rounded-lg bg-amber-50 dark:bg-amber-500/10 p-2.5">
            <div class="text-xs font-semibold text-stone-700 dark:text-stone-200">Perbaiki empty state</div>
            <div class="mt-1.5 text-[10px] text-stone-400">TSK-103</div>
          </div>
        </div>
      </div>

      <!-- Mobile/tablet inline mini-board (replaces floating cards below lg) -->
      <div class="lg:hidden mt-14 max-w-md mx-auto" use:reveal={{ delay: 200 }}>
        <div class="rounded-2xl bg-white/80 dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 backdrop-blur-md p-4 shadow-[0_30px_60px_-30px_rgba(16,90,60,0.3)]">
          <div class="flex items-center justify-between mb-3">
            <span class="text-[10px] font-bold uppercase tracking-wider text-stone-400">Board · Sprint 12</span>
            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">
              <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span> Live
            </span>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <!-- On Going (accent) -->
            <div class="rounded-xl bg-brand-50 dark:bg-brand-500/10 ring-1 ring-brand-500/20 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-2">On Going</div>
              <div class="text-sm font-bold text-stone-900 dark:text-white leading-snug">Refactor auth service</div>
              <div class="mt-2 flex items-center justify-between text-[10px]">
                <span class="text-stone-400">TSK-104</span>
                <span class="font-semibold text-brand-600 dark:text-brand-400">v2.2 → v2.3</span>
              </div>
              <div class="mt-2 h-1 rounded-full bg-brand-100 dark:bg-brand-500/20 overflow-hidden">
                <div class="h-full w-2/3 bg-brand-500 rounded-full"></div>
              </div>
            </div>
            <!-- Revisi -->
            <div class="rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-500/20 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-2">Revisi</div>
              <div class="text-sm font-bold text-stone-900 dark:text-white leading-snug">Perbaiki empty state</div>
              <div class="mt-2 text-[10px] text-stone-400">TSK-103</div>
            </div>
            <!-- Backlog -->
            <div class="rounded-xl bg-stone-100 dark:bg-white/5 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Backlog</div>
              <div class="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-snug">Riset kompetitor</div>
              <div class="mt-2 text-[10px] text-stone-400">TSK-098</div>
            </div>
            <!-- Done -->
            <div class="rounded-xl bg-stone-900 dark:bg-white/5 ring-1 ring-white/10 p-3">
              <div class="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Done</div>
              <div class="flex items-center gap-1.5">
                <svg class="w-3.5 h-3.5 text-brand-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                <div class="text-sm font-semibold text-white leading-snug">Setup CI pipeline</div>
              </div>
              <div class="mt-2 text-[10px] text-stone-400">TSK-091</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll cue -->
      <div class="mt-16 flex justify-center" use:reveal={{ delay: 300 }}>
        <div class="flex flex-col items-center gap-2 text-stone-400 dark:text-stone-500">
          <span class="text-[10px] font-semibold uppercase tracking-[0.2em]">Scroll</span>
          <span class="w-px h-8 bg-gradient-to-b from-stone-400/70 to-transparent animate-pulse"></span>
        </div>
      </div>
    </div>
  </header>

  <!-- Features: asymmetric bento, soft cards -->
  <section class="relative z-10 py-24 md:py-32">
    <div class="max-w-[1240px] mx-auto px-5 md:px-8">
      <div class="max-w-xl mb-14" use:reveal>
        <div class="text-sm font-bold text-brand-500 mb-4">Yang bikin beda</div>
        <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.05] text-stone-900 dark:text-white">
          Semua yang tim butuhkan, tanpa yang nggak.
        </h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-6 gap-5">

        <!-- Kanban — large -->
        <div class="md:col-span-4 rounded-[2rem] bg-white dark:bg-stone-900 ring-1 ring-stone-900/5 dark:ring-white/10 p-8 md:p-10 shadow-[0_20px_50px_-30px_rgba(16,90,60,0.22)]" use:reveal>
          <div class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-7">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4V4z"/><path d="M19 4h-4v16h4a1 1 0 001-1V5a1 1 0 00-1-1z"/><path d="M15 4H9v16h6V4z"/></svg>
          </div>
          <h3 class="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Kanban Board</h3>
          <p class="text-stone-500 dark:text-stone-400 leading-relaxed mt-3 max-w-md">
            Backlog, On Going, Revisi, Done. Geser task antar kolom dengan drag-and-drop yang halus dan responsif.
          </p>
          <div class="mt-8 flex flex-wrap gap-2 text-sm">
            {#each ['Backlog', 'On Going', 'Revisi', 'Done'] as tag}
              <span class="rounded-full px-3.5 py-1.5 bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 font-medium">{tag}</span>
            {/each}
          </div>
        </div>

        <!-- Version control -->
        <div class="md:col-span-2 rounded-[2rem] bg-stone-900 dark:bg-white/5 text-white ring-1 ring-white/10 p-8 md:p-10 shadow-[0_20px_50px_-30px_rgba(16,90,60,0.22)]" use:reveal={{ delay: 80 }}>
          <div class="w-12 h-12 rounded-2xl bg-white/10 text-brand-300 flex items-center justify-center mb-7">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 3v18M18 9v12" stroke-linecap="round"/><path d="M6 9c3.3 0 6 2.7 6 6s2.7 6 6 6" stroke-linecap="round"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/></svg>
          </div>
          <h3 class="text-2xl font-bold tracking-tight">Version Control</h3>
          <p class="text-stone-300 leading-relaxed mt-3">
            Tiap perpindahan kolom mencatat log dan menaikkan versi otomatis.
          </p>
        </div>

        <!-- Batch -->
        <div class="md:col-span-3 rounded-[2rem] bg-white dark:bg-stone-900 ring-1 ring-stone-900/5 dark:ring-white/10 p-8 md:p-10 shadow-[0_20px_50px_-30px_rgba(16,90,60,0.22)]" use:reveal={{ delay: 120 }}>
          <div class="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-7">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <h3 class="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Batch Releases</h3>
          <p class="text-stone-500 dark:text-stone-400 leading-relaxed mt-3 max-w-sm">
            Kelompokkan task per rilis — v1.0 MVP, v1.1 Payment — biar progres kelihatan rapi.
          </p>
        </div>

        <!-- Roles -->
        <div class="md:col-span-3 rounded-[2rem] bg-white dark:bg-stone-900 ring-1 ring-stone-900/5 dark:ring-white/10 p-8 md:p-10 shadow-[0_20px_50px_-30px_rgba(16,90,60,0.22)]" use:reveal={{ delay: 120 }}>
          <div class="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-500/10 text-brand-500 flex items-center justify-center mb-7">
            <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round"/></svg>
          </div>
          <h3 class="text-2xl font-bold tracking-tight text-stone-900 dark:text-white">Role &amp; Workspace</h3>
          <p class="text-stone-500 dark:text-stone-400 leading-relaxed mt-3 max-w-sm">
            Atur akses per workspace. Undang anggota, tetapkan role, kontrol siapa melakukan apa.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- How it works: warm numbered cards -->
  <section class="relative z-10 py-24 md:py-32">
    <div class="max-w-[1240px] mx-auto px-5 md:px-8">
      <div class="text-center max-w-2xl mx-auto mb-16" use:reveal>
        <h2 class="text-4xl md:text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white">
          Tiga langkah, langsung jalan.
        </h2>
        <p class="text-stone-500 dark:text-stone-400 text-lg mt-5 leading-relaxed">
          Nggak ada setup ribet. Buat, isi, lalu pantau — sisanya Project Master yang urus.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        {#each [
          { n: '01', t: 'Buat project', d: 'Inisiasi workspace, undang tim, tetapkan role, dan definisikan visi produk.' },
          { n: '02', t: 'Tambah task', d: 'Pecah pekerjaan jadi task kecil. Tentukan prioritas dan kelompokkan dalam batch.' },
          { n: '03', t: 'Pantau progres', d: 'Geser kartu di board. Project Master mencatat versi dan riwayat secara otomatis.' },
        ] as step, i}
          <div class="rounded-[2rem] bg-white dark:bg-stone-900 ring-1 ring-stone-900/5 dark:ring-white/10 p-8 md:p-9 shadow-[0_20px_50px_-30px_rgba(16,90,60,0.22)]" use:reveal={{ delay: i * 90 }}>
            <div class="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-bold text-lg shadow-[0_8px_20px_-6px_rgba(22,167,102,0.5)]">{step.n}</div>
            <h4 class="text-xl font-bold tracking-tight mt-6 text-stone-900 dark:text-white">{step.t}</h4>
            <p class="text-stone-500 dark:text-stone-400 leading-relaxed mt-2.5">{step.d}</p>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <!-- CTA: warm coral panel -->
  <section class="relative z-10 px-5 md:px-8 pb-24 md:pb-32">
    <div class="max-w-[1240px] mx-auto rounded-[2.5rem] bg-brand-500 overflow-hidden relative shadow-[0_40px_80px_-40px_rgba(22,167,102,0.5)]" use:reveal>
      <div class="absolute -top-1/3 -right-[5%] w-[30rem] h-[30rem] bg-brand-400/50 rounded-full blur-[100px] pointer-events-none"></div>
      <div class="relative px-8 py-20 md:p-24 text-center flex flex-col items-center">
        <h2 class="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1] max-w-2xl">
          Mulai kelola project dengan lebih tenang.
        </h2>
        <p class="text-white/85 text-lg mt-6 max-w-md leading-relaxed">
          Gratis untuk mulai. Tanpa kartu kredit, tanpa setup rumit.
        </p>
        <a href="/register" use:inertia class="group flex items-center gap-2.5 mt-10 pl-8 pr-3 py-4 rounded-xl bg-white text-stone-900 font-bold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
          Mulai gratis sekarang
          <span class="w-9 h-9 rounded-lg bg-stone-900 text-white flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="relative z-10 border-t border-stone-200/70 dark:border-white/10">
    <div class="max-w-[1240px] mx-auto px-5 md:px-8 py-12 flex flex-col sm:flex-row justify-between items-center gap-6">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
          <LogoMark class="w-3.5 h-3.5 text-white" />
        </div>
        <span class="font-bold tracking-tight text-stone-900 dark:text-white">Project Master</span>
      </div>
      <div class="text-sm text-stone-400">
        &copy; {new Date().getFullYear()} Project Master
      </div>
    </div>
  </footer>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }
  :global(html.dark) {
    background-color: #16130f;
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) {
      scroll-behavior: auto;
    }
    .hero-scene { transform: none !important; }
    .hero-card { animation: none !important; }
  }

  /* Floating kanban cards — gentle, desynced so the scene feels alive */
  @keyframes float-a {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -14px; }
  }
  @keyframes float-b {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -20px; }
  }
  @keyframes float-c {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -10px; }
  }
  @keyframes float-d {
    0%, 100% { translate: 0 0; }
    50% { translate: 0 -16px; }
  }

  /* Subtle grain — breaks digital flatness without an image asset */
  .hero-grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    background-size: 160px 160px;
  }
</style>
