<script lang="ts">
    import { inertia } from "@inertiajs/svelte";
    import NaraIcon from "../../Components/NaraIcon.svelte";
    import axios from "axios";
    import { api, Toast } from "../../Components/helper";
    import { fly } from 'svelte/transition';

    interface ForgotPasswordForm {
        email: string;
        phone: string;
    }

    let form: ForgotPasswordForm = {
        email: "",
        phone: "",
    };

    let success: boolean = $state(false);
    let { error }: { error?: string } = $props();

    $effect(() => {
        if (error) Toast(error, 'error');
    });

    async function submitForm(): Promise<void> {
        const result = await api(() => axios.post("/forgot-password", form));
        
        if (result.success) {
            success = true;
            form.email = "";
            form.phone = "";
        }
    }
</script>

<div class="min-h-screen bg-[#020617] text-slate-100 flex overflow-hidden font-sans selection:bg-purple-500/30">
  
  <!-- Left Panel: Form -->
  <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 z-10 relative">
      <!-- Logo Header -->
      <div>
          <a href="/" use:inertia class="text-2xl font-bold tracking-tighter flex items-center gap-2 text-white hover:text-purple-400 transition-colors">
              <NaraIcon />
              <span>PM Macroma</span>
          </a>
      </div>

      <!-- Form Container -->
      <div class="max-w-md w-full mx-auto" in:fly={{ y: 20, duration: 600 }}>
          <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <div class="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 mb-6">
                  <svg class="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
              </div>
              
              <h1 class="text-3xl font-bold tracking-tight mb-2 text-white">Reset Password</h1>
              <p class="text-slate-400 mb-8 text-sm">Enter your email and we'll send you a recovery link.</p>

              {#if success}
                  <div class="p-4 mb-6 text-sm text-purple-200 rounded-xl bg-purple-900/30 border border-purple-500/30 backdrop-blur-md flex items-start gap-3" role="alert">
                      <svg class="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <div>
                          <span class="font-semibold block mb-1">Recovery link sent!</span>
                          Please check your email or phone for the reset instructions.
                      </div>
                  </div>
              {/if}

              <form class="space-y-5" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
                  <div class="space-y-1.5">
                      <label for="email" class="block text-sm font-medium text-slate-300 ml-1">Email or Phone Number</label>
                      <input bind:value={form.email} required type="text" name="email" id="email" 
                          class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 outline-none transition-all text-white placeholder:text-slate-500" 
                          placeholder="you@example.com or 08xxxxxxxxxx" >
                  </div>

                  <button type="submit" 
                      class="w-full relative overflow-hidden rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold text-base py-3 transition-all active:scale-[0.98] mt-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                      Send Recovery Link
                  </button>

                  <p class="text-center text-sm text-slate-400 mt-6">
                      Remember your password? <a href="/login" use:inertia class="font-semibold text-purple-400 hover:text-purple-300 transition-colors">Sign in</a>
                  </p>
              </form>
          </div>
      </div>

      <!-- Footer -->
      <div class="text-xs text-slate-500 text-center lg:text-left">
          © 2026 PM Macroma
      </div>
  </div>

  <!-- Right Panel: Visual -->
  <div class="hidden lg:flex w-1/2 bg-[#020617] relative overflow-hidden items-center justify-center border-l border-white/5">
      <!-- Deep dark grain overlay -->
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      <!-- Ambient Aurora Blobs -->
      <div class="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse" style="animation-duration: 10s;"></div>
      <div class="absolute bottom-1/3 left-1/3 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] animate-pulse" style="animation-duration: 8s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-info-500/5 rounded-full blur-[130px]"></div>

      <div class="relative z-10 w-full max-w-lg p-12 flex flex-col items-center text-center">
          <!-- Glassmorphism Secure Icon UI -->
          <div class="w-full max-w-xs mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-700 ease-out mb-12 flex flex-col items-center justify-center">
             <div class="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center border-4 border-purple-500/30 mb-6 relative">
                 <div class="absolute inset-0 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" style="animation-duration: 3s;"></div>
                 <svg class="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
             </div>
             <div class="h-2 w-32 bg-slate-300 rounded-full mb-3"></div>
             <div class="h-1.5 w-24 bg-slate-600 rounded-full"></div>
          </div>

          <h2 class="text-5xl font-bold tracking-tighter text-white mb-4 leading-tight">
            SECURE.<br/> 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-info-400 to-primary-400">RELIABLE.</span>
          </h2>
          <p class="text-lg text-slate-400 font-light max-w-sm">
            Your data is protected with enterprise-grade security protocols.
          </p>
      </div>
  </div>
</div>