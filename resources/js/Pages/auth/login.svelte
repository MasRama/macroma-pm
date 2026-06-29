<script lang="ts">
  import { inertia, router } from '@inertiajs/svelte'
  import { buildCSRFHeaders, Toast } from '../../Components/helper';
  import { fly } from 'svelte/transition';
  import LogoMark from '../../Components/LogoMark.svelte';

  interface LoginForm {
    email: string;
    password: string;
  }

  let form: LoginForm = {
    email: '',
    password: '',
  }

  let { error }: { error?: string } = $props();

  $effect(() => {
    if (error) Toast(error, 'error');
  });

  function submitForm(): void {
    router.post("/login", { email: form.email, password: form.password }, {
      headers: buildCSRFHeaders()
    })
  }
</script>

<!-- Vibe: landing page — stone neutral, emerald brand, gradient mesh, grain, glass -->
<div class="min-h-[100dvh] bg-stone-50 dark:bg-[#16130f] text-stone-800 dark:text-stone-100 font-display antialiased selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden flex">

  <!-- Left: form panel -->
  <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10">

    <!-- Logo -->
    <a href="/" use:inertia class="flex items-center gap-2.5 w-fit cursor-pointer">
      <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(22,167,102,0.45)]">
        <LogoMark class="w-5 h-5 text-white" />
      </div>
      <span class="font-bold tracking-tight text-stone-900 dark:text-white">Project Master</span>
    </a>

    <!-- Form -->
    <div class="max-w-md w-full mx-auto my-10" in:fly={{ y: 24, duration: 700 }}>
      <div class="mb-9">
        <div class="inline-flex items-center gap-2 mb-6 rounded-full bg-white/70 dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          Selamat datang kembali
        </div>
        <h1 class="text-4xl font-extrabold tracking-[-0.02em] leading-[1.05] text-stone-900 dark:text-white [text-wrap:balance]">
          Masuk ke <span class="italic font-serif text-brand-500">workspace.</span>
        </h1>
        <p class="mt-4 text-stone-500 dark:text-stone-400 leading-relaxed">
          Lanjutkan dari tempat terakhir kamu tinggalkan.
        </p>
      </div>

      <!-- Google (hidden for now) -->
      <!-- Divider (hidden while Google is hidden) -->
      <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
        <div class="space-y-1.5">
          <label for="email" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 ml-1">Email</label>
          <input bind:value={form.email} required type="text" name="email" id="email"
            class="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 outline-none transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
            placeholder="kamu@contoh.com">
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between ml-1">
            <label for="password" class="block text-sm font-semibold text-stone-700 dark:text-stone-300">Password</label>
            <a href="/forgot-password" use:inertia class="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">Lupa password?</a>
          </div>
          <input bind:value={form.password} required type="password" name="password" id="password"
            placeholder="••••••••"
            class="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 outline-none transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500">
        </div>

        <button type="submit"
          class="group w-full flex items-center justify-center gap-2.5 mt-2 pl-7 pr-4 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold shadow-[0_12px_30px_-10px_rgba(22,167,102,0.55)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer">
          Masuk
          <span class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>

        <p class="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
          Belum punya akun? <a href="/register" use:inertia class="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">Buat sekarang</a>
        </p>
      </form>
    </div>

    <!-- Footer -->
    <div class="text-xs text-stone-400 dark:text-stone-500 text-center lg:text-left">
      &copy; {new Date().getFullYear()} Project Master
    </div>
  </div>

  <!-- Right: visual panel — editorial static activity feed (desktop only) -->
  <div class="hidden lg:flex w-1/2 relative overflow-hidden border-l border-stone-200/70 dark:border-white/10 bg-stone-100/50 dark:bg-[#1c1814]">
    <!-- Gradient mesh -->
    <div class="absolute inset-0 bg-[radial-gradient(50%_40%_at_30%_20%,rgba(22,167,102,0.16),transparent_60%),radial-gradient(45%_35%_at_75%_80%,rgba(13,148,136,0.12),transparent_60%)] dark:bg-[radial-gradient(50%_40%_at_30%_20%,rgba(22,167,102,0.20),transparent_60%),radial-gradient(45%_35%_at_75%_80%,rgba(13,148,136,0.14),transparent_60%)]" aria-hidden="true"></div>
    <!-- Grain -->
    <div class="auth-grain absolute inset-0 opacity-[0.35] dark:opacity-[0.25] mix-blend-soft-light pointer-events-none" aria-hidden="true"></div>

    <div class="relative z-10 w-full max-w-md mx-auto px-10 py-14 flex flex-col justify-center h-full">

      <!-- Section label -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
          <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Aktivitas tim</span>
        </div>
        <span class="text-[11px] font-semibold text-stone-400 dark:text-stone-500">Hari ini</span>
      </div>

      <!-- Activity feed — static -->
      <div class="space-y-1 mb-10">

        <!-- Entry: task moved (accent) -->
        <div class="flex gap-3.5 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
          <div class="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-bold shrink-0">AR</div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] text-stone-700 dark:text-stone-200 leading-snug">
              <span class="font-bold text-stone-900 dark:text-white">Ari</span> pindahkan
              <span class="font-semibold">Refactor auth service</span>
              <span class="text-stone-400"> → </span>
              <span class="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400">
                <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>On Going
              </span>
            </div>
            <div class="mt-1.5 flex items-center gap-2 text-[10px] text-stone-400">
              <span>TSK-104</span><span>·</span><span>v2.2 → v2.3</span><span>·</span><span>2m</span>
            </div>
          </div>
        </div>

        <!-- Entry: comment -->
        <div class="flex gap-3.5 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
          <div class="w-8 h-8 rounded-full bg-stone-700 dark:bg-stone-600 text-white flex items-center justify-center text-xs font-bold shrink-0">SN</div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] text-stone-700 dark:text-stone-200 leading-snug">
              <span class="font-bold text-stone-900 dark:text-white">Sinta</span> berkomentar di
              <span class="font-semibold">Perbaiki empty state</span>
            </div>
            <div class="mt-1.5 rounded-lg bg-stone-100 dark:bg-white/5 p-2 text-[11px] text-stone-500 dark:text-stone-400 italic leading-snug">
              "Bisa pakai ilustrasi, bukan cuma teks?"
            </div>
            <div class="mt-1.5 text-[10px] text-stone-400">TSK-103 · 14m</div>
          </div>
        </div>

        <!-- Entry: task done -->
        <div class="flex gap-3.5 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
          <div class="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold shrink-0">BK</div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] text-stone-700 dark:text-stone-200 leading-snug">
              <span class="font-bold text-stone-900 dark:text-white">Bima</span> menyelesaikan
              <span class="font-semibold">Setup CI pipeline</span>
            </div>
            <div class="mt-1.5 flex items-center gap-2 text-[10px] text-stone-400">
              <span class="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
                <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Done
              </span>
              <span>·</span><span>TSK-091</span><span>·</span><span>1j</span>
            </div>
          </div>
        </div>

        <!-- Entry: release -->
        <div class="flex gap-3.5 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
          <div class="w-8 h-8 rounded-xl bg-stone-900 dark:bg-white/10 text-brand-300 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] text-stone-700 dark:text-stone-200 leading-snug">
              Rilis <span class="font-bold text-stone-900 dark:text-white">v2.2</span> dipublikasikan
            </div>
            <div class="mt-1.5 text-[10px] text-stone-400">8 task · Payment integration · 3j</div>
          </div>
        </div>

        <!-- Entry: new member -->
        <div class="flex gap-3.5 p-3 rounded-xl hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
          <div class="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0">DW</div>
          <div class="flex-1 min-w-0">
            <div class="text-[13px] text-stone-700 dark:text-stone-200 leading-snug">
              <span class="font-bold text-stone-900 dark:text-white">Dewi</span> bergabung ke workspace
            </div>
            <div class="mt-1.5 flex items-center gap-2 text-[10px] text-stone-400">
              <span class="rounded-full bg-stone-100 dark:bg-white/5 px-1.5 py-0.5 font-semibold">Developer</span>
              <span>·</span><span>5j</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Headline -->
      <h2 class="text-[2.75rem] font-extrabold tracking-[-0.03em] leading-[0.98] text-stone-900 dark:text-white [text-wrap:balance]">
        Tim kamu sudah
        <span class="block mt-1 italic font-serif text-brand-500">menunggu.</span>
      </h2>
      <p class="mt-5 text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm">
        Setiap perubahan tercatat. Kembali ke alur tanpa kehilangan konteks.
      </p>

      <!-- Metric strip -->
      <div class="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-stone-200/70 dark:border-white/10">
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">12</div>
          <div class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Update hari ini</div>
        </div>
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">5</div>
          <div class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Anggota aktif</div>
        </div>
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-brand-500">0</div>
          <div class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Yang terlewat</div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .auth-grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    background-size: 160px 160px;
  }
</style>
