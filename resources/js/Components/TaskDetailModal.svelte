<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { buildCSRFHeaders, Toast, api } from './helper';
  import axios from 'axios';

  interface TaskRecord {
    id: string;
    title: string;
    description: string | null;
    priority: 'low' | 'medium' | 'high';
    assignee_id: string | null;
    column_id: string;
    version_major: number;
    version_minor: number;
    version_patch: number;
    created_at: number;
  }

  interface UserRecord {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  }

  interface CommentRecord {
    id: string;
    task_id: string;
    user_id: string | null;
    content: string;
    created_at: number;
    updated_at: number;
    user: { id: string | null; name: string | null; email: string | null; avatar: string | null } | null;
  }

  interface LogRecord {
    id: string;
    task_id: string;
    version: string;
    column_from: string | null;
    column_to: string;
    note: string;
    created_by: string | null;
    created_at: number;
    user?: { id: string; name: string | null; email: string; avatar: string | null } | null;
  }

  let { task, assignee, currentUser, isOwner = false, onClose, onDeleted }: {
    task: TaskRecord;
    assignee?: UserRecord;
    currentUser?: UserRecord;
    isOwner?: boolean;
    onClose: () => void;
    onDeleted: (taskId: string) => void;
  } = $props();

  type Tab = 'detail' | 'comments' | 'history';
  let activeTab = $state<Tab>('detail');

  let isDeleting = $state(false);

  // Comments state
  let comments = $state<CommentRecord[]>([]);
  let commentsLoaded = $state(false);
  let commentsLoading = $state(false);
  let newComment = $state('');
  let isPostingComment = $state(false);
  let deletingCommentId = $state<string | null>(null);

  // Logs state
  let logs = $state<LogRecord[]>([]);
  let logsLoaded = $state(false);
  let logsLoading = $state(false);

  const priorityLabel = $derived(
    task.priority === 'high' ? 'High' :
    task.priority === 'medium' ? 'Medium' : 'Low'
  );

  const priorityClass = $derived(
    task.priority === 'high' ? 'bg-red-500/15 text-red-500 border-red-500/20' :
    task.priority === 'medium' ? 'bg-yellow-500/15 text-yellow-500 border-yellow-500/20' :
    'bg-green-500/15 text-green-500 border-green-500/20'
  );

  const columnLabel: Record<string, string> = {
    backlog: 'Backlog',
    ongoing: 'On Going',
    revisi: 'Revisi',
    done: 'Done',
  };

  const versionString = $derived(
    `${task.version_major}.${task.version_minor}.${task.version_patch}`
  );

  async function handleDelete() {
    if (!confirm(`Yakin ingin menghapus task "${task.title}"?`)) return;
    isDeleting = true;
    const result = await api(() => axios.delete(`/tasks/${task.id}`, { headers: buildCSRFHeaders() }));
    isDeleting = false;
    if (result.success) {
      onDeleted(task.id);
    }
  }

  async function loadComments() {
    if (commentsLoaded || commentsLoading) return;
    commentsLoading = true;
    try {
      const res = await fetch(`/tasks/${task.id}/comments`);
      const data = await res.json();
      comments = data?.data?.comments ?? [];
      commentsLoaded = true;
    } catch {
      comments = [];
    } finally {
      commentsLoading = false;
    }
  }

  async function loadLogs() {
    if (logsLoaded || logsLoading) return;
    logsLoading = true;
    try {
      const res = await fetch(`/tasks/${task.id}/logs`);
      const data = await res.json();
      logs = data?.data?.logs ?? [];
      logsLoaded = true;
    } catch {
      logs = [];
    } finally {
      logsLoading = false;
    }
  }

  function selectTab(tab: Tab) {
    activeTab = tab;
    if (tab === 'comments') loadComments();
    else if (tab === 'history') loadLogs();
  }

  async function postComment() {
    const content = newComment.trim();
    if (!content || isPostingComment) return;
    isPostingComment = true;
    try {
      const res = await fetch(`/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildCSRFHeaders() },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (data.success && data.data?.comment) {
        comments = [...comments, data.data.comment];
        newComment = '';
      } else {
        Toast(data.message || 'Gagal menambah komentar', 'error');
      }
    } catch {
      Toast('Gagal menambah komentar', 'error');
    } finally {
      isPostingComment = false;
    }
  }

  async function deleteComment(comment: CommentRecord) {
    if (!confirm('Hapus komentar ini?')) return;
    deletingCommentId = comment.id;
    try {
      const res = await fetch(`/tasks/${task.id}/comments/${comment.id}`, {
        method: 'DELETE',
        headers: buildCSRFHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        comments = comments.filter((c) => c.id !== comment.id);
      } else {
        Toast(data.message || 'Gagal menghapus komentar', 'error');
      }
    } catch {
      Toast('Gagal menghapus komentar', 'error');
    } finally {
      deletingCommentId = null;
    }
  }

  function canDeleteComment(comment: CommentRecord): boolean {
    if (isOwner) return true;
    if (!currentUser || !comment.user_id) return false;
    return comment.user_id === currentUser.id;
  }

  function formatDateTime(ts: number): string {
    return new Date(ts).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function userInitial(u: { name: string | null; email: string | null } | null | undefined): string {
    if (!u) return '?';
    const name = u.name || u.email || '?';
    return (name[0] || '?').toUpperCase();
  }

  function userLabel(u: { name: string | null; email: string | null } | null | undefined): string {
    if (!u) return 'Unknown';
    return u.name || u.email || 'Unknown';
  }
</script>

<div
  class="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    data-testid="task-detail-modal"
    class="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-white/[0.06] flex items-start justify-between gap-3 shrink-0">
      <div class="flex-1 min-w-0">
        <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">v{versionString}</p>
        <h2 class="text-base font-semibold text-slate-900 dark:text-white leading-snug">{task.title}</h2>
      </div>
      <button
        onclick={onClose}
        class="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="px-6 pt-3 border-b border-slate-100 dark:border-white/[0.06] shrink-0">
      <div class="flex items-center gap-1" role="tablist">
        {#each [{ id: 'detail', label: 'Detail' }, { id: 'comments', label: 'Comments' }, { id: 'history', label: 'Version History' }] as tab}
          <button
            role="tab"
            aria-selected={activeTab === tab.id}
            data-testid="task-detail-tab-{tab.id}"
            onclick={() => selectTab(tab.id as Tab)}
            class="px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px {activeTab === tab.id ? 'text-primary-600 dark:text-primary-400 border-primary-500 dark:border-primary-400' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-200'}"
          >
            {tab.label}
            {#if tab.id === 'comments' && commentsLoaded}
              <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400">{comments.length}</span>
            {:else if tab.id === 'history' && logsLoaded}
              <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400">{logs.length}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <div class="px-6 py-4 overflow-y-auto flex-1 min-h-[200px]">
      {#if activeTab === 'detail'}
        <div class="space-y-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border {priorityClass}">
              {priorityLabel}
            </span>
            <span class="text-[10px] font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
              {columnLabel[task.column_id] ?? task.column_id}
            </span>
            {#if assignee}
              <div class="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <div class="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold overflow-hidden">
                  {#if assignee.avatar}
                    <img src={assignee.avatar} alt={assignee.name || assignee.email} class="w-full h-full object-cover" />
                  {:else}
                    {((assignee.name || assignee.email)[0] || '').toUpperCase()}
                  {/if}
                </div>
                <span>{assignee.name || assignee.email}</span>
              </div>
            {/if}
          </div>

          <div>
            <p class="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mb-1.5">Deskripsi</p>
            {#if task.description}
              <p class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            {:else}
              <p class="text-sm text-slate-400 dark:text-slate-500 italic">Tidak ada deskripsi</p>
            {/if}
          </div>

          <p class="text-[11px] text-slate-400 dark:text-slate-500">
            Dibuat {new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      {:else if activeTab === 'comments'}
        <div data-testid="task-detail-comments" class="flex flex-col gap-3">
          {#if commentsLoading}
            <div class="text-xs text-slate-500 animate-pulse">Loading...</div>
          {:else if comments.length === 0}
            <div class="text-xs text-slate-500 dark:text-slate-400 italic">Belum ada komentar.</div>
          {:else}
            {#each comments as comment (comment.id)}
              <div class="flex gap-2.5 group">
                <div class="shrink-0 w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200 overflow-hidden">
                  {#if comment.user?.avatar}
                    <img src={comment.user.avatar} alt={userLabel(comment.user)} class="w-full h-full object-cover" />
                  {:else}
                    {userInitial(comment.user)}
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{userLabel(comment.user)}</span>
                    <span class="text-[10px] text-slate-400 dark:text-slate-500">{formatDateTime(comment.created_at)}</span>
                    {#if canDeleteComment(comment)}
                      <button
                        onclick={() => deleteComment(comment)}
                        disabled={deletingCommentId === comment.id}
                        class="ml-auto text-[10px] text-slate-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                        title="Hapus komentar"
                      >
                        {deletingCommentId === comment.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    {/if}
                  </div>
                  <p class="text-sm text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {:else if activeTab === 'history'}
        <div data-testid="task-detail-history" class="flex flex-col gap-2.5">
          {#if logsLoading}
            <div class="text-xs text-slate-500 animate-pulse">Loading...</div>
          {:else if logs.length === 0}
            <div class="text-xs text-slate-500 dark:text-slate-400 italic">Tidak ada log versi.</div>
          {:else}
            {#each logs as log (log.id)}
              <div class="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] p-3 rounded-lg">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-[10px] bg-slate-200 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded">{log.version}</span>
                  <span class="text-xs text-slate-600 dark:text-slate-300">
                    {log.column_from ? (columnLabel[log.column_from] ?? log.column_from) : 'Created'} &rarr; {columnLabel[log.column_to] ?? log.column_to}
                  </span>
                </div>
                {#if log.note}
                  <p class="text-xs text-slate-600 dark:text-slate-400 mt-1.5 whitespace-pre-wrap break-words">{log.note}</p>
                {/if}
                <div class="flex items-center gap-2 mt-2 text-[10px] text-slate-400 dark:text-slate-500">
                  {#if log.user}
                    <div class="flex items-center gap-1">
                      <div class="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[8px] font-bold overflow-hidden">
                        {#if log.user.avatar}
                          <img src={log.user.avatar} alt={userLabel(log.user)} class="w-full h-full object-cover" />
                        {:else}
                          {userInitial(log.user)}
                        {/if}
                      </div>
                      <span>{userLabel(log.user)}</span>
                    </div>
                    <span>·</span>
                  {/if}
                  <span>{formatDateTime(log.created_at)}</span>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>

    {#if activeTab === 'comments'}
      <form
        onsubmit={(e) => { e.preventDefault(); postComment(); }}
        class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.06] shrink-0 flex items-end gap-2"
      >
        <textarea
          data-testid="task-comment-input"
          bind:value={newComment}
          placeholder="Tulis komentar..."
          rows="2"
          maxlength="2000"
          class="flex-1 resize-none text-sm bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-primary-400/60"
          onkeydown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              postComment();
            }
          }}
        ></textarea>
        <button
          type="submit"
          data-testid="task-comment-submit"
          disabled={!newComment.trim() || isPostingComment}
          class="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPostingComment ? '...' : 'Kirim'}
        </button>
      </form>
    {/if}

    {#if isOwner}
      <div class="px-6 pb-5 pt-1 flex justify-end shrink-0 border-t border-slate-100 dark:border-white/[0.06]">
        <button
          onclick={handleDelete}
          disabled={isDeleting}
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {#if isDeleting}
            <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
          {/if}
          Hapus Task
        </button>
      </div>
    {/if}
  </div>
</div>
