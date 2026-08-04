<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { buildCSRFHeaders, Toast, api } from './helper';
  import axios from 'axios';
  import ImagePreviewModal from './ImagePreviewModal.svelte';

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

  interface AttachmentRecord {
    id: string;
    task_id: string;
    url: string;
    name: string | null;
    mime_type: string | null;
    size: number | null;
    uploaded_by: string | null;
    created_at: number;
    user?: { id: string | null; name: string | null; email: string | null; avatar: string | null } | null;
  }

  let { task, assignee, currentUser, isOwner = false, initialAttachmentCount = 0, onClose, onDeleted }: {
    task: TaskRecord;
    assignee?: UserRecord;
    currentUser?: UserRecord;
    isOwner?: boolean;
    initialAttachmentCount?: number;
    onClose: () => void;
    onDeleted: (taskId: string) => void;
  } = $props();

  type Tab = 'detail' | 'comments' | 'history' | 'images';
  let activeTab = $state<Tab>('detail');

  let isDeleting = $state(false);
  let copied = $state(false);

  // Attachments state
  // `attachmentCount` is the live count used for the tab badge — seeded from the
  // server-rendered count so the badge shows immediately without waiting for the
  // first tab click. `attachments` only holds the full list (loaded lazily).
  let attachmentCount = $state(initialAttachmentCount);
  let attachments = $state<AttachmentRecord[]>([]);
  let attachmentsLoaded = $state(false);
  let attachmentsLoading = $state(false);
  let isUploading = $state(false);
  let isDragOver = $state(false);
  let fileInput = $state<HTMLInputElement | null>(null);
  let previewIndex = $state<number | null>(null);
  let deletingAttachmentId = $state<string | null>(null);

  async function copyDescription() {
    if (!task.description) return;
    try {
      await navigator.clipboard.writeText(task.description);
      copied = true;
      setTimeout(() => (copied = false), 1500);
    } catch {
      Toast('Gagal menyalin deskripsi', 'error');
    }
  }

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
    task.priority === 'high' ? 'bg-danger-500/15 text-danger-600 dark:text-danger-400 ring-1 ring-danger-500/20' :
    task.priority === 'medium' ? 'bg-secondary-500/15 text-secondary-600 dark:text-secondary-400 ring-1 ring-secondary-500/20' :
    'bg-brand-500/15 text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/20'
  );

  const columnLabel: Record<string, string> = {
    backlog: 'Backlog',
    ongoing: 'On Going',
    revisi: 'Revisi',
    review: 'Review',
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
    else if (tab === 'images') loadAttachments();
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

  async function loadAttachments() {
    if (attachmentsLoaded || attachmentsLoading) return;
    attachmentsLoading = true;
    try {
      const res = await fetch(`/tasks/${task.id}/attachments`);
      const data = await res.json();
      attachments = data?.data?.attachments ?? [];
      attachmentCount = attachments.length;
      attachmentsLoaded = true;
    } catch {
      attachments = [];
    } finally {
      attachmentsLoading = false;
    }
  }

  function triggerFileInput() {
    fileInput?.click();
  }

  function handleFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      uploadFiles(Array.from(input.files));
    }
    input.value = '';
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      uploadFiles(Array.from(files));
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragOver = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragOver = false;
  }

  async function uploadFiles(files: File[]) {
    if (isUploading) return;
    const images = files.filter(f => f.type.startsWith('image/'));
    if (images.length === 0) {
      Toast('Pilih file gambar (JPEG/PNG/GIF/WebP)', 'error');
      return;
    }

    isUploading = true;
    const formData = new FormData();
    for (const file of images) {
      formData.append('files', file);
    }

    try {
      const res = await fetch(`/tasks/${task.id}/attachments`, {
        method: 'POST',
        headers: { ...buildCSRFHeaders() },
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.data?.attachments) {
        attachments = [...attachments, ...data.data.attachments];
        attachmentCount = attachments.length;
        attachmentsLoaded = true;
        const msg = data.data.errors?.length
          ? `${data.data.attachments.length} gambar terupload, sebagian gagal`
          : `${data.data.attachments.length} gambar terupload`;
        Toast(msg, data.data.errors?.length ? 'warning' : 'success');
      } else {
        Toast(data.message || 'Gagal upload gambar', 'error');
      }
    } catch {
      Toast('Gagal upload gambar', 'error');
    } finally {
      isUploading = false;
    }
  }

  function canDeleteAttachment(att: AttachmentRecord): boolean {
    if (isOwner) return true;
    if (!currentUser || !att.uploaded_by) return false;
    return att.uploaded_by === currentUser.id;
  }

  async function deleteAttachment(att: AttachmentRecord) {
    if (!confirm('Hapus gambar ini?')) return;
    deletingAttachmentId = att.id;
    try {
      const res = await fetch(`/tasks/${task.id}/attachments/${att.id}`, {
        method: 'DELETE',
        headers: buildCSRFHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        attachments = attachments.filter(a => a.id !== att.id);
        attachmentCount = attachments.length;
        Toast('Gambar dihapus', 'success');
      } else {
        Toast(data.message || 'Gagal menghapus gambar', 'error');
      }
    } catch {
      Toast('Gagal menghapus gambar', 'error');
    } finally {
      deletingAttachmentId = null;
    }
  }

  function openPreview(index: number) {
    previewIndex = index;
  }

  function closePreview() {
    previewIndex = null;
  }

  function formatSize(bytes: number | null): string {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  class="fixed inset-0 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="presentation"
  transition:fade={{ duration: 150 }}
>
  <div
    data-testid="task-detail-modal"
    class="bg-white dark:bg-surface-dark ring-1 ring-stone-900/5 dark:ring-white/10 rounded-2xl w-full max-w-lg shadow-modal overflow-hidden flex flex-col max-h-[90vh]"
    transition:fly={{ y: 20, duration: 200 }}
    onclick={(e) => e.stopPropagation()}
    onkeydown={(e) => e.stopPropagation()}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div class="px-6 pt-6 pb-4 border-b border-stone-100 dark:border-white/[0.05] flex items-start justify-between gap-3 shrink-0">
      <div class="flex-1 min-w-0">
        <p class="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 dark:text-stone-500 mb-1.5">v{versionString}</p>
        <h2 class="text-base font-semibold text-stone-900 dark:text-white leading-snug">{task.title}</h2>
      </div>
      <button
        onclick={onClose}
        class="shrink-0 p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Tabs -->
    <div class="px-6 pt-3 border-b border-stone-100 dark:border-white/[0.05] shrink-0">
      <div class="flex items-center gap-1" role="tablist">
        {#each [{ id: 'detail', label: 'Detail' }, { id: 'comments', label: 'Comments' }, { id: 'history', label: 'Version History' }, { id: 'images', label: 'Images' }] as tab}
          <button
            role="tab"
            aria-selected={activeTab === tab.id}
            data-testid="task-detail-tab-{tab.id}"
            onclick={() => selectTab(tab.id as Tab)}
            class="px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px cursor-pointer {activeTab === tab.id ? 'text-brand-600 dark:text-brand-400 border-brand-500 dark:border-brand-400' : 'text-stone-500 dark:text-stone-400 border-transparent hover:text-stone-800 dark:hover:text-stone-200'}"
          >
            {tab.label}
            {#if tab.id === 'comments' && commentsLoaded}
              <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/[0.05] text-stone-500 dark:text-stone-400">{comments.length}</span>
            {:else if tab.id === 'history' && logsLoaded}
              <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/[0.05] text-stone-500 dark:text-stone-400">{logs.length}</span>
            {:else if tab.id === 'images' && attachmentCount > 0}
              <span class="ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/[0.05] text-stone-500 dark:text-stone-400">{attachmentCount}</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <div class="px-6 py-4 overflow-y-auto flex-1 min-h-[200px]">
      {#if activeTab === 'detail'}
        <div class="space-y-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full {priorityClass}">
              {priorityLabel}
            </span>
            <span class="text-[10px] font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-white/[0.05] text-stone-500 dark:text-stone-400 ring-1 ring-stone-900/5 dark:ring-white/10">
              {columnLabel[task.column_id] ?? task.column_id}
            </span>
            {#if assignee}
              <div class="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                <div class="w-5 h-5 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-[9px] font-bold overflow-hidden ring-1 ring-stone-900/5 dark:ring-white/10">
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
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400 dark:text-stone-500">Deskripsi</p>
              {#if task.description}
                <button
                  type="button"
                  onclick={copyDescription}
                  class="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors cursor-pointer"
                >
                  {copied ? 'Tersalin' : 'Salin'}
                </button>
              {/if}
            </div>
            {#if task.description}
              <p class="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            {:else}
              <p class="text-sm text-stone-400 dark:text-stone-500 italic">Tidak ada deskripsi</p>
            {/if}
          </div>

          <p class="text-[11px] text-stone-400 dark:text-stone-500">
            Dibuat {new Date(task.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      {:else if activeTab === 'comments'}
        <div data-testid="task-detail-comments" class="flex flex-col gap-3">
          {#if commentsLoading}
            <div class="text-xs text-stone-500 animate-pulse">Loading...</div>
          {:else if comments.length === 0}
            <div class="text-xs text-stone-500 dark:text-stone-400 italic">Belum ada komentar.</div>
          {:else}
            {#each comments as comment (comment.id)}
              <div class="flex gap-2.5 group">
                <div class="shrink-0 w-7 h-7 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold text-stone-700 dark:text-stone-200 overflow-hidden ring-1 ring-stone-900/5 dark:ring-white/10">
                  {#if comment.user?.avatar}
                    <img src={comment.user.avatar} alt={userLabel(comment.user)} class="w-full h-full object-cover" />
                  {:else}
                    {userInitial(comment.user)}
                  {/if}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-semibold text-stone-700 dark:text-stone-200">{userLabel(comment.user)}</span>
                    <span class="text-[10px] text-stone-400 dark:text-stone-500">{formatDateTime(comment.created_at)}</span>
                    {#if canDeleteComment(comment)}
                      <button
                        onclick={() => deleteComment(comment)}
                        disabled={deletingCommentId === comment.id}
                        class="ml-auto text-[10px] text-stone-400 hover:text-danger-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 cursor-pointer"
                        title="Hapus komentar"
                      >
                        {deletingCommentId === comment.id ? 'Menghapus...' : 'Hapus'}
                      </button>
                    {/if}
                  </div>
                  <p class="text-sm text-stone-700 dark:text-stone-300 mt-0.5 whitespace-pre-wrap break-words">{comment.content}</p>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      {:else if activeTab === 'history'}
        <div data-testid="task-detail-history" class="flex flex-col gap-2.5">
          {#if logsLoading}
            <div class="text-xs text-stone-500 animate-pulse">Loading...</div>
          {:else if logs.length === 0}
            <div class="text-xs text-stone-500 dark:text-stone-400 italic">Tidak ada log versi.</div>
          {:else}
            {#each logs as log (log.id)}
              <div class="bg-surface-input dark:bg-white/[0.03] ring-1 ring-stone-900/5 dark:ring-white/[0.06] p-3 rounded-lg">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-[10px] bg-stone-200 dark:bg-white/10 text-stone-700 dark:text-stone-200 px-1.5 py-0.5 rounded">{log.version}</span>
                  <span class="text-xs text-stone-600 dark:text-stone-300">
                    {log.column_from ? (columnLabel[log.column_from] ?? log.column_from) : 'Created'} &rarr; {columnLabel[log.column_to] ?? log.column_to}
                  </span>
                </div>
                {#if log.note}
                  <p class="text-xs text-stone-600 dark:text-stone-400 mt-1.5 whitespace-pre-wrap break-words">{log.note}</p>
                {/if}
                <div class="flex items-center gap-2 mt-2 text-[10px] text-stone-400 dark:text-stone-500">
                  {#if log.user}
                    <div class="flex items-center gap-1">
                      <div class="w-4 h-4 rounded-full bg-stone-200 dark:bg-white/10 flex items-center justify-center text-[8px] font-bold overflow-hidden">
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
      {:else if activeTab === 'images'}
        <div data-testid="task-detail-images" class="flex flex-col gap-4">
          <!-- Upload dropzone -->
          <div
            class="relative rounded-xl border-2 border-dashed transition-all duration-200 {isDragOver ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-500/10' : 'border-stone-200 dark:border-white/[0.08] hover:border-brand-500/40 dark:hover:border-brand-400/40'}"
            ondrop={handleDrop}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            role="button"
            tabindex="0"
            onclick={triggerFileInput}
            onkeydown={(e) => e.key === 'Enter' && triggerFileInput()}
          >
            <input
              bind:this={fileInput}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              multiple
              class="hidden"
              onchange={handleFileChange}
            />
            <div class="flex flex-col items-center justify-center py-6 px-4 text-center cursor-pointer">
              {#if isUploading}
                <svg class="animate-spin w-6 h-6 text-brand-500 mb-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <p class="text-xs font-semibold text-stone-600 dark:text-stone-300">Mengupload...</p>
              {:else}
                <svg class="w-6 h-6 text-stone-400 dark:text-stone-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                <p class="text-xs font-semibold text-stone-600 dark:text-stone-300">Klik atau drag gambar ke sini</p>
                <p class="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">JPEG, PNG, GIF, WebP — maks 5MB per file</p>
              {/if}
            </div>
          </div>

          <!-- Gallery grid -->
          {#if attachmentsLoading}
            <div class="text-xs text-stone-500 animate-pulse">Loading...</div>
          {:else if attachments.length === 0}
            <div class="text-xs text-stone-500 dark:text-stone-400 italic text-center py-6">Belum ada gambar. Upload gambar untuk task ini.</div>
          {:else}
            <div class="grid grid-cols-3 gap-2.5">
              {#each attachments as att, i (att.id)}
                <div class="group relative aspect-square rounded-lg overflow-hidden ring-1 ring-stone-900/5 dark:ring-white/10 bg-stone-100 dark:bg-white/[0.04]">
                  <button
                    onclick={() => openPreview(i)}
                    class="absolute inset-0 w-full h-full cursor-zoom-in"
                    title="Lihat gambar"
                  >
                    <img src={att.url} alt={att.name || 'Attachment'} class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                  </button>
                  <!-- Hover overlay -->
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                  <!-- Delete button -->
                  {#if canDeleteAttachment(att)}
                    <button
                      onclick={(e) => { e.stopPropagation(); deleteAttachment(att); }}
                      disabled={deletingAttachmentId === att.id}
                      class="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/50 text-white hover:bg-rose-500 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50 cursor-pointer"
                      title="Hapus gambar"
                    >
                      {#if deletingAttachmentId === att.id}
                        <svg class="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      {:else}
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
                      {/if}
                    </button>
                  {/if}
                  <!-- Filename tooltip on hover -->
                  <div class="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-[10px] text-white font-medium truncate opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {att.name || 'Image'}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    {#if activeTab === 'comments'}
      <form
        onsubmit={(e) => { e.preventDefault(); postComment(); }}
        class="px-6 py-3 border-t border-stone-100 dark:border-white/[0.05] shrink-0 flex items-end gap-2"
      >
        <textarea
          data-testid="task-comment-input"
          bind:value={newComment}
          placeholder="Tulis komentar..."
          rows="2"
          maxlength="2000"
          class="flex-1 resize-none text-sm bg-surface-input dark:bg-white/[0.04] ring-1 ring-stone-900/10 dark:ring-white/10 rounded-lg px-3 py-2 text-stone-700 dark:text-stone-200 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 transition-all"
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
          class="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPostingComment ? '...' : 'Kirim'}
        </button>
      </form>
    {/if}

    {#if isOwner}
      <div class="px-6 pb-5 pt-1 flex justify-end shrink-0 border-t border-stone-100 dark:border-white/[0.05]">
        <button
          onclick={handleDelete}
          disabled={isDeleting}
          class="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-500/10 ring-1 ring-danger-200 dark:ring-danger-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {#if isDeleting}
            <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          {:else}
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>
          {/if}
          Hapus task
        </button>
      </div>
    {/if}
  </div>
</div>

{#if previewIndex !== null && attachments.length > 0}
  <ImagePreviewModal
    attachments={attachments}
    startIndex={previewIndex}
    onClose={closePreview}
  />
{/if}
