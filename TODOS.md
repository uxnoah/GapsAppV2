# TODOs

## User TODOs

## 🚨 CRITICAL: TypeScript & Code Quality Issues

### Database Function Inconsistencies
- [ ] **FIX ROOT CAUSE**: `createUser` vs `getUserByEmail` return type mismatch
  - `createUser` returns: `{ id, username, email, passwordHash, isAdmin, ... }`
  - `getUserByEmail` returns: `{ id, username, email, passwordHash, isAdmin, boards: [...], ... }`
  - **Solution**: Make `getUserByEmail` NOT include boards by default, or make `createUser` include them
  - **Impact**: This caused cascading TypeScript errors across multiple API routes

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

### Database & Data Structure
1. [ ] Add way to add data to board (title, user ID, description) - [src/lib/database.ts:110](src/lib/database.ts#L110)
2. [ ] Comment out logging functions until activity tracking is implemented - [src/lib/database.ts:401](src/lib/database.ts#L401)
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

## AI Agent TODOs

### Error Handling & Rollback
12. [ ] Add better error handling and logging in gaps-canvas - [src/components/gaps-canvas.tsx:97](src/components/gaps-canvas.tsx#L97)
13. [ ] Implement rollback if API fails - [src/components/gaps-canvas.tsx:987](src/components/gaps-canvas.tsx#L987)
14. [ ] Explore OptimisticUpdate<T> usage and verify server confirmation/rollback logic - [src/lib/types.ts:209](src/lib/types.ts#L209)

### Authentication & User Management
15. [ ] Update section when authentication is added - [src/lib/database.ts:484](src/lib/database.ts#L484)

### Brain Integration
16. [ ] Update with new brain (currently not using Chipp) - [src/lib/types.ts:127](src/lib/types.ts#L127)

### Code Cleanup
17. [ ] Remove unused CreateItemRequest (can just create new item and update) - [src/lib/types.ts:131](src/lib/types.ts#L131)
18. [ ] Add Sandbox to section list - [src/lib/utils.ts:240](src/lib/utils.ts#L240)

## Notes & Documentation
19. [ ] Update object structure changes in utils - [src/lib/utils.ts:95](src/lib/utils.ts#L95)
20. [ ] Add Sandbox to section list - [src/lib/utils.ts:240](src/lib/utils.ts#L240)

## Files with TODOs
- [src/lib/database.ts](src/lib/database.ts) - 3 TODOs
- [src/lib/types.ts](src/lib/types.ts) - 8 TODOs  
- [src/lib/utils.ts](src/lib/utils.ts) - 2 TODOs
- [src/components/gaps-canvas.tsx](src/components/gaps-canvas.tsx) - 2 TODOs
- [src/components/gaps-box.tsx](src/components/gaps-box.tsx) - 2 TODOs 