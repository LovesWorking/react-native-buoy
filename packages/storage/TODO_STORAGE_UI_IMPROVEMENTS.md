# TODO: Storage Browser UI/UX Improvements

**Status:** Not Started
**Goal:** Improve storage browser UX with better filtering, search, and cleaner UI
**Estimated Time:** 4-6 hours

---

## Task 1: Add Filter Button to Storage Tab (Like Events Tab)

**Goal:** Add a filter button to the Storage browser tab (similar to Events tab) to filter out specific storage keys.

### 1.1 Research Events Tab Implementation
- [ ] Read `StorageModalWithTabs.tsx` to understand Events tab filter implementation
- [ ] Find the filter button component used in Events tab (lines 574-588)
- [ ] Locate `StorageFilterViewV2.tsx` component
- [ ] Understand how `ignoredPatterns` state works
- [ ] Review how filters are persisted (AsyncStorage persistence)

### 1.2 Add Filter State to GameUIStorageBrowser
- [ ] Add `ignoredPatterns` state (Set<string>) to `GameUIStorageBrowser.tsx`
- [ ] Add `showFilters` state (boolean)
- [ ] Load persisted filters from AsyncStorage on mount
- [ ] Save filters to AsyncStorage when they change
- [ ] Use dev tools storage key: `devToolsStorageKeys.storage.keyFilters()`

### 1.3 Auto-Filter Dev Tool Keys by Default
- [ ] Initialize `ignoredPatterns` with `@devtools` pattern by default
- [ ] This auto-hides all dev tool storage keys (no user config needed!)
- [ ] User can still toggle to show them if needed

### 1.4 Add Filter Button to Action Bar
- [ ] Import `Filter` icon from `@react-buoy/shared-ui`
- [ ] Add filter button next to Export/Purge buttons in action bar
- [ ] Show active state when filters are applied (count > 0)
- [ ] Button opens filter view when clicked

### 1.5 Create Filter View Modal
- [ ] Reuse `StorageFilterViewV2` component (or create storage-specific one)
- [ ] Display list of filterable patterns
- [ ] Show toggle switches for each pattern
- [ ] Add "Add Pattern" input field
- [ ] List all unique storage key prefixes as suggestions

### 1.6 Apply Filters to Key Display
- [ ] Filter `filteredKeys` based on `ignoredPatterns`
- [ ] Check if any part of storage key matches ignored pattern
- [ ] Update key count display to reflect filtered count

### 1.7 Test Filter Functionality
- [ ] Test adding custom filter patterns
- [ ] Test toggling patterns on/off
- [ ] Test filter persistence (close/reopen modal)
- [ ] Verify dev tool keys are hidden by default
- [ ] Test "Add Pattern" functionality

**Estimated Time:** 1.5 hours

---

## Task 2: Change Tab Filter System (All, Missing, Issues)

**Goal:** Redesign the filter cards so "All" shows only keys without issues, and add clearer naming.

### 2.1 Understand Current Filter System
- [ ] Review `StorageFilterCards.tsx` component
- [ ] Review `activeFilter` state in `GameUIStorageBrowser.tsx`
- [ ] Current filters: "all", "missing", "issues"
- [ ] Current filter logic in `filteredKeys` useMemo (lines 106-129)

### 2.2 Update Filter Logic
**New Behavior:**
- [ ] **"Valid"** (rename from "All") - Shows only keys without issues
  - [ ] Filter: `status === 'required_present' || status === 'optional_present'`
- [ ] **"Missing"** (keep as-is) - Shows missing required keys
  - [ ] Filter: `status === 'required_missing'`
- [ ] **"Issues"** (keep as-is) - Shows keys with wrong type/value
  - [ ] Filter: `status === 'required_wrong_type' || status === 'required_wrong_value'`

### 2.3 Update Filter Cards Component
- [ ] Change "All" label to "Valid" in `StorageFilterCards.tsx`
- [ ] Update filter card descriptions to match new behavior
- [ ] Update "valid" card to show count of valid keys only
- [ ] Update badge colors if needed

### 2.4 Update Section Header Text
- [ ] Change "ALL STORAGE KEYS" to "VALID STORAGE KEYS"
- [ ] Update empty state messages to reflect new filter

### 2.5 Test New Filter Behavior
- [ ] Verify "Valid" shows only valid keys
- [ ] Verify "Missing" shows missing keys
- [ ] Verify "Issues" shows problematic keys
- [ ] Check that counts are accurate

**Estimated Time:** 45 minutes

---

## Task 3: Add Search Bar Under "All Storage Keys"

**Goal:** Add a search input to easily filter storage keys by name.

### 3.1 Research Existing Search Implementations
- [ ] Search for search components in other dev tools
- [ ] Check `@react-buoy/shared-ui` for search input component
- [ ] Review search UX patterns in existing tools
- [ ] Find consistent styling/behavior to match

### 3.2 Add Search State
- [ ] Add `searchQuery` state (string) to `GameUIStorageBrowser.tsx`
- [ ] Add `setSearchQuery` setter
- [ ] Consider debouncing for performance (if >100 keys)

### 3.3 Create Search Input Component
- [ ] Use existing shared UI search component (if available)
- [ ] Or create styled TextInput with search icon
- [ ] Add clear button (X icon) when text is entered
- [ ] Placeholder text: "Search storage keys..."
- [ ] Match styling of other search inputs in dev tools

### 3.4 Add Search Bar to UI
- [ ] Place search bar inside `keysSection` component
- [ ] Position above `StorageKeySection` component
- [ ] Make it sticky or fixed at top of scrollable area
- [ ] Consistent padding/margins with rest of UI

### 3.5 Implement Search Filtering
- [ ] Add search filter to `filteredKeys` useMemo
- [ ] Filter keys where `key.toLowerCase().includes(searchQuery.toLowerCase())`
- [ ] Apply search AFTER status filter and storage type filter
- [ ] Update key count to show search results count

### 3.6 Add Search Empty State
- [ ] Show "No keys match search" when search returns 0 results
- [ ] Display current search query in empty state
- [ ] Add "Clear search" button

### 3.7 Test Search Functionality
- [ ] Test search with various queries
- [ ] Test search combined with filters (Valid/Missing/Issues)
- [ ] Test search combined with storage type filter
- [ ] Test clear button
- [ ] Test empty state
- [ ] Test with large number of keys (performance)

**Estimated Time:** 1 hour

---

## Task 4: Remove "X keys | Stored" and Move Search/Filter to Action Bar

**Goal:** Clean up action bar by removing redundant "X keys | Stored" text and adding search/filter there instead.

### 4.1 Review Current Action Bar
- [ ] Locate action bar in `GameUIStorageBrowser.tsx` (lines 211-259)
- [ ] Current left side: "X keys | Stored"
- [ ] Current right side: Export, Purge buttons
- [ ] Plan new layout

### 4.2 Remove "X keys | Stored"
- [ ] Remove `actionBarLeft` View (lines 212-219)
- [ ] Remove `keyPill` and `keyCount` text
- [ ] This info is redundant (shown in header and filter cards)

### 4.3 Add Search Bar to Action Bar
- [ ] Move search input from Task 3 to action bar left side
- [ ] Make it flexible width (take available space)
- [ ] Style to match action bar aesthetic (same height as buttons)
- [ ] Add search icon inside input (leading icon)

### 4.4 Add Filter Button to Action Bar
- [ ] Move filter button from Task 1 to action bar right side
- [ ] Position between search bar and Export button
- [ ] Show active indicator when filters are applied
- [ ] Show filter count badge if patterns > 0

### 4.5 Redesign Action Bar Layout
**New Layout:**
```
[Search Input (flex: 1)         ] [Filter] [Export] [Purge]
```
- [ ] Left side: Search input (flexible width)
- [ ] Right side: Filter, Export, Purge buttons
- [ ] Proper spacing between elements
- [ ] Responsive design (works on narrow screens)

### 4.6 Update Action Bar Styles
- [ ] Update `actionBar` styles for new layout
- [ ] Remove old `actionBarLeft` styles
- [ ] Add search input container styles
- [ ] Ensure button alignment is correct

### 4.7 Test Action Bar
- [ ] Test on different screen sizes
- [ ] Verify search works from action bar
- [ ] Verify filter button works from action bar
- [ ] Check spacing and alignment
- [ ] Test all buttons still work (Export, Purge)

**Estimated Time:** 1 hour

---

## Task 5: Remove Redundant Header Stats (Storage | X keys | Critical)

**Goal:** Remove the top stats display that shows "Storage | X keys | Critical" as it's redundant with filter cards.

### 5.1 Locate Header Stats Component
- [ ] Find `StorageFilterCards` component
- [ ] Look for health percentage/status display (lines 198-208)
- [ ] Identify props: `healthPercentage`, `healthStatus`, `healthColor`

### 5.2 Review What to Remove
Current header shows:
- [ ] Storage type badge
- [ ] Key count ("X keys")
- [ ] Health status ("OPTIMAL", "WARNING", "CRITICAL")
- [ ] This duplicates info in filter cards below

### 5.3 Remove Header Stats Display
Option A: Remove entire header section
- [ ] Remove `StorageFilterCards` header row if it exists
- [ ] Keep only the filter cards themselves

Option B: Simplify header
- [ ] Keep filter cards but remove redundant stats
- [ ] Show only filter toggles (Valid, Missing, Issues)

### 5.4 Update StorageFilterCards Component
- [ ] Remove or hide stats display section
- [ ] Keep filter card buttons (Valid, Missing, Issues)
- [ ] Keep storage type filter (All, Async, MMKV, Secure)
- [ ] Simplify layout

### 5.5 Test Header Removal
- [ ] Verify filter cards still work
- [ ] Check that info is still accessible elsewhere
- [ ] Ensure no visual gaps or layout issues
- [ ] Test filter card interactions

**Estimated Time:** 30 minutes

---

## Task 6: Update Storage Type Header Based on Filter Selection

**Goal:** Make the storage browser header dynamic based on selected storage type filter.

### 6.1 Understand Current Header
- [ ] Locate where "STORAGE" title is displayed
- [ ] Currently shows fixed "STORAGE" text with percentage
- [ ] Review `StorageFilterCards` props (health percentage shown)

### 6.2 Design New Header Text
**New behavior based on `activeStorageType`:**
- [ ] **"all"** → "STORAGE • ALL TYPES"
- [ ] **"async"** → "STORAGE • ASYNC"
- [ ] **"mmkv"** → "STORAGE • MMKV"
- [ ] **"secure"** → "STORAGE • SECURE"

Alternative (simpler):
- [ ] **"all"** → "ALL STORAGE"
- [ ] **"async"** → "ASYNC STORAGE"
- [ ] **"mmkv"** → "MMKV STORAGE"
- [ ] **"secure"** → "SECURE STORAGE"

### 6.3 Find Header Component Location
- [ ] Check `StorageModalWithTabs.tsx` for header
- [ ] Look for `ModalHeader.Content` with title prop
- [ ] Determine if header is in modal or browser component

### 6.4 Make Header Dynamic
- [ ] Create `getStorageHeaderTitle()` function
- [ ] Accept `activeStorageType` as parameter
- [ ] Return appropriate title string
- [ ] Use `getStorageTypeLabel()` helper if needed

### 6.5 Update Header Text
- [ ] Replace static "STORAGE" with dynamic title
- [ ] Remove percentage display (redundant)
- [ ] Update typography to fit new text
- [ ] Ensure it looks good in all states

### 6.6 Test Header Updates
- [ ] Switch between storage type filters
- [ ] Verify header updates correctly
- [ ] Check header in modal header bar
- [ ] Test on different devices/sizes

**Estimated Time:** 30 minutes

---

## Summary of Changes

### Before:
- No filter button (dev keys always visible)
- "All" shows everything including issues
- Search not available
- Action bar has "X keys | Stored" text
- Header shows "Storage | X keys | Critical"
- Header doesn't reflect storage type filter

### After:
- ✅ Filter button (dev keys auto-hidden)
- ✅ "Valid" shows only valid keys
- ✅ Search bar in action bar
- ✅ Clean action bar: [Search] [Filter] [Export] [Purge]
- ✅ Header simplified (no redundant stats)
- ✅ Header updates based on storage type: "ASYNC STORAGE", "MMKV STORAGE", etc.

---

## Testing Checklist

### Functionality Tests
- [ ] Filter button works and persists patterns
- [ ] Dev tool keys auto-filtered by default
- [ ] "Valid" filter shows only valid keys
- [ ] "Missing" filter shows missing keys
- [ ] "Issues" filter shows problem keys
- [ ] Search filters keys correctly
- [ ] Search works with other filters
- [ ] Clear search button works
- [ ] Filter + Search + Storage Type all work together
- [ ] Export still works correctly
- [ ] Purge still works correctly

### UI/UX Tests
- [ ] Action bar layout looks clean
- [ ] Search bar is easily accessible
- [ ] Filter button is discoverable
- [ ] Filter view is easy to use
- [ ] Header is clear and informative
- [ ] No redundant information displayed
- [ ] Consistent with other dev tool designs
- [ ] Works on small screens (mobile)
- [ ] Works on large screens (tablet)

### Performance Tests
- [ ] Search is responsive with 100+ keys
- [ ] Filter changes are instant
- [ ] No lag when typing in search
- [ ] Auto-refresh doesn't interfere with search

---

## Progress Tracking

**Started:** [DATE]
**Completed:** [DATE]
**Total Time:** [HOURS]

**Tasks Completed:** 0 / 6

- [ ] Task 1: Add Filter Button to Storage Tab
- [ ] Task 2: Change Tab Filter System (All → Valid)
- [ ] Task 3: Add Search Bar
- [ ] Task 4: Clean Up Action Bar
- [ ] Task 5: Remove Redundant Header Stats
- [ ] Task 6: Update Dynamic Header Based on Storage Type

---

## Notes

- Keep UI consistent with Events tab filter system
- Reuse components from other dev tools where possible
- Maintain game-themed aesthetic (cyberpunk style)
- Test with real storage data (not just empty state)
- Consider mobile experience (buttons should be tappable)
