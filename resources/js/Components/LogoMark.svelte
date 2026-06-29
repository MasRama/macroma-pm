<!-- Project Master logo mark: three kanban columns of varying heights.
     Represents the board (Backlog / On Going / Done) — the product's core.
     Middle column tallest = active work. Uses currentColor. -->
<script lang="ts">
  let { class: cls = 'w-4 h-4' }: { class?: string } = $props();
</script>

<svg class={cls} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <rect x="3.5" y="11" width="4" height="9" rx="1.4"/>
  <rect x="10" y="4" width="4" height="16" rx="1.4"/>
  <rect x="16.5" y="8" width="4" height="12" rx="1.4"/>
</svg>
