# MMKV Storage - Zero Configuration!

## ✅ No Setup Required!

Just like AsyncStorage, **MMKV works automatically** with zero configuration!

### For AsyncStorage Users
✅ No setup needed - works automatically

### For MMKV Users
✅ No setup needed - works automatically!

---

## How It Works

Both AsyncStorage and MMKV are **automatically detected** when you open the Storage tab:

1. **AsyncStorage** - Monitoring starts automatically when Storage tab opens
2. **MMKV** - Auto-detection starts automatically when Storage tab opens
   - Constructor interception catches all `new MMKV()` calls
   - Scans common paths for exported instances
   - Registers everything automatically

## Usage

### Step 1: Create Your Storage (Normal Code)

```typescript
// storage/index.ts
import { MMKV } from 'react-native-mmkv';

// Just create your instances normally - nothing special needed!
export const storage = new MMKV();
export const cache = new MMKV({ id: 'cache' });
export const secureStorage = new MMKV({
  id: 'secure',
  encryptionKey: 'your-key',
});
```

### Step 2: Use Your Storage (Normal Code)

```typescript
import { storage } from './storage';

// Use it normally
storage.set('user.name', 'John');
storage.set('user.age', 30);
storage.set('user.isPremium', true);

const name = storage.getString('user.name');
```

### Step 3: Open Dev Tools

That's it! Open your dev tools → Storage tab:
- **AsyncStorage keys** appear automatically
- **MMKV instances** appear automatically in the selector
- **Events** are tracked automatically for both

## What You'll See

### In Storage Browser
- All AsyncStorage keys (automatic)
- All MMKV instances in dropdown selector (automatic)
- Click "MMKV" filter button to see only MMKV keys
- Click "Async" filter button to see only AsyncStorage keys
- Click "All Types" to see both

### In Events Tab
- Real-time AsyncStorage operations (automatic)
- Real-time MMKV operations (automatic)
- Color-coded by action type
- Instance ID shown for MMKV events

## FAQ

### Q: Do I need to register my MMKV instances?
**A: No!** They're auto-detected when you open the Storage tab.

### Q: Do I need to call any hooks or setup functions?
**A: No!** Everything is automatic.

### Q: What if auto-detection doesn't find my instances?
**A: Rare, but you can manually register:**
```typescript
import { registerMMKV } from '@react-buoy/storage';

const storage = new MMKV();
registerMMKV('storage', storage); // One line, only if needed
```

### Q: Does this work in Expo Go?
**A: Partially.** AsyncStorage works perfectly. MMKV doesn't work in Expo Go (it requires native modules), but the dev tools gracefully handle this - you'll just see AsyncStorage only.

### Q: When does auto-detection run?
**A: When you open the Storage tab for the first time.** This is the same pattern as AsyncStorage monitoring.

### Q: Will this slow down my app?
**A: No.** Auto-detection only runs once when you open dev tools, and monitoring has minimal overhead.

## Comparison to Other Dev Tools

| Tool | Setup Required |
|------|----------------|
| **Network** | ✅ None - auto-detects fetch/axios |
| **AsyncStorage** | ✅ None - auto-monitors |
| **MMKV** | ✅ None - auto-detects and monitors |
| **Secure Store** | 🚧 Coming soon |

All storage dev tools work automatically!

## Behind the Scenes

When you open the Storage tab, this happens automatically:

1. **AsyncStorage**: `startListening()` is called
2. **MMKV**: `enableMMKVAutoDetection()` is called
   - Patches `new MMKV()` constructor
   - Scans for existing exported instances
   - Registers all found instances
3. **Both**: Events are tracked and displayed in real-time

You don't see any of this - it just works!

## Edge Cases

### Dynamic Instance Creation
If you create MMKV instances dynamically after opening dev tools, they're still auto-detected via constructor interception.

```typescript
// Even this works automatically!
function createCache() {
  return new MMKV({ id: 'dynamic-cache' });
}

const cache = createCache(); // Auto-detected!
```

### Custom Instance IDs
Auto-detected with the ID you provide:

```typescript
new MMKV({ id: 'my-custom-id' }); // Shows as "my-custom-id" in dev tools
new MMKV();                        // Shows as "mmkv.default"
```

### Encrypted Instances
Auto-detected and marked as encrypted:

```typescript
new MMKV({ encryptionKey: 'key' }); // 🔒 Shows encryption badge
```

## Summary

**AsyncStorage**: Always worked automatically ✅
**MMKV**: Now works automatically too ✅

No hooks, no setup, no configuration - just install and use!
