# TODOs

## User TODOs

## 🚨 CRITICAL: TypeScript & Code Quality Issues

### Database Function Inconsistencies
- [X ] **FIX ROOT CAUSE**: `createUser` vs `getUserByEmail` return type mismatch
  [X] `createUser` returns: `{ id, username, email, passwordHash, isAdmin, ... }`
  -[X] `getUserByEmail` returns: `{ id, username, email, passwordHash, isAdmin, boards: [...], ... }`
  -[X] **Solution**: Make `getUserByEmail` NOT include boards by default, or make `createUser` include them
  -[x] **Impact**: This caused cascading TypeScript errors across multiple API routes

### TypeScript Infrastructure Problems
- [ ] **Define proper interfaces** for all data structures instead of using `any`
- [ ] **Fix database functions** to have consistent return types across all operations
- [ ] **Implement proper error handling** at the source instead of catching everywhere
- [ ] **Use robust state management** patterns instead of null checks everywhere
- [ ] **Create proper TypeScript interfaces** for API request/response formats

### Code Quality Debt
- [ ] **Audit all `any` type usage** and replace with proper interfaces
- [ ] **Standardize error handling** patterns across all API routes
- [ ] **Review null safety patterns** and implement consistent approaches
- [ ] **Document expected data structures** for all database operations

## 🔧 API Reorganization & Structure

### API Route Organization
- [ ] **Reorganize API routes** from confusing `/api/test-database/` structure
  - **Current Issue**: Real production endpoints are in "test-database" folder
  - **Impact**: 15+ fetch calls need updating if routes are moved
  - **Options**:
    - Option 1: Keep current structure (no code changes needed)
    - Option 2: Rename folder to `/api/dev-tools/` (requires updating all fetch calls)
    - Option 3: Move to proper structure (requires updating all fetch calls)
  - **Recommended**: Keep current structure until ready for larger refactoring

### API Route Structure Plan
- [ ] **Move board operations** from `/api/test-database/` to `/api/boards/`
  - `create-board` → `/api/boards/` (POST)
  - `get-board/[id]` → `/api/boards/[id]` (GET)
  - `update-board` → `/api/boards/[id]` (PUT)
- [ ] **Move thought operations** from `/api/test-database/` to `/api/thoughts/`
  - `create-thoughts` → `/api/thoughts/batch` (POST)
  - `edit-thought` → `/api/thoughts/[id]` (PUT)
  - `move-thought` → `/api/thoughts/[id]/move` (POST)
- [ ] **Move user operations** from `/api/test-database/` to `/api/users/`
  - `create-user` → `/api/users/` (POST)
- [ ] **Move utility operations** to `/api/admin/` or `/api/dev/`
  - `health` → `/api/admin/health`
  - `stats` → `/api/admin/stats`
  - `log-activity` → `/api/admin/activity`

### Frontend Updates Required
- [ ] **Update all fetch calls** in frontend components:
  - `src/app/live-test/page.tsx` (3 fetch calls)
  - `src/app/test-database/page.tsx` (12+ fetch calls)
- [ ] **Create API utility functions** to centralize endpoint URLs
- [ ] **Add proper error handling** for all API calls
- [ ] **Implement loading states** for better UX

### Database & Data Structure
1. [ ] Add way to add data to board (title, user ID, description) - [src/lib/database.ts:110](src/lib/database.ts#L110)
2. [ ] Instrument API routes to log user actions using sessions
   - Ensure each API handler either:
     - reuses a request-scoped WorkSession and calls `logActivity(sessionId, ...)`; or
     - as a fallback for one-offs, calls `createSessionAndLogActivity(...)`.
   - Current state: Activity log is present but most frontend/API actions are not creating logs.
   - Affected files: `/api/diagram`, `/api/thoughts`, `/api/test-database/*`.
3. [ ] Add Sandbox as fifth option for GapsSection - [src/lib/types.ts:36](src/lib/types.ts#L36)
4. [ ] Remove or comment out unused fields (aiGenerated, confidence, timestamps) - [src/lib/types.ts:54,57,58,66](src/lib/types.ts#L54)
5. [ ] Change `items: GapsItem[]` to `thoughts: GapsThought[]` and rename throughout codebase - [src/lib/types.ts:78](src/lib/types.ts#L78)
6. [ ] Add position parameter for creating new items (default to last in section) - [src/lib/types.ts:97](src/lib/types.ts#L97)
7. [ ] Add way to change tags, AIGenerated/HumanApproved, and metadata - [src/lib/types.ts:112](src/lib/types.ts#L112)
8. [ ] Make target order optional (default to last in section) - [src/lib/types.ts:125](src/lib/types.ts#L125)
9. [ ] Comment out getSectionColors function until UI components use it - [src/lib/utils.ts:164](src/lib/utils.ts#L164)

### UI/UX Improvements
10. [ ] Remove colors prop from gaps-box component (not being used) - [src/components/gaps-box.tsx:17](src/components/gaps-box.tsx#L17)
11. [ ] Add obvious comment to gaps-box.tsx that it is not currently being used (optional change) - [src/components/gaps-box.tsx](src/components/gaps-box.tsx)
12. [ ] A set of settings and menu structure (this was the overall chat UI)
13. [ ] Set up APIs to change settings so that the AI can change it
14. [ ] Set up a way to get the settings, get certain settings, so that we can send that information to the AI. That information could include beginner, intermediate, advanced.
15. [ ] Add the chat framework in the UI and overall framework of UI, you know maybe something like could look a little bit like ChatGPT or Plot, honestly.
16. [ ] Need to figure out our onboarding process

## AI Agent TODOs

### Error Handling & Rollback
12. [ ] Add better error handling and logging in gaps-canvas - [src/components/gaps-canvas.tsx:97](src/components/gaps-canvas.tsx#L97)
13. [ ] Implement rollback if API fails - [src/components/gaps-canvas.tsx:987](src/components/gaps-canvas.tsx#L987)
14. [ ] Explore OptimisticUpdate<T> usage and verify server confirmation/rollback logic - [src/lib/types.ts:209](src/lib/types.ts#L209)

### Authentication & User Management
15. [ ] Update section when authentication is added - [src/lib/database.ts:484](src/lib/database.ts#L484)
16. [ ] Set up authentication for users and user management
17. [ ] Need to get a real database setup and hosted online
18. [ ] **When auth is added, remove getOrCreateDefaultUser/Board and derive user/board from session**
19. [ ] Add LinkedIn SSO provider (OIDC) after Google/GitHub are live
20. [ ] Add Notion SSO provider (OAuth) after Google/GitHub are live

### Brain Integration
18. [ ] Update with new brain (currently not using Chipp) - [src/lib/types.ts:127](src/lib/types.ts#L127)
18b. [ ] Setup "review" state for content from AI so that users can approve changes
19. [ ] Add idea that the gaps explainer, which is part of the gaps brain, might be able to use images as tools
20. [ ] **DECISION NEEDED**: Choose brain architecture structure for executive piece:
    - Option 1: Single agent using customer assistance tools to compile answers
    - Option 2: Question interpreter agent + plan creator agent + step-by-step execution
    - Option 3: Supervisor agent that sends messages to other agents, takes responses back, and refines until complete answer
    - Option 4: Dynamic group of agents that talk to each other, each agent can send next task to whichever agent they feel is most appropriate

### Code Cleanup
20. [ ] Remove unused CreateItemRequest (can just create new item and update) - [src/lib/types.ts:131](src/lib/types.ts#L131)
21. [ ] Add Sandbox to section list - [src/lib/utils.ts:240](src/lib/utils.ts#L240)

## Notes & Documentation
22. [ ] Update object structure changes in utils - [src/lib/utils.ts:95](src/lib/utils.ts#L95)
23. [ ] Add Sandbox to section list - [src/lib/utils.ts:240](src/lib/utils.ts#L240)

## Files with TODOs
- [src/lib/database.ts](src/lib/database.ts) - 3 TODOs
- [src/lib/types.ts](src/lib/types.ts) - 8 TODOs  
- [src/lib/utils.ts](src/lib/utils.ts) - 2 TODOs
- [src/components/gaps-canvas.tsx](src/components/gaps-canvas.tsx) - 2 TODOs
- [src/components/gaps-box.tsx](src/components/gaps-box.tsx) - 2 TODOs 