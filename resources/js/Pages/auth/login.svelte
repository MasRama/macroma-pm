<script lang="ts">
  import { onMount } from 'svelte';
  import { inertia, router } from '@inertiajs/svelte'
  import { buildCSRFHeaders, Toast } from '../../Components/helper';
  import NaraIcon from '../../Components/NaraIcon.svelte';
  import { fade, fly } from 'svelte/transition';

  onMount(() => {
      // Logic for onMount if needed in future
  });

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

<div class="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans selection:bg-primary-500/30">
  
  <!-- Left Panel: Form -->
  <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 z-10 relative">
      <!-- Logo Header -->
      <div>
          <a href="/" use:inertia class="text-2xl font-bold tracking-tighter flex items-center gap-2 text-slate-900 dark:text-white hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
              <NaraIcon />
              <span>PM Macroma</span>
          </a>
      </div>

      <!-- Form Container -->
      <div class="max-w-md w-full mx-auto" in:fly={{ y: 20, duration: 600 }}>
          <div class="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
              <h1 class="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Welcome Back</h1>
              <p class="text-slate-500 dark:text-slate-400 mb-8 text-sm">Enter your credentials to access your workspace.</p>

              <!-- Google Login Button -->
              <div class="flex flex-col space-y-4 mb-6">
                  <a href="/google/redirect" 
                     class="group relative w-full flex items-center justify-center px-6 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300">
                      <svg class="h-5 w-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span class="font-medium text-slate-700 dark:text-slate-200">Continue with Google</span>
                  </a>
                  
                  <div class="relative py-2">
                      <div class="absolute inset-0 flex items-center">
                          <div class="w-full border-t border-slate-200 dark:border-white/10"></div>
                      </div>
                      <div class="relative flex justify-center text-xs uppercase tracking-widest">
                          <span class="bg-white dark:bg-[#020617] px-4 text-slate-500">Or email</span>
                      </div>
                  </div>
              </div>

              <!-- Login Form -->
              <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
                  <div class="space-y-1.5">
                      <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email</label>
                      <input bind:value={form.email} required type="text" name="email" id="email" 
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                          placeholder="you@example.com" >
                  </div>
                  
                  <div class="space-y-1.5">
                      <div class="flex items-center justify-between ml-1">
                          <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                          <a href="/forgot-password" use:inertia class="text-xs font-medium text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">Forgot password?</a>
                      </div>
                      <input bind:value={form.password} required type="password" name="password" id="password" 
                          placeholder="••••••••" 
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-400/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" >
                  </div>  

                  <button type="submit" 
                      class="w-full relative overflow-hidden rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-base py-3 transition-all active:scale-[0.98] mt-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                      Sign In
                  </button>

                  <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                      Don't have an account? <a href="/register" use:inertia class="font-semibold text-primary-500 dark:text-primary-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors">Create one</a>
                  </p>
              </form>
          </div>
      </div>

      <!-- Footer -->
      <div class="text-xs text-slate-400 dark:text-slate-500 text-center lg:text-left">
          © 2026 PM Macroma
      </div>
  </div>

  <!-- Right Panel: Visual -->
  <div class="hidden lg:flex w-1/2 bg-slate-100 dark:bg-[#020617] relative overflow-hidden items-center justify-center border-l border-slate-200 dark:border-white/5">
      <!-- Deep dark grain overlay -->
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay"></div>
      
      <!-- Ambient Aurora Blobs -->
      <div class="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[100px] animate-pulse opacity-60 dark:opacity-100" style="animation-duration: 8s;"></div>
      <div class="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse opacity-60 dark:opacity-100" style="animation-duration: 12s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-info-500/5 rounded-full blur-[150px] opacity-60 dark:opacity-100"></div>

      <div class="relative z-10 w-full max-w-lg p-12 flex flex-col items-center text-center">
          <!-- Glassmorphism Mock UI Card -->
          <div class="w-full bg-white/90 dark:bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-out mb-12">
              <div class="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-white/5 pb-4">
                  <div class="flex gap-2">
                      <div class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                      <div class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                      <div class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  </div>
                  <div class="h-2 w-24 bg-slate-200 dark:bg-white/10 rounded-full"></div>
              </div>
              
              <div class="space-y-4">
                  <!-- Mock Task Item -->
                  <div class="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                      <div class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/20 flex items-center justify-center border border-primary-100 dark:border-primary-500/30">
                          <svg class="w-4 h-4 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      <div class="flex-1 space-y-2">
                          <div class="h-2.5 w-3/4 bg-slate-200 dark:bg-slate-300 rounded-full"></div>
                          <div class="h-2 w-1/2 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      </div>
                  </div>
                  
                  <!-- Mock Task Item -->
                  <div class="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 opacity-70">
                      <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center border border-purple-100 dark:border-purple-500/30">
                          <div class="w-2 h-2 rounded-full bg-purple-400"></div>
                      </div>
                      <div class="flex-1 space-y-2">
                          <div class="h-2.5 w-5/6 bg-slate-200 dark:bg-slate-300 rounded-full"></div>
                          <div class="h-2 w-1/3 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
                      </div>
                  </div>
              </div>
          </div>

          <h2 class="text-5xl font-bold tracking-tighter text-slate-900 dark:text-white mb-4 leading-tight">
            SHIP FASTER.<br/> 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-info-500 to-purple-500 dark:from-primary-400 dark:via-info-400 dark:to-purple-400">TRACK SMARTER.</span>
          </h2>
          <p class="text-lg text-slate-500 dark:text-slate-400 font-light max-w-sm">
            The project management platform designed for velocity and precision.
          </p>
      </div>
  </div>
</div>