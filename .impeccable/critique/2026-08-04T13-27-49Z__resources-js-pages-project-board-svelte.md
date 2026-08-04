---
target: kanban board (project-board.svelte)
total_score: 19
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 2
timestamp: 2026-08-04T13-27-49Z
slug: resources-js-pages-project-board-svelte
---
# Design Critique: Kanban Board (pm-macroma)

**Method: dual-agent (A: b571d164 · B: parent-fallback — sub-agent B lacked exec tool, detector run in parent)**

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3/4 | Realtime sync invisible — no connection indicator, no "syncing" state during drag |
| 2 | Match System / Real World | 2/4 | "Revisi" (ID) mixed with "Backlog/On Going/Review/Done" (EN) — inconsistent language |
| 3 | User Control and Freedom | 2/4 | MoveModal cancel restores state silently; no undo after delete |
| 4 | Consistency and Standards | 2/4 | KanbanBoard.svelte (4 cols) vs project-board.svelte (5 cols) — dead component drift |
| 5 | Error Prevention | 1/4 | Delete project/task uses browser `confirm()` — no safeguards, no type-to-confirm |
| 6 | Recognition Rather Than Recall | 3/4 | Active batch not visually marked in dropdown without selecting |
| 7 | Flexibility and Efficiency | 2/4 | No keyboard shortcuts, no bulk ops, drag is only efficiency feature |
| 8 | Aesthetic and Minimalist Design | 3/4 | Clean but generic; header has 7 actions competing with equal weight |
| 9 | Error Recovery | 1/4 | Generic Toast errors; no inline validation on AddTaskModal until submit |
| 10 | Help and Documentation | 0/4 | No tooltips, no empty-state guidance, no explanation of version/batch system |
| **Total** | | **19/40** | **Needs work** |

## Design Specificity Verdict

**Category-interchangeable.** Hapus copy Indonesian dan "Revisi" — ini bisa jadi Trello, Asana, atau Linear tanpa perubahan. Visual language generic SaaS: white cards, standard Tailwind rings, brand-green primary, conventional priority dots. Tidak ada yang menandakan "Macroma" — tidak ada custom iconography, tidak ada distinctive palette di luar brand green default, tidak ada unique interaction pattern. Version/batch system satu-satunya domain-specific feature, tapi presented sebagai standard dropdown tanpa visual differentiation. Terasa seperti template implementation, bukan product dengan point of view.

**Deterministic scan:** 1 finding — `border-accent-on-rounded` di TaskDetailModal.svelte line 423 (`border-b-2` di tab dengan rounded corners). Tab border clash dengan rounded card. False positive? Tidak — ini valid; tab border-b-2 di container rounded-2xl memang clash.

## Overall Impression

Clean, technically solid (realtime, dark mode, image flow), tapi estetik dan UX-nya generic. Header penuh sesak dengan 7 action tanpa hierarchy. Empty states tidak ada. Confirm dialog pakai browser native. Bahasa campur aduk. Skor 19/40 — di bawah rata-rata interface production (20-32). Biggest opportunity: kurangi cognitive load di header dan kasih product personality.

## What's Working

1. **Realtime sync architecture** — dedup logic (project-board line 59-60) mencegah echo, Toast untuk remote changes well-timed. Interface terasa "alive".
2. **Image attachment flow** — drag-drop zone di AddTaskModal dengan visual feedback jelas, preview grid rapi, ImagePreviewModal dengan keyboard nav (←/→/Esc) terasa native.
3. **Dark mode comprehensive** — setiap component punya dark classes dengan consistent opacity scales (`dark:bg-white/[0.04]`, `dark:ring-white/10`). Lebih baik dari kebanyakan generic implementations.

## Priority Issues

### [P0] Delete pakai browser confirm() tanpa safeguard
- **What**: `confirm('Yakin ingin menghapus project ini?...')` di project-board line 145 dan TaskDetailModal line 111
- **Why it matters**: Destructive action affect semua data. Browser confirm dismissible, tidak match design language, no type-to-confirm
- **Fix**: Dedicated DeleteModal dengan type-project-name-to-confirm, warning jumlah task yang akan dihapus, checkbox "I understand this cannot be undone"
- **Suggested command**: `/impeccable harden`

### [P0] Bahasa campur (ID + EN)
- **What**: Columns "Backlog", "On Going", "Revisi", "Review", "Done" — "Revisi" satu-satunya Indonesia
- **Why it matters**: Cognitive dissonance. Sinyal lack of intentionality di product voice
- **Fix**: Pilih satu bahasa. Kalau ID: Belum/Sedang/Revisi/Tinjau/Selesai. Kalau EN: Backlog/Ongoing/Revision/Review/Done
- **Suggested command**: `/impeccable clarify`

### [P1] Header action overload — 7 button tanpa hierarchy
- **What**: Lines 311-379 project-board — batch dropdown, Minor, Major, Delete, Activity, Add Task semua equal weight
- **Why it matters**: User tidak bisa identify primary action cepat. "Add Task" harus dominant tapi compete dengan version bump + delete
- **Fix**: Group version controls (Minor/Major) jadi dropdown/segmented. Move Delete ke kebab menu. "Add Task" satu-satunya primary CTA
- **Suggested command**: `/impeccable shape`

### [P1] MoveModal version preview meaningless
- **What**: MoveModal line 38 show `nextVersion = 'v0.0.?'` — user tidak tahu version apa yang akan di-assign
- **Why it matters**: Moving ke Revisi butuh understanding versioning consequence. `?` create uncertainty, erode trust
- **Fix**: Calculate actual next version client-side (increment patch), atau show "Auto-incremented" dengan tooltip. Better: current version + "+1" indicator
- **Suggested command**: `/impeccable clarify`

### [P2] Empty states missing
- **What**: Column kosong hanya show "+ Add task" button (KanbanBoard line 91-97). No guidance, no personality
- **Why it matters**: Empty states = opportunity untuk guidance + discoverability. Bare button tidak explain apa column untuk
- **Fix**: Microcopy per column: "Belum ada task di Backlog — drag task ke sini atau klik + Add task"
- **Suggested command**: `/impeccable onboard`

### [P3] Tab badges tidak muncul sampai diklik (sudah partial fix)
- **What**: Tab Images badge sudah preloaded (fix terakhir), tapi Comments dan History tabs masih load-on-click
- **Why it matters**: User tidak tahu tab mana yang ada content tanpa klik semua
- **Fix**: Eager-load comment/log counts di server saat render board, atau show skeleton badge
- **Suggested command**: `/impeccable audit`

## Persona Red Flags

**Power User PM**: Bulk move 10 task ke Revisi setelah client review → harus drag satu-satu, tiap move trigger MoveModal dengan note wajib, tidak ada keyboard shortcut, tidak ada bulk operation. Abandonment risk tinggi untuk repetitive workflow.

**First-Timer Team Member**: Add task pertama → AddTaskModal tidak ada guidance apa judul task yang baik, priority dropdown tidak explain kapan pakai High vs Low, assignee dropdown show name/email tanpa context siapa siapa. Kalau accidentally close modal, work langsung hilang tanpa confirmation.

**Reviewer/Stakeholder**: Review tasks di kolom Review → kolom Review tidak ada distinct visual treatment (sama dengan On Going), tidak ada filter by assignee/priority, comments terkubur di tab, tidak ada quick action "approve/request changes" — harus drag manual tanpa context.

## Minor Observations

- KanbanBoard.svelte (4 cols) sepertinya unused/outdated — project-board.svelte define 5 cols sendiri. Dead code.
- TaskCard attachment count icon tidak ada hover preview — harus buka modal
- Activity button tidak ada badge unread count, padahal `unread_count` di-pass ke page
- Version bump buttons pakai generic up-arrow icon — tidak clear "bump version"
- MoveModal backdrop click cancel tapi optimistic update sudah applied — user mungkin think move succeeded
- ImagePreviewModal tidak ada zoom/pan — tidak bisa inspect detail attachment
- TaskDetailModal close button kecil di pojok — easy to miss di mobile
- No skeleton/transition saat initial page load — tasks just appear

## Questions to Consider

1. Kenapa versioning system ada? Task punya version numbers tapi tidak ada UI untuk view history per task, tidak ada diff, tidak ada revert. Version bump buttons create batches tapi relationship batch ↔ task version opaque. Apakah feature ini solve real problem, atau technical complexity tanpa user value?

2. Apa opinion product tentang flow kerja? 5 columns suggest specific workflow tapi interface tidak enforce atau guide. Kenapa "Revisi" separate dari "Backlog"? Interface permissive tapi tidak teach intended workflow — apa mental model yang user harus punya?

3. Siapa target user-nya? Copy Indonesian suggest local market, tapi generic SaaS aesthetic suggest compete dengan Linear/Asana. Version/batch system suggest software dev workflow, tapi tidak ada code-related features (PR links, commit refs). Interface tidak take a stand.
