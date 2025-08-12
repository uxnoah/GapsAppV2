image.png# Task List

## Breadcrumb (top)
- Next step I will take next turn is: Draft AI brain I/O schema v0 (envelopes + ops) and stub apply-ops endpoint [D6].

## Conventions
- Rule: Number all tasks in `Next`; maintain numbering when editing.
- Rule: When a Now task/subtask is completed, move it to Done in the same turn; update Breadcrumb with the immediate next step.
- Rule: For any non-trivial task in Now/Next, append a detail footnote like `[D1]` and document the context/success criteria in "Task Details" at the bottom. Link out to docs when useful.
- Rule: Use ⭐ to mark strong candidates to pick up next.

## Now
1. Realtime polish (keep optional items only)
   - [ ] Add small reconnect/backoff if channel closes (optional)

## Next
1. AI brain I/O schema v0 ⭐
   - Define outbound envelope (conversation + compact diagram + board/version) [D6]
   - Define inbound updates (domain ops + optional replace_document) [D6]
   - Add batch apply endpoint `/api/boards/[id]/apply-ops` (atomic, idempotent) [D6]
   - Prefer server-applied changes + realtime UI updates; skip optimistic initially [D6]
   - LangFlow: tool schema for `submit_diagram_updates` + prompt wiring [D6]

## Plan: Supabase rollout (Auth first, then DB)

1) Auth (Google/GitHub)
   - [x] Confirm `.env.local` has NEXT_PUBLIC_SUPABASE_URL/ANON and URLs configured in Supabase
   - [x] `/login` (client) with Google/GitHub; fallback handles implicit hash tokens
   - [x] Server helpers: read session on API routes; block if no session
   - [x] Remove default demo bootstrap (`getOrCreateDefaultUser/Board`) after RLS
   - [x] Checkpoint: Sign in sets server cookie; UI loads diagram

2) Database swap to Supabase Postgres
   - [x] Update `prisma/schema.prisma` provider to `postgresql` with `directUrl`
   - [x] Ensure `.env.local` has DATABASE_URL (pooled), DIRECT_URL, SHADOW_DATABASE_URL
   - [x] Run `npm run db:push && npx prisma generate`
   - [x] Checkpoint: Tables visible in Supabase → Database → Tables

3) RLS policies
    - [x] Enable RLS on `boards`, `thoughts`, `work_sessions`, `activity_logs`
    - [x] Policies: owner-only read/write via `auth.uid()` mapping (link Supabase auth user to our `users` row) and admin bypass
    - [ ] Seed admin emails as `is_admin = true`
    - [x] Checkpoint: Unauthed blocked; authed owner OK

4) Realtime (optional milestone)
   - [x] Subscribe to `thoughts` changes on client; merge updates in `gaps-canvas`
   - [x] Checkpoint: Second browser receives inserts/moves/edits live (intermittent UI state issues noted)

5) Cleanup
   - [x] Remove test-database routes and demo code
   - [x] Update docs/ENVIRONMENT.md with final steps

## New issues / Tech debt
- Realtime misses under rapid local edits/moves (state mgmt) → address with state refactor later
- Console error fixes were implemented; keep watch during dev hot reload
- Suppress build warnings from `@supabase/realtime-js` dynamic import (optional)
- Add runtime health banner for auth in dev (optional)

3. Vector store (knowledge base)
   3.1 Enable `pgvector` on Supabase; create embedding column(s) and index
   3.2 Add embedding pipeline (e.g., OpenAI/other) and ingest script
   3.3 Add minimal search endpoint using cosine distance

## Later/Backlog
- Front-end polish (deferred from Now)
  - Fix "new thought" flicker when adding another item immediately after typing [D3]
  - Fix section snap-back when pressing Load (queue-by-id + reconcile) [D3]
- TypeScript Infrastructure & Code Quality
  - Define proper interfaces for API request/response formats
  - Implement proper error handling at the source instead of catching everywhere
  - Use robust state management patterns instead of null checks everywhere
  - Audit remaining `any` usage and replace
  - Standardize error handling patterns across API routes
  - Review null safety patterns; implement consistent approaches
  - Document expected data structures for all database operations

- API Reorganization & Structure
  - Reorganize API routes from `/api/test-database/` (consider `/api/dev-tools/` or proper structure)
  - Move board ops to `/api/boards` (POST/GET/PUT)
  - Move thought ops to `/api/thoughts` (batch/create/edit/move)
  - Move user ops to `/api/users` (create)
  - Move utilities to `/api/admin` (health/stats/activity)
  - Update all frontend fetch calls; add API utilities; add loading/error states

- Database & Data Structure
  - Add improved board creation options (title/userId/description convenience)
  - Instrument API routes to log user actions using sessions consistently
  - Add Sandbox as fifth section option
  - Revisit optional fields (aiGenerated, confidence, timestamps) usage in types
  - Consider renaming UI `items` → `thoughts` across codebase
  - Add way to change tags/ai flags/metadata from UI
  - Make target order optional defaults in move operations
  - Comment or remove unused helpers until needed

- UI/UX Improvements
  - Remove unused colors prop from gaps-box; annotate current usage
  - Settings & menu structure; chat UI framework; onboarding flow

- AI Agent / Error Handling
  - Add better error handling/logging in `gaps-canvas`
  - Implement rollback on API failure; review `OptimisticUpdate<T>` usage

- Authentication & Hosting
  - Finalize auth UX; remove default user/board bootstrap once auth exists; secure routes with RLS + server checks

- Brain Integration
  - Update with new brain (not using Chipp); add review/approval state; decide agent architecture

- Code Cleanup & Docs
  - Remove unused CreateItemRequest; update object structure changes in utils; add Sandbox to utils section list

## Done
 - RLS prep
  - Realtime MVP
    - Server session endpoint added; browser websocket authenticated
    - Insert echo ignored and id dedupe added in `gaps-canvas`
    - Cross-tab updates working for add/move/edit/delete; minor gaps remain due to local state

  - Settings persistence MVP
    - Added `GET/PUT /api/users/preferences` storing generic JSON in `users.preferences`
    - Wired Settings page toggles/select to read/write (`openLastDiagram`, `enableRealtime`, `experienceLevel`)

  - Sign-in UX
    - Removed GitHub button; kept Google OAuth
    - Added email magic-link and email/password sign-up/sign-in flows
   - Ran auth_id backfill in Supabase SQL editor
   - Noted one leftover user without auth_id: `demo@chapp.local` (will clean up before enabling RLS)
 - RLS enabled + policies created (owner-only + admin bypass) on `boards`, `thoughts`, `work_sessions`, `activity_logs`
 - RLS verification
   - Incognito GET `/api/diagram` → 401/403 Unauthorized
   - Logged-in GET `/api/diagram` → OK; app loads and CRUD works with minor perf issues to tune
- Cross-user verification: isolated per user OK; admin toggle optional (see [D1])
- Login UX
  - Client-only login component; server `/login` redirect if already authed
  - Fallback for implicit hash tokens → server cookie via `/api/auth/set-session`
  - `/` redirects unauthenticated users to `/login`

- Header navigation
  - Added Canvas/Menu/Settings links in header

- Menu & settings UX
  - "Items" label changed to "thoughts" on list
  - Create New moved to bottom as a single button; creates board, selects, and navigates to canvas
  - Settings page: added Placeholder section with toggles and dropdowns (no persistence yet)

- Swapped first call site to wrapper: `src/app/live-test/page.tsx` GET `/api/diagram`.
- Created and commented API wrapper `src/lib/api.ts` (routes, apiFetch, ApiError, helpers).
- Replaced fetch with wrapper in `gaps-canvas.tsx` for: load, save, title update sim, add/edit/delete/move, AI sims; removed response-branches; fixed type-safe mapping.
- Unified catch blocks to use `getApiErrorMessage`.
- Converted remaining live-test page calls to wrapper.
- Added optional GET retry policy hook (off by default) in wrapper.
 - 1.4: Smoke tests
  - 1.4.1: Created `docs/smoke-tests.md` with end-to-end steps
  - 1.4.2: Added “✅ Diagram loaded (items: N)” success log; existing success logs confirm add/edit/move/delete/title/save
  - 1.4.3: Ran checklist via Debug Panel and `/live-test` (user confirmed logs); no blocking gaps found
- 1.2.1/1.2.2: Added Thought DTO/request/response types; applied to POST/PUT/PATCH thought routes; callers now use `api.<method><ThoughtResponse>` generics.
- 1.2.3: Updated UI mapping comments in `gaps-canvas.tsx` (content→text, order mapping, dates).
- 1.2.4: Added compile-time response generics in callers for add/edit/move flows.
- Track A: Removed `any` in DB utils, API routes, UI mappers
- Track B: Standardized DB return shapes (BoardWithRelations for single board ops; BoardSummaryWithCounts for lists; raw Thought for thought ops)
- Removed temporary sub-task doc (was `docs/tasks/typing-and-db-consistency.md`)

- Workspace launcher MVP: added `scripts/mcp-start.sh`, `scripts/dev-all.sh`, `npm run mcp:start`, `npm run dev:all`, and `docs/browser-mcp.md`. Confirmed the MCP server start script runs the server in background and writes logs.
 - Added `docs/QuickLaunch` with one-line commands to start Next.js at `http://localhost:3000` and the Browser Tools MCP server (default or `--port 3025`).

- 1.5: Centralized activity logging
  - 1.5.1: Created `src/lib/activity.ts` with strongly-typed `ActivityAction` union and `logActivity`
  - 1.5.2: Replaced ad-hoc logs in routes: update_title, create_thought, move_thought, update_thought, delete_thought, save_diagram
  - 1.5.3: Verified logs visible in terminal with `ACTIVITY_LOG_DEBUG=true`; deduped extra save_diagram log


## Task Details

[D1] Seed admin + verify bypass
- Why: Admins must access all rows via RLS bypass for support/debug.
- Steps: see `docs/optional-tasks.md` (SQL and UI paths)
- Success: Query confirms `is_admin=true`; as admin you can read any board; non-admins remain isolated.

[D2] Update docs/ENVIRONMENT.md (auth/RLS finalization)
- Include: RLS summary, how to toggle admin, how to verify isolation/admin access, testing steps (incognito vs authed), and rollback notes.
- Success: New section exists; steps are reproducible without chat history.

[D3] Front-end polish: new-thought flicker & Load snap-back
- Context: Flicker when adding another thought immediately; occasional cross-section snap-back after manual Load.
- Approach: Buffer unsaved edits per-id; only rehydrate from GET when newer server version; queue-by-id for move saves; debounce manual Load reconciliation.
- Success: No visual flash when adding back-to-back; no cross-section regressions on Load.

[D4] User menu, list, preferences
- Scope: Add a lightweight menu; route for listing user boards; button to create new; placeholder Preferences page (open last vs new, etc.).
- Success: From header, user can navigate to list, open board, create new; preferences page renders.

[D5] Supabase rollout cleanup
- Remove test/demo endpoints and `/test-database` page now that RLS + auth flow is stable.
- Quick audit that all app routes call `requireSession()` at the top.
- Re-run RLS/Auth verification (see [D2]) to ensure no regressions.
