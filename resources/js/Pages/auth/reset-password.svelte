<script lang="ts">
  import { inertia, router } from '@inertiajs/svelte'
  import NaraIcon from '../../Components/NaraIcon.svelte';
  import { buildCSRFHeaders, password_generator, Toast } from '../../Components/helper';
  import { fly } from 'svelte/transition';

  interface ResetPasswordForm {
    password: string;
    password_confirmation: string;
  }

  let { id, error }: { id: string, error?: string } = $props();

  $effect(() => {
    if (error) Toast(error, 'error');
  });

  let form: ResetPasswordForm = $state({
    password: '',
    password_confirmation: ''
  })
 
  function generatePassword(): void { 
    const retVal = password_generator(10); 
    form.password = retVal
    form.password_confirmation = retVal
  }

  function submitForm(): void {
    if (form.password != form.password_confirmation) {
      Toast("Password dan konfirmasi password harus sama", "error")
      return;
    }

    router.post(`/reset-password`, { ...form, id } as any, {
      headers: buildCSRFHeaders()
    })
  }
</script>

<div class="min-h-screen bg-[#020617] text-slate-100 flex overflow-hidden font-sans selection:bg-info-500/30">
  
  <!-- Right Panel: Visual (Order 1 on Desktop) -->
  <div class="hidden lg:flex w-1/2 bg-[#020617] relative overflow-hidden items-center justify-center border-r border-white/5 order-1">
      <!-- Deep dark grain overlay -->
      <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      
      <!-- Ambient Aurora Blobs -->
      <div class="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-info-500/20 rounded-full blur-[100px] animate-pulse" style="animation-duration: 9s;"></div>
      <div class="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style="animation-duration: 11s;"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[150px]"></div>

      <div class="relative z-10 w-full max-w-lg p-12 flex flex-col items-center text-center">
          <!-- Glassmorphism Password Reset UI -->
          <div class="w-full max-w-xs mx-auto bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transform -rotate-2 hover:rotate-0 transition-transform duration-700 ease-out mb-12 relative overflow-hidden">
             <!-- Animated scanning line -->
             <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-info-400 to-transparent opacity-50 animate-bounce" style="animation-duration: 3s;"></div>
             
             <div class="w-20 h-20 mx-auto rounded-2xl bg-info-500/20 flex items-center justify-center border border-info-500/30 mb-8">
                 <svg class="w-10 h-10 text-info-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                 </svg>
             </div>
             <div class="flex items-center justify-center gap-2 mb-4">
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-slate-600"></div>
                 <div class="w-3 h-3 rounded-full bg-info-400 animate-pulse"></div>
             </div>
             <div class="h-2 w-32 mx-auto bg-slate-400/50 rounded-full"></div>
          </div>

          <h2 class="text-5xl font-bold tracking-tighter text-white mb-4 leading-tight">
            RESTORE.<br/> 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-info-400 via-primary-400 to-purple-400">RECONNECT.</span>
          </h2>
          <p class="text-lg text-slate-400 font-light max-w-sm">
            Set your new credentials and get back to shipping.
          </p>
      </div>
  </div>

  <!-- Left Panel: Form (Order 2 on Desktop) -->
  <div class="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 z-10 relative order-2 overflow-y-auto">
      <!-- Logo Header -->
      <div class="flex justify-start lg:justify-end">
          <a href="/" use:inertia class="text-2xl font-bold tracking-tighter flex items-center gap-2 text-white hover:text-info-400 transition-colors">
              <NaraIcon />
              <span>PM Macroma</span>
          </a>
      </div>

      <!-- Form Container -->
      <div class="max-w-md w-full mx-auto my-8 lg:my-0" in:fly={{ y: 20, duration: 600 }}>
          <div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              <h1 class="text-3xl font-bold tracking-tight mb-2 text-white">Create New Password</h1>
              <p class="text-slate-400 mb-8 text-sm">Please choose a strong password for your account.</p>

              <!-- Reset Form -->
              <form class="space-y-4" onsubmit={(e) => { e.preventDefault(); submitForm(); }}>
                  <div class="space-y-1.5">
                      <label for="password" class="block text-sm font-medium text-slate-300 ml-1">New Password</label>
                      <input bind:value={form.password} required type="password" name="password" id="password" 
                          placeholder="••••••••" 
                          class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-info-500/50 focus:border-info-400/50 outline-none transition-all text-white placeholder:text-slate-500" >
                  </div>
                  
                  <div class="space-y-1.5">
                      <label for="confirm-password" class="block text-sm font-medium text-slate-300 ml-1">Confirm Password</label>
                      <input bind:value={form.password_confirmation} required type="password" name="confirm-password" id="confirm-password" 
                          placeholder="••••••••" 
                          class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-info-500/50 focus:border-info-400/50 outline-none transition-all text-white placeholder:text-slate-500" >
                  </div>

                  <div class="flex justify-end pt-1">
                    <button type="button" onclick={generatePassword} class="text-[11px] font-mono text-info-400 hover:text-info-300 transition-colors flex items-center gap-1.5 bg-info-500/10 px-2 py-1 rounded-md border border-info-500/20">
                        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19H12" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        GENERATE SECURE
                    </button>
                  </div>
               
                  <button type="submit" 
                      class="w-full relative overflow-hidden rounded-xl bg-info-500 hover:bg-info-600 text-white font-semibold text-base py-3 transition-all active:scale-[0.98] mt-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                      Reset Password
                  </button>

                  <p class="text-center text-sm text-slate-400 mt-6">
                      Remember your password? <a href="/login" use:inertia class="font-semibold text-info-400 hover:text-info-300 transition-colors">Sign in</a>
                  </p>
              </form>
          </div>
      </div>

      <!-- Footer -->
      <div class="text-xs text-slate-500 text-center lg:text-right">
          © 2026 PM Macroma
      </div>
  </div>
</div>