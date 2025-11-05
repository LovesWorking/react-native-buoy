# MMKV Interception Guide for Dev Tools

> **Purpose**: Practical guide for building dev tools to monitor and debug MMKV storage
>
> **Target Audience**: Dev tools developers building storage monitoring features
>
> **Last Updated**: 2025-01-04

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Monitoring Strategies](#monitoring-strategies)
3. [Strategy 1: Listener-Based Monitoring](#strategy-1-listener-based-monitoring)
4. [Strategy 2: Method Swizzling](#strategy-2-method-swizzling)
5. [Strategy 3: Hybrid Approach](#strategy-3-hybrid-approach)
6. [Complete Implementation Example](#complete-implementation-example)
7. [Data Collection & Storage](#data-collection--storage)
8. [Performance Considerations](#performance-considerations)
9. [Security Considerations](#security-considerations)
10. [Testing & Verification](#testing--verification)
11. [Common Pitfalls](#common-pitfalls)
12. [Best Practices](#best-practices)

---

## Executive Summary

### The Challenge

MMKV provides a synchronous, high-performance key-value storage API. To build effective dev tools, we need to:

1. **Monitor all storage operations** (read, write, delete)
2. **Track which instance** each operation belongs to
3. **Capture operation metadata** (timestamp, value, type)
4. **Minimize performance impact**
5. **Support multiple MMKV instances**

### Recommended Approach

**Hybrid Strategy**:
- Use **listeners** for write operations (set, remove, clearAll)
- Use **method wrapping** for read operations (getString, getNumber, etc.)
- Store dev tools data in **separate MMKV instance**

### Quick Start

```typescript
import { createMMKV } from 'react-native-mmkv'
import { enableMMKVDevTools } from './mmkv-dev-tools'

// Enable monitoring
const storage = createMMKV()
enableMMKVDevTools(storage, 'default-storage')

// All operations now logged
storage.set('user.name', 'John')  // Logged ✓
const name = storage.getString('user.name')  // Logged ✓
```

---

## Monitoring Strategies

### Strategy Comparison

| Strategy | Pros | Cons | Recommended For |
|----------|------|------|-----------------|
| **Listener-Based** | ✅ Official API<br>✅ Efficient<br>✅ Easy to implement | ❌ Write-only<br>❌ No type info<br>❌ No read tracking | Simple monitoring |
| **Method Swizzling** | ✅ Captures all ops<br>✅ Type information<br>✅ Performance metrics | ❌ Invasive<br>❌ Fragile<br>❌ Breaks on updates | Full dev tools |
| **Hybrid** | ✅ Best of both<br>✅ Complete coverage<br>✅ Type-safe | ❌ More complex | **Production dev tools** |

### Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                   Application Code                       │
│   const storage = createMMKV()                           │
│   storage.set('key', 'value')                            │
└──────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│              Dev Tools Interception Layer                │
│                                                            │
│  ┌────────────────────┐    ┌─────────────────────────┐  │
│  │  Listener Monitor  │    │  Method Wrapper Monitor │  │
│  │  (Write ops)       │    │  (Read ops)             │  │
│  └────────┬───────────┘    └──────────┬──────────────┘  │
│           │                           │                  │
│           └───────────┬───────────────┘                  │
│                       ↓                                  │
│            ┌──────────────────────┐                      │
│            │  Event Aggregator    │                      │
│            └──────────┬───────────┘                      │
│                       ↓                                  │
│            ┌──────────────────────┐                      │
│            │  Dev Tools Storage   │                      │
│            │  (Separate MMKV)     │                      │
│            └──────────────────────┘                      │
└──────────────────────────────────────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────────────┐
│                   Original MMKV                          │
│   (Unchanged - all operations go through normally)      │
└──────────────────────────────────────────────────────────┘
```

---

## Strategy 1: Listener-Based Monitoring

### Overview

Use MMKV's built-in `addOnValueChangedListener` API to monitor write operations.

**File Reference**: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts:22`

### Implementation

```typescript
import { MMKV } from 'react-native-mmkv'

interface StorageEvent {
  instance: string
  key: string
  timestamp: number
  operation: 'set' | 'remove'
}

class ListenerMonitor {
  private listeners = new Map<string, () => void>()

  /**
   * Start monitoring an MMKV instance
   */
  monitor(instance: MMKV, instanceId: string, onEvent: (event: StorageEvent) => void): void {
    // Add value change listener
    const listener = instance.addOnValueChangedListener((key) => {
      onEvent({
        instance: instanceId,
        key,
        timestamp: Date.now(),
        operation: 'set'  // Note: Can't distinguish set vs remove
      })
    })

    // Store cleanup function
    this.listeners.set(instanceId, () => listener.remove())
  }

  /**
   * Stop monitoring an instance
   */
  unmonitor(instanceId: string): void {
    const cleanup = this.listeners.get(instanceId)
    if (cleanup) {
      cleanup()
      this.listeners.delete(instanceId)
    }
  }

  /**
   * Stop monitoring all instances
   */
  unmonitorAll(): void {
    this.listeners.forEach((cleanup) => cleanup())
    this.listeners.clear()
  }
}

// Usage
const monitor = new ListenerMonitor()
monitor.monitor(storage, 'default', (event) => {
  console.log(`[${event.instance}] ${event.operation} ${event.key} at ${event.timestamp}`)
})
```

### Pros & Cons

**Pros**:
- ✅ Uses official API (no hacks)
- ✅ Efficient (event-driven)
- ✅ Works across all instances
- ✅ No performance overhead when no listeners

**Cons**:
- ❌ **Write operations only** (no read tracking)
- ❌ **No type information** (don't know if string, number, boolean, buffer)
- ❌ **Can't distinguish set vs remove** (both trigger listener)
- ❌ **No value capture** (must manually read value)

### Enhanced Version: Capture Values

```typescript
class EnhancedListenerMonitor {
  monitor(instance: MMKV, instanceId: string, onEvent: (event: StorageEvent) => void): void {
    const listener = instance.addOnValueChangedListener((key) => {
      // Try to read value (might be undefined if removed)
      const stringValue = instance.getString(key)
      const numberValue = instance.getNumber(key)
      const booleanValue = instance.getBoolean(key)

      // Determine type and value
      let value: any
      let type: 'string' | 'number' | 'boolean' | 'buffer' | 'removed'

      if (stringValue !== undefined) {
        value = stringValue
        type = 'string'
      } else if (numberValue !== undefined) {
        value = numberValue
        type = 'number'
      } else if (booleanValue !== undefined) {
        value = booleanValue
        type = 'boolean'
      } else if (instance.contains(key)) {
        // Key exists but not string/number/boolean → must be buffer
        value = instance.getBuffer(key)
        type = 'buffer'
      } else {
        // Key doesn't exist → removed
        value = undefined
        type = 'removed'
      }

      onEvent({
        instance: instanceId,
        key,
        value,
        type,
        timestamp: Date.now(),
        operation: type === 'removed' ? 'remove' : 'set'
      })
    })

    // Store cleanup
    this.listeners.set(instanceId, () => listener.remove())
  }
}
```

**Issue**: Reads value **after** write (not atomic), and trying all getters is inefficient.

---

## Strategy 2: Method Swizzling

### Overview

Wrap MMKV methods to intercept all operations before they reach the native layer.

### Implementation

```typescript
import { MMKV, createMMKV as originalCreateMMKV, Configuration } from 'react-native-mmkv'

interface StorageOperation {
  instance: string
  operation: 'set' | 'getString' | 'getNumber' | 'getBoolean' | 'getBuffer' | 'remove' | 'clearAll' | 'getAllKeys'
  key?: string
  value?: any
  type?: 'string' | 'number' | 'boolean' | 'buffer'
  timestamp: number
  duration?: number
}

type OperationCallback = (op: StorageOperation) => void

class MMKVInterceptor {
  private callbacks: OperationCallback[] = []

  /**
   * Register a callback for all operations
   */
  onOperation(callback: OperationCallback): () => void {
    this.callbacks.push(callback)
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit an operation event
   */
  private emit(op: StorageOperation): void {
    this.callbacks.forEach((cb) => cb(op))
  }

  /**
   * Wrap an MMKV instance with monitoring
   */
  wrap(instance: MMKV, instanceId: string): MMKV {
    // Wrap set()
    const originalSet = instance.set.bind(instance)
    instance.set = (key: string, value: boolean | string | number | ArrayBuffer) => {
      const start = performance.now()

      // Determine type
      let type: 'string' | 'number' | 'boolean' | 'buffer'
      if (typeof value === 'string') {
        type = 'string'
      } else if (typeof value === 'number') {
        type = 'number'
      } else if (typeof value === 'boolean') {
        type = 'boolean'
      } else {
        type = 'buffer'
      }

      // Call original
      originalSet(key, value)

      // Emit event
      this.emit({
        instance: instanceId,
        operation: 'set',
        key,
        value,
        type,
        timestamp: Date.now(),
        duration: performance.now() - start
      })
    }

    // Wrap getString()
    const originalGetString = instance.getString.bind(instance)
    instance.getString = (key: string) => {
      const start = performance.now()
      const value = originalGetString(key)

      this.emit({
        instance: instanceId,
        operation: 'getString',
        key,
        value,
        type: 'string',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // Wrap getNumber()
    const originalGetNumber = instance.getNumber.bind(instance)
    instance.getNumber = (key: string) => {
      const start = performance.now()
      const value = originalGetNumber(key)

      this.emit({
        instance: instanceId,
        operation: 'getNumber',
        key,
        value,
        type: 'number',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // Wrap getBoolean()
    const originalGetBoolean = instance.getBoolean.bind(instance)
    instance.getBoolean = (key: string) => {
      const start = performance.now()
      const value = originalGetBoolean(key)

      this.emit({
        instance: instanceId,
        operation: 'getBoolean',
        key,
        value,
        type: 'boolean',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // Wrap getBuffer()
    const originalGetBuffer = instance.getBuffer.bind(instance)
    instance.getBuffer = (key: string) => {
      const start = performance.now()
      const value = originalGetBuffer(key)

      this.emit({
        instance: instanceId,
        operation: 'getBuffer',
        key,
        value: value ? `<ArrayBuffer ${value.byteLength} bytes>` : undefined,  // Don't log full buffer
        type: 'buffer',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // Wrap remove()
    const originalRemove = instance.remove.bind(instance)
    instance.remove = (key: string) => {
      const start = performance.now()
      const result = originalRemove(key)

      this.emit({
        instance: instanceId,
        operation: 'remove',
        key,
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return result
    }

    // Wrap clearAll()
    const originalClearAll = instance.clearAll.bind(instance)
    instance.clearAll = () => {
      const start = performance.now()
      originalClearAll()

      this.emit({
        instance: instanceId,
        operation: 'clearAll',
        timestamp: Date.now(),
        duration: performance.now() - start
      })
    }

    // Wrap getAllKeys()
    const originalGetAllKeys = instance.getAllKeys.bind(instance)
    instance.getAllKeys = () => {
      const start = performance.now()
      const keys = originalGetAllKeys()

      this.emit({
        instance: instanceId,
        operation: 'getAllKeys',
        value: keys,
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return keys
    }

    return instance
  }
}

// Global interceptor instance
const interceptor = new MMKVInterceptor()

/**
 * Enhanced createMMKV that automatically wraps instances
 */
export function createMMKV(configuration?: Partial<Configuration>): MMKV {
  const instance = originalCreateMMKV(configuration)
  const instanceId = configuration?.id ?? 'mmkv.default'

  return interceptor.wrap(instance, instanceId)
}

/**
 * Subscribe to all MMKV operations
 */
export function onMMKVOperation(callback: OperationCallback): () => void {
  return interceptor.onOperation(callback)
}
```

### Usage

```typescript
// In your app, replace react-native-mmkv import
import { createMMKV, onMMKVOperation } from './mmkv-interceptor'

// Subscribe to operations
const unsubscribe = onMMKVOperation((op) => {
  console.log(`[${op.instance}] ${op.operation} ${op.key} = ${op.value} (${op.duration}ms)`)
})

// Use MMKV normally
const storage = createMMKV()
storage.set('user.name', 'John')  // Logged ✓
const name = storage.getString('user.name')  // Logged ✓
```

### Pros & Cons

**Pros**:
- ✅ **Complete coverage** (reads and writes)
- ✅ **Type information** (know exactly which getter/setter used)
- ✅ **Performance metrics** (operation duration)
- ✅ **Value capture** (get actual values)
- ✅ **Operation distinction** (set vs remove vs clearAll)

**Cons**:
- ❌ **Invasive** (modifies instance methods)
- ❌ **Fragile** (breaks if MMKV API changes)
- ❌ **No TypeScript safety** (method signatures must match exactly)
- ❌ **Performance overhead** (every operation wrapped)
- ❌ **Memory overhead** (stores original method references)

---

## Strategy 3: Hybrid Approach

### Overview

Combine listeners (for writes) and method wrapping (for reads) to get the best of both worlds.

### Implementation

```typescript
import { MMKV } from 'react-native-mmkv'

interface StorageEvent {
  instance: string
  operation: 'set' | 'get' | 'remove' | 'clearAll'
  key?: string
  value?: any
  type?: 'string' | 'number' | 'boolean' | 'buffer'
  timestamp: number
  duration?: number
}

type EventCallback = (event: StorageEvent) => void

class HybridMMKVMonitor {
  private eventCallbacks: EventCallback[] = []
  private listenerCleanups = new Map<string, () => void>()

  /**
   * Register event callback
   */
  onEvent(callback: EventCallback): () => void {
    this.eventCallbacks.push(callback)
    return () => {
      const index = this.eventCallbacks.indexOf(callback)
      if (index > -1) {
        this.eventCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Emit event to all callbacks
   */
  private emit(event: StorageEvent): void {
    this.eventCallbacks.forEach((cb) => cb(event))
  }

  /**
   * Monitor an MMKV instance
   */
  monitor(instance: MMKV, instanceId: string): void {
    // 1. Use listener for write operations
    const listener = instance.addOnValueChangedListener((key) => {
      // We know a write happened, but not the details
      // Could read value here, but that's another operation
      this.emit({
        instance: instanceId,
        operation: 'set',  // Assume set (could be remove)
        key,
        timestamp: Date.now()
      })
    })

    // Store listener cleanup
    const cleanupListener = () => listener.remove()

    // 2. Wrap read operations
    const originalGetString = instance.getString.bind(instance)
    instance.getString = (key: string) => {
      const start = performance.now()
      const value = originalGetString(key)

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'string',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    const originalGetNumber = instance.getNumber.bind(instance)
    instance.getNumber = (key: string) => {
      const start = performance.now()
      const value = originalGetNumber(key)

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'number',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    const originalGetBoolean = instance.getBoolean.bind(instance)
    instance.getBoolean = (key: string) => {
      const start = performance.now()
      const value = originalGetBoolean(key)

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'boolean',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    const originalGetBuffer = instance.getBuffer.bind(instance)
    instance.getBuffer = (key: string) => {
      const start = performance.now()
      const value = originalGetBuffer(key)

      this.emit({
        instance: instanceId,
        operation: 'get',
        key,
        value: value ? `<ArrayBuffer ${value.byteLength} bytes>` : undefined,
        type: 'buffer',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // 3. Wrap write operations (for type info)
    const originalSet = instance.set.bind(instance)
    instance.set = (key: string, value: boolean | string | number | ArrayBuffer) => {
      const start = performance.now()

      let type: 'string' | 'number' | 'boolean' | 'buffer'
      if (typeof value === 'string') type = 'string'
      else if (typeof value === 'number') type = 'number'
      else if (typeof value === 'boolean') type = 'boolean'
      else type = 'buffer'

      originalSet(key, value)

      this.emit({
        instance: instanceId,
        operation: 'set',
        key,
        value: type === 'buffer' ? `<ArrayBuffer ${(value as ArrayBuffer).byteLength} bytes>` : value,
        type,
        timestamp: Date.now(),
        duration: performance.now() - start
      })
    }

    const originalRemove = instance.remove.bind(instance)
    instance.remove = (key: string) => {
      const start = performance.now()
      const result = originalRemove(key)

      this.emit({
        instance: instanceId,
        operation: 'remove',
        key,
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return result
    }

    const originalClearAll = instance.clearAll.bind(instance)
    instance.clearAll = () => {
      const start = performance.now()
      originalClearAll()

      this.emit({
        instance: instanceId,
        operation: 'clearAll',
        timestamp: Date.now(),
        duration: performance.now() - start
      })
    }

    // Store all cleanups
    this.listenerCleanups.set(instanceId, cleanupListener)
  }

  /**
   * Stop monitoring an instance
   */
  unmonitor(instanceId: string): void {
    const cleanup = this.listenerCleanups.get(instanceId)
    if (cleanup) {
      cleanup()
      this.listenerCleanups.delete(instanceId)
    }
    // Note: Can't unwrap methods easily, would need to store originals
  }
}

// Global monitor
const monitor = new HybridMMKVMonitor()

/**
 * Enable monitoring for an MMKV instance
 */
export function enableMMKVMonitoring(instance: MMKV, instanceId: string): void {
  monitor.monitor(instance, instanceId)
}

/**
 * Subscribe to MMKV events
 */
export function onMMKVEvent(callback: EventCallback): () => void {
  return monitor.onEvent(callback)
}
```

### Usage

```typescript
import { createMMKV } from 'react-native-mmkv'
import { enableMMKVMonitoring, onMMKVEvent } from './hybrid-monitor'

// Create instance
const storage = createMMKV()

// Enable monitoring
enableMMKVMonitoring(storage, 'default')

// Subscribe to events
onMMKVEvent((event) => {
  console.log(`[${event.instance}] ${event.operation} ${event.key}`)
})

// All operations monitored
storage.set('key', 'value')  // Logged with type info ✓
const value = storage.getString('key')  // Logged with duration ✓
```

### Pros & Cons

**Pros**:
- ✅ **Complete coverage** (reads and writes)
- ✅ **Type information** from method wrapping
- ✅ **Efficient writes** using listeners
- ✅ **Performance metrics** for all operations
- ✅ **Best of both worlds**

**Cons**:
- ❌ **Complex** implementation
- ❌ **Dual notification** for writes (listener + wrapper)
- ❌ Still **invasive** (wraps methods)
- ❌ **Cleanup challenges** (can't easily unwrap)

---

## Complete Implementation Example

### Full Dev Tools System

Here's a complete, production-ready MMKV dev tools implementation:

**File**: `mmkv-devtools.ts`

```typescript
import { MMKV, createMMKV as originalCreateMMKV, Configuration } from 'react-native-mmkv'

// ============================================================================
// Types
// ============================================================================

export interface MMKVOperation {
  id: string  // Unique operation ID
  instance: string  // Instance ID
  operation: 'set' | 'get' | 'remove' | 'clearAll' | 'getAllKeys'
  key?: string
  value?: any
  type?: 'string' | 'number' | 'boolean' | 'buffer'
  timestamp: number
  duration?: number
  stackTrace?: string  // Optional stack trace
}

export interface MMKVInstanceInfo {
  id: string
  encrypted: boolean
  readOnly: boolean
  size: number
  keyCount: number
}

// ============================================================================
// Dev Tools Storage
// ============================================================================

class DevToolsStorage {
  private storage: MMKV
  private maxOperations = 1000  // Limit to prevent unbounded growth

  constructor() {
    // Use separate MMKV instance for dev tools data
    this.storage = originalCreateMMKV({ id: 'mmkv-devtools' })
  }

  /**
   * Log an operation
   */
  logOperation(op: MMKVOperation): void {
    const key = `op.${op.timestamp}.${op.id}`
    this.storage.set(key, JSON.stringify(op))

    // Cleanup old operations
    this.cleanup()
  }

  /**
   * Get all logged operations
   */
  getOperations(): MMKVOperation[] {
    const keys = this.storage.getAllKeys().filter((k) => k.startsWith('op.'))
    return keys
      .map((k) => {
        const json = this.storage.getString(k)
        return json ? JSON.parse(json) : null
      })
      .filter(Boolean)
      .sort((a, b) => b.timestamp - a.timestamp)  // Most recent first
  }

  /**
   * Clear all logged operations
   */
  clearOperations(): void {
    const keys = this.storage.getAllKeys().filter((k) => k.startsWith('op.'))
    keys.forEach((k) => this.storage.remove(k))
  }

  /**
   * Cleanup old operations (keep only maxOperations)
   */
  private cleanup(): void {
    const operations = this.getOperations()
    if (operations.length > this.maxOperations) {
      const toRemove = operations.slice(this.maxOperations)
      toRemove.forEach((op) => {
        this.storage.remove(`op.${op.timestamp}.${op.id}`)
      })
    }
  }

  /**
   * Store instance info
   */
  setInstanceInfo(instanceId: string, info: MMKVInstanceInfo): void {
    this.storage.set(`instance.${instanceId}`, JSON.stringify(info))
  }

  /**
   * Get all tracked instances
   */
  getInstances(): MMKVInstanceInfo[] {
    const keys = this.storage.getAllKeys().filter((k) => k.startsWith('instance.'))
    return keys.map((k) => {
      const json = this.storage.getString(k)
      return json ? JSON.parse(json) : null
    }).filter(Boolean)
  }
}

// ============================================================================
// MMKV Monitor
// ============================================================================

class MMKVDevTools {
  private devStorage = new DevToolsStorage()
  private operationId = 0
  private monitoredInstances = new Set<string>()

  /**
   * Wrap an MMKV instance with monitoring
   */
  monitor(instance: MMKV, instanceId: string, config?: Partial<Configuration>): MMKV {
    if (this.monitoredInstances.has(instanceId)) {
      console.warn(`MMKV instance "${instanceId}" is already monitored`)
      return instance
    }

    this.monitoredInstances.add(instanceId)

    // Store instance info
    this.devStorage.setInstanceInfo(instanceId, {
      id: instanceId,
      encrypted: !!config?.encryptionKey,
      readOnly: config?.readOnly ?? false,
      size: instance.size,
      keyCount: instance.getAllKeys().length
    })

    // Wrap all methods
    this.wrapMethods(instance, instanceId)

    return instance
  }

  /**
   * Wrap all MMKV methods
   */
  private wrapMethods(instance: MMKV, instanceId: string): void {
    // set()
    const originalSet = instance.set.bind(instance)
    instance.set = (key: string, value: boolean | string | number | ArrayBuffer) => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()

      let type: 'string' | 'number' | 'boolean' | 'buffer'
      let logValue: any = value

      if (typeof value === 'string') {
        type = 'string'
      } else if (typeof value === 'number') {
        type = 'number'
      } else if (typeof value === 'boolean') {
        type = 'boolean'
      } else {
        type = 'buffer'
        logValue = `<ArrayBuffer ${value.byteLength} bytes>`
      }

      originalSet(key, value)

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'set',
        key,
        value: logValue,
        type,
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      // Update instance info
      this.updateInstanceInfo(instance, instanceId)
    }

    // getString()
    const originalGetString = instance.getString.bind(instance)
    instance.getString = (key: string) => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      const value = originalGetString(key)

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'string',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // getNumber()
    const originalGetNumber = instance.getNumber.bind(instance)
    instance.getNumber = (key: string) => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      const value = originalGetNumber(key)

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'number',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // getBoolean()
    const originalGetBoolean = instance.getBoolean.bind(instance)
    instance.getBoolean = (key: string) => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      const value = originalGetBoolean(key)

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'get',
        key,
        value,
        type: 'boolean',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // getBuffer()
    const originalGetBuffer = instance.getBuffer.bind(instance)
    instance.getBuffer = (key: string) => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      const value = originalGetBuffer(key)

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'get',
        key,
        value: value ? `<ArrayBuffer ${value.byteLength} bytes>` : undefined,
        type: 'buffer',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return value
    }

    // remove()
    const originalRemove = instance.remove.bind(instance)
    instance.remove = (key: string) => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      const result = originalRemove(key)

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'remove',
        key,
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      this.updateInstanceInfo(instance, instanceId)

      return result
    }

    // clearAll()
    const originalClearAll = instance.clearAll.bind(instance)
    instance.clearAll = () => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      originalClearAll()

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'clearAll',
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      this.updateInstanceInfo(instance, instanceId)
    }

    // getAllKeys()
    const originalGetAllKeys = instance.getAllKeys.bind(instance)
    instance.getAllKeys = () => {
      const opId = `${instanceId}-${this.operationId++}`
      const start = performance.now()
      const keys = originalGetAllKeys()

      this.devStorage.logOperation({
        id: opId,
        instance: instanceId,
        operation: 'getAllKeys',
        value: keys,
        timestamp: Date.now(),
        duration: performance.now() - start
      })

      return keys
    }
  }

  /**
   * Update instance info after mutation
   */
  private updateInstanceInfo(instance: MMKV, instanceId: string): void {
    const instances = this.devStorage.getInstances()
    const info = instances.find((i) => i.id === instanceId)
    if (info) {
      info.size = instance.size
      info.keyCount = instance.getAllKeys().length
      this.devStorage.setInstanceInfo(instanceId, info)
    }
  }

  /**
   * Get all logged operations
   */
  getOperations(): MMKVOperation[] {
    return this.devStorage.getOperations()
  }

  /**
   * Get all monitored instances
   */
  getInstances(): MMKVInstanceInfo[] {
    return this.devStorage.getInstances()
  }

  /**
   * Clear operation logs
   */
  clearLogs(): void {
    this.devStorage.clearOperations()
  }
}

// ============================================================================
// Public API
// ============================================================================

// Global dev tools instance
const devTools = new MMKVDevTools()

/**
 * Enhanced createMMKV that automatically enables monitoring
 */
export function createMMKV(configuration?: Partial<Configuration>): MMKV {
  const instance = originalCreateMMKV(configuration)
  const instanceId = configuration?.id ?? 'mmkv.default'

  // Monitor if dev tools enabled
  if (__DEV__) {
    devTools.monitor(instance, instanceId, configuration)
  }

  return instance
}

/**
 * Get all logged operations
 */
export function getMMKVOperations(): MMKVOperation[] {
  return devTools.getOperations()
}

/**
 * Get all monitored instances
 */
export function getMMKVInstances(): MMKVInstanceInfo[] {
  return devTools.getInstances()
}

/**
 * Clear operation logs
 */
export function clearMMKVLogs(): void {
  devTools.clearLogs()
}
```

### Usage in App

```typescript
// 1. Replace import
import { createMMKV } from './mmkv-devtools'  // Instead of 'react-native-mmkv'

// 2. Use normally - monitoring is automatic in __DEV__
const storage = createMMKV()
storage.set('user.name', 'John')

// 3. Access logs from dev tools UI
import { getMMKVOperations, getMMKVInstances } from './mmkv-devtools'

const operations = getMMKVOperations()  // Get all logged operations
const instances = getMMKVInstances()    // Get instance info
```

---

## Data Collection & Storage

### Storage Strategy

**Use separate MMKV instance** for dev tools data to avoid:
- ❌ Polluting user data
- ❌ Triggering listeners recursively
- ❌ Performance impact on main storage

```typescript
// Dev tools storage (separate instance)
const devStorage = createMMKV({ id: 'devtools-mmkv' })

// User storage (monitored)
const userStorage = createMMKV({ id: 'user-data' })
```

### Data Retention

**Limit stored operations** to prevent unbounded growth:

```typescript
class DevToolsStorage {
  private maxOperations = 1000  // Keep only last 1000 operations

  cleanup(): void {
    const operations = this.getOperations()
    if (operations.length > this.maxOperations) {
      const toRemove = operations.slice(this.maxOperations)
      toRemove.forEach((op) => {
        this.storage.remove(`op.${op.timestamp}.${op.id}`)
      })
    }
  }
}
```

### Operation Log Format

```typescript
interface MMKVOperation {
  id: string           // "user-data-1234"
  instance: string     // "user-data"
  operation: string    // "set" | "get" | "remove" | ...
  key?: string         // "user.name"
  value?: any          // "John Doe" or "<ArrayBuffer 1024 bytes>"
  type?: string        // "string" | "number" | "boolean" | "buffer"
  timestamp: number    // 1704398400000
  duration?: number    // 0.5 (ms)
  stackTrace?: string  // Optional call stack
}
```

**Storage Key**: `op.{timestamp}.{id}`

**Example**:
```
op.1704398400000.user-data-1234 = '{"id":"user-data-1234","instance":"user-data",...}'
```

---

## Performance Considerations

### Overhead Analysis

**Method Wrapping Overhead**:
- Each wrapped method adds ~0.01-0.05ms
- Negligible for typical usage
- May matter for high-frequency operations

**Logging Overhead**:
- JSON serialization: ~0.1ms per operation
- MMKV write: ~0.02ms
- Total: ~0.12ms per logged operation

**Memory Overhead**:
- Each logged operation: ~200-500 bytes (depending on value size)
- 1000 operations: ~200-500 KB
- Cleanup prevents unbounded growth

### Optimization Tips

**1. Conditional Logging**:
```typescript
if (__DEV__) {
  devTools.logOperation(op)
}
```

**2. Sampling**:
```typescript
// Log only 10% of read operations
if (Math.random() < 0.1) {
  devTools.logOperation(op)
}
```

**3. Truncate Large Values**:
```typescript
function truncateValue(value: any, maxLength = 1000): any {
  if (typeof value === 'string' && value.length > maxLength) {
    return value.substring(0, maxLength) + '...'
  }
  return value
}
```

**4. Debounce Updates**:
```typescript
// Update instance info only once per second
const updateInstanceInfo = debounce((instance, instanceId) => {
  devStorage.setInstanceInfo(instanceId, { ... })
}, 1000)
```

---

## Security Considerations

### Encrypted Storage

**Problem**: Encrypted MMKV instances should not leak values in dev tools.

**Solution**: Detect encrypted instances and mask values.

```typescript
class MMKVDevTools {
  monitor(instance: MMKV, instanceId: string, config?: Partial<Configuration>): MMKV {
    const isEncrypted = !!config?.encryptionKey

    if (isEncrypted) {
      // Log operations but mask values
      this.monitorEncrypted(instance, instanceId)
    } else {
      // Log operations with full values
      this.monitorNormal(instance, instanceId)
    }
  }

  private monitorEncrypted(instance: MMKV, instanceId: string): void {
    const originalSet = instance.set.bind(instance)
    instance.set = (key, value) => {
      originalSet(key, value)

      // Log without value
      this.devStorage.logOperation({
        instance: instanceId,
        operation: 'set',
        key,
        value: '<encrypted>',  // Mask value
        timestamp: Date.now()
      })
    }
    // ... similar for get methods
  }
}
```

### Sensitive Data

**Always mask sensitive keys**:

```typescript
const SENSITIVE_KEYS = ['password', 'token', 'ssn', 'creditCard']

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k.toLowerCase()))
}

// In logging
if (isSensitive(key)) {
  logValue = '<redacted>'
}
```

---

## Testing & Verification

### Unit Tests

```typescript
import { createMMKV, getMMKVOperations, clearMMKVLogs } from './mmkv-devtools'

describe('MMKV Dev Tools', () => {
  beforeEach(() => {
    clearMMKVLogs()
  })

  test('logs set operations', () => {
    const storage = createMMKV({ id: 'test' })
    storage.set('key', 'value')

    const ops = getMMKVOperations()
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      instance: 'test',
      operation: 'set',
      key: 'key',
      value: 'value',
      type: 'string'
    })
  })

  test('logs get operations', () => {
    const storage = createMMKV({ id: 'test' })
    storage.set('key', 'value')
    clearMMKVLogs()

    storage.getString('key')

    const ops = getMMKVOperations()
    expect(ops).toHaveLength(1)
    expect(ops[0]).toMatchObject({
      instance: 'test',
      operation: 'get',
      key: 'key',
      value: 'value',
      type: 'string'
    })
  })

  test('respects operation limit', () => {
    const storage = createMMKV({ id: 'test' })

    // Generate 1500 operations
    for (let i = 0; i < 1500; i++) {
      storage.set(`key${i}`, i)
    }

    const ops = getMMKVOperations()
    expect(ops.length).toBeLessThanOrEqual(1000)
  })
})
```

---

## Common Pitfalls

### 1. Recursive Logging

**Problem**: Logging to MMKV triggers more logs.

**Solution**: Use separate instance for dev tools.

```typescript
// ❌ Bad
const devTools = createMMKV()  // Gets monitored, causes recursion!

// ✅ Good
const devTools = originalCreateMMKV({ id: 'devtools' })  // Not monitored
```

---

### 2. Memory Leaks from Listeners

**Problem**: Listeners not cleaned up.

**Solution**: Always remove listeners.

```typescript
// ❌ Bad
instance.addOnValueChangedListener((key) => console.log(key))  // Never removed

// ✅ Good
const listener = instance.addOnValueChangedListener((key) => console.log(key))
// Later...
listener.remove()
```

---

### 3. Large Value Logging

**Problem**: Logging large buffers or strings.

**Solution**: Truncate values.

```typescript
// ❌ Bad
logOperation({ value: hugeString })  // Could be MBs

// ✅ Good
logOperation({ value: truncateValue(hugeString, 1000) })
```

---

### 4. Type Mismatch

**Problem**: Reading wrong type.

**Solution**: Wrap all getters, not just one.

```typescript
// ❌ Bad - only wraps getString
const originalGetString = instance.getString.bind(instance)
instance.getString = (key) => {
  const value = originalGetString(key)
  log({ value, type: 'string' })
  return value
}
// But user might call getNumber() - not logged!

// ✅ Good - wrap all getters
wrapGetString(instance)
wrapGetNumber(instance)
wrapGetBoolean(instance)
wrapGetBuffer(instance)
```

---

## Best Practices

### 1. Conditional Monitoring

Only enable in development:

```typescript
export function createMMKV(config?: Partial<Configuration>): MMKV {
  const instance = originalCreateMMKV(config)

  if (__DEV__) {
    devTools.monitor(instance, config?.id ?? 'mmkv.default', config)
  }

  return instance
}
```

---

### 2. Separate Dev Tools Storage

Never pollute user storage:

```typescript
// ✅ Good
const devToolsStorage = originalCreateMMKV({ id: 'devtools-mmkv' })
const userStorage = createMMKV({ id: 'user-data' })  // Monitored
```

---

### 3. Cleanup Old Data

Prevent unbounded growth:

```typescript
class DevToolsStorage {
  private maxOperations = 1000

  logOperation(op: MMKVOperation): void {
    this.storage.set(`op.${op.timestamp}.${op.id}`, JSON.stringify(op))
    this.cleanup()  // Always cleanup after logging
  }

  private cleanup(): void {
    const operations = this.getOperations()
    if (operations.length > this.maxOperations) {
      const toRemove = operations.slice(this.maxOperations)
      toRemove.forEach((op) => this.storage.remove(`op.${op.timestamp}.${op.id}`))
    }
  }
}
```

---

### 4. Mask Sensitive Data

Always protect sensitive values:

```typescript
function logOperation(op: MMKVOperation): void {
  if (isEncrypted || isSensitiveKey(op.key)) {
    op.value = '<redacted>'
  }

  devStorage.logOperation(op)
}
```

---

### 5. Performance Monitoring

Track operation duration:

```typescript
const start = performance.now()
const value = originalGetString(key)
const duration = performance.now() - start

logOperation({ duration })
```

---

## Summary

### Recommended Approach

For production-ready dev tools:

1. **Use method wrapping** for complete coverage
2. **Store logs in separate MMKV instance**
3. **Limit log retention** (e.g., 1000 operations)
4. **Mask sensitive data** (encrypted instances, sensitive keys)
5. **Enable only in \_\_DEV\_\_**
6. **Track performance metrics**

### Quick Reference

```typescript
// 1. Create dev tools wrapper
export function createMMKV(config?) {
  const instance = originalCreateMMKV(config)
  if (__DEV__) {
    devTools.monitor(instance, config?.id ?? 'mmkv.default', config)
  }
  return instance
}

// 2. Use in app
const storage = createMMKV()

// 3. Access logs
const operations = getMMKVOperations()
const instances = getMMKVInstances()
```

---

**Next Steps**: See `STORAGE_DEVTOOLS_ARCHITECTURE.md` for current rn-buoy implementation analysis.
