# Storage Dev Tools - Recommendations & Implementation Guide

> **Purpose**: Actionable recommendations for implementing MMKV support correctly
>
> **Audience**: Developers implementing MMKV integration
>
> **Last Updated**: 2025-01-04

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Recommended Architecture](#recommended-architecture)
3. [Implementation Strategy](#implementation-strategy)
4. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)
5. [Code Examples](#code-examples)
6. [Testing Strategy](#testing-strategy)
7. [Migration Path](#migration-path)
8. [Best Practices](#best-practices)
9. [Common Pitfalls to Avoid](#common-pitfalls-to-avoid)

---

## Executive Summary

### Current State

- ✅ AsyncStorage: Fully implemented, working well
- ❌ MMKV: Not implemented (only reference docs exist)
- ❌ Expo SecureStore: Not implemented

### Recommended Approach

**Use Hybrid Monitoring Strategy**:
- ✅ MMKV built-in listeners for write notifications (efficient)
- ✅ Method wrapping for read tracking and type information (complete)
- ✅ Manual instance registration (explicit control)
- ✅ Reuse existing UI components (minimal changes)

### Key Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Monitoring Strategy** | Hybrid (listeners + wrapping) | Complete coverage, type info, performance |
| **Instance Registration** | Manual (`registerMMKVInstance`) | Explicit control, no import conflicts |
| **UI Changes** | Minimal (add instance selector) | Reuse AsyncStorage components |
| **Type Detection** | Try all getters sequentially | Only reliable method |
| **Multi-Instance** | Instance selector dropdown | Clean UX, clear state |

### Timeline Estimate

- **Phase 1 (Core)**: 12-17 hours
- **Phase 2 (UI)**: 7-10 hours
- **Phase 3 (Testing)**: 6-9 hours
- **Total**: 25-36 hours

---

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Application                         │
│                                                               │
│  import { createMMKV } from 'react-native-mmkv'             │
│  import { registerMMKVInstance } from '@react-buoy/storage' │
│                                                               │
│  const storage = createMMKV()                                │
│  registerMMKVInstance('default', storage)  // Manual         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              @react-buoy/storage Package                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      MMKV Instance Registry (New)                    │  │
│  │  - Tracks all registered instances                   │  │
│  │  - Provides list for UI                              │  │
│  │  - Manages lifecycle                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      MMKVListener (New - Hybrid Strategy)            │  │
│  │  - Uses built-in listeners for writes                │  │
│  │  - Wraps methods for reads and type info             │  │
│  │  - Emits unified events                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      useMMKVKeys (New - Data Fetching)               │  │
│  │  - Fetches keys from instance                        │  │
│  │  - Detects types (string/number/boolean/buffer)      │  │
│  │  - Validates against required keys                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                            ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │      Existing UI Components (Reused)                 │  │
│  │  + Instance Selector (New)                           │  │
│  │  + Instance Info Panel (New)                         │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### New Components Needed

1. **MMKVInstanceRegistry** - Track all instances
2. **MMKVListener** - Monitor operations (hybrid)
3. **useMMKVKeys** - Fetch and validate data
4. **useMMKVInstances** - Provide instance list
5. **MMKVInstanceSelector** - UI for switching instances
6. **MMKVInstanceInfoPanel** - Show instance metadata

---

## Implementation Strategy

### Strategy: Hybrid Monitoring

**Combines two approaches for complete coverage**:

#### Part 1: Built-in Listeners (For Writes)

```typescript
// MMKV provides addOnValueChangedListener
const listener = instance.addOnValueChangedListener((key) => {
  // Triggered on set() and remove()
  emitEvent({ operation: 'write', key, timestamp: Date.now() });
});
```

**Pros**:
- ✅ Official API (stable, supported)
- ✅ Efficient (no method wrapping overhead)
- ✅ Zero-copy (direct notification)

**Cons**:
- ❌ Write-only (doesn't track reads)
- ❌ No operation type (can't distinguish set vs remove)
- ❌ No value information
- ❌ No type information

#### Part 2: Method Wrapping (For Reads & Type Info)

```typescript
// Wrap getString() for read tracking
const originalGetString = instance.getString.bind(instance);
instance.getString = (key: string) => {
  const value = originalGetString(key);

  emitEvent({
    operation: 'getString',
    key,
    value,
    type: 'string',
    timestamp: Date.now()
  });

  return value;
};

// Also wrap set() for type information
const originalSet = instance.set.bind(instance);
instance.set = (key: string, value: any) => {
  const type = detectType(value);

  emitEvent({
    operation: 'set',
    key,
    value: type === 'buffer' ? `<ArrayBuffer ${value.byteLength} bytes>` : value,
    type,
    timestamp: Date.now()
  });

  return originalSet(key, value);
};
```

**Pros**:
- ✅ Complete coverage (reads + writes)
- ✅ Type information
- ✅ Value capture
- ✅ Operation distinction

**Cons**:
- ❌ Invasive (modifies instance)
- ❌ Slightly more overhead

**Why Hybrid is Best**:
- Listeners provide efficient write notification
- Method wrapping adds missing details (type, value, operation)
- Together, they provide complete coverage

---

## Step-by-Step Implementation Plan

### Step 1: Create MMKV Instance Registry

**File**: `src/storage/utils/MMKVInstanceRegistry.ts`

```typescript
import { MMKV } from 'react-native-mmkv';

interface MMKVInstanceInfo {
  id: string;
  instance: MMKV;
  encrypted: boolean;
  readOnly: boolean;
}

class MMKVInstanceRegistry {
  private instances = new Map<string, MMKVInstanceInfo>();

  register(id: string, instance: MMKV, config?: { encrypted?: boolean }) {
    this.instances.set(id, {
      id,
      instance,
      encrypted: config?.encrypted ?? false,
      readOnly: instance.isReadOnly
    });
  }

  unregister(id: string) {
    this.instances.delete(id);
  }

  get(id: string): MMKVInstanceInfo | undefined {
    return this.instances.get(id);
  }

  getAll(): MMKVInstanceInfo[] {
    return Array.from(this.instances.values());
  }
}

// Singleton
export const mmkvInstanceRegistry = new MMKVInstanceRegistry();

// Public API
export function registerMMKVInstance(
  id: string,
  instance: MMKV,
  config?: { encrypted?: boolean }
) {
  mmkvInstanceRegistry.register(id, instance, config);
}
```

**Usage**:
```typescript
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

const storage = createMMKV();
registerMMKVInstance('mmkv.default', storage);

const secureStorage = createMMKV({ id: 'secure', encryptionKey: 'key' });
registerMMKVInstance('secure', secureStorage, { encrypted: true });
```

---

### Step 2: Create MMKV Listener (Hybrid)

**File**: `src/storage/utils/MMKVListener.ts`

```typescript
import { MMKV } from 'react-native-mmkv';

export interface MMKVEvent {
  instance: string;
  operation: 'set' | 'get' | 'remove' | 'clearAll';
  key?: string;
  value?: any;
  type?: 'string' | 'number' | 'boolean' | 'buffer';
  timestamp: number;
}

class MMKVListener {
  private listeners: Array<(event: MMKVEvent) => void> = [];
  private monitoredInstances = new Map<string, () => void>();

  /**
   * Start monitoring an MMKV instance
   */
  monitor(instance: MMKV, instanceId: string) {
    if (this.monitoredInstances.has(instanceId)) {
      console.warn(`Already monitoring instance: ${instanceId}`);
      return;
    }

    // Part 1: Use built-in listener for write notifications
    const builtInListener = instance.addOnValueChangedListener((key) => {
      // Note: Can't distinguish set vs remove here
      this.emit({
        instance: instanceId,
        operation: 'set',  // Assume set (could be remove)
        key,
        timestamp: Date.now()
      });
    });

    // Part 2: Wrap methods for complete info
    this.wrapMethods(instance, instanceId);

    // Store cleanup function
    this.monitoredInstances.set(instanceId, () => {
      builtInListener.remove();
      // Note: Can't easily unwrap methods
    });
  }

  private wrapMethods(instance: MMKV, instanceId: string) {
    // Wrap set()
    const originalSet = instance.set.bind(instance);
    instance.set = (key: string, value: any) => {
      let type: 'string' | 'number' | 'boolean' | 'buffer';
      let logValue: any = value;

      if (typeof value === 'string') {
        type = 'string';
      } else if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else {
        type = 'buffer';
        logValue = `<ArrayBuffer ${(value as ArrayBuffer).byteLength} bytes>`;
      }

      this.emit({
        instance: instanceId,
        operation: 'set',
        key,
        value: logValue,
        type,
        timestamp: Date.now()
      });

      return originalSet(key, value);
    };

    // Wrap getString()
    const originalGetString = instance.getString.bind(instance);
    instance.getString = (key: string) => {
      const value = originalGetString(key);

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'string',
        timestamp: Date.now()
      });

      return value;
    };

    // Wrap getNumber()
    const originalGetNumber = instance.getNumber.bind(instance);
    instance.getNumber = (key: string) => {
      const value = originalGetNumber(key);

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'number',
        timestamp: Date.now()
      });

      return value;
    };

    // Wrap getBoolean()
    const originalGetBoolean = instance.getBoolean.bind(instance);
    instance.getBoolean = (key: string) => {
      const value = originalGetBoolean(key);

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'boolean',
        timestamp: Date.now()
      });

      return value;
    };

    // Wrap getBuffer()
    const originalGetBuffer = instance.getBuffer.bind(instance);
    instance.getBuffer = (key: string) => {
      const value = originalGetBuffer(key);

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value: value ? `<ArrayBuffer ${value.byteLength} bytes>` : undefined,
        type: 'buffer',
        timestamp: Date.now()
      });

      return value;
    };

    // Wrap remove()
    const originalRemove = instance.remove.bind(instance);
    instance.remove = (key: string) => {
      const result = originalRemove(key);

      this.emit({
        instance: instanceId,
        operation: 'remove',
        key,
        timestamp: Date.now()
      });

      return result;
    };

    // Wrap clearAll()
    const originalClearAll = instance.clearAll.bind(instance);
    instance.clearAll = () => {
      originalClearAll();

      this.emit({
        instance: instanceId,
        operation: 'clearAll',
        timestamp: Date.now()
      });
    };
  }

  /**
   * Add event listener
   */
  addListener(callback: (event: MMKVEvent) => void): () => void {
    this.listeners.push(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: MMKVEvent) {
    if (this.listeners.length === 0) return;

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in MMKV listener:', error);
      }
    });
  }

  /**
   * Stop monitoring an instance
   */
  unmonitor(instanceId: string) {
    const cleanup = this.monitoredInstances.get(instanceId);
    if (cleanup) {
      cleanup();
      this.monitoredInstances.delete(instanceId);
    }
  }
}

// Singleton
const mmkvListener = new MMKVListener();

export const monitorMMKVInstance = (instance: MMKV, instanceId: string) =>
  mmkvListener.monitor(instance, instanceId);

export const addMMKVListener = (callback: (event: MMKVEvent) => void) =>
  mmkvListener.addListener(callback);

export const unmonitorMMKVInstance = (instanceId: string) =>
  mmkvListener.unmonitor(instanceId);
```

---

### Step 3: Create useMMKVKeys Hook

**File**: `src/storage/hooks/useMMKVKeys.ts`

```typescript
import { useState, useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';
import { StorageKeyInfo, RequiredStorageKey } from '../types';

function detectMMKVType(instance: MMKV, key: string): {
  value: any;
  type: 'string' | 'number' | 'boolean' | 'buffer' | 'unknown';
} {
  // Try each getter in order
  const stringValue = instance.getString(key);
  if (stringValue !== undefined) {
    return { value: stringValue, type: 'string' };
  }

  const numberValue = instance.getNumber(key);
  if (numberValue !== undefined) {
    return { value: numberValue, type: 'number' };
  }

  const booleanValue = instance.getBoolean(key);
  if (booleanValue !== undefined) {
    return { value: booleanValue, type: 'boolean' };
  }

  const bufferValue = instance.getBuffer(key);
  if (bufferValue !== undefined) {
    return {
      value: `<ArrayBuffer ${bufferValue.byteLength} bytes>`,
      type: 'buffer'
    };
  }

  return { value: undefined, type: 'unknown' };
}

export function useMMKVKeys(
  instance: MMKV | undefined,
  instanceId: string,
  requiredStorageKeys: RequiredStorageKey[] = []
) {
  const [storageKeys, setStorageKeys] = useState<StorageKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | undefined>();

  const fetchKeys = useCallback(() => {
    if (!instance) {
      setStorageKeys([]);
      return;
    }

    setIsLoading(true);
    setError(undefined);

    try {
      // Get all keys from this instance
      const allKeys = instance.getAllKeys();

      // Read each key and detect type
      const parsedKeys: StorageKeyInfo[] = allKeys.map((key) => {
        const { value, type } = detectMMKVType(instance, key);

        // Find required config
        const requiredConfig = requiredStorageKeys.find((req) => {
          if (typeof req === 'string') return req === key;
          return req.key === key;
        });

        let status: StorageKeyInfo['status'] = 'optional_present';

        if (requiredConfig) {
          status = 'required_present';

          // Check expected value
          if (typeof requiredConfig === 'object' && 'expectedValue' in requiredConfig) {
            if (String(value) !== requiredConfig.expectedValue) {
              status = 'required_wrong_value';
            }
          }

          // Check expected type
          if (typeof requiredConfig === 'object' && 'expectedType' in requiredConfig) {
            if (type !== requiredConfig.expectedType) {
              status = 'required_wrong_type';
            }
          }
        }

        return {
          key,
          value,
          valueType: type,
          storageType: 'mmkv' as const,
          instanceId,
          status,
          category: requiredConfig ? 'required' : 'optional',
          description:
            typeof requiredConfig === 'object' && 'description' in requiredConfig
              ? requiredConfig.description
              : undefined
        };
      });

      // Add missing required keys
      requiredStorageKeys.forEach((req) => {
        const key = typeof req === 'string' ? req : req.key;
        const exists = parsedKeys.some((k) => k.key === key);

        if (!exists) {
          parsedKeys.push({
            key,
            value: undefined,
            storageType: 'mmkv' as const,
            instanceId,
            status: 'required_missing',
            category: 'required',
            description: typeof req === 'object' && 'description' in req ? req.description : undefined
          });
        }
      });

      setStorageKeys(parsedKeys);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, [instance, instanceId, requiredStorageKeys]);

  return {
    storageKeys,
    isLoading,
    error,
    refresh: fetchKeys
  };
}
```

---

### Step 4: Create useMMKVInstances Hook

**File**: `src/storage/hooks/useMMKVInstances.ts`

```typescript
import { useState, useEffect } from 'react';
import { mmkvInstanceRegistry } from '../utils/MMKVInstanceRegistry';

export function useMMKVInstances() {
  const [instances, setInstances] = useState(() => mmkvInstanceRegistry.getAll());
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(() => {
    const all = mmkvInstanceRegistry.getAll();
    return all.length > 0 ? all[0].id : null;
  });

  // Refresh instances periodically (in case new ones are registered)
  useEffect(() => {
    const interval = setInterval(() => {
      setInstances(mmkvInstanceRegistry.getAll());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    instances,
    activeInstanceId,
    setActiveInstanceId,
    activeInstance: activeInstanceId
      ? mmkvInstanceRegistry.get(activeInstanceId)
      : undefined
  };
}
```

---

### Step 5: Create Instance Selector Component

**File**: `src/storage/components/MMKVInstanceSelector.tsx`

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface MMKVInstanceSelectorProps {
  instances: Array<{ id: string; encrypted: boolean }>;
  activeInstanceId: string | null;
  onSelect: (id: string) => void;
}

export function MMKVInstanceSelector({
  instances,
  activeInstanceId,
  onSelect
}: MMKVInstanceSelectorProps) {
  if (instances.length === 0) {
    return null;
  }

  if (instances.length === 1) {
    return (
      <View style={styles.singleInstance}>
        <Text style={styles.instanceText}>{instances[0].id}</Text>
        {instances[0].encrypted && <Text style={styles.lockIcon}>🔒</Text>}
      </View>
    );
  }

  return (
    <View style={styles.dropdown}>
      {instances.map((inst) => (
        <TouchableOpacity
          key={inst.id}
          style={[
            styles.dropdownItem,
            activeInstanceId === inst.id && styles.dropdownItemActive
          ]}
          onPress={() => onSelect(inst.id)}
        >
          <Text style={styles.instanceText}>{inst.id}</Text>
          {inst.encrypted && <Text style={styles.lockIcon}>🔒</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  singleInstance: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4
  },
  dropdownItemActive: {
    backgroundColor: '#e0e0e0'
  },
  instanceText: {
    fontSize: 14,
    marginRight: 4
  },
  lockIcon: {
    fontSize: 12
  }
});
```

---

## Testing Strategy

### Unit Tests

**Test File**: `src/storage/__tests__/MMKVListener.test.ts`

```typescript
import { createMMKV } from 'react-native-mmkv';
import { monitorMMKVInstance, addMMKVListener } from '../utils/MMKVListener';

describe('MMKVListener', () => {
  test('emits event on set()', () => {
    const instance = createMMKV({ id: 'test' });
    monitorMMKVInstance(instance, 'test');

    const events: any[] = [];
    addMMKVListener((event) => events.push(event));

    instance.set('key', 'value');

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      instance: 'test',
      operation: 'set',
      key: 'key',
      value: 'value',
      type: 'string'
    });
  });

  test('emits event on getString()', () => {
    const instance = createMMKV({ id: 'test' });
    instance.set('key', 'value');

    const events: any[] = [];
    monitorMMKVInstance(instance, 'test');
    addMMKVListener((event) => events.push(event));

    instance.getString('key');

    expect(events).toContainEqual(
      expect.objectContaining({
        operation: 'get',
        key: 'key',
        type: 'string'
      })
    );
  });
});
```

### Integration Tests

Test complete flow from operation to UI update.

### Manual Testing Checklist

- [ ] Register MMKV instance
- [ ] Open Browser tab - see keys
- [ ] Open Events tab - see operations
- [ ] Edit value - see update in Browser
- [ ] Delete key - see removal
- [ ] Switch instances - see different data
- [ ] Check encrypted instance - values masked
- [ ] Performance test - 100+ keys

---

## Migration Path

### For Existing Users

**No Breaking Changes** - AsyncStorage continues to work as-is.

**To Add MMKV Support**:

```typescript
// 1. Install react-native-mmkv
npm install react-native-mmkv

// 2. Register instances
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

const storage = createMMKV();
registerMMKVInstance('mmkv.default', storage);

// 3. Done! Dev tools will show MMKV option
```

---

## Best Practices

### 1. Always Register Instances

```typescript
// ✅ Good
const storage = createMMKV();
if (__DEV__) {
  registerMMKVInstance('default', storage);
}

// ❌ Bad - instance won't be monitored
const storage = createMMKV();  // Forgot to register
```

### 2. Use Descriptive Instance IDs

```typescript
// ✅ Good
registerMMKVInstance('user-data', userStorage);
registerMMKVInstance('cache', cacheStorage);
registerMMKVInstance('secure-credentials', secureStorage);

// ❌ Bad
registerMMKVInstance('storage1', storage1);
registerMMKVInstance('storage2', storage2);
```

### 3. Mark Encrypted Instances

```typescript
// ✅ Good
registerMMKVInstance('secure', secureStorage, { encrypted: true });

// Now UI will mask values appropriately
```

### 4. Register at App Start

```typescript
// ✅ Good - register immediately after creation
const storage = createMMKV();
registerMMKVInstance('default', storage);

// ❌ Bad - register later (miss early operations)
const storage = createMMKV();
// ... app code ...
registerMMKVInstance('default', storage);  // Too late!
```

---

## Common Pitfalls to Avoid

### Pitfall #1: Forgetting to Register

**Problem**: Created MMKV instance but forgot to register.

**Result**: Instance won't appear in dev tools.

**Fix**: Always pair `createMMKV` with `registerMMKVInstance`.

---

### Pitfall #2: Logging Encrypted Values

**Problem**: Showing encrypted values in plain text.

**Fix**: Check `encrypted` flag and mask values:
```typescript
if (instanceInfo.encrypted) {
  displayValue = '<encrypted>';
}
```

---

### Pitfall #3: Type Detection Overhead

**Problem**: Calling all 4 getters for every key is slow.

**Fix**: Cache type information after first detection.

---

### Pitfall #4: Buffer Value Display

**Problem**: ArrayBuffer can't be JSON.stringify'd.

**Fix**: Show `<ArrayBuffer X bytes>` instead of raw data.

---

## Summary

### Recommended Implementation Order

1. ✅ **Create Instance Registry** (2-3 hours)
2. ✅ **Create MMKVListener** (6-8 hours)
3. ✅ **Create useMMKVKeys** (4-6 hours)
4. ✅ **Create useMMKVInstances** (2-3 hours)
5. ✅ **Create Instance Selector UI** (2-3 hours)
6. ✅ **Update Existing Components** (3-4 hours)
7. ✅ **Testing** (6-9 hours)
8. ✅ **Documentation** (2-3 hours)

### Key Takeaways

- Use **hybrid monitoring** (listeners + wrapping)
- **Manual registration** for explicit control
- **Reuse existing UI** components
- **Type detection** is essential
- **Multi-instance support** is required
- **Test thoroughly** with edge cases

**Est. Total Time**: 27-41 hours

---

*Ready for Implementation - See TODO.md for detailed task breakdown*
