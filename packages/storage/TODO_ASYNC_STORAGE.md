# TODO: Remove React Query from AsyncStorage Browser

**Status:** Not Started
**Plan Reference:** See `PLAN_ASYNC_STORAGE.md` for detailed implementation guide
**Estimated Time:** 8-11 hours

---

## Phase 1: Create Direct AsyncStorage Access Layer

### 1.1 Create useAsyncStorageKeys Hook
- [ ] Create new file: `packages/storage/src/storage/hooks/useAsyncStorageKeys.ts`
- [ ] Implement state management (useState for keys, loading, error)
- [ ] Implement `fetchStorageData()` function
  - [ ] Call `AsyncStorage.getAllKeys()`
  - [ ] Call `AsyncStorage.multiGet()` with all keys
  - [ ] Parse JSON values (with error handling)
  - [ ] Return ALL keys (no separation - filters handle dev keys)
  - [ ] Process required keys validation
  - [ ] Handle missing required keys
- [ ] Implement `refresh()` callback (exposed for event-driven refresh)
- [ ] Add useEffect for initial fetch
- [ ] Test hook in isolation

**Note:** Dev tool keys are NOT separated here - the existing filter system already handles them automatically.

**Estimated Time:** 2-3 hours

---

## Phase 2: Update GameUIStorageBrowser Component

### 2.1 Remove React Query Dependencies
- [ ] Remove `useQueryClient` import from line 12
- [ ] Remove query utility imports (lines 13-17)
- [ ] Keep `StorageType` but import from correct location

### 2.2 Add New Hook
- [ ] Add `useAsyncStorageKeys` import
- [ ] Replace `queryClient` usage with `useAsyncStorageKeys()` call
- [ ] Remove old query processing logic (lines 42-199)

### 2.3 Update Stats Calculation
- [ ] Rewrite stats `useMemo` to use `storageKeys` directly (no devToolKeys)
- [ ] Filter dev tool keys in stats calculation (don't count them)
- [ ] Set `mmkvCount: 0` (for future MMKV support)
- [ ] Set `secureCount: 0` (for future SecureStore support)
- [ ] Set `asyncCount` to total non-dev-tool keys
- [ ] Keep all other stat calculations

### 2.4 Add Auto-Refresh on Storage Events
- [ ] Remove manual refresh button from UI (lines 356-382)
- [ ] Remove `handleRefresh` function (lines 299-311)
- [ ] Remove `isRefreshing` state
- [ ] Add event listener integration:
  - [ ] Import `addListener` from AsyncStorageListener
  - [ ] Add useEffect to listen for storage events
  - [ ] Call `refresh()` automatically when storage events occur
  - [ ] Debounce refresh calls (avoid multiple rapid refreshes)
- [ ] Update action bar UI to remove Scan button

**Note:** Storage browser will now auto-update whenever storage changes, just like the Events tab!

### 2.5 Add Loading State UI
- [ ] Add loading state check at start of render
- [ ] Display loading message with Database icon
- [ ] Add loading state styles

### 2.6 Add Error State UI
- [ ] Add error state check after loading
- [ ] Display error message with error icon
- [ ] Add retry button
- [ ] Add retry button styles

### 2.7 Test Component
- [ ] Verify storage browser opens without errors
- [ ] Verify all keys are displayed
- [ ] Verify refresh works
- [ ] Verify loading state shows briefly
- [ ] Test error handling (simulate error)

**Estimated Time:** 2-3 hours

---

## Phase 3: Remove React Query Utilities

### 3.1 Delete Unused Files
- [ ] Delete `packages/storage/src/storage/utils/getStorageQueryCounts.ts`
- [ ] Delete `packages/storage/src/storage/hooks/useStorageQueryCounts.ts`
- [ ] Verify no other files import these (search project)

### 3.2 Update storageQueryUtils.ts
- [ ] Review `isStorageQuery()` - check if used anywhere
  - [ ] If only in deleted files → DELETE function
  - [ ] If used elsewhere → KEEP function
- [ ] Review `getStorageType()` - check if used anywhere
  - [ ] If only in deleted files → DELETE function
  - [ ] If used elsewhere → KEEP function
- [ ] Review `getCleanStorageKey()` - check if used anywhere
  - [ ] If only in deleted files → DELETE function
  - [ ] If used elsewhere → KEEP function
- [ ] Keep `StorageType` type (used everywhere)
- [ ] Keep `getStorageTypeLabel()` (used in UI)
- [ ] Keep `getStorageTypeHexColor()` (used in UI)

**Estimated Time:** 30 minutes

---

## Phase 4: Update StorageBrowserMode Component

### 4.1 Remove React Query References
- [ ] Remove `Query` type import from line 1
- [ ] Update `StorageBrowserModeProps` interface
  - [ ] Remove `selectedQuery` prop
  - [ ] Remove `onQuerySelect` prop
  - [ ] Keep `requiredStorageKeys` prop

### 4.2 Update StorageModalWithTabs Usage
- [ ] Open `StorageModalWithTabs.tsx`
- [ ] Find `<StorageBrowserMode>` call (around line 448)
- [ ] Remove `selectedQuery={undefined}` prop
- [ ] Remove `onQuerySelect={() => {}}` prop
- [ ] Keep `requiredStorageKeys={requiredStorageKeys}` prop

### 4.3 Test Integration
- [ ] Verify browser tab loads
- [ ] Verify no TypeScript errors
- [ ] Verify no console warnings

**Estimated Time:** 30 minutes

---

## Phase 5: Update Package Dependencies

### 5.1 Update package.json
- [ ] Open `packages/storage/package.json`
- [ ] Remove `"@tanstack/react-query": "^5.89.0"` from dependencies (line 23)
- [ ] Keep `@react-buoy/shared-ui` dependency
- [ ] Keep all peerDependencies unchanged

### 5.2 Reinstall Dependencies
- [ ] Run `pnpm install` in monorepo root
- [ ] Verify no dependency warnings
- [ ] Verify package builds successfully

### 5.3 Verify Removal
- [ ] Search entire package for `@tanstack/react-query` imports
- [ ] Should find zero results
- [ ] Search for `useQueryClient` usage
- [ ] Should find zero results

**Estimated Time:** 15 minutes

---

## Phase 6: Update Documentation

### 6.1 Update README.md
- [ ] Update description to emphasize independence (lines 5-7)
- [ ] Search for "query" mentions
- [ ] Search for "tanstack" mentions
- [ ] Remove or update all React Query references

### 6.2 Update Quick Start Section
- [ ] Emphasize zero-config nature (lines 34-58)
- [ ] Update feature list to mention independence
- [ ] Remove any React Query setup steps

### 6.3 Add "How It Works" Section
- [ ] Add new section explaining direct AsyncStorage access
- [ ] Document Browser Tab approach (getAllKeys + multiGet)
- [ ] Document Events Tab approach (method swizzling)
- [ ] Emphasize no external dependencies

### 6.4 Review All Examples
- [ ] Check all code examples in README
- [ ] Ensure none reference React Query concepts
- [ ] Ensure all examples still work

**Estimated Time:** 1 hour

---

## Phase 7: Export New Hook

### 7.1 Update Exports
- [ ] Open `packages/storage/src/storage/index.ts`
- [ ] Add export: `export { useAsyncStorageKeys } from "./hooks/useAsyncStorageKeys";`
- [ ] Verify export works (test import in another file)

### 7.2 Update TypeScript Definitions
- [ ] Run `pnpm build` in storage package
- [ ] Verify `.d.ts` files are generated correctly
- [ ] Verify `useAsyncStorageKeys` is in type definitions

**Estimated Time:** 15 minutes

---

## Phase 8: Testing

### 8.1 Functionality Tests
- [ ] Storage browser opens without errors
- [ ] All AsyncStorage keys are displayed
- [ ] Key values are shown correctly (strings, objects, arrays)
- [ ] Auto-refresh works when storage changes
- [ ] Dev tool keys are auto-filtered (not shown by default)
- [ ] Required keys validation works
- [ ] Missing keys are shown with correct status
- [ ] Wrong type detection works
- [ ] Wrong value detection works
- [ ] Dev tool keys are separated correctly
- [ ] Export functionality works
- [ ] Clear storage functionality works
- [ ] Filter cards work (All, Missing, Issues)
- [ ] Storage type filter works (should show only "async")
- [ ] Search functionality works

### 8.2 Performance Tests
- [ ] Test with empty storage
- [ ] Test with 10 keys
- [ ] Test with 50 keys
- [ ] Test with 100+ keys
- [ ] Refresh is responsive
- [ ] No memory leaks on repeated refresh
- [ ] No lag when switching tabs

### 8.3 Console Tests
- [ ] No React Query warnings
- [ ] No TypeScript errors
- [ ] No runtime errors
- [ ] No warnings about missing dependencies

### 8.4 Integration Tests
- [ ] Events tab still works independently
- [ ] Tab switching works smoothly (Browser ↔ Events)
- [ ] Modal persistence works (position/size saved)
- [ ] FloatingDevTools integration works
- [ ] `storageToolPreset` works out of the box
- [ ] `createStorageTool()` with custom config works

### 8.5 Edge Cases
- [ ] Empty storage shows appropriate message
- [ ] Storage errors are handled gracefully (show error UI)
- [ ] Invalid JSON values are handled (shown as strings)
- [ ] Null values display correctly
- [ ] Undefined values display correctly
- [ ] Very long key names don't break layout
- [ ] Very large values don't cause performance issues
- [ ] Special characters in keys are handled
- [ ] Unicode characters in values are handled

### 8.6 Example App Testing
- [ ] Test in monorepo example app
- [ ] Verify storage browser works end-to-end
- [ ] Test all features in real app context
- [ ] Verify no regressions

**Estimated Time:** 2-3 hours

---

## Phase 9: Final Verification

### 9.1 Code Review
- [ ] Review all changed files
- [ ] Verify code quality and consistency
- [ ] Check for commented-out code (remove it)
- [ ] Check for console.log statements (remove them)
- [ ] Verify error handling is comprehensive

### 9.2 TypeScript Check
- [ ] Run `pnpm typecheck` in storage package
- [ ] Fix any TypeScript errors
- [ ] Verify no type warnings

### 9.3 Build Check
- [ ] Run `pnpm build` in storage package
- [ ] Verify build succeeds without errors
- [ ] Verify build output is correct
- [ ] Check bundle size (should be smaller)

### 9.4 Documentation Check
- [ ] Re-read README.md for accuracy
- [ ] Verify all code examples are correct
- [ ] Check that Quick Start guide works
- [ ] Verify API documentation is accurate

### 9.5 Git Status
- [ ] Review all modified files
- [ ] Verify no unintended changes
- [ ] Stage only relevant changes
- [ ] Prepare commit message

**Estimated Time:** 1 hour

---

## Success Criteria

- [x] Zero React Query imports in storage package
- [ ] Zero configuration required from end user
- [ ] Works out of the box with `storageToolPreset`
- [ ] All existing features work (browse, edit, delete, add, validate)
- [ ] Performance is equal or better than React Query version
- [ ] No breaking changes to public API
- [ ] Events tab still works independently
- [ ] All tests pass
- [ ] Documentation is updated and accurate
- [ ] TypeScript builds without errors

---

## Rollback Plan

If major issues are discovered:
1. Create rollback branch from current state
2. Document specific issues encountered
3. Analyze root cause
4. Decide: Fix forward or rollback
5. If rollback needed, restore React Query version
6. Update plan based on learnings

---

## Notes

- Focus ONLY on AsyncStorage in this phase
- Do NOT add MMKV or SecureStore support yet
- Keep event listener system unchanged
- Maintain backward compatibility
- Document any issues or learnings for future phases

---

## Progress Tracking

**Started:** [DATE]
**Completed:** [DATE]
**Total Time:** [HOURS]

**Phases Completed:** 0 / 9

- [ ] Phase 1: Create Direct AsyncStorage Access Layer
- [ ] Phase 2: Update GameUIStorageBrowser Component
- [ ] Phase 3: Remove React Query Utilities
- [ ] Phase 4: Update StorageBrowserMode Component
- [ ] Phase 5: Update Package Dependencies
- [ ] Phase 6: Update Documentation
- [ ] Phase 7: Export New Hook
- [ ] Phase 8: Testing
- [ ] Phase 9: Final Verification
