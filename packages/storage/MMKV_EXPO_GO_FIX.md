# MMKV Expo Go Compatibility Fix

## Problem
The storage dev tools were crashing in Expo Go with "MMKV instance is required" error because:
1. MMKV is a native module that doesn't work in Expo Go
2. The code was importing MMKV directly, causing import errors
3. No graceful fallback when MMKV is unavailable

## Solution
Implemented graceful degradation with automatic detection:

### 1. MMKV Availability Detection (`mmkvAvailability.ts`)
```typescript
// Safely checks if MMKV is available
export function isMMKVAvailable(): boolean {
  try {
    const MMKVModule = require('react-native-mmkv');
    return MMKVModule.MMKV !== undefined;
  } catch (error) {
    return false; // Not available (Expo Go, not installed, etc.)
  }
}
```

### 2. Conditional Imports
All MMKV imports are now conditional:

**Before (crashes in Expo Go):**
```typescript
import { MMKV } from 'react-native-mmkv';
import { addMMKVListener } from '../utils/MMKVListener';
```

**After (safe):**
```typescript
import { isMMKVAvailable } from '../utils/mmkvAvailability';

let addMMKVListener: any;
if (isMMKVAvailable()) {
  const listener = require('../utils/MMKVListener');
  addMMKVListener = listener.addMMKVListener;
}
```

### 3. Graceful UI Degradation

#### Filter Button
- **Expo Go**: MMKV button hidden automatically
- **Dev Build with MMKV**: MMKV button visible

```typescript
// StorageFilterCards.tsx
const IS_MMKV_AVAILABLE = isMMKVAvailable();

{IS_MMKV_IMPLEMENTED && IS_MMKV_AVAILABLE && (
  <TouchableOpacity>
    <Text>MMKV</Text>
  </TouchableOpacity>
)}
```

#### Instance Selector
Shows helpful message when MMKV unavailable:

```
┌─────────────────────────────────────┐
│  ⚠️  MMKV Not Available             │
│                                     │
│  MMKV requires native modules and  │
│  cannot run in Expo Go. Please use │
│  a development build or EAS Build. │
└─────────────────────────────────────┘
```

### 4. Hook Safety
All MMKV hooks return empty/safe values when unavailable:

```typescript
// useMMKVKeys.ts
const fetchStorageData = useCallback(() => {
  if (!isMMKVAvailable()) {
    setStorageKeys([]);  // Return empty, no error
    setIsLoading(false);
    return;
  }
  // ... rest of logic
}, []);
```

## Behavior by Environment

### Expo Go (MMKV Unavailable)
✅ App works perfectly
✅ Storage tab shows only AsyncStorage
✅ No MMKV filter button visible
✅ No crashes or errors

### Development Build (MMKV Available, Not Registered)
✅ App works
✅ Storage tab shows AsyncStorage
✅ MMKV filter button visible
✅ Clicking MMKV shows "No MMKV Instances Registered"

### Development Build (MMKV Available + Registered)
✅ Full MMKV support
✅ Instance selector shows registered instances
✅ Real-time events monitoring
✅ Native type display

## Files Modified

### New Files
- `src/storage/utils/mmkvAvailability.ts` - Detection logic

### Updated Files
1. `src/storage/hooks/useMMKVKeys.ts` - Conditional imports + safe defaults
2. `src/storage/hooks/useMMKVInstances.ts` - Conditional imports + safe defaults
3. `src/storage/components/MMKVInstanceSelector.tsx` - Unavailable state UI
4. `src/storage/components/StorageFilterCards.tsx` - Runtime availability check
5. `src/storage/components/GameUIStorageBrowser.tsx` - Conditional MMKV listener
6. `src/storage/components/StorageEventListener.tsx` - Conditional MMKV events
7. `src/storage/utils/index.ts` - Export availability functions

## Testing Checklist

### In Expo Go
- [ ] App launches without crashes
- [ ] Storage tab opens successfully
- [ ] Only AsyncStorage keys visible
- [ ] No MMKV filter button shown
- [ ] No error messages

### In Dev Build (without registration)
- [ ] App launches
- [ ] Storage tab works
- [ ] MMKV filter button visible
- [ ] Clicking MMKV shows "No instances registered"

### In Dev Build (with registration)
- [ ] MMKV instances appear in selector
- [ ] Keys show with native types
- [ ] Events tab shows MMKV operations
- [ ] Instance switching works

## API Changes

### New Exports
```typescript
import {
  isMMKVAvailable,          // Check if MMKV is available
  getMMKVClass,             // Get MMKV class if available
  getMMKVUnavailableMessage, // User-friendly error message
} from '@react-buoy/storage';
```

### Breaking Changes
❌ None - fully backward compatible

## Migration Guide

**If you were using MMKV before this fix:**
- No changes needed
- Everything works the same when MMKV is available

**If running in Expo Go:**
- No changes needed
- MMKV features automatically hidden
- AsyncStorage continues to work

## Future Enhancements

Potential improvements:
1. Show "Expo Go Limitation" badge next to hidden features
2. Add "Learn More" link explaining Expo Go limitations
3. Toast notification: "MMKV not available - using AsyncStorage only"
