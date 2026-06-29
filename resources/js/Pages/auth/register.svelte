<script lang="ts">
  import { inertia, router } from '@inertiajs/svelte'
  import { buildCSRFHeaders, password_generator, Toast } from '../../Components/helper';
  import { fly } from 'svelte/transition';
  import LogoMark from '../../Components/LogoMark.svelte';

  interface RegisterForm {
    email: string;
    password: string;
    name: string;
    phone: string;
    password_confirmation: string;
  }

  let form: RegisterForm = {
    email: '',
    password: '',
    name: '',
    phone: '',
    password_confirmation: '',
  }

  let { error }: { error?: string } = $props();

  $effect(() => {
    if (error) Toast(error, 'error');
  });

  function submitForm(): void {
    if (form.password != form.password_confirmation) {
      Toast("Password dan konfirmasi password harus sama", "error");
      return;
    }

    form.phone = form.phone.toString()
    router.post("/register", form as any, {
      headers: buildCSRFHeaders()
    })
  }

  function generatePassword(): void {
    const retVal = password_generator(10);
    form.password = retVal
    form.password_confirmation = retVal
  }
</script>

<!-- Vibe: landing page — stone neutral, emerald brand, gradient mesh, grain, glass -->
<div class="min-h-[100dvh] bg-stone-50 dark:bg-[#16130f] text-stone-800 dark:text-stone-100 font-display antialiased selection:bg-brand-200 selection:text-brand-900 overflow-x-hidden flex">

  <!-- Left: visual panel — editorial static release timeline (desktop only) -->
  <div class="hidden lg:flex w-1/2 relative overflow-hidden border-r border-stone-200/70 dark:border-white/10 bg-stone-100/50 dark:bg-[#1c1814]">
    <!-- Gradient mesh -->
    <div class="absolute inset-0 bg-[radial-gradient(50%_40%_at_70%_20%,rgba(22,167,102,0.16),transparent_60%),radial-gradient(45%_35%_at_25%_80%,rgba(13,148,136,0.12),transparent_60%)] dark:bg-[radial-gradient(50%_40%_at_70%_20%,rgba(22,167,102,0.20),transparent_60%),radial-gradient(45%_35%_at_25%_80%,rgba(13,148,136,0.14),transparent_60%)]" aria-hidden="true"></div>
    <!-- Grain -->
    <div class="auth-grain absolute inset-0 opacity-[0.35] dark:opacity-[0.25] mix-blend-soft-light pointer-events-none" aria-hidden="true"></div>

    <div class="relative z-10 w-full max-w-md mx-auto px-10 py-14 flex flex-col justify-center h-full">

      <!-- Section label -->
      <div class="flex items-center gap-2 mb-8">
        <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
        <span class="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500 dark:text-stone-400">Rilis · Q2 2026</span>
      </div>

      <!-- Release timeline — static, vertical -->
      <div class="relative pl-6 mb-10">
        <!-- Vertical line -->
        <div class="absolute left-2 top-1 bottom-1 w-px bg-stone-200 dark:bg-white/10"></div>

        <!-- v2.3 (current, accent) -->
        <div class="relative mb-5">
          <div class="absolute -left-[1.15rem] top-1 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-brand-100 dark:ring-brand-500/20"></div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-extrabold tracking-tight text-stone-900 dark:text-white">v2.3</span>
            <span class="rounded-full bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">Sekarang</span>
          </div>
          <div class="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-snug">Refactor auth service</div>
          <div class="mt-1 text-[11px] text-stone-400">3 task · 67% selesai</div>
          <div class="mt-2 h-1 rounded-full bg-stone-200 dark:bg-white/10 overflow-hidden max-w-[200px]">
            <div class="h-full w-2/3 bg-brand-500 rounded-full"></div>
          </div>
        </div>

        <!-- v2.2 (done) -->
        <div class="relative mb-5">
          <div class="absolute -left-[1.15rem] top-1 w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-white/20 ring-4 ring-stone-100 dark:ring-white/5"></div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-extrabold tracking-tight text-stone-700 dark:text-stone-300">v2.2</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Rilis
            </span>
          </div>
          <div class="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-snug">Payment integration</div>
          <div class="mt-1 text-[11px] text-stone-400">8 task · 12 Apr</div>
        </div>

        <!-- v2.1 (done) -->
        <div class="relative mb-5">
          <div class="absolute -left-[1.15rem] top-1 w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-white/20 ring-4 ring-stone-100 dark:ring-white/5"></div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-extrabold tracking-tight text-stone-700 dark:text-stone-300">v2.1</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Rilis
            </span>
          </div>
          <div class="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-snug">Dashboard redesign</div>
          <div class="mt-1 text-[11px] text-stone-400">5 task · 28 Mar</div>
        </div>

        <!-- v2.0 (done) -->
        <div class="relative">
          <div class="absolute -left-[1.15rem] top-1 w-2.5 h-2.5 rounded-full bg-stone-900 dark:bg-white/20 ring-4 ring-stone-100 dark:ring-white/5"></div>
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-xs font-extrabold tracking-tight text-stone-700 dark:text-stone-300">v2.0</span>
            <span class="inline-flex items-center gap-1 rounded-full bg-stone-100 dark:bg-white/5 text-stone-500 dark:text-stone-400 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
              <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Rilis
            </span>
          </div>
          <div class="text-sm font-semibold text-stone-700 dark:text-stone-200 leading-snug">MVP launch</div>
          <div class="mt-1 text-[11px] text-stone-400">14 task · 01 Mar</div>
        </div>
      </div>

      <!-- Headline -->
      <h2 class="text-[2.75rem] font-extrabold tracking-[-0.03em] leading-[0.98] text-stone-900 dark:text-white [text-wrap:balance]">
        Mulai bangun tim
        <span class="block mt-1 italic font-serif text-brand-500">dengan tenang.</span>
      </h2>
      <p class="mt-5 text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm">
        Setiap perpindahan kolom mencatat versi otomatis. Riwayat tetap rapi.
      </p>

      <!-- Metric strip -->
      <div class="mt-10 grid grid-cols-3 gap-4 pt-8 border-t border-stone-200/70 dark:border-white/10">
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">&lt;1m</div>
          <div class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Setup workspace</div>
        </div>
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-stone-900 dark:text-white">Auto</div>
          <div class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Versi &amp; log</div>
        </div>
        <div>
          <div class="text-2xl font-extrabold tracking-tight text-brand-500">0</div>
          <div class="mt-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">Kartu kredit</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right: form panel -->
  <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 relative z-10 overflow-y-auto">

    <!-- Logo -->
    <div class="flex justify-start lg:justify-end">
      <a href="/" use:inertia class="flex items-center gap-2.5 w-fit cursor-pointer">
        <div class="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center shadow-[0_4px_14px_-2px_rgba(22,167,102,0.45)]">
          <LogoMark class="w-5 h-5 text-white" />
        </div>
        <span class="font-bold tracking-tight text-stone-900 dark:text-white">Project Master</span>
      </a>
    </div>

    <!-- Form -->
    <div class="max-w-md w-full mx-auto my-10" in:fly={{ y: 24, duration: 700 }}>
      <div class="mb-9">
        <div class="inline-flex items-center gap-2 mb-6 rounded-full bg-white/70 dark:bg-white/5 ring-1 ring-stone-900/5 dark:ring-white/10 px-3.5 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-300">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
          Daftar gratis
        </div>
        <h1 class="text-4xl font-extrabold tracking-[-0.02em] leading-[1.05] text-stone-900 dark:text-white [text-wrap:balance]">
          Buat <span class="italic font-serif text-brand-500">akun baru.</span>
        </h1>
        <p class="mt-4 text-stone-500 dark:text-stone-400 leading-relaxed">
          Mulai kelola project tim dalam hitungan menit.
        </p>
      </div>

      <!-- Google (hidden for now) -->
      <!-- Divider (hidden while Google is hidden) -->
      <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
        <div class="space-y-1.5">
          <label for="name" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 ml-1">Nama lengkap</label>
          <input bind:value={form.name} required type="text" name="name" id="name"
            class="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 outline-none transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
            placeholder="Nama kamu">
        </div>

        <div class="space-y-1.5">
          <label for="email" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 ml-1">Email</label>
          <input bind:value={form.email} required type="text" name="email" id="email"
            class="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 outline-none transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500"
            placeholder="kamu@contoh.com">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-1.5">
            <label for="password" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 ml-1">Password</label>
            <input bind:value={form.password} required type="password" name="password" id="password"
              placeholder="••••••••"
              class="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 outline-none transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500">
          </div>
          <div class="space-y-1.5">
            <label for="confirm-password" class="block text-sm font-semibold text-stone-700 dark:text-stone-300 ml-1">Konfirmasi</label>
            <input bind:value={form.password_confirmation} type="password" name="confirm-password" id="confirm-password"
              placeholder="••••••••"
              class="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-stone-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400/50 outline-none transition-all text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-stone-500">
          </div>
        </div>

        <div class="flex justify-end pt-1">
          <button type="button" onclick={generatePassword} class="text-[11px] font-mono text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors flex items-center gap-1.5 bg-brand-50 dark:bg-brand-500/10 px-2.5 py-1 rounded-md ring-1 ring-brand-200 dark:ring-brand-500/20 cursor-pointer">
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H12" stroke-linecap="round" stroke-linejoin="round"/></svg>
            GENERATE SECURE
          </button>
        </div>

        <button type="submit"
          class="group w-full flex items-center justify-center gap-2.5 mt-2 pl-7 pr-4 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-semibold shadow-[0_12px_30px_-10px_rgba(22,167,102,0.55)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] cursor-pointer">
          Buat akun
          <span class="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-1">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </button>

        <p class="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
          Sudah punya akun? <a href="/login" use:inertia class="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer">Masuk</a>
        </p>
      </form>
    </div>

    <!-- Footer -->
    <div class="text-xs text-stone-400 dark:text-stone-500 text-center lg:text-right">
      &copy; {new Date().getFullYear()} Project Master
    </div>
  </div>
</div>

<style>
  .auth-grain {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
    background-size: 160px 160px;
  }
</style>
