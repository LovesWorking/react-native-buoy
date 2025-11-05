# MMKV Storage Dev Tools - Usage Guide

## ✅ MMKV Support is Now Enabled!

The MMKV filter button is now visible in the storage browser UI.

## 🎉 Zero Configuration Required!

Both AsyncStorage and MMKV work **automatically** with zero setup!

### For All Users
✅ **No setup needed** - just open the Storage tab and it works!

### How It Works
1. Create your storage instances normally
2. Open dev tools → Storage tab
3. Everything is auto-detected and monitored

**That's it!** No hooks, no registration, no configuration.

### Example

```typescript
// storage/index.ts - Just create your instances normally!
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV();
export const cache = new MMKV({ id: 'cache' });
export const secureStorage = new MMKV({
  id: 'secure',
  encryptionKey: 'your-key',
});
```

Open dev tools → Storage tab → All instances appear automatically! 🎊

---

## Manual Registration (Only If Needed)

### 1. Register Your MMKV Instances (Manual Method)

In your app initialization code (e.g., `App.tsx` or a storage setup file):

```typescript
import { MMKV } from 'react-native-mmkv';
import { registerMMKVInstance, addMMKVInstance } from '@react-buoy/storage';

// Create your MMKV instances
export const storage = new MMKV();
export const secureStorage = new MMKV({
  id: 'secure-storage',
  encryptionKey: 'your-encryption-key',
});

// Register instances for dev tools monitoring
// Step 1: Register in the registry (for Browser tab)
registerMMKVInstance('mmkv.default', storage);
registerMMKVInstance('secure', secureStorage, { encrypted: true });

// Step 2: Add to listener (for Events tab)
addMMKVInstance(storage, 'mmkv.default');
addMMKVInstance(secureStorage, 'secure');
```

### 2. Use MMKV as Normal

```typescript
import { storage } from './storage';

// Write values (native types preserved)
storage.set('user.name', 'John Doe');      // string
storage.set('user.age', 30);                // number
storage.set('user.isPremium', true);        // boolean

// Read values
const name = storage.getString('user.name');
const age = storage.getNumber('user.age');
const isPremium = storage.getBoolean('user.isPremium');
```

### 3. Open Dev Tools

The Storage Browser will now show:
- **MMKV filter button** (click to filter MMKV keys only)
- **Instance selector dropdown** (switch between MMKV instances)
- **Instance info panel** (shows encryption, read-only status, key count)
- **Real-time events** in the Events tab (reads, writes, deletes with type info)

## What You'll See in Dev Tools

### Browser Tab
- All MMKV keys with their **native types** (string, number, boolean, buffer)
- **Instance ID badges** showing which MMKV instance each key belongs to
- Filter by status (valid, missing, issues)
- Filter by storage type (All, Async, MMKV)

### Events Tab
- Real-time MMKV operations: `set.string`, `set.number`, `get.boolean`, `delete`, etc.
- Instance ID shown in event data: `[mmkv.default] user.token (string)`
- Color-coded: 🟢 Green (writes), 🟠 Orange (reads), 🔴 Red (deletes)

## API Reference

### Registration APIs

```typescript
// Register instance in registry (for Browser tab)
registerMMKVInstance(
  id: string,           // Unique ID (e.g., 'mmkv.default', 'secure')
  instance: MMKV,       // MMKV instance
  config?: {
    encrypted?: boolean // Whether instance uses encryption
  }
)

// Add instance to listener (for Events tab)
addMMKVInstance(
  instance: MMKV,       // MMKV instance
  instanceId: string    // Same ID used in registerMMKVInstance
)

// Unregister when done
unregisterMMKVInstance(id: string)
removeMMKVInstance(id: string)
```

### Hooks

```typescript
// Get all registered MMKV instances
const { instances, instanceCount, refresh } = useMMKVInstances();

// Get keys from a specific instance
const { storageKeys, isLoading, error, refresh } = useMMKVKeys(
  instance,              // MMKV instance
  'mmkv.default',        // Instance ID
  requiredKeys           // Optional validation rules
);

// Get metadata for a single instance
const instance = useMMKVInstance('mmkv.default');
// Returns: { id, instance, encrypted, readOnly, keyCount, size? }
```

## Why Don't I See Any MMKV Keys?

If you click the MMKV filter but see no keys:

1. **Did you register your instances?**
   - You must call both `registerMMKVInstance()` and `addMMKVInstance()`
   - Do this **before** opening the dev tools

2. **Are there any keys in your MMKV instance?**
   - MMKV instances start empty
   - Write some test data: `storage.set('test', 'hello')`

3. **Is the instance selector showing your instance?**
   - Look for the dropdown above the keys list
   - If it says "No MMKV Instances Registered", go back to step 1

## Example: Complete Setup

```typescript
// storage/setup.ts
import { MMKV } from 'react-native-mmkv';
import { registerMMKVInstance, addMMKVInstance } from '@react-buoy/storage';

// Create instances
export const storage = new MMKV();
export const cache = new MMKV({ id: 'cache' });

// DEV TOOLS: Register for monitoring
if (__DEV__) {
  // Registry registration (for Browser tab)
  registerMMKVInstance('mmkv.default', storage);
  registerMMKVInstance('cache', cache);

  // Listener registration (for Events tab)
  addMMKVInstance(storage, 'mmkv.default');
  addMMKVInstance(cache, 'cache');

  console.log('✅ MMKV instances registered for dev tools');
}

// App.tsx
import './storage/setup'; // Import to run registration
import { storage } from './storage/setup';

export default function App() {
  // Add some test data
  React.useEffect(() => {
    if (__DEV__) {
      storage.set('app.version', '1.0.0');
      storage.set('user.visits', 42);
      storage.set('features.darkMode', true);
    }
  }, []);

  return <YourApp />;
}
```

Now open the dev tools Storage tab and click the **MMKV** filter button!

## Differences from AsyncStorage

| Feature | AsyncStorage | MMKV |
|---------|-------------|------|
| **API** | Async (Promises) | Sync (direct return) |
| **Types** | String only | string, number, boolean, buffer |
| **Instances** | Singleton | Multiple instances |
| **Speed** | Slower (~async overhead) | ~30x faster |
| **Dev Tools** | ✅ Full support | ✅ Full support (now!) |

## Troubleshooting

**Q: I see "No MMKV Instances Registered"**
- You forgot to call `registerMMKVInstance()`. See [Quick Start](#quick-start) above.

**Q: Events tab shows no MMKV events**
- You forgot to call `addMMKVInstance()`. You need BOTH registration calls.

**Q: Keys show "unknown" type instead of native type**
- This happens for buffer values. Buffers are displayed as `<ArrayBuffer X bytes>`.

**Q: Can I monitor MMKV instances created by third-party libraries?**
- Yes! If you have access to the MMKV instance object, just register it.

## Advanced: Required Keys Validation

You can validate that required MMKV keys exist:

```typescript
const requiredKeys = [
  'auth.token',                                    // Key must exist
  { key: 'user.id', expectedType: 'number' },     // Must be number
  { key: 'app.theme', expectedValue: 'dark' },    // Must equal 'dark'
];

const { storageKeys } = useMMKVKeys(
  storage,
  'mmkv.default',
  requiredKeys
);

// Keys will show status: required_present, required_missing, required_wrong_type, etc.
```

## Need Help?

- Check the reference docs in `docs/reference/REF_MMKV_*.md`
- See example usage in the hooks and components
- File an issue if something isn't working!
