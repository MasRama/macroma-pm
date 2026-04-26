<script lang="ts">
  import axios from 'axios';
  import { buildCSRFHeaders, Toast } from './helper';
  import realtime, { type RealtimeIncoming } from './realtime';
  import { onDestroy } from 'svelte';
  import { page as inertiaPage } from '@inertiajs/svelte';

  let { unread_count = 0 }: { unread_count?: number } = $props();
  let localUnreadCount = $state(unread_count);
  $effect(() => { localUnreadCount = unread_count; });

  let isOpen = $state(false);
  let notifications = $state<any[]>([]);
  let isLoading = $state(false);
  let buttonRef = $state<HTMLButtonElement | null>(null);
  let unsubscribeRealtime: (() => void) | null = null;

  const currentUserId = $derived(($inertiaPage.props.user as any)?.id ?? '');

  function handleRealtimeNotification(msg: RealtimeIncoming) {
    if (msg.type !== 'notification.created') return;
    const incoming = msg.payload?.notification;
    if (!incoming) return;

    // Bump unread count + prepend to list (kept at 10).
    localUnreadCount += 1;
    notifications = [incoming, ...notifications].slice(0, 10);

    // Lightweight toast so the user notices even with the dropdown closed.
    const summary =
      incoming.data?.message ||
      (incoming.type === 'workspace_invitation'
        ? `Undangan workspace ${incoming.data?.workspace_name ?? ''}`.trim()
        : 'Notifikasi baru');
    Toast(summary, 'info');
  }

  $effect(() => {
    if (!currentUserId) return;
    unsubscribeRealtime?.();
    unsubscribeRealtime = realtime.subscribe(`user:${currentUserId}`, handleRealtimeNotification);
    return () => {
      unsubscribeRealtime?.();
      unsubscribeRealtime = null;
    };
  });

  onDestroy(() => {
    unsubscribeRealtime?.();
    unsubscribeRealtime = null;
  });

  // Portal action — moves element out of sidebar DOM into <body>
  function portal(node: HTMLElement) {
    document.body.appendChild(node);
    return {
      destroy() {
        node.remove();
      },
    };
  }

  function getDropdownStyle(): string {
    if (!buttonRef) return '';
    const rect = buttonRef.getBoundingClientRect();
    const dropdownWidth = 320;
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 8) {
      left = window.innerWidth - dropdownWidth - 8;
    }
    return `position:fixed; bottom:${window.innerHeight - rect.top + 8}px; left:${left}px; z-index:9999;`;
  }

  function toggleDropdown() {
    isOpen = !isOpen;
    if (isOpen) {
      fetchNotifications();
    }
  }

  async function fetchNotifications() {
    isLoading = true;
    try {
      const response = await axios.get('/notifications');
      const data = response.data?.data;
      notifications = (Array.isArray(data) ? data : data?.notifications ?? []).slice(0, 10);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      Toast('Gagal memuat notifikasi', 'error');
    } finally {
      isLoading = false;
    }
  }

  async function markAllRead() {
    try {
      await axios.post('/notifications/mark-all-read', {}, { headers: buildCSRFHeaders() });
      localUnreadCount = 0;
      notifications = notifications.map(n => ({ ...n, read_at: n.read_at ?? Date.now() }));
    } catch {
      Toast('Gagal menandai notifikasi', 'error');
    }
  }

  async function respondToInvitation(token: string, action: 'accept' | 'decline') {
    try {
      await axios.post(`/invitations/${token}/respond`, { action }, { headers: buildCSRFHeaders() });
      Toast(action === 'accept' ? 'Undangan diterima' : 'Undangan ditolak', 'success');
      await fetchNotifications();
      document.dispatchEvent(new CustomEvent('notification-read'));
    } catch (error) {
      console.error(`Failed to ${action} invitation:`, error);
      Toast('Terjadi kesalahan', 'error');
    }
  }

  $effect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!isOpen) return;
      const target = event.target as Node;
      const dropdown = document.getElementById('notif-dropdown-portal');
      if (
        buttonRef && !buttonRef.contains(target) &&
        dropdown && !dropdown.contains(target)
      ) {
        isOpen = false;
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<div class="relative">
  <button
    bind:this={buttonRef}
    onclick={toggleDropdown}
    class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors relative"
    aria-label="Notifications"
  >
    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
    
    {#if localUnreadCount > 0}
      <span class="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center translate-x-1/3 -translate-y-1/3">
        {localUnreadCount > 99 ? '99+' : localUnreadCount}
      </span>
    {/if}
  </button>

  {#if isOpen}
    <div
      use:portal
      id="notif-dropdown-portal"
      style={getDropdownStyle()}
      class="w-80 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.08] rounded-2xl shadow-xl dark:shadow-black/40 overflow-hidden flex flex-col max-h-[400px]"
    >
      <div class="p-3 border-b border-slate-100 dark:border-white/[0.05] flex items-center justify-between shrink-0">
        <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-sm">Notifikasi</h3>
        <button
          onclick={markAllRead}
          class="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
        >
          Tandai semua dibaca
        </button>
      </div>

      <div class="overflow-y-auto flex-1 custom-scrollbar">
        {#if isLoading}
          <div class="p-8 flex justify-center items-center">
            <svg class="animate-spin h-6 w-6 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        {:else if notifications.length === 0}
          <div class="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            Tidak ada notifikasi
          </div>
        {:else}
          {#each notifications as notification}
            <div class="p-3 hover:bg-slate-50 dark:hover:bg-white/[0.03] border-b border-slate-100 dark:border-white/[0.05] transition-colors {notification.read_at ? '' : 'bg-primary-50/50 dark:bg-primary-500/5'}">
              {#if notification.type === 'workspace_invitation'}
                <div class="text-sm text-slate-700 dark:text-slate-300 mb-2">
                  <span class="font-medium text-slate-900 dark:text-slate-100">{notification.data?.inviter_name || 'Seseorang'}</span>
                  mengundang Anda ke workspace
                  <span class="font-medium text-slate-900 dark:text-slate-100">{notification.data?.workspace_name || 'Workspace'}</span>
                </div>
                {#if !notification.read_at}
                  <div class="flex gap-2 mt-2">
                    <button 
                      onclick={() => respondToInvitation(notification.data?.token, 'accept')}
                      class="flex-1 flex justify-center items-center gap-1 text-xs px-2 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      Terima
                    </button>
                    <button 
                      onclick={() => respondToInvitation(notification.data?.token, 'decline')}
                      class="flex-1 flex justify-center items-center gap-1 text-xs px-2 py-1.5 bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-colors"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      Tolak
                    </button>
                  </div>
                {/if}
              {:else if notification.type === 'invitation_accepted'}
                <div class="text-sm text-slate-700 dark:text-slate-300">
                  <span class="font-medium text-slate-900 dark:text-slate-100">{notification.data?.user_name || 'Seseorang'}</span>
                  bergabung ke workspace
                  <span class="font-medium text-slate-900 dark:text-slate-100">{notification.data?.workspace_name || 'Workspace'}</span>
                </div>
              {:else}
                <div class="text-sm text-slate-700 dark:text-slate-300">
                  {notification.data?.message || 'Notifikasi baru'}
                </div>
              {/if}
              <div class="text-[10px] text-slate-400 mt-1.5">
                {new Date(notification.created_at).toLocaleDateString()}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  {/if}
</div>