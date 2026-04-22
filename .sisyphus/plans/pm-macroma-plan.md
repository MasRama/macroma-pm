# PM Macroma — Full Implementation Plan

## TL;DR

> **Quick Summary**: Transform the existing Nara Framework TypeScript codebase into "PM Macroma" — a web-based project management tool with multi-member projects, versioned task batches, a Kanban board with DnD, immutable task logs, and a glassmorphism UI.
>
> **Deliverables**:
> - 5 new database migrations (projects, project_members, project_batches, tasks, task_logs)
> - 5 new models (Project, ProjectMember, ProjectBatch, Task, TaskLog)
> - 4 new controllers (ProjectController, ProjectMemberController, BatchController, TaskController)
> - 13 new routes registered in `routes/web.ts`
> - 10 new Svelte 5 components (AppLayout, Sidebar, KanbanBoard, TaskCard, MoveModal, AddLogModal, VersionLogAccordion, AddTaskModal, ProjectsPage, ProjectBoardPage)
> - Full landing page redesign (glassmorphism, PM Macroma branding)
> - Branding sweep: Nara → PM Macroma across all UI files + `package.json`
>
> **Estimated Effort**: XL
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: T1 (install) → T2-T6 (migrations) → T7-T11 (models) → T12-T15 (controllers) → T16 (routes) → T17 (AppLayout) → T18-T22 (pages/components) → T23-T25 (DnD+modals) → T26-T28 (landing+branding) → F1-F4 (final QA)

---

## Context

### Original Request
Build "PM Macroma" on the Nara Framework (HyperExpress + Svelte 5 + Inertia.js + Knex/SQLite). Multi-member projects with versioned batches, Kanban board with DnD column moves, immutable task version logs, and glassmorphism UI.

### Confirmed Requirements
- **Project ownership**: Multi-member (owner + members via `project_members` pivot)
- **Batch naming**: Auto-increment semver (`v{major}.{minor}`) enforced per project
- **Task versioning**: 3-level semver `v{major}.{minor}.{patch}` — `version_patch` increments on every move OR manual log add
- **Backward moves**: Yes, ALL column moves (forward AND backward) increment `version_patch` + create `task_log`
- **Assignee**: Linked to registered users from `project_members` only
- **Landing page**: Full glassmorphism redesign
- **Real-time**: Not required (manual refresh OK)

### Metis Review — Gaps Addressed
- **Q1 (batch major vs minor)**: Auto-resolved — minor auto-increments per `CREATE BATCH`; major only increments when user explicitly chooses "New Major Version" (a checkbox/toggle on the create-batch form). Default: always increment minor.
- **Q2 (version display)**: Auto-resolved — task version chip shows task's own `v{version_major}.{version_minor}.{version_patch}`. At task creation, `version_major` and `version_minor` are copied from the active batch (or `0.1` if no batch). Only `version_patch` changes thereafter.
- **Q3 (same-column reorder)**: Auto-resolved — same-column drag-and-drop (reorder only) does NOT increment version and does NOT show MoveModal. Only cross-column drops trigger version increment + MoveModal.
- **Q4 (note required)**: Auto-resolved — MoveModal `note` field is **required** (non-empty). Cannot submit with blank note.
- **Q5 (who can move tasks)**: Auto-resolved — any project member (owner or member role) can move/edit any task within that project.
- **Q6 (dashboard replacement)**: Auto-resolved — `/dashboard` redirects to `/projects`. The old dashboard page is replaced by projects index.
- **Q7 (owner in pivot)**: Auto-resolved — `owner_id` on `projects` is the authoritative reference. Owner is ALSO stored in `project_members` with `role='owner'` for uniform membership queries.
- **Q8 (sidebar)**: Confirmed — Sidebar layout (not top-nav).
- **Q9 (tasks without batch)**: `batch_id` nullable. Tasks show on kanban without batch version badge if no active batch. `version_major` and `version_minor` default to `0` and `1` respectively when no batch.
- **Q10 (project list info)**: Show: project name, description, active batch label (if any), task count per column, member count.

### Research Findings
- `BaseModel.create()` requires `id: crypto.randomUUID()` — does NOT auto-generate
- Bigint timestamps: `table.bigInteger('created_at')` NOT `table.timestamps()`
- Controller pattern: extend `BaseController`, call `this.requireInertia(response)` before `response.inertia()`
- Frontend: `$props()` for props, `$inertiaPage.props.user` for current user
- CSRF: ALL `router.patch/post/delete` MUST include `headers: buildCSRFHeaders()`
- Svelte 5 DnD: `$state` arrays (NOT `$derived`) + `onconsider`/`onfinalize` (NOT `on:consider`)
- No test framework configured — verification via `npm run lint` + curl + Playwright

---

## Work Objectives

### Core Objective
Build a complete project management application on Nara Framework, preserving all existing auth/RBAC infrastructure while adding a full PM domain layer (projects → batches → tasks → logs) with a Kanban board UI.

### Concrete Deliverables
- `migrations/` — 5 new migration files (`*_create_projects_table.ts`, etc.)
- `app/models/` — `Project.ts`, `ProjectMember.ts`, `ProjectBatch.ts`, `Task.ts`, `TaskLog.ts`
- `app/controllers/` — `ProjectController.ts`, `ProjectMemberController.ts`, `BatchController.ts`, `TaskController.ts`
- `routes/web.ts` — 13 new routes added
- `resources/js/Pages/` — `projects.svelte`, `project-board.svelte`
- `resources/js/Components/` — `AppLayout.svelte`, `Sidebar.svelte`, `KanbanBoard.svelte`, `TaskCard.svelte`, `MoveModal.svelte`, `AddLogModal.svelte`, `VersionLogAccordion.svelte`, `AddTaskModal.svelte`
- `resources/js/Pages/landing.svelte` — full glassmorphism redesign
- `package.json` — name changed to `pm-macroma`, `svelte-dnd-action` added

### Definition of Done
- [x] `node nara db:fresh && node nara db:status` — all 5 new migrations show "Ran"
- [x] `npm run lint` — exit code 0, zero TypeScript errors
- [x] `curl -s http://localhost:5555/projects -H "Cookie: auth_id={session}"` — returns 200 Inertia response
- [x] Playwright: cross-column drag shows MoveModal, note required, submit → version chip updates to `v0.1.1`
- [x] `grep -rn "NARA\." resources/js/` — zero matches
- [x] `grep -n '"name": "nara"' package.json` — zero matches

### Must Have
- Project CRUD with multi-member management
- Batch auto-increment semver per project (minor default, major opt-in)
- Kanban board with DnD cross-column moves
- MoveModal with required note on every cross-column move
- Task version increment (version_patch++) on every move AND manual log add
- Immutable task_logs (append-only, no update/delete)
- VersionLogAccordion showing full version history per task
- AppLayout with fixed Sidebar showing user's projects
- Glassmorphism UI: `bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl`
- Landing page redesigned for PM Macroma
- Branding sweep: Nara → PM Macroma

### Must NOT Have (Guardrails)
- NO WebSocket / real-time / polling
- NO email or Slack notifications
- NO analytics, reports, or admin panel
- NO file attachments on tasks
- NO due dates, labels/tags, archiving, or pagination on kanban
- NO new CSS files or external component libraries
- NO JSDoc on every function (only where needed)
- NO modification of existing controllers: `AuthController`, `UserController`, `AssetController`, `OAuthController`
- NO modification of existing RBAC system (roles/permissions tables)
- NO `table.timestamps()` in migrations — use explicit `table.bigInteger('created_at')`
- NO `$derived` for DnD column arrays — use `$state` + `$effect` only
- NO `on:consider`/`on:finalize` Svelte 4 syntax — use `onconsider`/`onfinalize`
- NO direct `bcrypt` usage — use `Authenticate.hash()`
- NO Zod/Yup/Joi — use `@validators/validate.ts`
- NO relative imports for core modules — always `@core`, `@models`, etc.
- NO task search/filter on kanban board
- NO global activity feed (only per-task logs)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (npm test just echoes a message)
- **Automated tests**: None (no test runner configured)
- **Framework**: N/A
- **TDD substitute**: TypeScript lint-first workflow:
  1. Write TypeScript interfaces/types first → `npm run lint` must pass = "green"
  2. Implement backend → verify with `curl` assertions
  3. Implement frontend → verify with Playwright

### QA Policy
Every task includes agent-executed QA scenarios. Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Backend APIs**: Bash (curl) — send requests, assert status + response fields
- **Frontend UI**: Playwright (`playwright` skill) — navigate, interact, assert DOM, screenshot
- **Migrations**: Bash (`node nara db:status`) — assert migration state
- **TypeScript**: Bash (`npm run lint`) — assert exit code 0

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — 6 parallel tasks, start immediately):
├── Task 1:  Install svelte-dnd-action [quick]
├── Task 2:  Migration: create_projects_table [quick]
├── Task 3:  Migration: create_project_members_table [quick]
├── Task 4:  Migration: create_project_batches_table [quick]
├── Task 5:  Migration: create_tasks_table [quick]
└── Task 6:  Migration: create_task_logs_table [quick]

Wave 2 (Models — 5 parallel tasks, after Wave 1):
├── Task 7:  Model: Project [quick]
├── Task 8:  Model: ProjectMember [quick]
├── Task 9:  Model: ProjectBatch [quick]
├── Task 10: Model: Task [unspecified-high]
└── Task 11: Model: TaskLog [quick]

Wave 3 (Controllers + Routes — 5 parallel tasks, after Wave 2):
├── Task 12: ProjectController (index, show, store, update, destroy) [unspecified-high]
├── Task 13: ProjectMemberController (store, destroy) [quick]
├── Task 14: BatchController (index, store, activate) [unspecified-high]
├── Task 15: TaskController (store, move, addLog, destroy, getLogs) [deep]
└── Task 16: Routes: register all 13 new routes in web.ts [quick]

Wave 4 (Frontend Core — 5 parallel tasks, after Task 16):
├── Task 17: AppLayout.svelte + Sidebar.svelte [visual-engineering]
├── Task 18: projects.svelte (projects index page) [visual-engineering]
├── Task 19: KanbanBoard.svelte + TaskCard.svelte (static, no DnD) [visual-engineering]
├── Task 20: MoveModal.svelte + AddLogModal.svelte [visual-engineering]
└── Task 21: AddTaskModal.svelte + VersionLogAccordion.svelte [visual-engineering]

Wave 5 (DnD + Integration + Polish — 3 parallel tasks, after Wave 4):
├── Task 22: project-board.svelte (full board page wiring all components + DnD) [deep]
├── Task 23: Landing page glassmorphism redesign [visual-engineering]
└── Task 24: Branding sweep: Nara → PM Macroma + dashboard redirect [quick]

Wave FINAL (4 parallel reviews — after ALL tasks):
├── Task F1: Plan compliance audit [oracle]
├── Task F2: Code quality + lint review [unspecified-high]
├── Task F3: Real manual QA (Playwright) [unspecified-high + playwright]
└── Task F4: Scope fidelity check [deep]
→ Present consolidated results → Get explicit user okay
```

### Dependency Matrix

| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | — | T22 (DnD) |
| T2-T6 | — | T7-T11 |
| T7-T11 | T2-T6 | T12-T15 |
| T12-T15 | T7-T11 | T16 |
| T16 | T12-T15 | T17-T21 |
| T17-T21 | T16 | T22 |
| T22 | T1, T17-T21 | F1-F4 |
| T23-T24 | T16 | F1-F4 (can run in parallel with T22) |
| F1-F4 | ALL | — |

### Agent Dispatch Summary

| Wave | Tasks | Count | Agent Categories |
|------|-------|-------|-----------------|
| 1 | T1-T6 | 6 | quick ×6 |
| 2 | T7-T11 | 5 | quick ×4, unspecified-high ×1 |
| 3 | T12-T16 | 5 | quick ×2, unspecified-high ×2, deep ×1 |
| 4 | T17-T21 | 5 | visual-engineering ×5 |
| 5 | T22-T24 | 3 | deep ×1, visual-engineering ×1, quick ×1 |
| FINAL | F1-F4 | 4 | oracle, unspecified-high ×2, deep |

---

## TODOs

---

### Wave 1 — Foundation (6 parallel tasks, start immediately)

- [x] 1. Install `svelte-dnd-action` dependency

  **What to do**:
  - Run `npm install svelte-dnd-action` in the project root
  - Verify it appears in `package.json` under `dependencies`
  - Run `npm run lint` to confirm no TypeScript errors introduced

  **Must NOT do**:
  - Do NOT install any other new packages (no animation libs, no component libs)
  - Do NOT modify any existing source files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single npm install + lint check, no code writing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2-6)
  - **Blocks**: Task 22 (KanbanBoard DnD)
  - **Blocked By**: None (start immediately)

  **References**:
  - `package.json` — add to `dependencies` section
  - `https://github.com/isaacs/svelte-dnd-action` — library homepage
  - Pattern: existing `package.json` dependency format for version pinning

  **Acceptance Criteria**:
  - [x] `cat package.json | grep svelte-dnd-action` — shows entry with version number
  - [x] `npm run lint` — exit code 0

  **QA Scenarios**:
  ```
  Scenario: svelte-dnd-action installed correctly
    Tool: Bash
    Steps:
      1. Run: cat package.json | grep "svelte-dnd-action"
      2. Assert: output contains "svelte-dnd-action" with a version string
      3. Run: npm run lint
      4. Assert: exit code 0, no output errors
    Expected Result: Package present in package.json, lint clean
    Evidence: .sisyphus/evidence/task-1-install-dnd.txt
  ```

  **Commit**: YES
  - Message: `install(deps): add svelte-dnd-action`
  - Files: `package.json`, `package-lock.json`

---

- [x] 2. Migration: `create_projects_table`

  **What to do**:
  - Create `migrations/{timestamp}_create_projects_table.ts`
  - Table: `projects`
    - `table.uuid('id').primary().notNullable()`
    - `table.string('name', 255).notNullable()`
    - `table.text('description').nullable()`
    - `table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE').notNullable()`
    - `table.bigInteger('created_at').notNullable()`
    - `table.bigInteger('updated_at').notNullable()`
  - `down()` must drop the table: `knex.schema.dropTableIfExists('projects')`

  **Must NOT do**:
  - Do NOT use `table.timestamps()` — use explicit `table.bigInteger('created_at')` calls
  - Do NOT use `table.increments('id')` — use `table.uuid('id').primary()`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple file creation following established migration pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3-6)
  - **Blocks**: Task 7 (Project model)
  - **Blocked By**: None

  **References**:
  - `migrations/20230513055909_users.ts` — exact syntax for UUID primary + bigint timestamps + foreign keys
  - `migrations/20230514062913_sessions.ts` — additional FK reference pattern
  - Pattern: `table.uuid('id').primary().notNullable()` and `table.bigInteger('created_at').notNullable()`

  **Acceptance Criteria**:
  - [x] File created at `migrations/*_create_projects_table.ts`
  - [x] `node nara db:migrate` runs without error
  - [x] `node nara db:status` shows the migration as "Ran"

  **QA Scenarios**:
  ```
  Scenario: Migration runs successfully
    Tool: Bash
    Steps:
      1. Run: node nara db:migrate
      2. Assert: no error output, exit code 0
      3. Run: node nara db:status
      4. Assert: output contains migration name with "Ran" status
    Expected Result: Migration applied, table exists in DB
    Evidence: .sisyphus/evidence/task-2-migration-projects.txt

  Scenario: Migration rollback works
    Tool: Bash
    Steps:
      1. Run: node nara db:rollback
      2. Assert: exit code 0
      3. Run: node nara db:migrate (re-apply)
      4. Assert: clean re-apply
    Evidence: .sisyphus/evidence/task-2-migration-projects-rollback.txt
  ```

  **Commit**: GROUP with Tasks 3-6 (single commit for all 5 migrations)

---

- [x] 3. Migration: `create_project_members_table`

  **What to do**:
  - Create `migrations/{timestamp}_create_project_members_table.ts`
  - Table: `project_members`
    - `table.uuid('id').primary().notNullable()`
    - `table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()`
    - `table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').notNullable()`
    - `table.string('role', 50).notNullable().defaultTo('member')` — values: `'owner'` or `'member'`
    - `table.bigInteger('created_at').notNullable()`
    - Add unique constraint: `table.unique(['project_id', 'user_id'])`
  - NO `updated_at` — membership records are created/deleted, not updated
  - `down()` drops the table

  **Must NOT do**:
  - Do NOT add `updated_at` column — membership records are immutable once created
  - Do NOT allow duplicate (project_id, user_id) pairs — enforce with unique constraint

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4-6)
  - **Blocks**: Task 8 (ProjectMember model)
  - **Blocked By**: Task 2 (projects table must exist for FK)

  **References**:
  - `migrations/20230513055909_users.ts` — FK pattern: `.references('id').inTable('users').onDelete('CASCADE')`
  - Pattern for pivot tables with unique constraint: `table.unique(['col1', 'col2'])`

  **Acceptance Criteria**:
  - [x] `node nara db:migrate` — clean run
  - [x] `node nara db:status` — shows "Ran"
  - [x] Unique constraint enforced (duplicate insert would fail)

  **QA Scenarios**:
  ```
  Scenario: Migration creates project_members table
    Tool: Bash
    Steps:
      1. Run: node nara db:migrate
      2. Assert: exit code 0
      3. Run: node nara db:status
      4. Assert: "*_create_project_members_table" in output with "Ran"
    Evidence: .sisyphus/evidence/task-3-migration-members.txt
  ```

  **Commit**: GROUP with Tasks 2, 4-6

---

- [x] 4. Migration: `create_project_batches_table`

  **What to do**:
  - Create `migrations/{timestamp}_create_project_batches_table.ts`
  - Table: `project_batches`
    - `table.uuid('id').primary().notNullable()`
    - `table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()`
    - `table.integer('major').notNullable().defaultTo(0)`
    - `table.integer('minor').notNullable().defaultTo(1)`
    - `table.string('label', 255).nullable()` — optional display label e.g., "MVP", "Payment Gateway"
    - `table.boolean('is_active').notNullable().defaultTo(false)`
    - `table.bigInteger('created_at').notNullable()`
    - `table.bigInteger('updated_at').notNullable()`
  - `down()` drops the table

  **Must NOT do**:
  - Do NOT use `table.timestamps()` — explicit bigInteger only

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-3, 5-6)
  - **Blocks**: Task 9 (ProjectBatch model)
  - **Blocked By**: Task 2 (projects table must exist for FK)

  **References**:
  - `migrations/20230513055909_users.ts` — boolean + integer column syntax
  - Pattern: `table.integer('major').notNullable().defaultTo(0)`

  **Acceptance Criteria**:
  - [x] `node nara db:migrate` — clean run
  - [x] `node nara db:status` — shows "Ran"

  **QA Scenarios**:
  ```
  Scenario: Migration creates project_batches table with correct schema
    Tool: Bash
    Steps:
      1. Run: node nara db:migrate && node nara db:status
      2. Assert: "*_create_project_batches_table" shows "Ran"
    Evidence: .sisyphus/evidence/task-4-migration-batches.txt
  ```

  **Commit**: GROUP with Tasks 2-3, 5-6

---

- [x] 5. Migration: `create_tasks_table`

  **What to do**:
  - Create `migrations/{timestamp}_create_tasks_table.ts`
  - Table: `tasks`
    - `table.uuid('id').primary().notNullable()`
    - `table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE').notNullable()`
    - `table.uuid('batch_id').references('id').inTable('project_batches').onDelete('SET NULL').nullable()`
    - `table.string('title', 500).notNullable()`
    - `table.text('description').nullable()`
    - `table.string('priority', 20).notNullable().defaultTo('medium')` — values: `'low'`, `'medium'`, `'high'`
    - `table.uuid('assignee_id').references('id').inTable('users').onDelete('SET NULL').nullable()`
    - `table.string('column_id', 50).notNullable().defaultTo('ongoing')` — values: `'ongoing'`, `'revisi'`, `'done'`
    - `table.integer('sort_order').notNullable().defaultTo(0)`
    - `table.integer('version_major').notNullable().defaultTo(0)`
    - `table.integer('version_minor').notNullable().defaultTo(1)`
    - `table.integer('version_patch').notNullable().defaultTo(0)`
    - `table.bigInteger('created_at').notNullable()`
    - `table.bigInteger('updated_at').notNullable()`
  - `down()` drops the table

  **Must NOT do**:
  - Do NOT use `table.timestamps()` — explicit bigInteger only
  - Do NOT omit nullable on `batch_id` and `assignee_id` — both are genuinely optional

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-4, 6)
  - **Blocks**: Task 10 (Task model)
  - **Blocked By**: Tasks 2, 4 (projects and project_batches must exist for FKs)

  **References**:
  - `migrations/20230513055909_users.ts` — all column type syntax patterns
  - Pattern for SET NULL on delete: `.references('id').inTable('users').onDelete('SET NULL').nullable()`

  **Acceptance Criteria**:
  - [x] `node nara db:migrate` — clean run, all 5 migrations Ran
  - [x] `node nara db:status` — "*_create_tasks_table" shows "Ran"

  **QA Scenarios**:
  ```
  Scenario: All 5 migrations run cleanly
    Tool: Bash
    Steps:
      1. Run: node nara db:fresh
      2. Assert: exit code 0
      3. Run: node nara db:status
      4. Assert: all 5 new migration names present with "Ran" status
    Evidence: .sisyphus/evidence/task-5-all-migrations.txt
  ```

  **Commit**: GROUP with Tasks 2-4, 6 → `feat(db): add PM migrations (projects, project_members, batches, tasks, task_logs)`

---

- [x] 6. Migration: `create_task_logs_table`

  **What to do**:
  - Create `migrations/{timestamp}_create_task_logs_table.ts`
  - Table: `task_logs`
    - `table.uuid('id').primary().notNullable()`
    - `table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE').notNullable()`
    - `table.string('version', 50).notNullable()` — snapshot string e.g., `"v0.1.0"`, `"v0.1.1"`
    - `table.string('column_from', 50).nullable()` — null ONLY for first log (task creation)
    - `table.string('column_to', 50).notNullable()`
    - `table.text('note').notNullable()`
    - `table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL').nullable()`
    - `table.bigInteger('created_at').notNullable()`
  - **NO `updated_at`** — task_logs are immutable (append-only)
  - `down()` drops the table

  **Must NOT do**:
  - Do NOT add `updated_at` column — logs are immutable by design
  - Do NOT allow UPDATE or DELETE on task_logs anywhere in the application

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1-5)
  - **Blocks**: Task 11 (TaskLog model)
  - **Blocked By**: Task 5 (tasks table must exist for FK)

  **References**:
  - `migrations/20230513055909_users.ts` — FK + nullable patterns
  - Pattern for immutable log tables: omit `updated_at` entirely

  **Acceptance Criteria**:
  - [x] `node nara db:status` shows "Ran" for task_logs migration
  - [x] No `updated_at` column in table (verify schema)

  **QA Scenarios**:
  ```
  Scenario: task_logs table has no updated_at column
    Tool: Bash
    Steps:
      1. Run: node nara db:fresh && node nara db:status
      2. Assert: all 5 migrations show "Ran"
    Evidence: .sisyphus/evidence/task-6-task-logs-migration.txt
  ```

  **Commit**: GROUP with Tasks 2-5

---

### Wave 2 — Models (5 parallel tasks, after Wave 1)

- [x] 7. Model: `Project`

  **What to do**:
  - Create `app/models/Project.ts`
  - Define `ProjectRecord` interface:
    ```typescript
    export interface ProjectRecord {
      id: string;
      name: string;
      description: string | null;
      owner_id: string;
      created_at: number;
      updated_at: number;
    }
    ```
  - Create `ProjectModel extends BaseModel<ProjectRecord>` with:
    - `protected tableName = 'projects'`
    - `async findByOwner(userId: string): Promise<ProjectRecord[]>` — `WHERE owner_id = userId`
    - `async findByMember(userId: string): Promise<ProjectRecord[]>` — JOIN `project_members` WHERE `user_id = userId`
    - `async findAllForUser(userId: string): Promise<ProjectRecord[]>` — union of owner + member projects (use `whereIn('id', ...)` or raw query)
  - Export singleton: `export const Project = new ProjectModel(); export default Project;`
  - Export from `app/models/index.ts` (add to existing exports)

  **Must NOT do**:
  - Do NOT forget `id: crypto.randomUUID()` in any `.create()` call (though models don't call create themselves; just be aware)
  - Do NOT use relative imports — use `@core`, `@services/DB` etc.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward model following exact User.ts pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 8-11)
  - **Blocks**: Task 12 (ProjectController)
  - **Blocked By**: Task 2 (projects migration must exist)

  **References**:
  - `app/models/User.ts` — complete model template (interface, class, singleton export)
  - `app/models/BaseModel.ts:51-115` — CRUD method signatures
  - `app/models/index.ts` — add export here

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0 with Project model exported
  - [x] `Project.findAllForUser(userId)` method exists and returns `ProjectRecord[]`

  **QA Scenarios**:
  ```
  Scenario: Project model type-checks cleanly
    Tool: Bash
    Steps:
      1. Run: npm run lint
      2. Assert: exit code 0, no TypeScript errors mentioning Project.ts
    Evidence: .sisyphus/evidence/task-7-model-project.txt
  ```

  **Commit**: GROUP with Tasks 8-11 → `feat(models): add Project, ProjectMember, ProjectBatch, Task, TaskLog models`

---

- [x] 8. Model: `ProjectMember`

  **What to do**:
  - Create `app/models/ProjectMember.ts`
  - Define `ProjectMemberRecord` interface:
    ```typescript
    export interface ProjectMemberRecord {
      id: string;
      project_id: string;
      user_id: string;
      role: 'owner' | 'member';
      created_at: number;
    }
    ```
  - Create `ProjectMemberModel extends BaseModel<ProjectMemberRecord>` with:
    - `protected tableName = 'project_members'`
    - `async findByProject(projectId: string): Promise<ProjectMemberRecord[]>`
    - `async findMembership(projectId: string, userId: string): Promise<ProjectMemberRecord | undefined>` — check if user is member
    - `async isMember(projectId: string, userId: string): Promise<boolean>` — returns true if membership exists
  - Export singleton and add to `app/models/index.ts`

  **Must NOT do**:
  - No `updated_at` in interface — this table has no updated_at column

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 9-11)
  - **Blocks**: Task 13 (ProjectMemberController)
  - **Blocked By**: Task 3 (project_members migration)

  **References**:
  - `app/models/User.ts` — model template
  - `app/models/index.ts` — add export

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `ProjectMember.isMember(projectId, userId)` method exists returning `Promise<boolean>`

  **QA Scenarios**:
  ```
  Scenario: ProjectMember model type-checks cleanly
    Tool: Bash
    Steps:
      1. Run: npm run lint
      2. Assert: exit code 0
    Evidence: .sisyphus/evidence/task-8-model-projectmember.txt
  ```

  **Commit**: GROUP with Tasks 7, 9-11

---

- [x] 9. Model: `ProjectBatch`

  **What to do**:
  - Create `app/models/ProjectBatch.ts`
  - Define `ProjectBatchRecord` interface:
    ```typescript
    export interface ProjectBatchRecord {
      id: string;
      project_id: string;
      major: number;
      minor: number;
      label: string | null;
      is_active: boolean;
      created_at: number;
      updated_at: number;
    }
    ```
  - Add computed helper (NOT stored in DB): `versionString(batch: ProjectBatchRecord): string` — returns `"v${batch.major}.${batch.minor}${batch.label ? ' ' + batch.label : ''}"`
  - Create `ProjectBatchModel extends BaseModel<ProjectBatchRecord>` with:
    - `protected tableName = 'project_batches'`
    - `async findByProject(projectId: string): Promise<ProjectBatchRecord[]>` — ordered by major DESC, minor DESC
    - `async findActive(projectId: string): Promise<ProjectBatchRecord | undefined>` — WHERE `is_active = true`
    - `async getNextVersion(projectId: string, bumpMajor: boolean): Promise<{major: number, minor: number}>` — computes next semver from existing batches
  - Export singleton and add to `app/models/index.ts`

  **Must NOT do**:
  - Do NOT store the computed version string in the DB — compute it at query time
  - Do NOT allow more than one `is_active = true` per project (enforced in BatchController, not here)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-8, 10-11)
  - **Blocks**: Task 14 (BatchController)
  - **Blocked By**: Task 4 (project_batches migration)

  **References**:
  - `app/models/User.ts` — model template
  - Batch version logic: if `bumpMajor=true`, `major++, minor=0`; else `minor++` from last batch's minor

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `ProjectBatch.getNextVersion(projectId, false)` returns `{major: 0, minor: 2}` if only `v0.1` exists

  **QA Scenarios**:
  ```
  Scenario: ProjectBatch model type-checks cleanly
    Tool: Bash
    Steps:
      1. Run: npm run lint
      2. Assert: exit code 0
    Evidence: .sisyphus/evidence/task-9-model-projectbatch.txt
  ```

  **Commit**: GROUP with Tasks 7-8, 10-11

---

- [x] 10. Model: `Task`

  **What to do**:
  - Create `app/models/Task.ts`
  - Define `TaskRecord` interface:
    ```typescript
    export interface TaskRecord {
      id: string;
      project_id: string;
      batch_id: string | null;
      title: string;
      description: string | null;
      priority: 'low' | 'medium' | 'high';
      assignee_id: string | null;
      column_id: 'ongoing' | 'revisi' | 'done';
      sort_order: number;
      version_major: number;
      version_minor: number;
      version_patch: number;
      created_at: number;
      updated_at: number;
    }
    ```
  - Add computed helper: `versionString(task: TaskRecord): string` — returns `"v${task.version_major}.${task.version_minor}.${task.version_patch}"`
  - Create `TaskModel extends BaseModel<TaskRecord>` with:
    - `protected tableName = 'tasks'`
    - `async findByProject(projectId: string, batchId?: string | null): Promise<TaskRecord[]>` — if batchId provided filter by it, else return all for project
    - `async findByColumn(projectId: string, column: string, batchId?: string | null): Promise<TaskRecord[]>` — filter by column_id
    - `async getMaxSortOrder(projectId: string, columnId: string): Promise<number>` — for auto-assigning sort_order on create
    - `async incrementVersion(id: string): Promise<TaskRecord | undefined>` — increment `version_patch` by 1, update `updated_at`
  - Export singleton and add to `app/models/index.ts`

  **Must NOT do**:
  - Do NOT implement task move logic here — that belongs in TaskController with DB transaction
  - Do NOT forget `version_major` and `version_minor` are copied from active batch at task creation time (set by controller, not model)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex model with multiple query methods, version increment logic, and nullable FK handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-9, 11)
  - **Blocks**: Task 15 (TaskController)
  - **Blocked By**: Task 5 (tasks migration)

  **References**:
  - `app/models/User.ts` — model template
  - `app/models/BaseModel.ts:51-115` — `update()` method signature for incrementVersion
  - Pattern for incrementVersion: `await this.query().where('id', id).increment('version_patch', 1).update({ updated_at: Date.now() })`

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] All column_id type values match: `'ongoing' | 'revisi' | 'done'`
  - [x] `Task.incrementVersion(id)` method exists

  **QA Scenarios**:
  ```
  Scenario: Task model type-checks cleanly with all required methods
    Tool: Bash
    Steps:
      1. Run: npm run lint
      2. Assert: exit code 0, no errors in Task.ts
    Evidence: .sisyphus/evidence/task-10-model-task.txt
  ```

  **Commit**: GROUP with Tasks 7-9, 11

---

- [x] 11. Model: `TaskLog`

  **What to do**:
  - Create `app/models/TaskLog.ts`
  - Define `TaskLogRecord` interface:
    ```typescript
    export interface TaskLogRecord {
      id: string;
      task_id: string;
      version: string;        // snapshot string "v0.1.0"
      column_from: string | null;  // null for creation log
      column_to: string;
      note: string;
      created_by: string | null;
      created_at: number;
      // NO updated_at
    }
    ```
  - Create `TaskLogModel extends BaseModel<TaskLogRecord>` with:
    - `protected tableName = 'task_logs'`
    - `async findByTask(taskId: string): Promise<TaskLogRecord[]>` — ordered by `created_at ASC`
    - Override `update()` to throw an error: `throw new Error('TaskLog records are immutable')` — prevent accidental updates
  - Export singleton and add to `app/models/index.ts`

  **Must NOT do**:
  - Do NOT add `updated_at` to the interface or any query
  - Do NOT implement a delete method — logs are permanent
  - Do NOT allow the model to be used for anything except create + findByTask

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7-10)
  - **Blocks**: Task 15 (TaskController)
  - **Blocked By**: Task 6 (task_logs migration)

  **References**:
  - `app/models/User.ts` — model template
  - Pattern: override parent `update()` method to throw error for immutability

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `TaskLogRecord` interface has no `updated_at` field
  - [x] `update()` method throws when called

  **QA Scenarios**:
  ```
  Scenario: TaskLog model prevents updates
    Tool: Bash
    Steps:
      1. Run: npm run lint
      2. Assert: exit code 0
    Evidence: .sisyphus/evidence/task-11-model-tasklog.txt
  ```

  **Commit**: GROUP with Tasks 7-10 → `feat(models): add Project, ProjectMember, ProjectBatch, Task, TaskLog models`

---

### Wave 3 — Controllers + Routes (5 parallel tasks, after Wave 2)

- [x] 12. Controller: `ProjectController`

  **What to do**:
  - Create `app/controllers/ProjectController.ts`
  - Extend `BaseController`
  - Implement these methods:
    - `async index(req, res)` — list all projects for `req.user` (via `Project.findAllForUser()`); render Inertia page `"projects"` with `{ projects, user }`
    - `async show(req, res)` — verify user is member of project (via `ProjectMember.isMember()`); render Inertia page `"project-board"` with `{ project, tasks, batches, members, user }`
    - `async store(req, res)` — validate body (`name` required, `description` optional); create project with `id: crypto.randomUUID()`; ALSO insert into `project_members` with `role: 'owner'`; return `jsonCreated(res, 'Project created', { project })`
    - `async update(req, res)` — owner-only; validate; update project name/description; return `jsonSuccess(res, 'Project updated', { project })`
    - `async destroy(req, res)` — owner-only; delete project (CASCADE handles related records); return `jsonSuccess(res, 'Project deleted')`
  - All methods call `this.requireAuth(req)` first
  - `show()` must pass `members` with user info (JOIN users table) for assignee dropdown

  **Must NOT do**:
  - Do NOT allow non-members to access any project resource (403)
  - Do NOT allow non-owners to update/delete a project (403)
  - Do NOT use Zod/Yup/Joi — use `@validators/validate.ts` or inline `getBody()` with schema

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple methods with authorization logic, JOIN queries, Inertia + JSON responses
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 13-15)
  - **Blocks**: Task 16 (routes), Task 18 (projects page)
  - **Blocked By**: Tasks 7, 8 (Project + ProjectMember models)

  **References**:
  - `app/controllers/UserController.ts:88-94` — `requireInertia()` + `response.inertia()` pattern
  - `app/controllers/UserController.ts:137-180` — `create()` pattern: validation, `randomUUID()`, error handling
  - `app/core/BaseController.ts:59-71` — constructor auto-binding
  - `app/core/BaseController.ts:104-135` — `requireAuth()` usage
  - `@core` — `jsonSuccess`, `jsonCreated`, `jsonError`, `jsonServerError` helpers
  - `@models` — `Project`, `ProjectMember` imports

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `GET /projects` returns Inertia response with component `"projects"` (after routes added)
  - [x] Non-member `GET /projects/:id` returns 403

  **QA Scenarios**:
  ```
  Scenario: Projects index returns correct Inertia response
    Tool: Bash (curl)
    Preconditions: Dev server running, valid session cookie
    Steps:
      1. curl -s http://localhost:5555/projects -H "Cookie: auth_id={session}" -H "X-Inertia: true" | jq '.component'
      2. Assert: output is "projects"
    Evidence: .sisyphus/evidence/task-12-project-controller-index.txt

  Scenario: Non-member cannot access project show
    Tool: Bash (curl)
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:5555/projects/{other_project_id} -H "Cookie: auth_id={non_member_session}"
      2. Assert: output is "403"
    Evidence: .sisyphus/evidence/task-12-project-controller-403.txt
  ```

  **Commit**: GROUP with Tasks 13-14 → `feat(controllers): add ProjectController, ProjectMemberController, BatchController`

---

- [x] 13. Controller: `ProjectMemberController`

  **What to do**:
  - Create `app/controllers/ProjectMemberController.ts`
  - Extend `BaseController`
  - Implement:
    - `async store(req, res)` — add member to project; owner-only; validate `user_id` exists in users table; check not already a member (return 409 if duplicate); insert with `role: 'member'`; return `jsonCreated(res, 'Member added', { member })`
    - `async destroy(req, res)` — remove member; owner-only; cannot remove the owner themselves (return 400); delete from `project_members`; return `jsonSuccess(res, 'Member removed')`
  - All methods: `requireAuth(req)` + verify requester is project owner

  **Must NOT do**:
  - Do NOT allow a member to add/remove other members — owner-only operations
  - Do NOT allow the project owner to remove themselves (would orphan the project)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple CRUD with ownership guard
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12, 14-15)
  - **Blocks**: Task 16 (routes)
  - **Blocked By**: Tasks 7, 8 (Project + ProjectMember models)

  **References**:
  - `app/controllers/UserController.ts:137-180` — create pattern with error handling
  - `@core` — `jsonCreated`, `jsonError`, `jsonSuccess` helpers
  - Authorization pattern: `const project = await Project.findById(req.params.id); if (project.owner_id !== req.user.id) return jsonError(res, 'Forbidden', 403)`

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `POST /projects/:id/members` by owner adds member correctly
  - [x] `POST /projects/:id/members` by non-owner returns 403

  **QA Scenarios**:
  ```
  Scenario: Owner can add a member to project
    Tool: Bash (curl)
    Steps:
      1. POST /projects/{id}/members with { user_id: "{other_user_id}" }
      2. Assert: status 201, response has member.id
    Evidence: .sisyphus/evidence/task-13-add-member.txt

  Scenario: Cannot add duplicate member
    Tool: Bash (curl)
    Steps:
      1. POST /projects/{id}/members twice with same user_id
      2. Assert: second call returns 409
    Evidence: .sisyphus/evidence/task-13-duplicate-member.txt
  ```

  **Commit**: GROUP with Tasks 12, 14

---

- [x] 14. Controller: `BatchController`

  **What to do**:
  - Create `app/controllers/BatchController.ts`
  - Extend `BaseController`
  - Implement:
    - `async index(req, res)` — list all batches for project; membership check; return JSON `{ batches }` with computed `version_string` per batch
    - `async store(req, res)` — create new batch; membership check (any member); validate `label` optional, `bump_major` boolean (default false); use `ProjectBatch.getNextVersion(projectId, bumpMajor)` to compute next `{major, minor}`; insert with `is_active: false` (do not auto-activate); return `jsonCreated(res, 'Batch created', { batch })`
    - `async activate(req, res)` — set batch as active; owner-only; use **DB transaction**:
      1. `UPDATE project_batches SET is_active = false WHERE project_id = :projectId`
      2. `UPDATE project_batches SET is_active = true WHERE id = :batchId`
      3. Commit; return `jsonSuccess(res, 'Batch activated', { batch })`
  - Include computed `version_string` field in all responses: `versionString(batch)` from ProjectBatch model

  **Must NOT do**:
  - Do NOT allow two batches to be active simultaneously — enforce with transaction
  - Do NOT allow arbitrary `major`/`minor` values from user — always compute via `getNextVersion()`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: DB transaction for atomic activation + computed version logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12-13, 15)
  - **Blocks**: Task 16 (routes)
  - **Blocked By**: Tasks 7, 8, 9 (Project, ProjectMember, ProjectBatch models)

  **References**:
  - `app/controllers/UserController.ts` — controller structure
  - Knex transaction pattern: `await DB.transaction(async (trx) => { await trx('project_batches').where('project_id', projectId).update({ is_active: false }); await trx('project_batches').where('id', batchId).update({ is_active: true }); })`
  - `@services` — `DB` import for transaction

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `PATCH /projects/:id/batches/:batchId/activate` — exactly one batch is_active after call
  - [x] Creating batch when `v0.1` exists → `bump_major=false` creates `v0.2`; `bump_major=true` creates `v1.0`

  **QA Scenarios**:
  ```
  Scenario: Batch activation enforces single-active constraint
    Tool: Bash (curl)
    Steps:
      1. Create 2 batches (A: v0.1, B: v0.2)
      2. Activate batch A: PATCH /projects/{id}/batches/{a_id}/activate
      3. Activate batch B: PATCH /projects/{id}/batches/{b_id}/activate
      4. GET /projects/{id}/batches
      5. Assert: response contains exactly 1 batch with is_active: true
    Evidence: .sisyphus/evidence/task-14-batch-single-active.txt

  Scenario: Batch version auto-increments correctly
    Tool: Bash (curl)
    Steps:
      1. Create project, no batches yet
      2. POST /projects/{id}/batches { bump_major: false } → Assert: major=0, minor=1
      3. POST /projects/{id}/batches { bump_major: false } → Assert: major=0, minor=2
      4. POST /projects/{id}/batches { bump_major: true } → Assert: major=1, minor=0
    Evidence: .sisyphus/evidence/task-14-batch-version-increment.txt
  ```

  **Commit**: GROUP with Tasks 12-13 → `feat(controllers): add ProjectController, ProjectMemberController, BatchController`

---

- [x] 15. Controller: `TaskController`

  **What to do**:
  - Create `app/controllers/TaskController.ts`
  - Extend `BaseController`
  - Implement:
    - `async store(req, res)` — create task; membership check; validate `title` required, `priority` optional (default 'medium'), `assignee_id` optional (must be project member if set), `batch_id` optional (if not provided, use active batch or null); set `column_id = 'ongoing'`, `sort_order = maxSortOrder + 1`; copy `version_major` and `version_minor` from active batch (or 0/1 if no batch); set `version_patch = 0`; create task; **immediately** create first `task_log`: `{ column_from: null, column_to: 'ongoing', version: 'v0.1.0', note: 'Tugas dibuat' }`; return `jsonCreated(res, 'Task created', { task })`
    - `async move(req, res)` — move task to new column; membership check; validate `column_id` (one of `ongoing|revisi|done`) and `note` (required, non-empty); if `column_id === task.column_id`, return 400 "Cannot move to same column"; use **DB transaction**: (1) increment `version_patch`, (2) update `column_id` + `sort_order` + `updated_at`, (3) create `task_log` with `column_from`, `column_to`, `version` snapshot, `note`, `created_by`; return `jsonSuccess(res, 'Task moved', { task, log })`
    - `async addLog(req, res)` — add manual log (no column change); membership check; validate `note` required; use **DB transaction**: (1) increment `version_patch`, (2) create `task_log` with `column_from = task.column_id`, `column_to = task.column_id`, `version` snapshot, `note`, `created_by`; return `jsonSuccess(res, 'Log added', { log })`
    - `async destroy(req, res)` — delete task; owner-only; cascade deletes task_logs; return `jsonSuccess(res, 'Task deleted')`
    - `async getLogs(req, res)` — get task logs; membership check; return JSON `{ logs }` ordered by `created_at ASC`
  - Version snapshot format: `"v${version_major}.${version_minor}.${version_patch}"` (after increment for move/addLog)

  **Must NOT do**:
  - Do NOT allow move to same column — return 400
  - Do NOT allow empty `note` on move or addLog — required field
  - Do NOT skip DB transaction for move/addLog — atomicity is critical
  - Do NOT allow UPDATE or DELETE on task_logs

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex multi-step transactions, version snapshot logic, multiple authorization checks, first-log creation on task create
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 12-14)
  - **Blocks**: Task 16 (routes), Task 22 (board page)
  - **Blocked By**: Tasks 10, 11 (Task + TaskLog models)

  **References**:
  - Knex transaction: `await DB.transaction(async (trx) => { await trx('tasks').where('id', id).increment('version_patch', 1).update({ column_id, updated_at: Date.now() }); await trx('task_logs').insert({ id: crypto.randomUUID(), ... }); })`
  - `app/controllers/UserController.ts:137-180` — controller structure and error handling
  - `@services` — DB import
  - `@models` — Task, TaskLog imports

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `POST /projects/:id/tasks` creates task with `version_patch = 0` AND creates first task_log with `column_from = null`
  - [x] `PATCH /tasks/:id/move` increments `version_patch` AND creates task_log in single transaction
  - [x] `PATCH /tasks/:id/move` with empty `note` returns 422
  - [x] `PATCH /tasks/:id/move` to same column returns 400

  **QA Scenarios**:
  ```
  Scenario: Task creation creates initial task_log
    Tool: Bash (curl)
    Preconditions: Valid session, project exists with membership
    Steps:
      1. POST /projects/{id}/tasks { title: "Test task", priority: "high" }
      2. Assert: response has task.version_patch === 0
      3. GET /tasks/{task_id}/logs
      4. Assert: response has 1 log with column_from=null, column_to="ongoing", note="Tugas dibuat"
    Evidence: .sisyphus/evidence/task-15-task-create-log.txt

  Scenario: Move increments version atomically + creates log
    Tool: Bash (curl)
    Steps:
      1. PATCH /tasks/{id}/move { column_id: "done", note: "Moving to done" }
      2. Assert: response task.version_patch === 1
      3. GET /tasks/{id}/logs
      4. Assert: response has 2 logs, second has version="v0.1.1", column_to="done"
    Evidence: .sisyphus/evidence/task-15-task-move-atomic.txt

  Scenario: Move to same column returns 400
    Tool: Bash (curl)
    Steps:
      1. Get task current column_id (e.g., "ongoing")
      2. PATCH /tasks/{id}/move { column_id: "ongoing", note: "Same column" }
      3. Assert: status 400
    Evidence: .sisyphus/evidence/task-15-same-column-400.txt
  ```

  **Commit**: `feat(controllers): add TaskController with atomic move+version+log transaction`

---

- [x] 16. Routes: register all 13 new PM routes

  **What to do**:
  - Open `routes/web.ts`
  - Add the following routes BEFORE the catch-all public asset route:
    ```typescript
    // PM Macroma — Projects
    Route.get("/projects", [Auth], ProjectController.index);
    Route.post("/projects", [Auth], ProjectController.store);
    Route.get("/projects/:id", [Auth], ProjectController.show);
    Route.patch("/projects/:id", [Auth], ProjectController.update);
    Route.delete("/projects/:id", [Auth], ProjectController.destroy);

    // PM Macroma — Members
    Route.post("/projects/:id/members", [Auth], ProjectMemberController.store);
    Route.delete("/projects/:id/members/:userId", [Auth], ProjectMemberController.destroy);

    // PM Macroma — Batches
    Route.get("/projects/:id/batches", [Auth], BatchController.index);
    Route.post("/projects/:id/batches", [Auth], BatchController.store);
    Route.patch("/projects/:id/batches/:batchId/activate", [Auth], BatchController.activate);

    // PM Macroma — Tasks
    Route.post("/projects/:id/tasks", [Auth], TaskController.store);
    Route.patch("/tasks/:id/move", [Auth], TaskController.move);
    Route.post("/tasks/:id/logs", [Auth], TaskController.addLog);
    Route.delete("/tasks/:id", [Auth], TaskController.destroy);
    Route.get("/tasks/:id/logs", [Auth], TaskController.getLogs);

    // Redirect old dashboard to projects
    Route.get("/dashboard", [Auth], ProjectController.index);
    ```
  - Import the 4 new controllers at the top of `routes/web.ts`
  - Run `npm run lint` to verify

  **Must NOT do**:
  - Do NOT modify or remove existing routes
  - Do NOT place new routes after the catch-all `Route.get("/public/*", ...)`

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO — must run after Tasks 12-15
  - **Parallel Group**: Sequential after Wave 3
  - **Blocks**: Tasks 17-24 (all frontend work)
  - **Blocked By**: Tasks 12, 13, 14, 15 (all controllers must exist)

  **References**:
  - `routes/web.ts` — existing route registration pattern and import style
  - `app/middlewares/auth.ts` — Auth middleware import

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] All 15 routes registered (13 PM + dashboard redirect + dashboard redirect via index)
  - [x] No existing routes removed

  **QA Scenarios**:
  ```
  Scenario: All new routes respond (no 404)
    Tool: Bash (curl)
    Preconditions: Dev server running
    Steps:
      1. curl -s -o /dev/null -w "%{http_code}" http://localhost:5555/projects -H "Cookie: auth_id={session}"
      2. Assert: 200 (not 404)
      3. curl -s -o /dev/null -w "%{http_code}" http://localhost:5555/dashboard -H "Cookie: auth_id={session}"
      4. Assert: 200 (redirected to projects, component is "projects")
    Evidence: .sisyphus/evidence/task-16-routes.txt
  ```

  **Commit**: `feat(routes): register all PM routes in web.ts`

---

### Wave 4 — Frontend Core (5 parallel tasks, after Task 16)

- [x] 17. Component: `AppLayout.svelte` + `Sidebar.svelte`

  **What to do**:
  - Create `resources/js/Components/AppLayout.svelte`
    - Props: `{ title?: string, children: Snippet }` (Svelte 5 snippet API)
    - Layout: `<div class="flex min-h-screen">` with `<Sidebar />` on left (260px fixed) + `<main class="flex-1 ml-[260px] ...">` for content
    - Include `<svelte:head><title>{title ?? 'PM Macroma'}</title></svelte:head>`
    - Dark mode aware: `dark:bg-surface-dark bg-surface-light`
  - Create `resources/js/Components/Sidebar.svelte`
    - Props: `{ projects: ProjectRecord[], activeProjectId?: string }`
    - Layout: Fixed left sidebar, 260px wide, glassmorphism: `fixed left-0 top-0 h-screen w-[260px] bg-white/10 dark:bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col`
    - Logo/brand at top: "PM Macroma" text with a simple icon (no external SVG lib)
    - Project list: each project as a link (`use:inertia href="/projects/{project.id}"`), active state highlighted
    - "New Project" button at bottom or top
    - Current user name/avatar at very bottom

  **Must NOT do**:
  - Do NOT add horizontal top-nav — sidebar only
  - Do NOT use external icon libraries
  - Do NOT create new CSS files — Tailwind classes only
  - Do NOT add `on:click` (Svelte 4 syntax) — use `onclick` (Svelte 5)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Layout component with glassmorphism styling, responsive design, Svelte 5 snippet API
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Glassmorphism design patterns and Tailwind class combinations

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 18-21)
  - **Blocks**: Task 22 (project-board page)
  - **Blocked By**: Task 16 (routes — for inertia links to work)

  **References**:
  - `resources/js/Pages/dashboard.svelte` — existing page structure, CSS classes pattern, dark mode usage
  - `resources/js/Components/Header.svelte` — existing component structure for reference
  - Svelte 5 snippet API: `import type { Snippet } from 'svelte'; let { children }: { children: Snippet } = $props(); {@render children()}`
  - Glassmorphism pattern: `bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl`
  - Inertia link: `import { inertia } from '@inertiajs/svelte'; <a use:inertia href="/projects/{id}">`

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] Sidebar renders at 260px fixed, glassmorphism styled
  - [x] Main content area has `ml-[260px]` offset

  **QA Scenarios**:
  ```
  Scenario: AppLayout renders sidebar and main content correctly
    Tool: Playwright
    Preconditions: Dev server running, logged in
    Steps:
      1. page.goto('/projects')
      2. Assert: page.locator('[data-testid="sidebar"]').isVisible()
      3. Assert: page.locator('[data-testid="sidebar"]').evaluate(el => el.offsetWidth === 260)
      4. Screenshot: .sisyphus/evidence/task-17-sidebar.png
    Evidence: .sisyphus/evidence/task-17-sidebar.png
  ```

  **Commit**: `feat(frontend): add AppLayout and Sidebar components`

---

- [x] 18. Page: `projects.svelte` (projects index)

  **What to do**:
  - Create `resources/js/Pages/projects.svelte`
  - Props interface:
    ```typescript
    interface Props {
      projects: Array<ProjectRecord & {
        active_batch_label?: string;
        task_counts: { ongoing: number, revisi: number, done: number };
        member_count: number;
      }>;
      user: UserRecord;
    }
    ```
  - Use `AppLayout` as wrapper
  - Show grid of project cards (2-3 columns, glassmorphism cards)
  - Each card: project name, description excerpt, active batch label (if any), mini task count pills, member count, "Open Board" link
  - "New Project" button → inline form or modal with `name` (required) + `description` (optional)
  - Create project: `router.post('/projects', { name, description }, { headers: buildCSRFHeaders(), onSuccess: () => { ... } })`
  - Empty state: "No projects yet. Create your first project." with a call-to-action

  **Must NOT do**:
  - Do NOT add search/filter for project list
  - Do NOT add pagination
  - Do NOT use `$form` store from `@inertiajs/svelte` — use manual `$state` + `router.post()`

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Page layout with card grid, empty state, create form, glassmorphism styling
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17, 19-21)
  - **Blocks**: Task 22 (project-board page)
  - **Blocked By**: Task 16 (routes), Task 17 (AppLayout)

  **References**:
  - `resources/js/Pages/dashboard.svelte` — props pattern, $inertiaPage, router usage
  - `resources/js/Components/helper.ts` — `buildCSRFHeaders()`, `Toast()` imports
  - Svelte 5 `router.post`: `import { router } from '@inertiajs/svelte'; router.post('/projects', data, { headers: buildCSRFHeaders(), preserveState: false })`
  - `app/controllers/ProjectController.ts` — `index()` response shape (tasks counts, member counts)

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] Playwright: page renders list of projects for logged-in user
  - [x] Playwright: "New Project" creates project and it appears in list

  **QA Scenarios**:
  ```
  Scenario: Projects page renders user's projects
    Tool: Playwright
    Steps:
      1. page.goto('/projects')
      2. Assert: page.locator('[data-testid="project-card"]').count() >= 1 (assuming seed data)
      3. Screenshot: .sisyphus/evidence/task-18-projects-page.png
    Evidence: .sisyphus/evidence/task-18-projects-page.png

  Scenario: Create new project from projects page
    Tool: Playwright
    Steps:
      1. page.goto('/projects')
      2. page.click('[data-testid="new-project-btn"]')
      3. page.fill('[data-testid="project-name-input"]', 'Test Project Playwright')
      4. page.click('[data-testid="create-project-submit"]')
      5. Assert: page.locator('text=Test Project Playwright').isVisible()
    Evidence: .sisyphus/evidence/task-18-create-project.png
  ```

  **Commit**: `feat(frontend): add projects index page`

---

- [x] 19. Components: `KanbanBoard.svelte` + `TaskCard.svelte` (static, no DnD yet)

  **What to do**:
  - Create `resources/js/Components/KanbanBoard.svelte`
    - Props: `{ tasks: TaskRecord[], members: ProjectMemberWithUser[], activeBatch?: ProjectBatchRecord }`
    - Render 3 columns: "On Going" | "Revisi" | "Done" (hardcoded column order)
    - Each column is a `<div data-column="{columnId}" data-testid="kanban-column-{columnId}">` container
    - Tasks filtered per column (use `$state` arrays — NOT `$derived` — for DnD compatibility later)
    - Column header: name + task count badge
    - Glassmorphism column card: `bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4`
    - Tasks rendered as `<TaskCard>` components
    - "Add Task" button per column header (opens AddTaskModal in parent)
    - NO DnD in this task — that's Task 22
  - Create `resources/js/Components/TaskCard.svelte`
    - Props: `{ task: TaskRecord, assignee?: UserRecord }`
    - Show: title, priority badge (color-coded: high=red/`bg-red-500/20 text-red-400`, medium=yellow, low=green), assignee avatar initial or name, version chip (`v${task.version_major}.${task.version_minor}.${task.version_patch}` in monospace badge), action buttons (move-log icon, expand accordion)
    - Add `data-task-card` attribute to root element, `data-testid="version-chip"` to version badge
    - Compact card design — max 100px height when collapsed

  **Must NOT do**:
  - Do NOT use `$derived` for column arrays — use `$state` + filter in `$effect` (DnD requires reassignment)
  - Do NOT add DnD bindings in this task — deferred to Task 22
  - Do NOT add `on:click` (Svelte 4) — use `onclick` (Svelte 5)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI layout with glassmorphism columns and compact card design
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17-18, 20-21)
  - **Blocks**: Task 22 (DnD integration)
  - **Blocked By**: Task 16 (routes)

  **References**:
  - `resources/js/Pages/dashboard.svelte` — Tailwind patterns, dark mode, card styling
  - Priority badge colors: `high` → `bg-red-500/20 text-red-400`, `medium` → `bg-yellow-500/20 text-yellow-400`, `low` → `bg-green-500/20 text-green-400`
  - Version chip: `<span class="font-mono text-xs bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded" data-testid="version-chip">v{major}.{minor}.{patch}</span>`
  - `$state` + `$effect` pattern for column arrays (critical for DnD compatibility):
    ```typescript
    let ongoingTasks = $state<TaskRecord[]>([]);
    $effect(() => { ongoingTasks = tasks.filter(t => t.column_id === 'ongoing').sort((a,b) => a.sort_order - b.sort_order); });
    ```

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] Three kanban columns render with correct `data-column` attributes
  - [x] Version chip visible on each task card with correct format

  **QA Scenarios**:
  ```
  Scenario: Kanban renders 3 columns with tasks
    Tool: Playwright
    Preconditions: Project with tasks in each column
    Steps:
      1. page.goto('/projects/{id}')
      2. Assert: page.locator('[data-column="ongoing"]').isVisible()
      3. Assert: page.locator('[data-column="revisi"]').isVisible()
      4. Assert: page.locator('[data-column="done"]').isVisible()
      5. Assert: page.locator('[data-testid="version-chip"]').first().textContent() matches /v\d+\.\d+\.\d+/
      6. Screenshot: .sisyphus/evidence/task-19-kanban-static.png
    Evidence: .sisyphus/evidence/task-19-kanban-static.png
  ```

  **Commit**: GROUP with Tasks 20-21

---

- [x] 20. Components: `MoveModal.svelte` + `AddLogModal.svelte`

  **What to do**:
  - Create `resources/js/Components/MoveModal.svelte`
    - Props: `{ task: TaskRecord, targetColumn: string, onConfirm: (note: string) => void, onCancel: () => void }`
    - Modal overlay: `fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center`
    - Modal card: glassmorphism `bg-surface-dark/95 backdrop-blur-xl border border-white/10 rounded-xl p-6 w-full max-w-md`
    - Show: task title, "Moving from {column_from} → {column_to}" info line
    - `<textarea data-testid="move-modal-note" ...>` — required, min 1 character
    - Submit button `data-testid="move-modal-submit"` — disabled until note is non-empty
    - Cancel button — calls `onCancel()`
    - Root element: `data-testid="move-modal"`
    - Use Svelte `fly` transition on mount/unmount
  - Create `resources/js/Components/AddLogModal.svelte`
    - Props: `{ task: TaskRecord, onConfirm: (note: string) => void, onCancel: () => void }`
    - Similar structure to MoveModal but header says "Add Log Entry"
    - Explains: "This will increment the task version without moving it"
    - Textarea `data-testid="add-log-note"` required
    - Root element: `data-testid="add-log-modal"`

  **Must NOT do**:
  - Do NOT allow empty note submission (button disabled + HTML required attribute)
  - Do NOT use external animation libraries — Svelte `fly`/`fade` transitions only

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Modal UI with glassmorphism, Svelte transitions, accessibility
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17-19, 21)
  - **Blocks**: Task 22 (DnD/board integration)
  - **Blocked By**: Task 16 (routes)

  **References**:
  - `resources/js/Pages/dashboard.svelte` — modal pattern if any, Tailwind classes
  - Svelte fly transition: `import { fly } from 'svelte/transition'; <div transition:fly={{ y: 20, duration: 200 }}>`
  - Column display names: `{ ongoing: 'On Going', revisi: 'Revisi', done: 'Done' }`

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `data-testid="move-modal"`, `data-testid="move-modal-note"`, `data-testid="move-modal-submit"` attributes present
  - [x] Submit button disabled when note is empty

  **QA Scenarios**:
  ```
  Scenario: MoveModal submit disabled when note is empty
    Tool: Playwright
    Steps:
      1. Render MoveModal with task prop (programmatically or via board page)
      2. Assert: page.locator('[data-testid="move-modal-submit"]').isDisabled()
      3. page.fill('[data-testid="move-modal-note"]', 'Test note')
      4. Assert: page.locator('[data-testid="move-modal-submit"]').isEnabled()
    Evidence: .sisyphus/evidence/task-20-move-modal.png
  ```

  **Commit**: GROUP with Tasks 19, 21

---

- [x] 21. Components: `AddTaskModal.svelte` + `VersionLogAccordion.svelte`

  **What to do**:
  - Create `resources/js/Components/AddTaskModal.svelte`
    - Props: `{ projectId: string, members: ProjectMemberWithUser[], onClose: () => void }`
    - Form: `title` (required text input), `priority` (dropdown: low/medium/high, default medium), `assignee_id` (dropdown from project members only, optional), `description` (textarea, optional)
    - `data-testid="add-task-modal"` on root
    - Submit: `router.post('/projects/{projectId}/tasks', data, { headers: buildCSRFHeaders(), onSuccess: onClose })`
    - Glassmorphism modal styling, Svelte `scale` transition
  - Create `resources/js/Components/VersionLogAccordion.svelte`
    - Props: `{ taskId: string }`
    - Collapsible: button to toggle open/close, Svelte `slide` transition
    - On open: fetch logs via `fetch('/tasks/{taskId}/logs')` (plain fetch, not Inertia) → `$state` array
    - Show log list: each entry shows version badge, column arrow (`null → On Going` for creation, `Revisi → Done` for moves), note text, relative timestamp
    - When `column_from` is null: display "Created" instead of column name
    - `data-testid="version-log-accordion"` on root

  **Must NOT do**:
  - Do NOT show users outside project members in assignee dropdown
  - Do NOT allow submitting AddTaskModal without title
  - Do NOT use external component libraries for dropdowns — native `<select>` with Tailwind

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Forms with dropdowns, accordion UI, async fetch inside component
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17-20)
  - **Blocks**: Task 22 (board page integration)
  - **Blocked By**: Task 16 (routes)

  **References**:
  - `resources/js/Pages/dashboard.svelte` — form patterns with Svelte 5
  - `resources/js/Components/helper.ts` — `buildCSRFHeaders()` import
  - Svelte slide transition: `import { slide } from 'svelte/transition'; <div transition:slide={{ duration: 200 }}>`
  - Fetch logs: `const res = await fetch('/tasks/' + taskId + '/logs'); const data = await res.json();`

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] AddTaskModal assignee dropdown only shows project members
  - [x] VersionLogAccordion shows "Created" for null column_from entry

  **QA Scenarios**:
  ```
  Scenario: AddTaskModal creates task and closes
    Tool: Playwright
    Steps:
      1. page.click('[data-testid="add-task-btn"]')
      2. Assert: page.locator('[data-testid="add-task-modal"]').isVisible()
      3. page.fill('[data-testid="task-title-input"]', 'New Playwright Task')
      4. page.click('[data-testid="task-submit-btn"]')
      5. Assert: page.locator('[data-testid="add-task-modal"]').not.isVisible()
      6. Assert: page.locator('text=New Playwright Task').isVisible()
    Evidence: .sisyphus/evidence/task-21-add-task-modal.png

  Scenario: VersionLogAccordion shows creation log
    Tool: Playwright
    Steps:
      1. Locate a task card
      2. page.click('[data-testid="version-log-accordion"] button')
      3. Assert: log list visible with entry containing "Created"
    Evidence: .sisyphus/evidence/task-21-version-log.png
  ```

  **Commit**: GROUP with Tasks 19-20 → `feat(frontend): add KanbanBoard, TaskCard, MoveModal, AddLogModal, AddTaskModal, VersionLogAccordion`

---

### Wave 5 — DnD + Integration + Polish (3 parallel tasks, after Wave 4)

- [x] 22. Page: `project-board.svelte` — full board with DnD integration

  **What to do**:
  - Create `resources/js/Pages/project-board.svelte`
  - Props interface:
    ```typescript
    interface Props {
      project: ProjectRecord;
      tasks: TaskRecord[];
      batches: BatchRecord[];
      members: ProjectMemberWithUser[];
      activeBatch?: ProjectBatchRecord;
      user: UserRecord;
    }
    ```
  - Use `AppLayout` as wrapper with `<KanbanBoard>` and all modals
  - **DnD Integration** (CRITICAL — read carefully):
    - Import `dndzone` from `svelte-dnd-action` and `import type { DndEvent } from 'svelte-dnd-action'`
    - Use THREE separate `$state` arrays: `let ongoingTasks = $state<TaskRecord[]>([])`; likewise for revisi and done
    - Use `$effect` to sync incoming `tasks` prop into the three state arrays (runs on prop update)
    - Apply `use:dndzone={{ items: ongoingTasks, ...}}` to each column container div
    - Handle `onconsider` (Svelte 5 syntax, NOT `on:consider`): update the column array with `e.detail.items` for visual feedback, track source column
    - Handle `onfinalize` (Svelte 5 syntax): detect if cross-column move (check `e.detail.info.source !== currentColumn`); if same-column → just update sort_order silently (no modal, no API), if cross-column → set `pendingMove = { taskId, fromColumn, toColumn }` → show MoveModal
    - **Snapshot pattern**: before each `handleFinalize`, snapshot `{ ongoingTasks, revisiTasks, doneTasks }` for rollback on error
    - MoveModal `onConfirm(note)`: call `router.patch('/tasks/{taskId}/move', { column_id, note }, { headers: buildCSRFHeaders(), preserveState: true, onSuccess: () => { pendingMove = null }, onError: () => { restoreSnapshot(); pendingMove = null } })`
    - MoveModal `onCancel()`: restore snapshot, `pendingMove = null`
    - Header area: batch selector dropdown (shows active batch, allows switching)
    - "Add Task" button in each column header → shows `AddTaskModal`
    - Task card click → shows `VersionLogAccordion` in expanded card
    - Manual log button on each card → shows `AddLogModal`

  **Must NOT do**:
  - Do NOT use `$derived` for column arrays — DnD requires `$state` + `$effect`
  - Do NOT use `on:consider`/`on:finalize` — Svelte 5 requires `onconsider`/`onfinalize`
  - Do NOT fire PATCH without MoveModal for cross-column drops
  - Do NOT forget `headers: buildCSRFHeaders()` on every mutation
  - Do NOT skip snapshot-and-restore for optimistic UI

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex state management, DnD integration with MoveModal intercept, snapshot/rollback pattern, cross-cutting coordination of all board components
  - **Skills**: [`ui-ux-pro-max`]
    - `ui-ux-pro-max`: Board layout and UX polish

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 23, 24)
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4 (final QA)
  - **Blocked By**: Tasks 1, 15, 17-21

  **References**:
  - svelte-dnd-action docs: `use:dndzone={{ items, flipDurationMs: 200 }}`
  - `$state` + `$effect` pattern (MUST follow exactly):
    ```typescript
    let ongoingTasks = $state<TaskRecord[]>([]);
    let revisiTasks = $state<TaskRecord[]>([]);
    let doneTasks = $state<TaskRecord[]>([]);
    $effect(() => {
      ongoingTasks = tasks.filter(t => t.column_id === 'ongoing').sort((a,b) => a.sort_order - b.sort_order);
      revisiTasks = tasks.filter(t => t.column_id === 'revisi').sort((a,b) => a.sort_order - b.sort_order);
      doneTasks = tasks.filter(t => t.column_id === 'done').sort((a,b) => a.sort_order - b.sort_order);
    });
    ```
  - Snapshot pattern:
    ```typescript
    let snapshot = $state({ ongoing: [], revisi: [], done: [] });
    function handleFinalize(column: string, e: CustomEvent<DndEvent<TaskRecord>>) {
      snapshot = { ongoing: [...ongoingTasks], revisi: [...revisiTasks], done: [...doneTasks] };
      // ... detect cross-column, show modal or update silently
    }
    function restoreSnapshot() {
      ongoingTasks = snapshot.ongoing; revisiTasks = snapshot.revisi; doneTasks = snapshot.done;
    }
    ```
  - `resources/js/Components/helper.ts` — `buildCSRFHeaders()`
  - `app/controllers/ProjectController.ts` — `show()` response shape reference

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] Playwright: cross-column drag shows `[data-testid="move-modal"]` before API fires
  - [x] Playwright: same-column drag does NOT show modal
  - [x] Playwright: after move confirm, version chip shows `v0.1.1`
  - [x] Playwright: move cancel restores card to original column

  **QA Scenarios**:
  ```
  Scenario: Cross-column DnD triggers MoveModal
    Tool: Playwright
    Preconditions: Board with at least 1 task in "ongoing" column
    Steps:
      1. page.goto('/projects/{id}')
      2. const card = page.locator('[data-column="ongoing"] [data-task-card]').first()
      3. const doneCol = page.locator('[data-column="done"]')
      4. await card.dragTo(doneCol)
      5. Assert: page.locator('[data-testid="move-modal"]').isVisible({ timeout: 2000 })
      6. Assert: page.locator('[data-testid="move-modal-submit"]').isDisabled()
      7. page.fill('[data-testid="move-modal-note"]', 'Playwright drag to done')
      8. Assert: page.locator('[data-testid="move-modal-submit"]').isEnabled()
      9. page.click('[data-testid="move-modal-submit"]')
      10. Assert: page.locator('[data-testid="move-modal"]').not.isVisible()
      11. Assert: page.locator('[data-column="done"] [data-task-card]').count() >= 1
      12. Assert: page.locator('[data-testid="version-chip"]').first().textContent() matches /v0\.1\.1/
      13. Screenshot: .sisyphus/evidence/task-22-dnd-move-modal.png
    Evidence: .sisyphus/evidence/task-22-dnd-move-modal.png

  Scenario: Same-column drag does NOT trigger modal or version increment
    Tool: Playwright
    Steps:
      1. Note current version chip text on first card
      2. Drag first task in "ongoing" to bottom of "ongoing" (same column reorder)
      3. Assert: page.locator('[data-testid="move-modal"]').not.isVisible({ timeout: 500 })
      4. Assert: version chip text unchanged
    Evidence: .sisyphus/evidence/task-22-same-column-no-modal.png

  Scenario: Move cancel restores card to original column
    Tool: Playwright
    Steps:
      1. Drag card from "ongoing" to "done"
      2. MoveModal appears
      3. page.click('[data-testid="move-modal-cancel"]')
      4. Assert: card is back in "ongoing" column
      5. Assert: version chip unchanged
    Evidence: .sisyphus/evidence/task-22-move-cancel-restore.png
  ```

  **Commit**: `feat(frontend): add project-board page with DnD integration`

---

- [x] 23. Landing page: glassmorphism redesign for PM Macroma

  **What to do**:
  - Open `resources/js/Pages/landing.svelte` (full redesign)
  - Replace ALL Nara Framework marketing content with PM Macroma content
  - Structure:
    - **Hero section**: Large headline "Manage Projects with Clarity" or similar; subtext about PM Macroma; CTA buttons "Get Started" → `/register` and "Sign In" → `/login`; glassmorphism hero card showing a mockup or abstract UI representation
    - **Features section**: 3-4 feature cards (Kanban Board, Version Tracking, Team Collaboration, Batch Management); glassmorphism cards with icons (inline SVGs, no external lib)
    - **How it works**: Brief 3-step flow (Create Project → Add Tasks → Track Versions)
    - **CTA section**: Final call to action
  - Glassmorphism throughout: `bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl`
  - Dark mode native: `dark:bg-surface-dark bg-gradient-to-br from-slate-900 to-slate-800`
  - Svelte `fly`/`fade` transitions for section entrances (no external animation lib)
  - NO Nara Framework branding — zero mentions

  **Must NOT do**:
  - Do NOT keep any Nara Framework references or screenshots
  - Do NOT add new CSS files — Tailwind only
  - Do NOT use external animation libraries (Framer Motion, etc.)
  - Do NOT add more than 4 feature cards (keep it focused)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Full page UI design with glassmorphism, animations, marketing copywriting
  - **Skills**: [`ui-ux-pro-max`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 22, 24)
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4
  - **Blocked By**: Task 16 (routes must work for CTA links)

  **References**:
  - `resources/js/Pages/landing.svelte` — existing file structure to replace
  - `resources/js/Pages/dashboard.svelte` — CSS patterns, dark mode classes, Tailwind tokens
  - Glassmorphism pattern: `bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl`
  - Tailwind design tokens in use: `text-primary-600`, `bg-surface-card-light`, `dark:bg-surface-dark`

  **Acceptance Criteria**:
  - [x] `npm run lint` — exit code 0
  - [x] `grep -c "Nara" resources/js/Pages/landing.svelte` — 0 matches
  - [x] Playwright: landing page loads at `/`, shows "PM Macroma" branding

  **QA Scenarios**:
  ```
  Scenario: Landing page shows PM Macroma content, no Nara references
    Tool: Playwright
    Steps:
      1. page.goto('/')
      2. Assert: page.locator('text=PM Macroma').isVisible()
      3. Assert: page.locator('text=Nara').count() === 0
      4. Assert: page.locator('a[href="/login"]').isVisible()
      5. Assert: page.locator('a[href="/register"]').isVisible()
      6. Screenshot: .sisyphus/evidence/task-23-landing.png
    Evidence: .sisyphus/evidence/task-23-landing.png
  ```

  **Commit**: `feat(landing): glassmorphism redesign for PM Macroma`

---

- [x] 24. Branding sweep: Nara → PM Macroma across all files

  **What to do**:
  - `package.json`: change `"name": "nara"` to `"name": "pm-macroma"`
  - `resources/js/Components/Header.svelte`: replace `NARA.` text/logo with `PM Macroma` (keep the component structure, just change the brand text)
  - Any other `.svelte` file with "NARA." or "Nara Framework" text: replace with "PM Macroma"
  - Check and update: `resources/js/app.ts` or any title meta tags
  - Add `data-testid="sidebar"` to `Sidebar.svelte` root element (if not already added in Task 17)
  - Verify with grep: `grep -rn "NARA\." resources/js/` must return 0 matches
  - Verify: `grep -n '"name": "nara"' package.json` must return 0 matches

  **Must NOT do**:
  - Do NOT rename `NaraIcon.svelte` file — just update the icon content or leave unused
  - Do NOT change file names or import paths that would break builds
  - Do NOT modify server.ts or other backend files for branding

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple text replacements across a few files + grep verification
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (parallel with Tasks 22, 23)
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4
  - **Blocked By**: Task 17 (Sidebar must exist to add data-testid)

  **References**:
  - `resources/js/Components/Header.svelte` — contains "NARA." branding to replace
  - `package.json` — `name` field to update
  - Grep command to find all instances: `grep -rn "NARA\.\|Nara Framework" resources/js/ --include="*.svelte"`

  **Acceptance Criteria**:
  - [x] `grep -rn "NARA\." resources/js/ --include="*.svelte"` — 0 matches
  - [x] `grep -n '"name": "nara"' package.json` — 0 matches
  - [x] `npm run lint` — exit code 0

  **QA Scenarios**:
  ```
  Scenario: Zero Nara branding in frontend files
    Tool: Bash
    Steps:
      1. Run: grep -rn "NARA\." resources/js/ --include="*.svelte"
      2. Assert: no output (exit 1 from grep = no matches = pass)
      3. Run: grep -n '"name": "nara"' package.json
      4. Assert: no output
      5. Run: npm run lint
      6. Assert: exit code 0
    Evidence: .sisyphus/evidence/task-24-branding-sweep.txt
  ```

  **Commit**: `chore(branding): sweep Nara → PM Macroma, rename package, redirect dashboard`

---

## Final Verification Wave

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed. Wait for user's explicit approval before marking work complete.**

- [x] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [x] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run lint` (tsc --noEmit). Review all changed/new files for: `as any`/`@ts-ignore`, empty catches, console.log in production code (Logger.* OK), commented-out code, unused imports, relative imports where aliases required. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Lint [PASS/FAIL] | Files [N clean/N issues] | VERDICT: APPROVE/REJECT`

- [x] F3. **Real Manual QA** — `unspecified-high` + `playwright` skill
  Start dev server. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (DnD → MoveModal → version increment → log display). Test edge cases: empty project (no tasks, no batch), task with no assignee, batch activation switching. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT: APPROVE/REJECT`

- [x] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual file diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT: APPROVE/REJECT`

---

## Commit Strategy

```
T1:  install(deps): add svelte-dnd-action
T2-T6: feat(db): add PM migrations (projects, project_members, batches, tasks, task_logs)
T7-T11: feat(models): add Project, ProjectMember, ProjectBatch, Task, TaskLog models
T12-T14: feat(controllers): add ProjectController, ProjectMemberController, BatchController
T15: feat(controllers): add TaskController with atomic move+version+log transaction
T16: feat(routes): register 13 PM routes in web.ts
T17: feat(frontend): add AppLayout and Sidebar components
T18: feat(frontend): add projects index page
T19-T21: feat(frontend): add KanbanBoard, TaskCard, MoveModal, AddLogModal, AddTaskModal, VersionLogAccordion
T22: feat(frontend): add project-board page with DnD integration
T23: feat(landing): glassmorphism redesign for PM Macroma
T24: chore(branding): sweep Nara → PM Macroma, rename package, redirect dashboard
```

---

## Success Criteria

### Verification Commands
```bash
# Migrations
node nara db:fresh && node nara db:status
# Expected: all new migrations show "Ran"

# TypeScript
npm run lint
# Expected: exit code 0

# Projects API
curl -s http://localhost:5555/projects -H "Cookie: auth_id={session}" | jq '.component'
# Expected: "projects"

# Task move atomicity
curl -s -X PATCH http://localhost:5555/tasks/{id}/move \
  -H "Cookie: auth_id={session}" \
  -H "X-CSRF-Token: {token}" \
  -H "Content-Type: application/json" \
  -d '{"column_id":"done","note":"Test move"}' | jq '.data.version_patch'
# Expected: 1

# Branding
grep -rn "NARA\." resources/js/ --include="*.svelte"; echo "exit: $?"
# Expected: exit: 0 with no output lines
grep -n '"name": "nara"' package.json; echo "exit: $?"
# Expected: exit: 0 with no output lines
```

### Final Checklist
- [x] All "Must Have" features present and functional
- [x] All "Must NOT Have" patterns absent (grep-verified)
- [x] `npm run lint` exits 0
- [x] All 5 migrations run successfully
- [x] Kanban DnD cross-column move: MoveModal appears, note required, version increments
- [x] Same-column reorder: NO MoveModal, NO version increment
- [x] task_logs immutable: no UPDATE or DELETE routes for task_logs
- [x] Single active batch per project: activation deactivates others atomically
- [x] Owner also in project_members pivot with role='owner'
- [x] Branding grep assertions pass
