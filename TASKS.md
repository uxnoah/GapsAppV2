# Task List

## Breadcrumb (top)
- Next step I will take next turn is: Collect Supabase credentials and project settings to enable DB/Auth integration work.

## Conventions
- Rule: Number all tasks in `Next`; maintain numbering when editing.
- Rule: When a Now task/subtask is completed, move it to Done in the same turn; update Breadcrumb with the immediate next step.

## Now
2. Workspace launcher
   - 2.1 Add `scripts/mcp-start.sh` to reliably start Browser Tools server
   - 2.2 Add `scripts/dev-all.sh` and `npm run dev:all`
   - 2.3 Add quick doc `docs/browser-mcp.md` and link from README later

3. Supabase prerequisites — credentials & settings (blocking)
   - What to provide (values) → where to get them
     - NEXT_PUBLIC_SUPABASE_URL → Supabase: Project Settings → API → Project URL
     - NEXT_PUBLIC_SUPABASE_ANON_KEY → Supabase: Project Settings → API → anon public key
     - SUPABASE_SERVICE_ROLE_KEY → Supabase: Project Settings → API → service_role key
     - SUPABASE_JWT_SECRET → Supabase: Project Settings → API → JWT secret
     - DATABASE_URL (pooled) → Supabase: Database → Connection string → URI (use pgbouncer, port 6543)
     - DIRECT_URL (non-pooled) → Supabase: Database → Connection string → URI (direct, port 5432)
     - SHADOW_DATABASE_URL (optional) → Direct URL to a separate scratch DB (or we can reuse direct URL if needed)
     - SITE URL(s) → Supabase: Authentication → URL Configuration → Site URL (add `http://localhost:3000` and your prod domain)
     - ALLOWED REDIRECT URLs → Supabase: Authentication → URL Configuration → Redirect URLs (add local + prod)
     - GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET → Google Cloud Console: APIs & Services → Credentials → OAuth 2.0 Client IDs (redirect: `https://<project-ref>.supabase.co/auth/v1/callback`)
     - GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET → GitHub → Settings → Developer settings → OAuth Apps (callback: `https://<project-ref>.supabase.co/auth/v1/callback`)
     - INITIAL_ADMIN_EMAILS → Your list of emails to mark `is_admin = true`

   - How to set up providers
     - Google: Google Cloud Console → select/create project → OAuth consent screen (External) → publish app → Credentials → Create OAuth client ID (Web) → Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` → copy client ID/secret
     - GitHub: GitHub → Settings → Developer settings → OAuth Apps → New OAuth App → Homepage URL: your Site URL; Authorization callback URL: `https://<project-ref>.supabase.co/auth/v1/callback` → Register → copy client ID/secret

   - Supabase config touchpoints
     - Project Settings → API: copy URL/keys/secrets above
     - Authentication → Providers: enable Google and GitHub, paste client IDs/secrets
     - Authentication → URL Configuration: set Site URL and Redirect URLs (local + prod)
     - Database → Connection string: copy pooled (DATABASE_URL) and direct (DIRECT_URL)

   - Notes
     - Single Supabase project for now (we can clone to staging later)
     - No SMTP needed since we’re using Google/GitHub SSO
     - Share secrets securely; do not commit to git

## Next
1. Quick wins before Supabase integration (1–2 hours)
   1.1 (DONE) Add a tiny API client wrapper for fetch (single place to change routes/options)
   1.2 Ensure request/response types where still missing in thought endpoints
   1.3 Refresh stale comments
   1.4 Add a smoke test checklist for diagram load/save and thought CRUD/move
   1.5 (DONE) Centralize activity logging usage (one helper used in routes)

2. Supabase integration (DB + Auth + RLS + Realtime)
   2.1 Create Supabase project; enable Postgres (auto)
   2.2 Add env vars: `DATABASE_URL` (Supabase), `SHADOW_DATABASE_URL` (optional for Prisma), Supabase auth keys
   2.3 Prisma: switch `datasource db` provider to `postgres`; `prisma migrate deploy`
   2.4 Replace default user helpers with Supabase Auth session in API routes
   2.5 Define RLS policies (per-user access to boards/thoughts)
   2.6 Frontend: add Supabase client; subscribe to Realtime on `thoughts` (and boards if needed)
   2.7 Keep Prisma for server-side reads/writes; use Supabase client for Auth + Realtime

3. Vector store (knowledge base)
   3.1 Enable `pgvector` on Supabase; create embedding column(s) and index
   3.2 Add embedding pipeline (e.g., OpenAI/other) and ingest script
   3.3 Add minimal search endpoint using cosine distance

## Later/Backlog
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

- 1.5: Centralized activity logging
  - 1.5.1: Created `src/lib/activity.ts` with strongly-typed `ActivityAction` union and `logActivity`
  - 1.5.2: Replaced ad-hoc logs in routes: update_title, create_thought, move_thought, update_thought, delete_thought, save_diagram
  - 1.5.3: Verified logs visible in terminal with `ACTIVITY_LOG_DEBUG=true`; deduped extra save_diagram log


