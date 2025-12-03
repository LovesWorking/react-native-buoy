# Persistent Storage Plan

## Problem

When developers clear AsyncStorage during logout flows, all devtools settings get wiped. This is frustrating because devtools preferences (panel positions, enabled features, filters, etc.) should persist across logout/login cycles.

## Goal

Create a storage abstraction that:
1. **Persists independently** of AsyncStorage (survives `AsyncStorage.clear()`)
2. **Same API** as AsyncStorage (no refactoring needed)
3. **Automatic fallback** to AsyncStorage when file system unavailable (Expo Go)
4. **Zero config** for developers using the devtools

## Solution: Unified Storage Abstraction

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   DevTools Code                      │
│         storage.getItem() / storage.setItem()        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│              storage.ts (abstraction)                │
│                                                      │
│   if (FileSystem available) → use FileSystem         │
│   else → fallback to AsyncStorage                    │
└─────────────────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│  FileSystem      │    │  AsyncStorage    │
│  (persistent)    │    │  (fallback)      │
│                  │    │                  │
│  Expo Dev Build  │    │  Expo Go         │
│  RN CLI + expo   │    │  (with warning)  │
└──────────────────┘    └──────────────────┘
```

### API Design

```typescript
// Matches AsyncStorage API exactly
interface DevToolsStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiSet(keyValuePairs: [string, string][]): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}
```

### Implementation

```typescript
// storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

let FileSystem: typeof import('expo-file-system') | null = null;

// Try to import expo-file-system (optional peer dep)
try {
  FileSystem = require('expo-file-system');
} catch {
  FileSystem = null;
}

const STORAGE_DIR = FileSystem
  ? `${FileSystem.documentDirectory}react-buoy/`
  : null;

const isFileSystemAvailable = (): boolean => {
  return FileSystem !== null && FileSystem.documentDirectory !== null;
};

// File-based implementation
const fileStorage: DevToolsStorage = {
  async getItem(key: string): Promise<string | null> {
    if (!isFileSystemAvailable()) return null;
    try {
      const path = `${STORAGE_DIR}${encodeURIComponent(key)}.json`;
      const content = await FileSystem!.readAsStringAsync(path);
      return content;
    } catch {
      return null; // File doesn't exist
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (!isFileSystemAvailable()) return;
    const path = `${STORAGE_DIR}${encodeURIComponent(key)}.json`;

    // Ensure directory exists
    const dirInfo = await FileSystem!.getInfoAsync(STORAGE_DIR!);
    if (!dirInfo.exists) {
      await FileSystem!.makeDirectoryAsync(STORAGE_DIR!, { intermediates: true });
    }

    await FileSystem!.writeAsStringAsync(path, value);
  },

  async removeItem(key: string): Promise<void> {
    if (!isFileSystemAvailable()) return;
    try {
      const path = `${STORAGE_DIR}${encodeURIComponent(key)}.json`;
      await FileSystem!.deleteAsync(path, { idempotent: true });
    } catch {
      // Ignore if doesn't exist
    }
  },

  async getAllKeys(): Promise<string[]> {
    if (!isFileSystemAvailable()) return [];
    try {
      const files = await FileSystem!.readDirectoryAsync(STORAGE_DIR!);
      return files
        .filter(f => f.endsWith('.json'))
        .map(f => decodeURIComponent(f.replace('.json', '')));
    } catch {
      return [];
    }
  },

  async clear(): Promise<void> {
    if (!isFileSystemAvailable()) return;
    try {
      await FileSystem!.deleteAsync(STORAGE_DIR!, { idempotent: true });
    } catch {
      // Ignore
    }
  },

  // ... multiGet, multiSet, multiRemove implementations
};

// AsyncStorage fallback
const asyncStorageAdapter: DevToolsStorage = {
  getItem: (key) => AsyncStorage.getItem(`@react-buoy/${key}`),
  setItem: (key, value) => AsyncStorage.setItem(`@react-buoy/${key}`, value),
  removeItem: (key) => AsyncStorage.removeItem(`@react-buoy/${key}`),
  getAllKeys: async () => {
    const keys = await AsyncStorage.getAllKeys();
    return keys
      .filter(k => k.startsWith('@react-buoy/'))
      .map(k => k.replace('@react-buoy/', ''));
  },
  clear: async () => {
    const keys = await AsyncStorage.getAllKeys();
    const buoyKeys = keys.filter(k => k.startsWith('@react-buoy/'));
    await AsyncStorage.multiRemove(buoyKeys);
  },
  // ... multiGet, multiSet, multiRemove implementations
};

// Export the right implementation
export const storage: DevToolsStorage = isFileSystemAvailable()
  ? fileStorage
  : asyncStorageAdapter;

// Also export a flag so devtools can show a warning in Expo Go
export const isPersistentStorage = isFileSystemAvailable();
```

## Usage

### In DevTools Code

```typescript
// Before (vulnerable to AsyncStorage.clear())
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('@react-buoy/panel-position', JSON.stringify(position));

// After (persistent!)
import { storage } from './storage';
await storage.setItem('panel-position', JSON.stringify(position));
```

### Showing Warning in Expo Go

```typescript
import { isPersistentStorage } from './storage';

if (!isPersistentStorage) {
  console.warn(
    '[React Buoy] Using AsyncStorage fallback. ' +
    'DevTools settings may be lost if AsyncStorage is cleared. ' +
    'Install expo-file-system for persistent storage.'
  );
}
```

## File Structure

When using FileSystem, settings are stored at:

```
<DocumentDirectory>/
  react-buoy/
    panel-position.json
    enabled-features.json
    network-filters.json
    ...
```

## Peer Dependencies

```json
{
  "peerDependencies": {
    "@react-native-async-storage/async-storage": ">=1.0.0",
    "expo-file-system": ">=15.0.0"
  },
  "peerDependenciesMeta": {
    "expo-file-system": {
      "optional": true
    }
  }
}
```

## Migration Path

1. **No migration needed** - fresh start with file storage
2. Old AsyncStorage keys remain (won't conflict)
3. Could optionally add one-time migration to copy existing settings to file storage

## Trade-offs

| Aspect | FileSystem | AsyncStorage Fallback |
|--------|------------|----------------------|
| Persists through logout | ✅ Yes | ❌ No |
| Speed | Slightly slower | Faster |
| Expo Go support | ❌ No | ✅ Yes |
| Extra dependency | expo-file-system | None |

## Initialization Flow

On first load, we test the file system before using it. This ensures we only use it when it actually works.

```
┌─────────────────────────────────────────────────────────────┐
│                      App Starts                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            Is expo-file-system installed?                    │
└─────────────────────┬──────────────────┬────────────────────┘
                      │ Yes              │ No
                      ▼                  ▼
┌──────────────────────────────┐   ┌──────────────────────────┐
│   Run CRUD health check:     │   │  Use AsyncStorage        │
│   1. Create test file        │   │  (show warning)          │
│   2. Read test file          │   └──────────────────────────┘
│   3. Delete test file        │
└─────────────────────┬────────┘
                      │
          ┌───────────┴───────────┐
          │ Pass                  │ Fail
          ▼                       ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│  Check: is file storage  │   │  Mark FileSystem disabled    │
│  empty?                  │   │  Use AsyncStorage            │
└───────────┬──────────────┘   │  (show warning)              │
            │                  └──────────────────────────────┘
  ┌─────────┴─────────┐
  │ Empty             │ Has data
  ▼                   ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│  Check AsyncStorage for    │   │  Use FileSystem            │
│  existing @react-buoy/*    │   │  (already migrated)        │
│  keys                      │   └────────────────────────────┘
└───────────┬────────────────┘
            │
  ┌─────────┴─────────┐
  │ Has keys          │ No keys
  ▼                   ▼
┌────────────────────────────┐   ┌────────────────────────────┐
│  Migrate AsyncStorage      │   │  Use FileSystem            │
│  → FileSystem              │   │  (fresh start)             │
│  Then use FileSystem       │   └────────────────────────────┘
└────────────────────────────┘
```

### Health Check Implementation

```typescript
const HEALTH_CHECK_FILE = `${STORAGE_DIR}.health-check`;

async function testFileSystem(): Promise<boolean> {
  if (!FileSystem || !FileSystem.documentDirectory) {
    return false;
  }

  try {
    // Ensure directory exists
    const dirInfo = await FileSystem.getInfoAsync(STORAGE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
    }

    // Test write
    const testData = `health-check-${Date.now()}`;
    await FileSystem.writeAsStringAsync(HEALTH_CHECK_FILE, testData);

    // Test read
    const readBack = await FileSystem.readAsStringAsync(HEALTH_CHECK_FILE);
    if (readBack !== testData) {
      return false;
    }

    // Test delete
    await FileSystem.deleteAsync(HEALTH_CHECK_FILE, { idempotent: true });

    return true;
  } catch (error) {
    console.warn('[React Buoy] FileSystem health check failed:', error);
    return false;
  }
}
```

### Migration Implementation

```typescript
async function migrateFromAsyncStorage(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const buoyKeys = allKeys.filter(k => k.startsWith('@react-buoy/'));

    if (buoyKeys.length === 0) {
      return; // Nothing to migrate
    }

    const pairs = await AsyncStorage.multiGet(buoyKeys);

    for (const [fullKey, value] of pairs) {
      if (value !== null) {
        const key = fullKey.replace('@react-buoy/', '');
        await fileStorage.setItem(key, value);
      }
    }

    console.log(`[React Buoy] Migrated ${pairs.length} settings to persistent storage`);

    // Optionally: clean up old AsyncStorage keys after successful migration
    // await AsyncStorage.multiRemove(buoyKeys);
  } catch (error) {
    console.warn('[React Buoy] Migration failed:', error);
    // Continue anyway - not critical
  }
}
```

### Storage Initialization

```typescript
let storageBackend: 'filesystem' | 'asyncstorage' | null = null;
let initPromise: Promise<void> | null = null;

async function initStorage(): Promise<void> {
  // Only run once
  if (storageBackend !== null) return;

  const fileSystemWorks = await testFileSystem();

  if (fileSystemWorks) {
    // Check if we need to migrate
    const existingFiles = await fileStorage.getAllKeys();

    if (existingFiles.length === 0) {
      // Empty file storage - check for AsyncStorage data to migrate
      await migrateFromAsyncStorage();
    }

    storageBackend = 'filesystem';
    console.log('[React Buoy] Using persistent file storage');
  } else {
    storageBackend = 'asyncstorage';
    console.warn(
      '[React Buoy] Using AsyncStorage fallback. ' +
      'Settings may be lost if AsyncStorage is cleared. ' +
      'Install expo-file-system for persistent storage.'
    );
  }
}

// Ensure init runs before any storage operation
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initStorage();
  }
  return initPromise;
}

// Wrapper that waits for init
export const storage: DevToolsStorage = {
  async getItem(key: string): Promise<string | null> {
    await ensureInit();
    return storageBackend === 'filesystem'
      ? fileStorage.getItem(key)
      : asyncStorageAdapter.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await ensureInit();
    return storageBackend === 'filesystem'
      ? fileStorage.setItem(key, value)
      : asyncStorageAdapter.setItem(key, value);
  },

  // ... etc
};
```

## Key Decisions

1. **Migration**: On first load, if file storage is empty but AsyncStorage has `@react-buoy/*` keys, migrate them over automatically.

2. **Health check**: Test CRUD operations on init. If any fail, fall back to AsyncStorage for the entire session.

3. **Self-healing**: Health check runs on each app launch, so if file system starts working later (permissions fixed, etc.), it'll pick it up.

4. **Key prefix**: AsyncStorage uses `@react-buoy/` prefix. FileSystem uses folder isolation (`<DocumentDirectory>/react-buoy/`).

## Implementation Complete

### What was done

1. **Created `persistentStorage.ts`** - New storage abstraction that uses FileSystem when available
2. **Updated `safeAsyncStorage.ts`** - Now wraps `persistentStorage`, so all existing code automatically uses persistent storage
3. **Added `expo-file-system` as optional peer dependency**

### How it works

The existing `safeGetItem`, `safeSetItem`, `safeRemoveItem` functions now use `persistentStorage` under the hood:

```
safeGetItem() → persistentStorage.getItem() → FileSystem (if available)
                                            → AsyncStorage (fallback)
                                            → Memory (last resort)
```

**No code changes needed!** All existing code using `safeGetItem`/`safeSetItem` automatically benefits from persistent storage.

### For new code

You can also use `persistentStorage` directly:

```typescript
import {
  persistentStorage,
  isUsingPersistentStorage,
  getStorageBackendType
} from '@react-buoy/shared-ui';

// Same API as AsyncStorage
await persistentStorage.setItem('my-key', 'my-value');
const value = await persistentStorage.getItem('my-key');

// Check what backend is being used
const isPersistent = await isUsingPersistentStorage(); // true if using FileSystem
const backend = await getStorageBackendType(); // 'filesystem' | 'asyncstorage' | 'memory'
```

## Remaining Tasks

- [ ] Add warning banner in devtools UI when using fallback storage (Expo Go)
- [ ] Test in Expo Go, Expo Dev Build, and RN CLI projects
