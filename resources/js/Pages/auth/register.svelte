<script lang="ts">
  import { onMount } from 'svelte';
  import { inertia, router } from '@inertiajs/svelte'
  import { buildCSRFHeaders, password_generator, Toast } from '../../Components/helper';
  import NaraIcon from '../../Components/NaraIcon.svelte';
  import { fade, fly } from 'svelte/transition';

  onMount(() => {
      // Logic for onMount if needed in future
  });

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

<div class="min-h-screen bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 flex overflow-hidden font-sans selection:bg-info-500/30">
  
  <!-- Right Panel: Visual (Order 1 on Desktop) -->
  <div class="hidden lg:flex w-1/2 bg-slate-100 dark:bg-[#020617] relative overflow-hidden items-center justify-center border-r border-slate-200 dark:border-white/5 order-1">
      <!-- Deep dark grain overlay -->
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 dark:opacity-20 mix-blend-overlay"></div>
      
      <!-- Ambient Aurora Blobs -->
      <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-info-500/20 rounded-full blur-[100px] animate-pulse opacity-60 dark:opacity-100" style="animation-duration: 9s;"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] animate-pulse opacity-60 dark:opacity-100" style="animation-duration: 11s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/5 rounded-full blur-[150px] opacity-60 dark:opacity-100"></div>

      <div class="relative z-10 w-full max-w-lg p-12 flex flex-col items-center text-center">
          <!-- Glassmorphism Terminal Mock UI -->
          <div class="w-full bg-white/90 dark:bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform rotate-2 hover:rotate-0 transition-transform duration-700 ease-out mb-12 text-left font-mono text-sm">
              <div class="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/5 pb-4">
                  <div class="flex gap-2">
                      <div class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                      <div class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                      <div class="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  </div>
                  <div class="text-xs text-slate-400 dark:text-slate-500">setup.sh</div>
              </div>
              
              <div class="space-y-3 text-slate-700 dark:text-slate-300">
                  <div class="flex gap-2">
                      <span class="text-info-500 dark:text-info-400">~</span>
                      <span class="text-primary-500 dark:text-primary-400">$</span>
                      <span>npx create-macroma-workspace</span>
                  </div>
                  <div class="text-slate-500">Initializing project structure...</div>
                  <div class="flex gap-2">
                      <span class="text-purple-500 dark:text-purple-400">→</span>
                      <span>Configuring permissions and roles</span>
                  </div>
                  <div class="flex gap-2">
                      <span class="text-purple-500 dark:text-purple-400">→</span>
                      <span>Setting up real-time sync</span>
                  </div>
                  <div class="flex gap-2 mt-2">
                      <span class="text-primary-500 dark:text-primary-400">✓</span>
                      <span class="text-slate-900 dark:text-white font-medium">Workspace ready in 0.8s</span>
                  </div>
              </div>
          </div>

          <h2 class="text-5xl font-bold tracking-tighter text-slate-900 dark:text-white mb-4 leading-tight">
            BUILD TEAMS.<br/> 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-info-500 via-purple-500 to-primary-500 dark:from-info-400 dark:via-purple-400 dark:to-primary-400">NOT BOTTLENECKS.</span>
          </h2>
          <p class="text-lg text-slate-500 dark:text-slate-400 font-light max-w-sm">
            Join thousands of teams shipping better products with Macroma.
          </p>
      </div>
  </div>

  <!-- Left Panel: Form (Order 2 on Desktop) -->
  <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 z-10 relative order-2 overflow-y-auto">
      <!-- Logo Header -->
      <div class="flex justify-start lg:justify-end">
          <a href="/" use:inertia class="text-2xl font-bold tracking-tighter flex items-center gap-2 text-slate-900 dark:text-white hover:text-info-500 dark:hover:text-info-400 transition-colors">
              <NaraIcon />
              <span>PM Macroma</span>
          </a>
      </div>

      <!-- Form Container -->
      <div class="max-w-md w-full mx-auto my-8 lg:my-0" in:fly={{ y: 20, duration: 600 }}>
          <div class="bg-white/90 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl">
              <h1 class="text-3xl font-bold tracking-tight mb-2 text-slate-900 dark:text-white">Create Account</h1>
              <p class="text-slate-500 dark:text-slate-400 mb-8 text-sm">Start building your legacy today.</p>

              <!-- Google Signup Button -->
              <div class="flex flex-col space-y-4 mb-6">
                  <a href="/google/redirect" 
                     class="group relative w-full flex items-center justify-center px-6 py-3 border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-300">
                      <svg class="h-5 w-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      <span class="font-medium text-slate-700 dark:text-slate-200">Sign up with Google</span>
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

              <!-- Register Form -->
              <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
                  <div class="space-y-1.5">
                      <label for="name" class="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Full Name</label>
                      <input bind:value={form.name} required type="text" name="name" id="name" 
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-info-500/50 focus:border-info-400/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                          placeholder="Your Name" >
                  </div>

                  <div class="space-y-1.5">
                      <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Email</label>
                      <input bind:value={form.email} required type="text" name="email" id="email" 
                          class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-info-500/50 focus:border-info-400/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                          placeholder="you@example.com" >
                  </div> 

                  <div class="grid grid-cols-2 gap-4">
                      <div class="space-y-1.5">
                          <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Password</label>
                          <input bind:value={form.password} required type="password" name="password" id="password" 
                              placeholder="••••••••" 
                              class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-info-500/50 focus:border-info-400/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" >
                      </div>
                      <div class="space-y-1.5">
                          <label for="confirm-password" class="block text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">Confirm</label>
                          <input bind:value={form.password_confirmation} type="password" name="confirm-password" id="confirm-password" 
                              placeholder="••••••••" 
                              class="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-info-500/50 focus:border-info-400/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500" >
                      </div>
                  </div>

                  <div class="flex justify-end pt-1">
                    <button type="button" onclick={generatePassword} class="text-[11px] font-mono text-info-600 dark:text-info-400 hover:text-info-500 dark:hover:text-info-300 transition-colors flex items-center gap-1.5 bg-info-50 dark:bg-info-500/10 px-2 py-1 rounded-md border border-info-200 dark:border-info-500/20">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        GENERATE SECURE
                    </button>
                  </div>
               
                  <button type="submit" 
                      class="w-full relative overflow-hidden rounded-xl bg-info-500 hover:bg-info-600 text-white font-semibold text-base py-3 transition-all active:scale-[0.98] mt-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                      Create Account
                  </button>

                  <p class="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                      Already have an account? <a href="/login" use:inertia class="font-semibold text-info-500 dark:text-info-400 hover:text-info-600 dark:hover:text-info-300 transition-colors">Sign in</a>
                  </p>
              </form>
          </div>
      </div>

      <!-- Footer -->
      <div class="text-xs text-slate-400 dark:text-slate-500 text-center lg:text-right">
          © 2026 PM Macroma
      </div>
  </div>
</div>