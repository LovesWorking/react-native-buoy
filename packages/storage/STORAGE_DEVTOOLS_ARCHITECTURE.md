# Storage Dev Tools - Current Architecture

> **Package**: @react-buoy/storage
>
> **Location**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage`
>
> **Status**: AsyncStorage Only (MMKV & SecureStore NOT implemented)
>
> **Last Updated**: 2025-01-04

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Status](#current-implementation-status)
3. [Architecture Overview](#architecture-overview)
4. [AsyncStorage Implementation](#asyncstorage-implementation)
5. [UI Component Architecture](#ui-component-architecture)
6. [Data Flow](#data-flow)
7. [Code Organization](#code-organization)
8. [Integration Points](#integration-points)
9. [What Works vs What Doesn't](#what-works-vs-what-doesnt)
10. [Critical Issues](#critical-issues)

---

## Executive Summary

### What This Package Does

**@react-buoy/storage** is a development tool that provides a **storage browser and event monitor** for React Native applications. It allows developers to:

- 📊 Browse all storage keys and values
- 🔍 Search and filter storage data
- ✏️ Edit, add, and delete storage entries
- 📡 Monitor storage operations in real-time
- ✅ Validate required keys against expected values
- 📤 Export and purge storage data

### Current State

**✅ Fully Implemented:**
- AsyncStorage monitoring and browsing

**❌ NOT Implemented (Placeholders Only):**
- MMKV support
- Expo SecureStore support

**⚠️ Misleading UI:**
- UI shows filter options for "MMKV" and "Secure"
- These options do nothing (return empty results)
- No indication to users that features are unavailable

---

## Current Implementation Status

### Storage Type Support Matrix

| Storage Type | Browser Tab | Events Tab | UI Filter | Notes |
|--------------|-------------|------------|-----------|-------|
| **AsyncStorage** | ✅ Full | ✅ Full | ✅ Works | Complete implementation |
| **MMKV** | ❌ None | ❌ None | ⚠️ Shows but empty | Only documentation exists |
| **Expo SecureStore** | ❌ None | ❌ None | ⚠️ Shows but empty | Not started |

### Feature Completeness

| Feature | Status | Notes |
|---------|--------|-------|
| Browse all keys | ✅ Complete | AsyncStorage only |
| Real-time monitoring | ✅ Complete | AsyncStorage only |
| Edit values | ✅ Complete | Inline editing |
| Delete keys | ✅ Complete | Single and bulk |
| Add new keys | ✅ Complete | Modal form |
| Search keys | ⚠️ Partial | Logic exists, UI missing |
| Filter by status | ✅ Complete | All/Missing/Issues |
| Filter by type | ⚠️ Misleading | Shows MMKV/Secure options |
| Required key validation | ✅ Complete | Multiple validation modes |
| Export data | ✅ Complete | JSON export |
| Purge storage | ✅ Complete | Clear all |
| Auto-refresh | ✅ Complete | Debounced updates |
| Diff viewer | ✅ Complete | Side-by-side comparison |

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   React Native App                          │
│                                                               │
│   import { storageToolPreset } from '@react-buoy/storage'   │
│   <FloatingDevTools tools={[storageToolPreset]} />          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              @react-buoy/storage Package                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           Storage Tool Preset                        │  │
│  │  (Entry point configuration)                         │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│          ┌───────────┴───────────┐                          │
│          ↓                       ↓                          │
│  ┌───────────────┐       ┌──────────────┐                  │
│  │ Browser Tab   │       │ Events Tab   │                  │
│  │               │       │              │                  │
│  │ UI Components │       │ UI Components│                  │
│  └───────┬───────┘       └───────┬──────┘                  │
│          │                       │                          │
│          ↓                       ↓                          │
│  ┌──────────────────────────────────────┐                  │
│  │        Hooks & Utilities             │                  │
│  │                                       │                  │
│  │  ├─ useAsyncStorageKeys (Browser)   │                  │
│  │  └─ AsyncStorageListener (Events)   │                  │
│  └─────────────┬────────────────────────┘                  │
│                │                                            │
└────────────────┼────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│               React Native AsyncStorage                     │
│                                                               │
│  Intercepted via Method Swizzling                           │
│  - setItem()    ← Wrapped                                   │
│  - removeItem() ← Wrapped                                   │
│  - mergeItem()  ← Wrapped                                   │
│  - clear()      ← Wrapped                                   │
│  - multiSet()   ← Wrapped                                   │
│  - multiRemove()← Wrapped                                   │
│  - multiMerge() ← Wrapped                                   │
└─────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
StorageModalWithTabs
├── Tab 1: "Browser"
│   └── GameUIStorageBrowser
│       ├── StorageFilterCards
│       │   ├── StatusFilter (All, Missing, Issues)
│       │   └── TypeFilter (All, Async, MMKV, Secure)
│       ├── ActionBar
│       │   ├── ExportButton
│       │   └── PurgeButton
│       ├── StorageKeySection (Required Keys)
│       │   └── StorageKeyCard[] (individual keys)
│       │       ├── KeyHeader (name, status badge)
│       │       ├── ValueDisplay (formatted value)
│       │       ├── ActionButtons (Edit, Delete, Copy)
│       │       └── DiffViewer (if changed)
│       └── StorageKeySection (Optional Keys)
│           └── StorageKeyCard[] (individual keys)
└── Tab 2: "Events"
    └── StorageEventsSection
        ├── EventControls
        │   ├── PauseButton
        │   ├── ClearButton
        │   └── EventFilters
        └── EventList
            └── EventCard[] (chronological log)
```

---

## AsyncStorage Implementation

### Dual Strategy Pattern

The package uses **two complementary approaches** to provide complete coverage:

#### Strategy 1: Browser Tab (Direct Queries)

**Purpose**: Display current state of all storage

**Implementation**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/hooks/useAsyncStorageKeys.ts`

**How It Works**:
```typescript
async function fetchStorageKeys() {
  // 1. Get all keys
  const allKeys = await AsyncStorage.getAllKeys();

  // 2. Fetch all values in batch
  const keyValuePairs = await AsyncStorage.multiGet(allKeys);

  // 3. Parse and validate each
  const parsed = keyValuePairs.map(([key, value]) => {
    let parsedValue = value;
    try {
      parsedValue = JSON.parse(value);
    } catch {
      // Keep as string if not JSON
    }

    return {
      key,
      value: parsedValue,
      storageType: 'async',
      status: validateKey(key, parsedValue),
      category: isRequired(key) ? 'required' : 'optional'
    };
  });

  // 4. Add missing required keys
  addMissingRequiredKeys(parsed);

  return parsed;
}
```

**Data Flow**:
```
User Opens Browser Tab
        ↓
useAsyncStorageKeys hook triggered
        ↓
AsyncStorage.getAllKeys() called
        ↓
AsyncStorage.multiGet(allKeys) called
        ↓
Parse JSON for each value
        ↓
Validate against required keys config
        ↓
Determine status (present/missing/wrong_type/wrong_value)
        ↓
Add placeholder entries for missing required keys
        ↓
Return StorageKeyInfo[]
        ↓
UI renders key cards
```

**Validation Logic**:

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/hooks/useAsyncStorageKeys.ts` (lines 70-127)

```typescript
// Required key configuration types
type RequiredStorageKey =
  | string  // Just a key name
  | { key: string; expectedValue: string; description?: string }  // Exact value match
  | { key: string; expectedType: string; description?: string }   // Type check
  | { key: string; storageType: StorageType; description?: string }  // Storage type

// Validation process
function validateKey(key: string, value: unknown): Status {
  const config = findRequiredConfig(key);

  if (!config) {
    return 'optional_present';
  }

  // Check if key exists
  if (value === undefined) {
    return 'required_missing';
  }

  // Check expected value (exact match)
  if (config.expectedValue !== undefined) {
    if (value !== config.expectedValue) {
      return 'required_wrong_value';
    }
  }

  // Check expected type
  if (config.expectedType !== undefined) {
    if (typeof value !== config.expectedType) {
      return 'required_wrong_type';
    }
  }

  return 'required_present';
}
```

**Key Features**:
- ✅ Batch fetching for performance
- ✅ Graceful JSON parsing (fallback to string)
- ✅ Multiple validation modes
- ✅ Missing key detection
- ✅ Status categorization

---

#### Strategy 2: Events Tab (Method Swizzling)

**Purpose**: Monitor operations in real-time

**Implementation**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/utils/AsyncStorageListener.ts`

**How It Works**:

**Initialization** (happens once on app start):
```typescript
class AsyncStorageListener {
  private originalSetItem: typeof AsyncStorage.setItem;
  private originalRemoveItem: typeof AsyncStorage.removeItem;
  // ... store all original methods

  async startListening(): Promise<boolean> {
    // Prevent double-swizzling
    if (AsyncStorage.setItem.name === 'swizzled_setItem') {
      console.error('Already swizzled!');
      return false;
    }

    // Store originals
    this.originalSetItem = AsyncStorage.setItem;
    this.originalRemoveItem = AsyncStorage.removeItem;
    // ... store all methods

    // Replace with wrapped versions
    AsyncStorage.setItem = this.wrappedSetItem;
    AsyncStorage.removeItem = this.wrappedRemoveItem;
    // ... wrap all methods

    return true;
  }

  wrappedSetItem = async (key: string, value: string) => {
    // Emit event BEFORE operation
    if (!this.shouldIgnoreKey(key)) {
      this.emit({
        action: 'setItem',
        timestamp: new Date(),
        data: { key, value }
      });
    }

    // Call original method
    return this.originalSetItem(key, value);
  };
}
```

**Data Flow**:
```
App calls AsyncStorage.setItem('user.name', 'John')
        ↓
Wrapped setItem intercepted
        ↓
Check if key should be ignored (dev tool keys)
        ↓
NO → Emit event to all listeners
        ↓
Call original AsyncStorage.setItem
        ↓
Value written to storage
        ↓
Listeners receive event
        ↓
Events tab appends to log
        ↓
Browser tab auto-refreshes (debounced 100ms)
```

**Methods Swizzled**:

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/utils/AsyncStorageListener.ts` (lines 65-200)

| Method | Event Action | Data Captured |
|--------|--------------|---------------|
| `setItem(key, value)` | `setItem` | `{ key, value }` |
| `removeItem(key)` | `removeItem` | `{ key }` |
| `mergeItem(key, value)` | `mergeItem` | `{ key, value }` |
| `clear()` | `clear` | `{}` |
| `multiSet([[k,v], ...])` | `multiSet` | `{ pairs }` |
| `multiRemove([keys])` | `multiRemove` | `{ keys }` |
| `multiMerge([[k,v], ...])` | `multiMerge` | `{ pairs }` |

**Ignored Keys (Prevent Infinite Loops)**:

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/utils/AsyncStorageListener.ts` (line 24)

```typescript
private ignoredKeys = new Set([
  '@react_buoy_storage_event_filters',
  '@react_buoy_storage_key_filters',
  '@react_buoy_storage_is_monitoring',
  'REACT_QUERY_OFFLINE_CACHE',  // Legacy
]);

private shouldIgnoreKey(key: string): boolean {
  // Exact match
  if (this.ignoredKeys.has(key)) return true;

  // Prefix match
  for (const ignoredKey of this.ignoredKeys) {
    if (key.startsWith(ignoredKey)) return true;
  }

  return false;
}
```

**Why This Matters**: Without filtering, dev tool writes would trigger events, which would trigger more writes, causing infinite loops.

**Listener Registry**:

```typescript
class AsyncStorageListener {
  private listeners: Array<(event: AsyncStorageEvent) => void> = [];

  addListener(callback: (event: AsyncStorageEvent) => void): () => void {
    this.listeners.push(callback);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private emit(event: AsyncStorageEvent): void {
    // Skip if no listeners (zero overhead)
    if (this.listeners.length === 0) return;

    // Call all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Swallow errors to prevent one bad listener from breaking others
        console.error('Error in AsyncStorage listener:', error);
      }
    });
  }
}
```

**Singleton Pattern**:

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/utils/AsyncStorageListener.ts` (lines 250-260)

```typescript
// Create singleton instance
const asyncStorageListener = new AsyncStorageListener();

// Export methods (not class)
export const startListening = () => asyncStorageListener.startListening();
export const stopListening = () => asyncStorageListener.stopListening();
export const addListener = (callback) => asyncStorageListener.addListener(callback);
export const removeListener = (callback) => asyncStorageListener.removeListener(callback);
```

**Why Singleton**: Prevents multiple instances from swizzling the same methods multiple times.

---

### Auto-Refresh Integration

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/GameUIStorageBrowser.tsx` (lines 69-85)

**How Browser Tab Auto-Refreshes on Events**:

```typescript
useEffect(() => {
  let timeoutId: ReturnType<typeof setTimeout>;

  // Subscribe to storage events
  const unsubscribe = addListener((event) => {
    // Clear any pending refresh
    clearTimeout(timeoutId);

    // Debounce refresh (wait 100ms)
    timeoutId = setTimeout(() => {
      refresh();  // Calls useAsyncStorageKeys.refresh()
    }, 100);
  });

  // Cleanup on unmount
  return () => {
    clearTimeout(timeoutId);
    unsubscribe();
  };
}, [refresh]);
```

**Why Debounce**: Prevents excessive refreshes during rapid operations (e.g., `multiSet` with 100 keys).

**Result**: Browser tab is **always up-to-date** with storage state, no manual refresh needed.

---

## UI Component Architecture

### Type System

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/types.ts`

```typescript
export interface StorageKeyInfo {
  key: string;                    // Storage key name
  value: unknown;                 // Parsed value (object if JSON, string otherwise)
  expectedValue?: string;         // For validation
  expectedType?: string;          // For validation
  description?: string;           // Human-readable description
  storageType: StorageType;       // "async" | "mmkv" | "secure"
  status: StorageKeyStatus;       // Validation status
  category: "required" | "optional";  // Whether key is required
  lastUpdated?: Date;             // When value last changed
}

export type StorageType = "async" | "mmkv" | "secure";

export type StorageKeyStatus =
  | "required_present"          // ✅ Required key exists with correct value
  | "required_missing"          // ❌ Required key doesn't exist
  | "required_wrong_value"      // ⚠️ Required key has wrong value
  | "required_wrong_type"       // ⚠️ Required key has wrong type
  | "optional_present";         // ℹ️ Optional key exists

export interface StorageKeyStats {
  totalCount: number;           // Total keys
  requiredCount: number;        // Total required keys
  missingCount: number;         // Required keys missing
  wrongValueCount: number;      // Required keys with wrong value
  wrongTypeCount: number;       // Required keys with wrong type
  presentRequiredCount: number; // Required keys present and correct
  optionalCount: number;        // Optional keys
  mmkvCount: number;            // MMKV keys (always 0 currently)
  asyncCount: number;           // AsyncStorage keys
  secureCount: number;          // SecureStore keys (always 0 currently)
}

export type RequiredStorageKey =
  | string  // Simple key name
  | {
      key: string;
      expectedValue: string;
      description?: string;
    }  // Exact value match
  | {
      key: string;
      expectedType: string;
      description?: string;
    }  // Type check
  | {
      key: string;
      storageType: StorageType;
      description?: string;
    };  // Storage type
```

### Component Details

#### StorageModalWithTabs

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/StorageModalWithTabs.tsx`

**Purpose**: Main container with tab navigation

**Props**:
```typescript
interface StorageModalWithTabsProps {
  visible: boolean;
  onClose: () => void;
  requiredStorageKeys: RequiredStorageKey[];
  ignoredPatterns?: string[];
  searchQuery?: string;
  devToolMode?: boolean;
}
```

**State Management**:
```typescript
const [activeTab, setActiveTab] = useState<'browser' | 'events'>('browser');
```

**Tabs**:
1. **Browser**: Shows `<GameUIStorageBrowser />` with current storage state
2. **Events**: Shows `<StorageEventsSection />` with operation log

---

#### GameUIStorageBrowser

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/GameUIStorageBrowser.tsx`

**Purpose**: Main browser UI with filters, search, and key display

**Key Features**:
- Status filtering (All, Missing, Issues)
- Storage type filtering (All, Async, MMKV, Secure)
- Search filtering (by key name)
- Required vs Optional grouping
- Stats display
- Export/Purge actions

**Filtering Logic**:

```typescript
// 1. Filter by status
const statusFiltered = keys.filter((k) => {
  if (activeStatus === 'all') return true;
  if (activeStatus === 'missing') return k.status === 'required_missing';
  if (activeStatus === 'issues') {
    return k.status === 'required_wrong_value' ||
           k.status === 'required_wrong_type' ||
           k.status === 'required_missing';
  }
});

// 2. Filter by storage type
const typeFiltered = statusFiltered.filter((k) => {
  if (activeStorageType === 'all') return true;
  return k.storageType === activeStorageType;
});

// 3. Filter by search query
const searchFiltered = typeFiltered.filter((k) => {
  if (!searchQuery) return true;
  return k.key.toLowerCase().includes(searchQuery.toLowerCase());
});

// 4. Filter by ignored patterns
const finalFiltered = searchFiltered.filter((k) => {
  return !ignoredPatterns.some((pattern) => {
    return k.key.includes(pattern);
  });
});
```

**Grouping Logic**:

```typescript
const requiredKeys = finalFiltered.filter((k) => k.category === 'required');
const optionalKeys = finalFiltered.filter((k) => k.category === 'optional');
```

**Render**:
```tsx
<ScrollView>
  <StorageFilterCards
    activeStatus={activeStatus}
    setActiveStatus={setActiveStatus}
    activeStorageType={activeStorageType}
    setActiveStorageType={setActiveStorageType}
    stats={stats}
  />

  <ActionBar
    onExport={handleExport}
    onPurge={handlePurge}
  />

  <StorageKeySection
    title="Required Keys"
    keys={requiredKeys}
  />

  <StorageKeySection
    title="Optional Keys"
    keys={optionalKeys}
  />
</ScrollView>
```

---

#### StorageFilterCards

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/StorageFilterCards.tsx`

**Purpose**: Filter buttons for status and storage type

**Filter Types**:

**Status Filters**:
```typescript
type StatusFilter = 'all' | 'missing' | 'issues';

// UI:
<FilterButton active={activeStatus === 'all'}>All ({stats.totalCount})</FilterButton>
<FilterButton active={activeStatus === 'missing'}>Missing ({stats.missingCount})</FilterButton>
<FilterButton active={activeStatus === 'issues'}>Issues ({stats.wrongValueCount + stats.wrongTypeCount})</FilterButton>
```

**Storage Type Filters**:
```typescript
type StorageTypeFilter = 'all' | 'async' | 'mmkv' | 'secure';

// UI:
<FilterButton active={activeStorageType === 'all'}>All</FilterButton>
<FilterButton active={activeStorageType === 'async'}>Async ({stats.asyncCount})</FilterButton>
<FilterButton active={activeStorageType === 'mmkv'}>MMKV ({stats.mmkvCount})</FilterButton>  {/* Always 0 */}
<FilterButton active={activeStorageType === 'secure'}>Secure ({stats.secureCount})</FilterButton>  {/* Always 0 */}
```

**⚠️ Critical Issue**: MMKV and Secure filters are shown but **always return empty** because those storage types aren't implemented.

---

#### StorageKeyCard

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/StorageKeyCard.tsx`

**Purpose**: Display individual storage key with value and actions

**Props**:
```typescript
interface StorageKeyCardProps {
  storageKey: StorageKeyInfo;
  onEdit?: (key: string, newValue: any) => void;
  onDelete?: (key: string) => void;
  onCopy?: (key: string, value: any) => void;
}
```

**UI Elements**:
1. **Header**: Key name + status badge
2. **Value Display**: Formatted value (JSON syntax highlighting)
3. **Actions**: Edit, Delete, Copy buttons
4. **Description**: Optional description text
5. **Diff Viewer**: Shows old vs new value if changed

**Status Badges**:
```typescript
const statusConfig = {
  'required_present': { color: 'green', icon: '✓', label: 'Present' },
  'required_missing': { color: 'red', icon: '✗', label: 'Missing' },
  'required_wrong_value': { color: 'orange', icon: '⚠', label: 'Wrong Value' },
  'required_wrong_type': { color: 'orange', icon: '⚠', label: 'Wrong Type' },
  'optional_present': { color: 'blue', icon: 'ℹ', label: 'Optional' },
};
```

**Value Formatting**:
```typescript
function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}
```

---

#### StorageEventsSection

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/StorageEventsSection.tsx`

**Purpose**: Real-time event monitoring UI

**State**:
```typescript
const [events, setEvents] = useState<AsyncStorageEvent[]>([]);
const [isPaused, setIsPaused] = useState(false);
const [eventFilter, setEventFilter] = useState<string | 'all'>('all');
```

**Event Subscription**:
```typescript
useEffect(() => {
  const unsubscribe = addListener((event) => {
    if (!isPaused) {
      setEvents((prev) => [event, ...prev]);  // Prepend (newest first)
    }
  });

  return unsubscribe;
}, [isPaused]);
```

**Event Filtering**:
```typescript
const filteredEvents = events.filter((event) => {
  if (eventFilter === 'all') return true;
  return event.action === eventFilter;
});
```

**Event Display**:
```tsx
<FlatList
  data={filteredEvents}
  renderItem={({ item }) => (
    <EventCard>
      <EventHeader>
        <EventAction>{item.action}</EventAction>
        <EventTime>{formatTime(item.timestamp)}</EventTime>
      </EventHeader>
      <EventData>{JSON.stringify(item.data, null, 2)}</EventData>
    </EventCard>
  )}
/>
```

**Controls**:
```tsx
<ControlBar>
  <PauseButton onPress={() => setIsPaused(!isPaused)}>
    {isPaused ? 'Resume' : 'Pause'}
  </PauseButton>

  <ClearButton onPress={() => setEvents([])}>
    Clear
  </ClearButton>

  <FilterDropdown
    value={eventFilter}
    onChange={setEventFilter}
    options={['all', 'setItem', 'removeItem', 'clear']}
  />
</ControlBar>
```

---

## Data Flow

### Complete Flow: User Opens Browser Tab

```
1. User opens dev tools modal
        ↓
2. StorageModalWithTabs renders
        ↓
3. GameUIStorageBrowser mounts
        ↓
4. useAsyncStorageKeys hook executes
        ↓
5. AsyncStorage.getAllKeys() called
        ↓
6. AsyncStorage.multiGet(allKeys) called
        ↓
7. Parse JSON for each value
        ↓
8. Validate against required keys
        ↓
9. Add missing required keys as placeholders
        ↓
10. Return StorageKeyInfo[]
        ↓
11. Filter by status (activeStatus)
        ↓
12. Filter by type (activeStorageType)
        ↓
13. Filter by search (searchQuery)
        ↓
14. Group into required vs optional
        ↓
15. Render StorageKeyCard for each key
        ↓
16. User sees all storage keys
```

### Complete Flow: User Edits Value

```
1. User clicks "Edit" on StorageKeyCard
        ↓
2. Modal opens with current value
        ↓
3. User modifies value, clicks "Save"
        ↓
4. onEdit(key, newValue) called
        ↓
5. AsyncStorage.setItem(key, JSON.stringify(newValue))
        ↓
6. AsyncStorageListener intercepts call
        ↓
7. Wrapped setItem emits event
        ↓
8. Original setItem writes to storage
        ↓
9. Event listeners receive notification
        ↓
10. Events tab appends event to log
        ↓
11. Browser tab auto-refresh triggered (debounced 100ms)
        ↓
12. useAsyncStorageKeys refetches data
        ↓
13. UI updates with new value
        ↓
14. DiffViewer shows old vs new value
```

### Complete Flow: Storage Operation Monitoring

```
App Code:
  AsyncStorage.setItem('user.token', 'abc123')
        ↓
AsyncStorageListener (Method Swizzling):
  AsyncStorage.setItem = wrappedSetItem
        ↓
Wrapped Method:
  1. Check if key should be ignored
  2. NO → Emit event { action: 'setItem', key: 'user.token', value: 'abc123', timestamp: ... }
  3. Call original setItem
        ↓
Event Emission:
  listeners.forEach(listener => listener(event))
        ↓
Listeners:
  - Events Tab: Append to event log
  - Browser Tab: Trigger refresh (debounced)
        ↓
Browser Tab Auto-Refresh:
  1. clearTimeout(pendingRefresh)
  2. setTimeout(() => refresh(), 100)
  3. After 100ms: useAsyncStorageKeys.refresh()
  4. Fetch latest data
  5. Re-render UI
```

---

## Code Organization

### Directory Structure

```
src/
├── storage/
│   ├── components/
│   │   ├── GameUIStorageBrowser.tsx          # Main browser UI
│   │   ├── StorageModalWithTabs.tsx          # Tab container
│   │   ├── StorageEventsSection.tsx          # Events monitoring UI
│   │   ├── StorageFilterCards.tsx            # Filter buttons
│   │   ├── StorageKeySection.tsx             # Key grouping (Required/Optional)
│   │   ├── StorageKeyCard.tsx                # Individual key display
│   │   ├── StorageValueDisplay.tsx           # Value formatting
│   │   ├── AddStorageKeyModal.tsx            # Add new key modal
│   │   ├── EditStorageKeyModal.tsx           # Edit value modal
│   │   ├── DiffViewer/
│   │   │   ├── DiffViewer.tsx                # Side-by-side diff
│   │   │   └── DiffLine.tsx                  # Individual diff line
│   │   └── ... (20+ component files)
│   ├── hooks/
│   │   ├── useAsyncStorageKeys.ts            # Browser data fetching
│   │   ├── useStorageKeyStats.ts             # Stats calculation
│   │   └── useStorageFilters.ts              # Filter state management
│   ├── utils/
│   │   ├── AsyncStorageListener.ts           # Event system (method swizzling)
│   │   ├── storageKeyValidation.ts           # Validation logic
│   │   └── storageKeyFormatting.ts           # Value formatting
│   ├── types.ts                              # TypeScript definitions
│   └── index.ts                              # Public exports
├── index.tsx                                 # Package entry point
└── preset.tsx                                # Pre-configured tool
```

### Key Files by Purpose

**Core Logic**:
- `hooks/useAsyncStorageKeys.ts` - Fetches and validates storage data
- `utils/AsyncStorageListener.ts` - Event monitoring system

**UI Components**:
- `components/StorageModalWithTabs.tsx` - Main container
- `components/GameUIStorageBrowser.tsx` - Browser tab
- `components/StorageEventsSection.tsx` - Events tab

**Configuration**:
- `preset.tsx` - Default configuration (`storageToolPreset`)
- `types.ts` - Type definitions

**Entry Points**:
- `index.tsx` - Package exports
- `src/storage/index.ts` - Component exports

---

## Integration Points

### How Apps Use This Package

**Option 1: Pre-configured Preset (Recommended)**

```typescript
import { FloatingDevTools } from '@react-buoy/core';
import { storageToolPreset } from '@react-buoy/storage';

export default function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools tools={[storageToolPreset]} />
    </>
  );
}
```

**What `storageToolPreset` Provides**:

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/preset.tsx`

```typescript
export const storageToolPreset: DevTool = {
  name: 'Storage Browser',
  icon: '💾',
  component: StorageModalWithTabs,
  defaultProps: {
    requiredStorageKeys: [],
    ignoredPatterns: [],
    searchQuery: '',
    devToolMode: true,
  },
};
```

**Option 2: Custom Configuration**

```typescript
import { createStorageTool } from '@react-buoy/storage';

const myStorageTool = createStorageTool({
  requiredStorageKeys: [
    'user.id',
    { key: 'user.token', expectedType: 'string' },
    { key: 'settings.theme', expectedValue: 'dark' },
  ],
  ignoredPatterns: [
    '@my_app_internal_',
    'CACHE_',
  ],
});

<FloatingDevTools tools={[myStorageTool]} />
```

**Option 3: Direct Component Usage**

```typescript
import { StorageModalWithTabs } from '@react-buoy/storage';

function MyDevToolsUI() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onPress={() => setVisible(true)}>Open Storage Browser</Button>

      <StorageModalWithTabs
        visible={visible}
        onClose={() => setVisible(false)}
        requiredStorageKeys={[
          'user.id',
          { key: 'user.name', expectedType: 'string' },
        ]}
      />
    </>
  );
}
```

### Initialization Sequence

```
1. App imports storageToolPreset
        ↓
2. FloatingDevTools renders with tools={[storageToolPreset]}
        ↓
3. User taps floating dev tools button
        ↓
4. Dev tools modal opens
        ↓
5. User taps "Storage Browser" tool
        ↓
6. StorageModalWithTabs mounts
        ↓
7. GameUIStorageBrowser mounts (Browser tab active by default)
        ↓
8. useAsyncStorageKeys hook executes
        ↓
9. AsyncStorageListener.startListening() called
        ↓
10. AsyncStorage methods swizzled (if not already)
        ↓
11. Event listeners registered
        ↓
12. Initial data fetched and displayed
        ↓
13. Auto-refresh listener activated
        ↓
14. User can browse/edit/monitor storage
```

### Cleanup on Unmount

```typescript
// In StorageModalWithTabs
useEffect(() => {
  return () => {
    // AsyncStorageListener does NOT restore original methods
    // Methods stay swizzled even after unmount
    // This is intentional (listeners can still monitor)
  };
}, []);

// In GameUIStorageBrowser (auto-refresh)
useEffect(() => {
  const unsubscribe = addListener(...);

  return () => {
    clearTimeout(timeoutId);
    unsubscribe();  // Remove this specific listener
  };
}, []);
```

**Note**: AsyncStorage methods remain swizzled even after dev tools close. This is by design (low overhead when no listeners).

---

## What Works vs What Doesn't

### ✅ Fully Functional (AsyncStorage)

**Browser Tab**:
- ✅ Fetch all keys and values
- ✅ Parse JSON values
- ✅ Validate required keys
- ✅ Filter by status (All, Missing, Issues)
- ✅ Filter by storage type (Async works, MMKV/Secure don't)
- ✅ Search by key name (logic exists, UI pending)
- ✅ Group by category (Required, Optional)
- ✅ Display status badges
- ✅ Show stats (counts)
- ✅ Edit values inline
- ✅ Delete keys
- ✅ Add new keys
- ✅ Copy to clipboard
- ✅ Export all data (JSON)
- ✅ Purge storage (clear all)
- ✅ Auto-refresh on storage changes
- ✅ Diff viewer (old vs new values)

**Events Tab**:
- ✅ Real-time event monitoring
- ✅ Method swizzling interception
- ✅ Event logging (all AsyncStorage operations)
- ✅ Pause/resume monitoring
- ✅ Clear event log
- ✅ Filter events by type
- ✅ Timestamp display
- ✅ Data display (key, value)

**Integration**:
- ✅ Pre-configured preset
- ✅ Custom configuration
- ✅ Direct component usage
- ✅ FloatingDevTools integration
- ✅ Zero config required

### ❌ Not Implemented

**MMKV Support**:
- ❌ No MMKV listener/swizzling
- ❌ No MMKV data fetching
- ❌ No MMKV instance selection
- ❌ No MMKV type detection
- ❌ UI filter option exists but returns empty

**Expo SecureStore Support**:
- ❌ No SecureStore listener
- ❌ No SecureStore data fetching
- ❌ UI filter option exists but returns empty

**UI Features (Planned)**:
- ❌ Search bar in UI (logic exists, UI missing)
- ❌ Filter button for ignored patterns
- ❌ Dynamic header based on storage type
- ❌ Pagination for large datasets
- ❌ Virtual scrolling

### ⚠️ Partially Working / Misleading

**Storage Type Filtering**:
- ⚠️ UI shows "All", "Async", "MMKV", "Secure" options
- ⚠️ Only "All" and "Async" return results
- ⚠️ "MMKV" and "Secure" always show empty (not disabled)
- ⚠️ No indication to user that features are unavailable

**Stats**:
- ⚠️ `mmkvCount: 0` always (hardcoded)
- ⚠️ `secureCount: 0` always (hardcoded)
- ⚠️ Accurate for AsyncStorage only

**Documentation**:
- ⚠️ Three MMKV markdown files exist (reference only, not implementation guides)
- ⚠️ May mislead developers into thinking MMKV is implemented

---

## Critical Issues

### Issue 1: Misleading MMKV/SecureStore UI

**Severity**: 🔴 High (User Confusion)

**Problem**: UI shows filter options for storage types that don't exist.

**Impact**:
- Users select "MMKV" → see empty list → think it's broken
- No indication that features are unavailable
- Could cause support requests

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/StorageFilterCards.tsx`

**Current Code**:
```typescript
<FilterButton active={activeStorageType === 'mmkv'}>
  MMKV ({stats.mmkvCount})  {/* Always 0 */}
</FilterButton>
```

**Recommendation**:
```typescript
<FilterButton
  active={activeStorageType === 'mmkv'}
  disabled={true}
  tooltip="MMKV support coming soon"
>
  MMKV ({stats.mmkvCount})
</FilterButton>
```

Or hide entirely:
```typescript
{/* Only show if MMKV is implemented */}
{IS_MMKV_IMPLEMENTED && (
  <FilterButton active={activeStorageType === 'mmkv'}>
    MMKV ({stats.mmkvCount})
  </FilterButton>
)}
```

---

### Issue 2: MMKV Documentation is Reference Material

**Severity**: 🟡 Medium (Developer Confusion)

**Problem**: Three MMKV markdown files appear to be implementation guides but are actually reference docs from react-native-mmkv repository.

**Files**:
- `MMKV_INTERCEPTION_GUIDE.md`
- `MMKV_ARCHITECTURE_DEEP_DIVE.md`
- `MMKV_COMPLETE_API_REFERENCE.md`

**Evidence**:
- Headers say "Source Repository: /Users/austinjohnson/Desktop/react native mmkv clone"
- Content describes MMKV internals, not rn-buoy integration
- No implementation code exists

**Impact**:
- Developers may waste time looking for MMKV implementation
- Could think MMKV is partially done when it's not started

**Recommendation**:
1. Move to `docs/reference/` folder
2. Add clear headers: "REFERENCE DOCUMENTATION - NOT IMPLEMENTATION"
3. Create separate `PLAN_MMKV_IMPLEMENTATION.md` with actual plan

---

### Issue 3: No Search Bar in UI

**Severity**: 🟢 Low (Planned Feature)

**Problem**: Search filtering logic exists but no TextInput in UI.

**File**: `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/src/storage/components/GameUIStorageBrowser.tsx`

**Evidence**:
```typescript
// Logic exists (line 150)
if (searchQuery) {
  keys = keys.filter((k) => k.key.toLowerCase().includes(searchQuery.toLowerCase()));
}

// But no search input in render
```

**Impact**:
- Feature gap in UI
- Users can't search without parent component passing `searchQuery` prop

**Recommendation**:
- Add TextInput to action bar
- Manage search state internally in component

**Already planned** in `/Users/austinjohnson/Desktop/rn-buoy/packages/storage/TODO_STORAGE_UI_IMPROVEMENTS.md`

---

### Issue 4: AsyncStorage Methods Stay Swizzled

**Severity**: 🟢 Low (By Design)

**Problem**: AsyncStorage methods remain wrapped even after dev tools close.

**Behavior**:
```typescript
// After AsyncStorageListener.startListening()
AsyncStorage.setItem === wrappedSetItem  // true

// Even after closing dev tools
AsyncStorage.setItem === wrappedSetItem  // still true (not restored)
```

**Impact**:
- Methods stay wrapped for app lifetime
- **Low overhead** when no listeners (emit() checks `listeners.length === 0`)
- Could interfere with other dev tools that also swizzle

**Recommendation**:
- Keep current behavior (minimal overhead)
- Or add `stopListening()` that restores original methods
- Document behavior clearly

---

### Issue 5: No Pagination for Large Datasets

**Severity**: 🟡 Medium (Performance)

**Problem**: Renders all keys at once, could lag with 100+ keys.

**Impact**:
- Slow rendering with many keys
- Poor UX on low-end devices

**Recommendation**:
- Add virtualized list (FlatList instead of ScrollView)
- Or pagination (show 50 at a time)

---

## Summary

### Package Status

**Overall**: 7/10 (Good for AsyncStorage, Missing MMKV)

**Strengths**:
- ✅ Excellent AsyncStorage implementation
- ✅ Sophisticated method swizzling
- ✅ Well-organized code
- ✅ Comprehensive UI
- ✅ Auto-refresh system
- ✅ Zero configuration

**Weaknesses**:
- ❌ No MMKV implementation (only reference docs)
- ❌ Misleading UI (shows unavailable features)
- ❌ Incomplete features (search UI, filter button)
- ❌ No performance optimizations

### Next Steps

**Priority 1: Fix Misleading UX**
1. Disable or hide MMKV/Secure filter buttons
2. Move MMKV docs to reference folder
3. Update README to clarify "AsyncStorage Only"

**Priority 2: Complete Planned Features**
1. Add search bar UI
2. Add filter button
3. Add pagination/virtualization

**Priority 3: Implement MMKV Support**
1. Create actual implementation plan
2. Implement MMKVListener
3. Create useMMKVKeys hook
4. Add multi-instance UI
5. Test thoroughly

---

**Report Generated**: 2025-01-04
**Package Version**: 0.1.30
**Files Analyzed**: 25+
**Lines of Code**: ~3,000+
