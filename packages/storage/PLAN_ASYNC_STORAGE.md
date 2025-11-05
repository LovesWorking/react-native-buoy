# Plan: Remove React Query from AsyncStorage Browser

## Goal
Remove all React Query dependencies from the AsyncStorage browser functionality. By the end of this plan, the AsyncStorage browser should work completely independently, requiring zero configuration from the end user - just like the Events tab currently does.

## Current State Analysis

### Files Using React Query (AsyncStorage Browser)
1. **GameUIStorageBrowser.tsx**
   - Lines 42-52: Uses `useQueryClient` and `queryClient.getQueryCache().getAll()`
   - Lines 50-52: Filters queries by `isStorageQuery(query.queryKey)`
   - Lines 60-199: Processes React Query cache data to build storage key info
   - Lines 286-287, 302-307: Uses `queryClient.invalidateQueries()` for refresh

2. **getStorageQueryCounts.ts**
   - Entire file: Helper that counts storage queries from React Query cache
   - Input: `Query[]` from React Query
   - Used for statistics display

3. **useStorageQueryCounts.ts**
   - Entire file: Hook wrapper around `getStorageQueryCounts`
   - Uses `useQueryClient` to access query cache

4. **StorageBrowserMode.tsx**
   - Lines 1, 6: Imports `Query` type from React Query
   - Lines 5-7: Has unused props `selectedQuery` and `onQuerySelect`

### Files That Work Independently (Keep As-Is)
- **AsyncStorageListener.ts** ✅ - Already independent, uses method swizzling
- **StorageModalWithTabs.tsx** ✅ - Only imports AsyncStorage, not React Query
- All other components ✅ - Don't use React Query

### Files to Update (Remove React Query References)
- **storageQueryUtils.ts** - Keep types, remove query-specific logic if any

---

## Implementation Plan

### Phase 1: Create Direct AsyncStorage Access Layer

#### 1.1 Create `useAsyncStorageKeys.ts` Hook
**Location:** `packages/storage/src/storage/hooks/useAsyncStorageKeys.ts`

**Purpose:** Replace React Query cache access with direct AsyncStorage API calls

**Note:** This hook returns ALL storage keys together (no separation of dev tool keys). The existing filter system in the UI already handles filtering dev tool keys automatically.

**Implementation:**
```typescript
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StorageKeyInfo, RequiredStorageKey } from '../types';

interface UseAsyncStorageKeysResult {
  storageKeys: StorageKeyInfo[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAsyncStorageKeys(
  requiredStorageKeys: RequiredStorageKey[] = []
): UseAsyncStorageKeysResult {
  // State management
  const [storageKeys, setStorageKeys] = useState<StorageKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all keys and values from AsyncStorage
  const fetchStorageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();

      if (!allKeys || allKeys.length === 0) {
        setStorageKeys([]);
        setIsLoading(false);
        return;
      }

      // 2. Get all values using multiGet
      const allKeyValuePairs = await AsyncStorage.multiGet(allKeys);

      // 3. Process keys into StorageKeyInfo format
      const allStorageKeys: StorageKeyInfo[] = [];

      allKeyValuePairs.forEach(([key, value]) => {

        // Parse value
        let parsedValue: unknown = value;
        if (value) {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value; // Keep as string if not JSON
          }
        }

        // Check if this is a required key
        const requiredConfig = requiredStorageKeys.find((req) => {
          if (typeof req === 'string') return req === key;
          return req.key === key;
        });

        // Determine status
        let status: StorageKeyInfo['status'] = 'optional_present';

        if (requiredConfig) {
          if (parsedValue === undefined || parsedValue === null) {
            status = 'required_missing';
          } else if (
            typeof requiredConfig === 'object' &&
            'expectedValue' in requiredConfig
          ) {
            status =
              parsedValue === requiredConfig.expectedValue
                ? 'required_present'
                : 'required_wrong_value';
          } else if (
            typeof requiredConfig === 'object' &&
            'expectedType' in requiredConfig
          ) {
            const actualType = parsedValue === null ? 'null' : typeof parsedValue;
            status =
              actualType.toLowerCase() === requiredConfig.expectedType.toLowerCase()
                ? 'required_present'
                : 'required_wrong_type';
          } else {
            status = 'required_present';
          }
        }

        const keyInfo: StorageKeyInfo = {
          key,
          value: parsedValue,
          storageType: 'async',
          status,
          category: requiredConfig ? 'required' : 'optional',
          ...(typeof requiredConfig === 'object' &&
            'expectedValue' in requiredConfig && {
              expectedValue: requiredConfig.expectedValue,
            }),
          ...(typeof requiredConfig === 'object' &&
            'expectedType' in requiredConfig && {
              expectedType: requiredConfig.expectedType,
            }),
          ...(typeof requiredConfig === 'object' &&
            'description' in requiredConfig && {
              description: requiredConfig.description,
            }),
        };

        allStorageKeys.push(keyInfo);
      });

      // 4. Add missing required keys
      requiredStorageKeys.forEach((req) => {
        const key = typeof req === 'string' ? req : req.key;
        const exists = allStorageKeys.some((k) => k.key === key);

        if (!exists) {
          allStorageKeys.push({
            key,
            value: undefined,
            storageType: 'async',
            status: 'required_missing',
            category: 'required',
            ...(typeof req === 'object' &&
              'expectedValue' in req && {
                expectedValue: req.expectedValue,
              }),
            ...(typeof req === 'object' &&
              'expectedType' in req && {
                expectedType: req.expectedType,
              }),
            ...(typeof req === 'object' &&
              'description' in req && {
                description: req.description,
              }),
          });
        }
      });

      setStorageKeys(allStorageKeys);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch storage data'));
      setStorageKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [requiredStorageKeys]);

  // Initial fetch
  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  return {
    storageKeys,
    isLoading,
    error,
    refresh: fetchStorageData,
  };
}
```

**Dependencies:**
- Uses existing `StorageKeyInfo` and `RequiredStorageKey` types
- No need for `isDevToolsStorageKey` - UI filters handle this

---

### Phase 2: Update GameUIStorageBrowser Component

#### 2.1 Replace React Query with Direct Storage Access
**File:** `packages/storage/src/storage/components/GameUIStorageBrowser.tsx`

**Changes:**

1. **Remove React Query imports (lines 11-12):**
```typescript
// DELETE:
import { useQueryClient } from "@tanstack/react-query";
```

2. **Remove React Query utility imports (lines 13-17):**
```typescript
// DELETE:
import {
  StorageType,
  getCleanStorageKey,
  getStorageType,
  isStorageQuery,
} from "../utils/storageQueryUtils";
```
Note: We still need `StorageType` but not from storageQueryUtils

3. **Add new hook import:**
```typescript
// ADD:
import { useAsyncStorageKeys } from "../hooks/useAsyncStorageKeys";
```

4. **Replace query client usage (lines 42-199):**
```typescript
// DELETE: All of this
const queryClient = useQueryClient();
const allQueries = queryClient.getQueryCache().getAll();
const storageQueriesData = allQueries.filter((query) =>
  isStorageQuery(query.queryKey)
);
const { storageKeys, devToolKeys, stats } = useMemo(() => {
  // ... 150 lines of query processing
}, [storageQueriesData, requiredStorageKeys]);

// REPLACE WITH:
const { storageKeys, isLoading, error, refresh } = useAsyncStorageKeys(
  requiredStorageKeys
);

// Calculate stats from keys (filter out dev tool keys in the calculation)
const stats = useMemo(() => {
  const allKeys = storageKeys;
  const appKeys = allKeys.filter((k) => !isDevToolsStorageKey(k.key));
  const devKeys = allKeys.filter((k) => isDevToolsStorageKey(k.key));

  return {
    totalCount: allKeys.length,
    requiredCount: appKeys.filter((k) => k.category === 'required').length,
    missingCount: appKeys.filter((k) => k.status === 'required_missing').length,
    wrongValueCount: appKeys.filter((k) => k.status === 'required_wrong_value').length,
    wrongTypeCount: appKeys.filter((k) => k.status === 'required_wrong_type').length,
    presentRequiredCount: appKeys.filter((k) => k.status === 'required_present').length,
    optionalCount: appKeys.filter((k) => k.category === 'optional').length,
    mmkvCount: 0, // Will be populated when MMKV is added
    asyncCount: appKeys.length,
    secureCount: 0, // Will be populated when SecureStore is added
    devToolsCount: devKeys.length,
  };
}, [storageKeys]);
```

5. **Add auto-refresh on storage events:**
```typescript
// DELETE: Manual refresh button and state
const [isRefreshing, setIsRefreshing] = useState(false);
const handleRefresh = useCallback(async () => { ... }, [queryClient]);

// ADD: Auto-refresh listener
import { addListener } from "../utils/AsyncStorageListener";

// Add useEffect to listen for storage events and auto-refresh
useEffect(() => {
  if (!visible) return;

  // Debounce to avoid multiple rapid refreshes
  let timeoutId: NodeJS.Timeout;

  const unsubscribe = addListener((event) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      refresh(); // Auto-refresh when storage changes
    }, 100); // 100ms debounce
  });

  return () => {
    clearTimeout(timeoutId);
    unsubscribe();
  };
}, [visible, refresh]);
```

**Remove from UI:**
- Delete the "Scan" button (lines 356-382 in action bar)
- Remove `isRefreshing` state checks
- Storage will now update automatically!

6. **Add loading/error states to UI:**
```typescript
// ADD: After the renderContent() function starts
if (isLoading && storageKeys.length === 0) {
  return (
    <View style={styles.emptyState}>
      <Database size={48} color={macOSColors.text.muted} />
      <Text style={styles.emptyTitle}>Loading storage keys...</Text>
    </View>
  );
}

if (error) {
  return (
    <View style={styles.emptyState}>
      <Database size={48} color={macOSColors.semantic.error} />
      <Text style={[styles.emptyTitle, { color: macOSColors.semantic.error }]}>
        Error loading storage
      </Text>
      <Text style={styles.emptySubtitle}>{error.message}</Text>
      <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}
```

7. **Add retry button styles:**
```typescript
// ADD to StyleSheet:
retryButton: {
  marginTop: 16,
  paddingHorizontal: 20,
  paddingVertical: 10,
  backgroundColor: gameUIColors.info,
  borderRadius: 8,
},
retryButtonText: {
  color: macOSColors.text.primary,
  fontSize: 14,
  fontWeight: '600',
  fontFamily: 'monospace',
},
```

---

### Phase 3: Remove React Query Utilities

#### 3.1 Delete `getStorageQueryCounts.ts`
**Action:** Delete file entirely
**Location:** `packages/storage/src/storage/utils/getStorageQueryCounts.ts`
**Reason:** No longer needed - stats calculated directly in GameUIStorageBrowser

#### 3.2 Delete `useStorageQueryCounts.ts`
**Action:** Delete file entirely
**Location:** `packages/storage/src/storage/hooks/useStorageQueryCounts.ts`
**Reason:** No longer needed - replaced by useAsyncStorageKeys

#### 3.3 Update `storageQueryUtils.ts`
**File:** `packages/storage/src/storage/utils/storageQueryUtils.ts`

**Changes:**
1. Remove query-related functions (if they're only used by deleted files)
2. Keep the following (used elsewhere):
   - `StorageType` type
   - `getStorageTypeLabel()`
   - `getStorageTypeHexColor()`

**Review:** Check if `isStorageQuery()`, `getStorageType()`, `getCleanStorageKey()` are used anywhere else:
- If used only in deleted files → DELETE
- If used in other components → KEEP

---

### Phase 4: Update StorageBrowserMode Component

#### 4.1 Remove React Query References
**File:** `packages/storage/src/storage/components/StorageBrowserMode.tsx`

**Changes:**

1. **Remove React Query import (line 1):**
```typescript
// DELETE:
import { Query } from "@tanstack/react-query";
```

2. **Remove unused props (lines 5-7):**
```typescript
// DELETE:
interface StorageBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  requiredStorageKeys?: RequiredStorageKey[];
}

// REPLACE WITH:
interface StorageBrowserModeProps {
  requiredStorageKeys?: RequiredStorageKey[];
}
```

3. **Update component signature (line 15):**
```typescript
// DELETE:
export function StorageBrowserMode({
  requiredStorageKeys = [],
}: StorageBrowserModeProps) {

// KEEP AS IS (no changes needed to implementation)
```

#### 4.2 Update StorageModalWithTabs Calls
**File:** `packages/storage/src/storage/components/StorageModalWithTabs.tsx`

**Changes at line 448-452:**
```typescript
// DELETE:
<StorageBrowserMode
  selectedQuery={undefined}
  onQuerySelect={() => {}}
  requiredStorageKeys={requiredStorageKeys}
/>

// REPLACE WITH:
<StorageBrowserMode
  requiredStorageKeys={requiredStorageKeys}
/>
```

---

### Phase 5: Update Package Dependencies

#### 5.1 Update package.json
**File:** `packages/storage/package.json`

**Changes:**

1. **Remove React Query dependency (line 23):**
```json
// DELETE:
"dependencies": {
  "@react-buoy/shared-ui": "workspace:*",
  "@tanstack/react-query": "^5.89.0"
}

// REPLACE WITH:
"dependencies": {
  "@react-buoy/shared-ui": "workspace:*"
}
```

That's it! No other peer dependencies needed for AsyncStorage (already listed).

---

### Phase 6: Update Documentation

#### 6.1 Update README.md
**File:** `packages/storage/README.md`

**Changes:**

1. **Update description (lines 5-7):**
```markdown
<!-- BEFORE -->
AsyncStorage browser and monitoring tool for React Native development.

<!-- AFTER -->
AsyncStorage browser and monitoring tool for React Native development. Works independently without any state management requirements.
```

2. **Remove any React Query mentions in examples**
   - Search for "query" and "tanstack"
   - Remove or update any references

3. **Update Quick Start section (lines 34-58):**
```markdown
<!-- Emphasize zero-config nature -->
**Import the preset and add it to your tools array. Done!**

The storage browser automatically:
- ✅ Discovers all AsyncStorage keys
- ✅ Displays values in real-time
- ✅ Monitors all storage operations
- ✅ Provides edit/delete/add functionality
- ✅ Works without any configuration or setup
- ✅ No state management library required
```

4. **Add note about independence:**
```markdown
## How It Works

The storage browser works by:
1. **Browser Tab**: Directly queries AsyncStorage.getAllKeys() and AsyncStorage.multiGet() to display all keys and values
2. **Events Tab**: Uses method swizzling to intercept AsyncStorage operations in real-time

No external dependencies or configuration required!
```

---

### Phase 7: Export New Hook

#### 7.1 Update storage/index.ts
**File:** `packages/storage/src/storage/index.ts`

**Add export:**
```typescript
// Storage section components
export { StorageSection } from "./components/StorageSection";
export { StorageModalWithTabs } from "./components/StorageModalWithTabs";
export { StorageKeyCard } from "./components/StorageKeyCard";
export { StorageKeyStatsSection } from "./components/StorageKeyStats";
export { StorageKeySection } from "./components/StorageKeySection";
export { StorageBrowserMode } from "./components/StorageBrowserMode";
export { StorageEventsSection } from "./components/StorageEventsSection";

// Storage hooks
export { useAsyncStorageKeys } from "./hooks/useAsyncStorageKeys"; // ADD THIS

// Storage types
export * from "./types";

// Storage utilities
export * from "./utils";
```

---

## Testing Checklist

After implementation, verify:

### Functionality Tests
- [ ] Storage browser opens without errors
- [ ] All AsyncStorage keys are displayed
- [ ] Key values are shown correctly (strings, objects, arrays, etc.)
- [ ] Refresh button works and updates the list
- [ ] Required keys validation works
- [ ] Missing keys are shown with correct status
- [ ] Wrong type/value detection works
- [ ] Dev tool keys are separated correctly
- [ ] Export functionality works
- [ ] Clear storage functionality works
- [ ] Filter cards work (All, Missing, Issues)
- [ ] Storage type filter works
- [ ] Search functionality works (if present)

### Performance Tests
- [ ] Large number of keys (100+) loads quickly
- [ ] Refresh is responsive
- [ ] No memory leaks on repeated refresh
- [ ] No React Query warnings in console

### Integration Tests
- [ ] Events tab still works independently
- [ ] Tab switching works smoothly
- [ ] Modal persistence works
- [ ] FloatingDevTools integration works
- [ ] Preset configuration works

### Edge Cases
- [ ] Empty storage (no keys) shows appropriate message
- [ ] Storage errors are handled gracefully
- [ ] Invalid JSON values are handled
- [ ] Null/undefined values display correctly
- [ ] Very long key names are handled
- [ ] Very large values are handled

---

## Success Criteria

✅ **Zero React Query imports** in storage package
✅ **Zero configuration required** from end user
✅ **Works out of the box** - just add preset to FloatingDevTools
✅ **All existing features work** (browse, edit, delete, add, validate)
✅ **Performance is equal or better** than React Query version
✅ **No breaking changes** to public API
✅ **Events tab still works** independently

---

## Rollback Plan

If issues arise:
1. Keep React Query implementation in separate branch
2. Feature flag the new implementation
3. Document known limitations
4. Provide migration guide for edge cases

---

## Future Enhancements (Out of Scope)

These will be handled in separate plans:
- MMKV support (PLAN_MMKV.md)
- Expo SecureStore support (PLAN_SECURE_STORE.md)
- Real-time updates via event listener integration
- Optimistic UI updates
- Pagination for large datasets
- Virtual scrolling for performance

---

## Estimated Effort

- **Phase 1**: 2-3 hours (hook creation)
- **Phase 2**: 2-3 hours (component updates)
- **Phase 3**: 30 minutes (file deletions)
- **Phase 4**: 30 minutes (prop cleanup)
- **Phase 5**: 15 minutes (package.json)
- **Phase 6**: 1 hour (documentation)
- **Phase 7**: 15 minutes (exports)
- **Testing**: 2-3 hours

**Total**: ~8-11 hours

---

## Notes

- This plan focuses ONLY on AsyncStorage
- MMKV and SecureStore will be separate plans
- Keep the event listener system exactly as-is
- Maintain backward compatibility with existing configurations
- The `requiredStorageKeys` prop should continue to work exactly as before
