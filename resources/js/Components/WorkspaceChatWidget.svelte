<script lang="ts">
  import axios from 'axios';
  import { buildCSRFHeaders } from './helper';
  import { scale, fly } from 'svelte/transition';

  let { workspace_id, workspace_name = 'Workspace' }: {
    workspace_id: string;
    workspace_name?: string;
  } = $props();

  interface ChatUser {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  interface ChatMessage {
    id: string;
    workspace_id: string;
    user_id: string;
    message: string;
    created_at: number;
    user: ChatUser;
  }

  let isOpen = $state(false);
  let messages = $state<ChatMessage[]>([]);
  let inputText = $state('');
  let isLoading = $state(false);
  let isSending = $state(false);
  let hasLoaded = $state(false);
  let chatBodyEl = $state<HTMLElement | null>(null);
  let inputEl = $state<HTMLInputElement | null>(null);
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function scrollToBottom(behavior: ScrollBehavior = 'smooth') {
    if (chatBodyEl) {
      chatBodyEl.scrollTo({ top: chatBodyEl.scrollHeight, behavior });
    }
  }

  async function fetchMessages(silent = false) {
    if (!silent) isLoading = true;
    try {
      const res = await axios.get(`/workspaces/${workspace_id}/messages`);
      const fetched: ChatMessage[] = res.data?.data?.messages ?? [];

      // Merge: avoid duplicates, preserve order
      const existingIds = new Set(messages.map(m => m.id));
      const newOnes = fetched.filter(m => !existingIds.has(m.id));
      if (newOnes.length > 0) {
        messages = fetched;
        // Only auto-scroll if we were already near the bottom
        setTimeout(() => scrollToBottom('smooth'), 60);
      } else if (!hasLoaded) {
        messages = fetched;
      }
      hasLoaded = true;
    } catch {
      // Silent fail for polling
    } finally {
      if (!silent) isLoading = false;
    }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || isSending) return;

    isSending = true;
    inputText = '';

    try {
      const res = await axios.post(
        `/workspaces/${workspace_id}/messages`,
        { message: text },
        { headers: buildCSRFHeaders() }
      );
      const newMsg: ChatMessage = res.data?.data?.message;
      if (newMsg) {
        messages = [...messages, newMsg];
        setTimeout(() => scrollToBottom('smooth'), 40);
      }
    } catch {
      inputText = text; // restore on error
    } finally {
      isSending = false;
      inputEl?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(() => fetchMessages(true), 5000);
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    if (isOpen) {
      if (!hasLoaded) fetchMessages();
      startPolling();
      setTimeout(() => {
        scrollToBottom('instant');
        inputEl?.focus();
      }, 200);
    } else {
      stopPolling();
    }
  }

  // Clean up on unmount
  $effect(() => {
    return () => stopPolling();
  });

  function getInitials(user: ChatUser): string {
    if (user.name) return user.name.substring(0, 2).toUpperCase();
    return user.email.substring(0, 2).toUpperCase();
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) return 'Hari ini';
    if (d.toDateString() === yesterday.toDateString()) return 'Kemarin';
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // Group messages by date
  interface MessageGroup {
    dateLabel: string;
    messages: ChatMessage[];
  }

  let messageGroups = $derived(
    (() => {
      const groups: MessageGroup[] = [];
      let lastDate = '';

      for (const msg of messages) {
        const dateLabel = formatDate(msg.created_at);
        if (dateLabel !== lastDate) {
          groups.push({ dateLabel, messages: [msg] });
          lastDate = dateLabel;
        } else {
          groups[groups.length - 1].messages.push(msg);
        }
      }

      return groups;
    })()
  );

  // Avatar color palette for users without avatars
  const avatarColors = [
    'from-primary-400 to-primary-600',
    'from-accent-400 to-accent-600',
    'from-info-400 to-info-600',
    'from-emerald-400 to-emerald-600',
    'from-teal-400 to-teal-600',
    'from-warning-400 to-warning-600',
  ];

  function getUserColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatarColors[Math.abs(hash) % avatarColors.length];
  }
</script>

<div use:portal>
  {#if isOpen}
    <div
      transition:fly={{ y: 16, duration: 220 }}
      class="fixed bottom-[88px] right-6 w-[360px] h-[540px] flex flex-col bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-2xl dark:shadow-black/60 overflow-hidden z-[9990]"
    >
      <div class="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.06] bg-gradient-to-r from-primary-500/10 to-transparent dark:from-primary-500/[0.15] shrink-0">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-full bg-primary-500/20 dark:bg-primary-500/30 flex items-center justify-center shrink-0">
            <svg class="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{workspace_name}</p>
            <p class="text-[10px] text-slate-400 dark:text-slate-500">Workspace Chat</p>
          </div>
        </div>

        <button
          onclick={toggleChat}
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
          aria-label="Tutup chat"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div
        bind:this={chatBodyEl}
        class="flex-1 overflow-y-auto px-4 py-3 space-y-1 min-h-0 chat-scrollbar"
      >
        {#if isLoading}
          <div class="flex items-center justify-center py-12">
            <svg class="animate-spin w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else if messages.length === 0}
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <div class="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.05] flex items-center justify-center mb-3">
              <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">Belum ada pesan</p>
            <p class="text-xs text-slate-400 mt-1">Jadilah yang pertama memulai percakapan!</p>
          </div>
        {:else}
          {#each messageGroups as group}
            <div class="flex items-center gap-3 py-2">
              <div class="flex-1 h-px bg-slate-100 dark:bg-white/[0.06]"></div>
              <span class="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">{group.dateLabel}</span>
              <div class="flex-1 h-px bg-slate-100 dark:bg-white/[0.06]"></div>
            </div>

            {#each group.messages as msg, i (msg.id)}
              {@const prevMsg = i > 0 ? group.messages[i - 1] : null}
              {@const isSameUser = prevMsg?.user_id === msg.user_id}
              {@const showAvatar = !isSameUser}

              <div class="flex items-end gap-2 {isSameUser ? 'mt-0.5' : 'mt-2.5'}">
                <div class="w-7 shrink-0">
                  {#if showAvatar}
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br {getUserColor(msg.user_id)} flex items-center justify-center text-white text-[9px] font-bold shadow-sm overflow-hidden">
                      {#if msg.user.avatar}
                        <img src={msg.user.avatar} alt={msg.user.name || msg.user.email} class="w-full h-full object-cover">
                      {:else}
                        {getInitials(msg.user)}
                      {/if}
                    </div>
                  {/if}
                </div>

                <div class="flex-1 min-w-0">
                  {#if showAvatar}
                    <div class="flex items-baseline gap-1.5 mb-0.5">
                      <span class="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                        {msg.user.name || msg.user.email}
                      </span>
                      <span class="text-[9px] text-slate-400 dark:text-slate-600 shrink-0">{formatTime(msg.created_at)}</span>
                    </div>
                  {/if}
                  <div class="group relative flex items-center gap-1">
                    <div class="px-3 py-1.5 rounded-xl rounded-tl-sm bg-slate-100 dark:bg-white/[0.07] text-slate-800 dark:text-slate-200 text-[13px] leading-relaxed break-words max-w-full">
                      {msg.message}
                    </div>
                    {#if isSameUser}
                      <span class="opacity-0 group-hover:opacity-100 transition-opacity text-[9px] text-slate-400 shrink-0 ml-0.5">{formatTime(msg.created_at)}</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          {/each}
        {/if}
      </div>

      <div class="px-3 py-3 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/80 dark:bg-white/[0.02] shrink-0">
        <div class="flex items-center gap-2 bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary-500/40 focus-within:border-primary-400/60 transition-all">
          <input
            bind:this={inputEl}
            bind:value={inputText}
            onkeydown={handleKeydown}
            type="text"
            placeholder="Ketik pesan..."
            maxlength={2000}
            disabled={isSending}
            class="flex-1 bg-transparent text-[13px] text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none disabled:opacity-50 min-w-0"
          >
          <button
            onclick={sendMessage}
            disabled={!inputText.trim() || isSending}
            class="shrink-0 w-7 h-7 rounded-lg bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Kirim pesan"
          >
            {#if isSending}
              <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
            {:else}
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            {/if}
          </button>
        </div>
        <p class="text-[9px] text-slate-400 dark:text-slate-600 mt-1.5 text-center">Enter untuk kirim · pesan update otomatis tiap 5 detik</p>
      </div>
    </div>
  {/if}

  <button
    onclick={toggleChat}
    class="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400 text-white shadow-lg shadow-primary-500/30 dark:shadow-primary-500/20 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 z-[9989]"
    aria-label={isOpen ? 'Tutup chat' : 'Buka workspace chat'}
    title={isOpen ? 'Tutup chat' : `Chat ${workspace_name}`}
  >
    {#if isOpen}
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7" />
      </svg>
    {:else}
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    {/if}
  </button>
</div>

<style>
  .chat-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .chat-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .chat-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.10);
    border-radius: 10px;
  }
  :global(.dark) .chat-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
  }
  .chat-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.18);
  }
  :global(.dark) .chat-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }
</style>
