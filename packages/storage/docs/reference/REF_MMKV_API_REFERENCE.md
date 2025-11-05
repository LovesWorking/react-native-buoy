# ⚠️ REFERENCE DOCUMENTATION ONLY - NOT IMPLEMENTED

> **WARNING**: This document describes how react-native-mmkv works internally.
>
> **It is NOT an implementation plan for rn-buoy storage dev tools.**
>
> **Current Status**: MMKV support is **not yet implemented** in @react-buoy/storage.
>
> See [MMKV_INTEGRATION_ANALYSIS.md](../../MMKV_INTEGRATION_ANALYSIS.md) for implementation details.

---

# MMKV Complete API Reference

> **Source Repository**: `/Users/austinjohnson/Desktop/react native mmkv clone`
>
> **Version**: 4.0.0 (Nitro Modules)
>
> **Last Updated**: 2025-01-04

## Table of Contents

1. [Overview](#overview)
2. [Core Interfaces](#core-interfaces)
   - [MMKV Interface](#mmkv-interface)
   - [Configuration Interface](#configuration-interface)
   - [Listener Interface](#listener-interface)
   - [MMKVFactory Interface](#mmkvfactory-interface)
   - [MMKVPlatformContext Interface](#mmkvplatformcontext-interface)
3. [Factory Function](#factory-function)
4. [React Hooks API](#react-hooks-api)
5. [Methods Reference](#methods-reference)
6. [Data Types](#data-types)
7. [Code Examples](#code-examples)
8. [Best Practices](#best-practices)
9. [Anti-Patterns (What NOT to Do)](#anti-patterns-what-not-to-do)
10. [Platform Differences](#platform-differences)
11. [Performance Characteristics](#performance-characteristics)
12. [Security & Encryption](#security--encryption)

---

## Overview

**react-native-mmkv** is a synchronous, high-performance key-value storage library for React Native that wraps the Tencent MMKV C++ library. It provides ~30x faster performance than AsyncStorage through direct JSI (JavaScript Interface) calls to native code.

### Key Features

- ✅ **Synchronous API** - No Promises, no async/await
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Fast** - JSI-based, ~30x faster than AsyncStorage
- ✅ **Encrypted** - AES encryption support
- ✅ **Multi-Instance** - Multiple isolated storage instances
- ✅ **Reactive** - Value change listeners
- ✅ **React Hooks** - Built-in hooks for React integration
- ✅ **Cross-Platform** - iOS, Android, Web

### Architecture Layers

```
┌────────────────────────────────────┐
│     TypeScript API Layer           │  ← Your app interacts here
├────────────────────────────────────┤
│     JSI Bridge (Synchronous)       │  ← Direct C++ calls
├────────────────────────────────────┤
│     C++ HybridMMKV Layer           │  ← Type handling, listeners
├────────────────────────────────────┤
│     Tencent MMKV Core (C++)        │  ← mmap-based storage
├────────────────────────────────────┤
│     Platform Storage (iOS/Android) │  ← File system
└────────────────────────────────────┘
```

---

## Core Interfaces

All TypeScript interfaces are defined in the `specs/` directory and serve as the contract between JavaScript and native code.

### MMKV Interface

**File**: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts`

The main storage interface representing an MMKV instance.

```typescript
interface MMKV extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // Write operations
  set(key: string, value: boolean | string | number | ArrayBuffer): void

  // Read operations (type-specific)
  getBoolean(key: string): boolean | undefined
  getString(key: string): string | undefined
  getNumber(key: string): number | undefined
  getBuffer(key: string): ArrayBuffer | undefined

  // Key management
  contains(key: string): boolean
  remove(key: string): boolean
  getAllKeys(): string[]
  clearAll(): void

  // Security
  recrypt(key: string | undefined): void

  // Memory management
  trim(): void

  // Properties
  readonly size: number
  readonly isReadOnly: boolean

  // Event listeners
  addOnValueChangedListener(onValueChanged: (key: string) => void): Listener
}
```

**Type Parameters**:
- `HybridObject<{ ios: 'c++'; android: 'c++' }>` - Nitro Modules type indicating C++ implementation on both platforms

**Key Observations**:
- Single `set()` method handles all types (boolean, string, number, ArrayBuffer)
- Type-specific getters return `undefined` if key doesn't exist or type mismatches
- All operations are **synchronous** (no Promises)
- Listeners enable reactive programming patterns

---

### Configuration Interface

**File**: `packages/react-native-mmkv/src/specs/MMKVFactory.nitro.ts`

Configuration object for creating MMKV instances.

```typescript
interface Configuration {
  /**
   * A unique ID for this MMKV instance.
   * @default 'mmkv.default'
   */
  id: string

  /**
   * Custom storage path (optional).
   * If not specified, uses platform default:
   * - iOS: Documents/mmkv or Caches/mmkv (tvOS)
   * - Android: filesDir/mmkv
   */
  path?: string

  /**
   * Encryption key for AES encryption (optional).
   * Maximum 16 bytes.
   */
  encryptionKey?: string

  /**
   * Process mode (optional).
   * @default 'single-process'
   */
  mode?: Mode

  /**
   * Whether this instance is read-only (optional).
   * @default false
   */
  readOnly?: boolean
}

type Mode = 'single-process' | 'multi-process'
```

**Field Details**:

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `id` | `string` | ✅ Yes | N/A | Unique identifier for the instance |
| `path` | `string` | ❌ No | Platform default | Custom storage directory |
| `encryptionKey` | `string` | ❌ No | `undefined` | Encryption key (max 16 bytes) |
| `mode` | `Mode` | ❌ No | `'single-process'` | Process synchronization mode |
| `readOnly` | `boolean` | ❌ No | `false` | Read-only access |

**File References**:
- `Configuration` type: `packages/react-native-mmkv/src/specs/MMKVFactory.nitro.ts:8-14`
- `Mode` type: `packages/react-native-mmkv/src/specs/MMKVFactory.nitro.ts:6`

---

### Listener Interface

**File**: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts`

Represents a registered value change listener.

```typescript
interface Listener {
  /**
   * Remove this listener from the registry.
   */
  remove: () => void
}
```

**Usage Pattern**:
```typescript
const listener = storage.addOnValueChangedListener((key) => {
  console.log(`Value changed for key: ${key}`)
})

// Later, unsubscribe
listener.remove()
```

**Implementation Note**:
- Internally uses `MMKVValueChangedListenerRegistry` (C++) to track listeners globally
- File: `packages/react-native-mmkv/cpp/MMKVValueChangedListenerRegistry.cpp`

---

### MMKVFactory Interface

**File**: `packages/react-native-mmkv/src/specs/MMKVFactory.nitro.ts`

Factory interface for creating MMKV instances (not typically used directly).

```typescript
interface MMKVFactory extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  /**
   * Create a new MMKV instance with the given configuration.
   */
  createMMKV(configuration: Configuration): MMKV

  /**
   * Initialize the MMKV library with a custom root path.
   * Should only be called once at app startup.
   */
  initializeMMKV(rootPath: string): void

  /**
   * Get the default MMKV instance ID.
   * @returns 'mmkv.default'
   */
  readonly defaultMMKVInstanceId: string
}
```

**Usage**:
- Factory is accessed via `NitroModules.createHybridObject<MMKVFactory>()`
- Typically abstracted away by `createMMKV()` function
- See: `packages/react-native-mmkv/src/createMMKV/createMMKV.ts`

---

### MMKVPlatformContext Interface

**File**: `packages/react-native-mmkv/src/specs/MMKVPlatformContext.nitro.ts`

Platform-specific context for directory resolution.

```typescript
interface MMKVPlatformContext extends HybridObject<{ ios: 'swift'; android: 'kotlin' }> {
  /**
   * Get the base directory for MMKV storage.
   * - iOS: Documents/mmkv or Caches/mmkv (tvOS)
   * - Android: filesDir/mmkv
   */
  getBaseDirectory(): string

  /**
   * Get the App Group directory (iOS only).
   * Returns undefined on Android or if not configured.
   */
  getAppGroupDirectory(): string | undefined
}
```

**Platform Implementations**:
- **iOS**: `packages/react-native-mmkv/ios/HybridMMKVPlatformContext.swift`
- **Android**: `packages/react-native-mmkv/android/src/main/java/com/margelo/nitro/mmkv/HybridMMKVPlatformContext.kt`

---

## Factory Function

### createMMKV()

**File**: `packages/react-native-mmkv/src/createMMKV/createMMKV.ts`

The primary function for creating MMKV instances.

```typescript
function createMMKV(configuration?: Partial<Configuration>): MMKV
```

**Signature**:
```typescript
createMMKV(): MMKV  // Creates default instance
createMMKV(config: Partial<Configuration>): MMKV  // Creates custom instance
```

**Parameters**:
- `configuration` (optional): Partial configuration object
  - Only `id` is typically required for custom instances
  - Other fields have sensible defaults

**Returns**: `MMKV` instance

**Example**:
```typescript
import { createMMKV } from 'react-native-mmkv'

// Default instance
const storage = createMMKV()

// Custom instance with encryption
const secureStorage = createMMKV({
  id: 'user-secure-storage',
  encryptionKey: 'my-encryption-key'
})

// Multi-process instance
const sharedStorage = createMMKV({
  id: 'shared-data',
  mode: 'multi-process'
})
```

**Internal Behavior** (from source code):

1. **Lazy Initialization**: Factory and platform context are created on first call
   ```typescript
   // File: packages/react-native-mmkv/src/createMMKV/createMMKV.ts:17-22
   if (factory == null) {
     factory = NitroModules.createHybridObject<MMKVFactory>('MMKVFactory')
   }
   if (platformContext == null) {
     platformContext = NitroModules.createHybridObject<MMKVPlatformContext>('MMKVPlatformContext')
   }
   ```

2. **Root Path Initialization**: MMKV library initialized with base directory
   ```typescript
   // File: packages/react-native-mmkv/src/createMMKV/createMMKV.ts:24-29
   if (baseDirectory == null) {
     baseDirectory = platformContext.getBaseDirectory()
     factory.initializeMMKV(baseDirectory)
   }
   ```

3. **iOS App Groups Support**: If `AppGroup` is in Info.plist, uses App Group directory
   ```typescript
   // File: packages/react-native-mmkv/src/createMMKV/createMMKV.ts:31-41
   const appGroupDirectory = platformContext.getAppGroupDirectory()
   if (appGroupDirectory != null) {
     if (configuration?.path != null) {
       throw new Error('Cannot use both `path` and App Groups!')
     }
     configuration = {
       ...configuration,
       path: appGroupDirectory,
     }
   }
   ```

4. **Memory Warning Listener**: Auto-trims storage on low memory (iOS/Android)
   ```typescript
   // File: packages/react-native-mmkv/src/createMMKV/createMMKV.ts:47-50
   if (!didAddMemoryWarningListener) {
     addMemoryWarningListener(() => instance.trim())
     didAddMemoryWarningListener = true
   }
   ```

**Default Instance Pattern**:
```typescript
// File: packages/react-native-mmkv/src/createMMKV/getDefaultMMKVInstance.ts
let defaultInstance: MMKV | undefined

export function getDefaultMMKVInstance(): MMKV {
  if (defaultInstance == null) {
    defaultInstance = createMMKV({ id: 'mmkv.default' })
  }
  return defaultInstance
}
```

---

## React Hooks API

All hooks are located in `packages/react-native-mmkv/src/hooks/`.

### useMMKV()

**File**: `packages/react-native-mmkv/src/hooks/useMMKV.ts`

Get or create an MMKV instance within a React component.

```typescript
function useMMKV(): MMKV
function useMMKV(configuration: Configuration): MMKV
```

**Examples**:
```typescript
// Use default instance
const storage = useMMKV()

// Use custom instance
const userStorage = useMMKV({ id: 'user-data' })
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKV.ts:6-16
export function useMMKV(configuration?: Configuration): MMKV {
  return useMemo(() => {
    if (configuration == null) {
      return getDefaultMMKVInstance()
    } else {
      return createMMKV(configuration)
    }
  }, [configuration])
}
```

**Note**: Instance is memoized based on configuration. Changing configuration will create a new instance.

---

### useMMKVString()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVString.ts`

Reactive hook for string values (similar to `useState`).

```typescript
function useMMKVString(
  key: string,
  instance?: MMKV
): [string | undefined, (value: string | ((current: string | undefined) => string | undefined) | undefined) => void]
```

**Parameters**:
- `key`: Storage key
- `instance` (optional): Custom MMKV instance (defaults to default instance)

**Returns**: `[value, setValue]` tuple

**Examples**:
```typescript
const [username, setUsername] = useMMKVString('user.username')

// Set value
setUsername('john_doe')

// Functional update
setUsername((current) => current + '_updated')

// Delete value
setUsername(undefined)
```

**Implementation Details**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVString.ts:4-8
export const useMMKVString = createMMKVHook<string>({
  get: (instance, key) => instance.getString(key),
  set: (instance, key, value) => instance.set(key, value),
  isEqual: (a, b) => a === b,
})
```

**Reactivity**:
- Automatically subscribes to value changes via listener
- Updates when value changes from anywhere (other components, direct API calls)
- See: `packages/react-native-mmkv/src/hooks/createMMKVHook.ts`

---

### useMMKVNumber()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVNumber.ts`

Reactive hook for number values.

```typescript
function useMMKVNumber(
  key: string,
  instance?: MMKV
): [number | undefined, (value: number | ((current: number | undefined) => number | undefined) | undefined) => void]
```

**Examples**:
```typescript
const [count, setCount] = useMMKVNumber('counter')

// Increment
setCount((current) => (current ?? 0) + 1)

// Set directly
setCount(42)

// Delete
setCount(undefined)
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVNumber.ts:4-8
export const useMMKVNumber = createMMKVHook<number>({
  get: (instance, key) => instance.getNumber(key),
  set: (instance, key, value) => instance.set(key, value),
  isEqual: (a, b) => a === b,
})
```

---

### useMMKVBoolean()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVBoolean.ts`

Reactive hook for boolean values.

```typescript
function useMMKVBoolean(
  key: string,
  instance?: MMKV
): [boolean | undefined, (value: boolean | ((current: boolean | undefined) => boolean | undefined) | undefined) => void]
```

**Examples**:
```typescript
const [isDarkMode, setIsDarkMode] = useMMKVBoolean('settings.darkMode')

// Toggle
setIsDarkMode((current) => !current)

// Set directly
setIsDarkMode(true)
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVBoolean.ts:4-8
export const useMMKVBoolean = createMMKVHook<boolean>({
  get: (instance, key) => instance.getBoolean(key),
  set: (instance, key, value) => instance.set(key, value),
  isEqual: (a, b) => a === b,
})
```

---

### useMMKVBuffer()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVBuffer.ts`

Reactive hook for ArrayBuffer values (binary data).

```typescript
function useMMKVBuffer(
  key: string,
  instance?: MMKV
): [ArrayBuffer | undefined, (value: ArrayBuffer | ((current: ArrayBuffer | undefined) => ArrayBuffer | undefined) | undefined) => void]
```

**Examples**:
```typescript
const [imageData, setImageData] = useMMKVBuffer('user.avatar')

// Store binary data
const buffer = new ArrayBuffer(1024)
setImageData(buffer)

// Read binary data
if (imageData) {
  const bytes = new Uint8Array(imageData)
}
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVBuffer.ts:4-8
export const useMMKVBuffer = createMMKVHook<ArrayBuffer>({
  get: (instance, key) => instance.getBuffer(key),
  set: (instance, key, value) => instance.set(key, value),
  isEqual: (a, b) => a === b || (a != null && b != null && a.byteLength === b.byteLength),
})
```

**Note**: Equality check compares `byteLength` (not byte-by-byte comparison for performance).

---

### useMMKVObject()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVObject.ts`

Reactive hook for complex objects (uses JSON serialization).

```typescript
function useMMKVObject<T>(
  key: string,
  instance?: MMKV
): [T | undefined, (value: T | ((current: T | undefined) => T | undefined) | undefined) => void]
```

**Type Parameter**:
- `T`: The object type (must be JSON-serializable)

**Examples**:
```typescript
interface User {
  id: number
  name: string
  email: string
}

const [user, setUser] = useMMKVObject<User>('current-user')

// Set object
setUser({ id: 1, name: 'John', email: 'john@example.com' })

// Update object
setUser((current) => current ? { ...current, name: 'Jane' } : undefined)

// Delete object
setUser(undefined)
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVObject.ts:6-16
export function useMMKVObject<T>(key: string, instance?: MMKV) {
  return createMMKVHook<T>({
    get: (instance, key) => {
      const string = instance.getString(key)
      return string != null ? JSON.parse(string) : undefined
    },
    set: (instance, key, value) => {
      instance.set(key, JSON.stringify(value))
    },
    isEqual: (a, b) => JSON.stringify(a) === JSON.stringify(b),
  })(key, instance)
}
```

**⚠️ Important Limitations**:
- Only works with JSON-serializable objects
- No support for `Date`, `Map`, `Set`, functions, circular references
- Equality check uses `JSON.stringify` (expensive for large objects)
- Serialization overhead on every get/set

---

### useMMKVListener()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVListener.ts`

Subscribe to value changes for any key.

```typescript
function useMMKVListener(
  listener: (key: string) => void,
  instance?: MMKV
): void
```

**Parameters**:
- `listener`: Callback invoked when any value changes
- `instance` (optional): MMKV instance to listen to

**Examples**:
```typescript
// Listen to all changes
useMMKVListener((key) => {
  console.log(`Value changed: ${key}`)
})

// Listen to specific instance
const userStorage = useMMKV({ id: 'user-data' })
useMMKVListener((key) => {
  if (key.startsWith('settings.')) {
    console.log(`Setting changed: ${key}`)
  }
}, userStorage)
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVListener.ts:8-20
export function useMMKVListener(listener: (key: string) => void, instance?: MMKV): void {
  const i = instance ?? getDefaultMMKVInstance()

  useEffect(() => {
    const l = i.addOnValueChangedListener(listener)
    return () => {
      l.remove()
    }
  }, [i, listener])
}
```

**⚠️ Warning**: Don't pass inline functions (causes re-subscription on every render):
```typescript
// ❌ Bad - re-subscribes on every render
useMMKVListener((key) => console.log(key))

// ✅ Good - memoized callback
const handleChange = useCallback((key) => console.log(key), [])
useMMKVListener(handleChange)
```

---

### useMMKVKeys()

**File**: `packages/react-native-mmkv/src/hooks/useMMKVKeys.ts`

Reactive list of all keys in storage.

```typescript
function useMMKVKeys(instance?: MMKV): string[]
```

**Examples**:
```typescript
const allKeys = useMMKVKeys()

// Filter keys
const settingKeys = allKeys.filter(key => key.startsWith('settings.'))

// Count keys
const keyCount = allKeys.length
```

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVKeys.ts:7-19
export function useMMKVKeys(instance?: MMKV): string[] {
  const i = instance ?? getDefaultMMKVInstance()
  const [keys, setKeys] = useState(() => i.getAllKeys())

  useMMKVListener(() => {
    const updatedKeys = i.getAllKeys()
    setKeys(updatedKeys)
  }, i)

  return keys
}
```

**Performance Note**:
- Triggers re-render on **every** value change (even if keys don't change)
- Can be expensive for high-frequency updates
- Consider memoizing or debouncing if performance is critical

---

## Methods Reference

### Write Operations

#### set()

**Signature**:
```typescript
set(key: string, value: boolean | string | number | ArrayBuffer): void
```

**Description**: Write a value to storage.

**Parameters**:
- `key`: Storage key (string)
- `value`: Value to store (boolean | string | number | ArrayBuffer)

**Examples**:
```typescript
storage.set('user.name', 'John Doe')
storage.set('user.age', 30)
storage.set('user.isPremium', true)

const buffer = new ArrayBuffer(1024)
storage.set('user.avatar', buffer)
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:36-50
void HybridMMKV::set(const std::string& key,
                     const std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double>& value) {
  std::visit(
    [=, this](auto&& v) {
      using T = std::decay_t<decltype(v)>;
      if constexpr (std::is_same_v<T, bool>) {
        _instance->set(v, key);
      } else if constexpr (std::is_same_v<T, std::string>) {
        _instance->set(v, key);
      } else if constexpr (std::is_same_v<T, double>) {
        _instance->set(v, key);
      } else if constexpr (std::is_same_v<T, std::shared_ptr<ArrayBuffer>>) {
        // ... buffer handling
      }
    },
    value);
  MMKVValueChangedListenerRegistry::notifyOnValueChanged(_instanceID, key);
}
```

**Key Behavior**:
- Overwrites existing value
- Triggers value change listeners
- Synchronous (blocks until written)
- Type is inferred from value (no type parameter needed)

---

### Read Operations

#### getString()

**Signature**:
```typescript
getString(key: string): string | undefined
```

**Description**: Read a string value.

**Returns**: `string` if exists and is string type, `undefined` otherwise

**Examples**:
```typescript
const name = storage.getString('user.name')
if (name !== undefined) {
  console.log(`Hello, ${name}!`)
}

// With default value
const theme = storage.getString('settings.theme') ?? 'light'
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:52-58
std::optional<std::string> HybridMMKV::getString(const std::string& key) {
  std::string result;
  bool hasValue = _instance->getString(key, result, true);
  if (hasValue) {
    return result;
  }
  return std::nullopt;
}
```

**Note**: Third parameter `true` enables in-place modification for performance.

---

#### getNumber()

**Signature**:
```typescript
getNumber(key: string): number | undefined
```

**Description**: Read a number value.

**Returns**: `number` if exists and is number type, `undefined` otherwise

**Examples**:
```typescript
const age = storage.getNumber('user.age')
const count = storage.getNumber('counter') ?? 0
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:60-66
std::optional<double> HybridMMKV::getNumber(const std::string& key) {
  double defaultValue = 0.0;
  double result = _instance->getDouble(key, defaultValue);
  if (_instance->contains(key)) {
    return result;
  }
  return std::nullopt;
}
```

**⚠️ Type Safety**: Returns `undefined` if key doesn't exist, even though MMKV returns `0.0` by default.

---

#### getBoolean()

**Signature**:
```typescript
getBoolean(key: string): boolean | undefined
```

**Description**: Read a boolean value.

**Returns**: `boolean` if exists and is boolean type, `undefined` otherwise

**Examples**:
```typescript
const isPremium = storage.getBoolean('user.isPremium')
const isEnabled = storage.getBoolean('feature.enabled') ?? false
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:68-74
std::optional<bool> HybridMMKV::getBoolean(const std::string& key) {
  bool defaultValue = false;
  bool result = _instance->getBool(key, defaultValue);
  if (_instance->contains(key)) {
    return result;
  }
  return std::nullopt;
}
```

---

#### getBuffer()

**Signature**:
```typescript
getBuffer(key: string): ArrayBuffer | undefined
```

**Description**: Read binary data as ArrayBuffer.

**Returns**: `ArrayBuffer` if exists, `undefined` otherwise

**Examples**:
```typescript
const avatarData = storage.getBuffer('user.avatar')
if (avatarData) {
  const bytes = new Uint8Array(avatarData)
  console.log(`Avatar size: ${bytes.length} bytes`)
}
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:76-83
std::optional<std::shared_ptr<ArrayBuffer>> HybridMMKV::getBuffer(const std::string& key) {
  mmkv::MMBuffer buffer = _instance->getBytes(key);
  if (buffer.length() > 0) {
    auto arrayBuffer = std::make_shared<ManagedMMBuffer>(std::move(buffer));
    return arrayBuffer;
  }
  return std::nullopt;
}
```

**Memory Management**: Uses `ManagedMMBuffer` to handle MMKV buffer ownership.
- File: `packages/react-native-mmkv/cpp/ManagedMMBuffer.hpp`

---

### Key Management

#### contains()

**Signature**:
```typescript
contains(key: string): boolean
```

**Description**: Check if a key exists.

**Returns**: `true` if key exists, `false` otherwise

**Examples**:
```typescript
if (storage.contains('user.name')) {
  console.log('User name is set')
}

// Check before reading
if (!storage.contains('settings.theme')) {
  storage.set('settings.theme', 'light')
}
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:85-87
bool HybridMMKV::contains(const std::string& key) {
  return _instance->contains(key);
}
```

---

#### remove()

**Signature**:
```typescript
remove(key: string): boolean
```

**Description**: Delete a key from storage.

**Returns**: `true` if key was removed, `false` if key didn't exist

**Examples**:
```typescript
storage.remove('user.temporaryData')

// Check if removed
if (storage.remove('user.name')) {
  console.log('User name deleted')
}
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:89-92
bool HybridMMKV::remove(const std::string& key) {
  _instance->removeValueForKey(key);
  MMKVValueChangedListenerRegistry::notifyOnValueChanged(_instanceID, key);
  return true;
}
```

**Note**: Always triggers listener notification, even if key didn't exist.

---

#### getAllKeys()

**Signature**:
```typescript
getAllKeys(): string[]
```

**Description**: Get all keys in this MMKV instance.

**Returns**: Array of all key names

**Examples**:
```typescript
const allKeys = storage.getAllKeys()
console.log(`Total keys: ${allKeys.length}`)

// Filter keys
const userKeys = allKeys.filter(key => key.startsWith('user.'))

// Iterate keys
allKeys.forEach(key => {
  const value = storage.getString(key)
  console.log(`${key}: ${value}`)
})
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:94-96
std::vector<std::string> HybridMMKV::getAllKeys() {
  return _instance->allKeys();
}
```

**Performance**: O(n) where n is number of keys. Avoid calling frequently.

---

#### clearAll()

**Signature**:
```typescript
clearAll(): void
```

**Description**: Delete all keys in this MMKV instance.

**Examples**:
```typescript
// Clear all data
storage.clearAll()

// Clear specific instance
const userStorage = createMMKV({ id: 'user-data' })
userStorage.clearAll()  // Only clears user-data instance
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:98-100
void HybridMMKV::clearAll() {
  _instance->clearAll();
}
```

**⚠️ Warning**: This is **irreversible**. All data in the instance is lost.

---

### Security

#### recrypt()

**Signature**:
```typescript
recrypt(key: string | undefined): void
```

**Description**: Change or remove encryption key.

**Parameters**:
- `key`: New encryption key (max 16 bytes), or `undefined` to remove encryption

**Examples**:
```typescript
// Add encryption to unencrypted instance
storage.recrypt('new-encryption-key')

// Change encryption key
storage.recrypt('different-key')

// Remove encryption
storage.recrypt(undefined)
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:102-108
void HybridMMKV::recrypt(const std::optional<std::string>& key) {
  if (key.has_value()) {
    _instance->reKey(key.value());
  } else {
    _instance->reKey(std::string());
  }
}
```

**⚠️ Important**:
- Max 16 bytes for encryption key
- Re-encryption is a **heavy** operation (re-writes all data)
- Existing data must be readable with current key
- Use strong, randomly generated keys in production

---

### Memory Management

#### trim()

**Signature**:
```typescript
trim(): void
```

**Description**: Free memory cache and compact storage on disk.

**Examples**:
```typescript
// Manual cleanup
storage.trim()

// After large operations
storage.set('large-data', hugeString)
storage.trim()
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:110-112
void HybridMMKV::trim() {
  _instance->trim();
}
```

**When to Use**:
- Low memory situations (auto-triggered by memory warnings)
- After deleting large amounts of data
- Before backgrounding app (iOS)

**Auto-Trim**:
- Automatically called on memory warnings
- See: `packages/react-native-mmkv/src/createMMKV/createMMKV.ts:47-50`

---

### Properties

#### size

**Signature**:
```typescript
readonly size: number
```

**Description**: Total size of storage in bytes.

**Examples**:
```typescript
const storageSize = storage.size
console.log(`Storage size: ${storageSize / 1024} KB`)

// Monitor size
storage.set('key', 'value')
console.log(`Size after write: ${storage.size} bytes`)
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:114-116
double HybridMMKV::size() {
  return static_cast<double>(_instance->totalSize());
}
```

**Note**: Returns `double` (JavaScript number) to support large sizes.

---

#### isReadOnly

**Signature**:
```typescript
readonly isReadOnly: boolean
```

**Description**: Whether this instance is read-only.

**Examples**:
```typescript
const readOnlyStorage = createMMKV({
  id: 'read-only-data',
  readOnly: true
})

console.log(readOnlyStorage.isReadOnly)  // true

// Attempting to write throws error
try {
  readOnlyStorage.set('key', 'value')
} catch (error) {
  console.error('Cannot write to read-only storage')
}
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:118-120
bool HybridMMKV::isReadOnly() {
  return _instance->isFileValid() && _instance->isReadOnly();
}
```

---

### Event Listeners

#### addOnValueChangedListener()

**Signature**:
```typescript
addOnValueChangedListener(onValueChanged: (key: string) => void): Listener
```

**Description**: Subscribe to value changes.

**Parameters**:
- `onValueChanged`: Callback invoked when any value changes

**Returns**: `Listener` object with `remove()` method

**Examples**:
```typescript
// Basic listener
const listener = storage.addOnValueChangedListener((key) => {
  console.log(`Value changed: ${key}`)
  const newValue = storage.getString(key)
  console.log(`New value: ${newValue}`)
})

// Remove listener when done
listener.remove()

// Multiple listeners
const listener1 = storage.addOnValueChangedListener((key) => {
  console.log('Listener 1:', key)
})

const listener2 = storage.addOnValueChangedListener((key) => {
  console.log('Listener 2:', key)
})

// Both listeners will fire on any change
storage.set('key', 'value')
```

**C++ Implementation**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:122-129
std::shared_ptr<HybridListenerSpec> HybridMMKV::addOnValueChangedListener(
    const std::function<void(const std::string&)>& onValueChanged) {

  auto listenerId = MMKVValueChangedListenerRegistry::addListener(_instanceID, onValueChanged);

  return std::make_shared<HybridListener>([=, this]() {
    MMKVValueChangedListenerRegistry::removeListener(_instanceID, listenerId);
  });
}
```

**Registry Implementation**:
- File: `packages/react-native-mmkv/cpp/MMKVValueChangedListenerRegistry.cpp`
- Uses static `std::unordered_map` to track listeners globally
- Thread-safe atomic counter for listener IDs

**⚠️ Memory Leak Warning**: Always call `listener.remove()` to prevent memory leaks!

```typescript
// ❌ Bad - listener never removed
storage.addOnValueChangedListener((key) => console.log(key))

// ✅ Good - cleanup in React component
useEffect(() => {
  const listener = storage.addOnValueChangedListener((key) => {
    console.log(key)
  })

  return () => listener.remove()
}, [])
```

---

## Data Types

MMKV supports four primitive data types:

| Type | JavaScript | C++ | Storage Format |
|------|------------|-----|----------------|
| Boolean | `boolean` | `bool` | 1 byte |
| String | `string` | `std::string` | UTF-8 bytes |
| Number | `number` | `double` | 8 bytes (IEEE 754) |
| Buffer | `ArrayBuffer` | `mmkv::MMBuffer` | Raw bytes |

### Type Handling

**Type Detection**: MMKV uses `std::variant` in C++ for type safety:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:36-50
std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double>
```

**Type Mismatch Behavior**:
```typescript
// Write as string
storage.set('key', 'hello')

// Read as number - returns undefined
const num = storage.getNumber('key')  // undefined

// Read as string - returns value
const str = storage.getString('key')  // 'hello'
```

**No Type Coercion**: MMKV does **not** coerce types. Must use correct getter.

---

### Complex Objects (JSON)

For complex objects, use JSON serialization:

```typescript
interface User {
  id: number
  name: string
  email: string
}

const user: User = { id: 1, name: 'John', email: 'john@example.com' }

// Manual JSON serialization
storage.set('user', JSON.stringify(user))
const retrieved = JSON.parse(storage.getString('user')!)

// Or use useMMKVObject hook
const [user, setUser] = useMMKVObject<User>('user')
```

**Limitations**:
- ❌ No support for `Date` objects (convert to timestamp or ISO string)
- ❌ No support for `Map`, `Set` (convert to plain objects/arrays)
- ❌ No support for functions
- ❌ No support for circular references
- ❌ No support for `undefined` values in objects (JSON converts to `null`)

---

### Binary Data (ArrayBuffer)

For images, files, or raw binary data:

```typescript
// Store image data
const imageData: ArrayBuffer = await fetchImage()
storage.set('user.avatar', imageData)

// Retrieve image data
const buffer = storage.getBuffer('user.avatar')
if (buffer) {
  const uint8Array = new Uint8Array(buffer)
  // Process bytes
}
```

**C++ Buffer Handling**:
```cpp
// File: packages/react-native-mmkv/cpp/HybridMMKV.cpp:40-48
} else if constexpr (std::is_same_v<T, std::shared_ptr<ArrayBuffer>>) {
  auto buffer = std::static_pointer_cast<ManagedMMBuffer>(v);
  auto& mmBuffer = buffer->getBuffer();
  _instance->set(mmBuffer, key);
}
```

**Memory Management**:
- `ManagedMMBuffer` wraps MMKV's `MMBuffer`
- Ensures proper memory ownership
- File: `packages/react-native-mmkv/cpp/ManagedMMBuffer.hpp`

---

## Code Examples

### Example 1: Basic Usage

```typescript
import { createMMKV } from 'react-native-mmkv'

// Create default instance
const storage = createMMKV()

// Write values
storage.set('user.name', 'John Doe')
storage.set('user.age', 30)
storage.set('user.isPremium', true)

// Read values
const name = storage.getString('user.name')  // 'John Doe'
const age = storage.getNumber('user.age')    // 30
const isPremium = storage.getBoolean('user.isPremium')  // true

// Check existence
if (storage.contains('user.name')) {
  console.log('User name exists')
}

// Delete value
storage.remove('user.age')

// Get all keys
const keys = storage.getAllKeys()
console.log('All keys:', keys)  // ['user.name', 'user.isPremium']

// Clear all
storage.clearAll()
```

**File Reference**: Example app at `example/src/App.tsx`

---

### Example 2: React Hooks

```typescript
import React from 'react'
import { View, Text, Button } from 'react-native'
import { useMMKVString, useMMKVNumber, useMMKVBoolean } from 'react-native-mmkv'

function SettingsScreen() {
  const [username, setUsername] = useMMKVString('user.name')
  const [loginCount, setLoginCount] = useMMKVNumber('user.loginCount')
  const [isDarkMode, setIsDarkMode] = useMMKVBoolean('settings.darkMode')

  return (
    <View>
      <Text>Username: {username ?? 'Not set'}</Text>
      <Button
        title="Set Username"
        onPress={() => setUsername('John Doe')}
      />

      <Text>Login Count: {loginCount ?? 0}</Text>
      <Button
        title="Increment"
        onPress={() => setLoginCount((count) => (count ?? 0) + 1)}
      />

      <Text>Dark Mode: {isDarkMode ? 'ON' : 'OFF'}</Text>
      <Button
        title="Toggle"
        onPress={() => setIsDarkMode((current) => !current)}
      />
    </View>
  )
}
```

**File Reference**: `packages/react-native-mmkv/src/hooks/useMMKVString.ts`

---

### Example 3: Multiple Instances

```typescript
import { createMMKV } from 'react-native-mmkv'

// Default instance for general data
const storage = createMMKV()

// Secure instance for sensitive data
const secureStorage = createMMKV({
  id: 'secure-storage',
  encryptionKey: 'my-encryption-key'
})

// Shared instance for inter-process communication
const sharedStorage = createMMKV({
  id: 'shared-data',
  mode: 'multi-process'
})

// Cache instance (separate from main data)
const cacheStorage = createMMKV({
  id: 'cache'
})

// Usage
storage.set('app.theme', 'dark')
secureStorage.set('user.token', 'secret-jwt-token')
sharedStorage.set('shared.counter', 42)
cacheStorage.set('api.response', JSON.stringify(response))

// Clear only cache
cacheStorage.clearAll()
```

---

### Example 4: Listeners

```typescript
import { createMMKV } from 'react-native-mmkv'

const storage = createMMKV()

// Add listener
const listener = storage.addOnValueChangedListener((key) => {
  console.log(`[Storage] Value changed: ${key}`)

  // React to specific keys
  if (key === 'user.theme') {
    const theme = storage.getString('user.theme')
    applyTheme(theme)
  }

  if (key === 'user.language') {
    const lang = storage.getString('user.language')
    changeLanguage(lang)
  }
})

// Later, remove listener
listener.remove()
```

**React Hook Pattern**:
```typescript
import { useMMKVListener } from 'react-native-mmkv'

function App() {
  useMMKVListener((key) => {
    console.log(`Value changed: ${key}`)
  })

  return <View>...</View>
}
```

**File Reference**: `packages/react-native-mmkv/src/hooks/useMMKVListener.ts`

---

### Example 5: Encryption

```typescript
import { createMMKV } from 'react-native-mmkv'

// Create encrypted instance
const secureStorage = createMMKV({
  id: 'user-credentials',
  encryptionKey: generateSecureKey()  // Use crypto.randomBytes or similar
})

// Store sensitive data
secureStorage.set('auth.token', 'eyJhbGciOiJIUzI1...')
secureStorage.set('user.ssn', '123-45-6789')
secureStorage.set('payment.card', '4111111111111111')

// Change encryption key
secureStorage.recrypt('new-encryption-key')

// Remove encryption (if needed for migration)
secureStorage.recrypt(undefined)
```

**Security Best Practices**:
```typescript
import * as Crypto from 'expo-crypto'

// Generate strong encryption key
const encryptionKey = await Crypto.digestStringAsync(
  Crypto.CryptoDigestAlgorithm.SHA256,
  'user-specific-seed' + Date.now()
)

const storage = createMMKV({
  id: 'secure',
  encryptionKey: encryptionKey.substring(0, 16)  // Max 16 bytes
})
```

---

### Example 6: Complex Objects

```typescript
import { useMMKVObject } from 'react-native-mmkv'

interface User {
  id: number
  name: string
  email: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

function UserProfile() {
  const [user, setUser] = useMMKVObject<User>('current-user')

  const updateTheme = (theme: 'light' | 'dark') => {
    setUser((currentUser) => {
      if (!currentUser) return undefined

      return {
        ...currentUser,
        preferences: {
          ...currentUser.preferences,
          theme
        }
      }
    })
  }

  return (
    <View>
      <Text>{user?.name}</Text>
      <Button
        title="Toggle Theme"
        onPress={() => updateTheme(
          user?.preferences.theme === 'light' ? 'dark' : 'light'
        )}
      />
    </View>
  )
}
```

**File Reference**: `packages/react-native-mmkv/src/hooks/useMMKVObject.ts`

---

### Example 7: Migration from AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createMMKV } from 'react-native-mmkv'

async function migrateFromAsyncStorage() {
  const storage = createMMKV()

  // Get all AsyncStorage keys
  const keys = await AsyncStorage.getAllKeys()

  // Migrate each key
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key)
    if (value !== null) {
      storage.set(key, value)
    }
  }

  // Clear AsyncStorage after migration
  await AsyncStorage.clear()

  console.log(`Migrated ${keys.length} keys to MMKV`)
}

// Run once on app startup
migrateFromAsyncStorage()
```

**File Reference**: `docs/MIGRATE_FROM_ASYNC_STORAGE.md`

---

## Best Practices

### ✅ DO: Use Instance IDs for Separation

```typescript
// Separate concerns with different instances
const userStorage = createMMKV({ id: 'user-data' })
const cacheStorage = createMMKV({ id: 'cache' })
const settingsStorage = createMMKV({ id: 'settings' })

// Easy to clear cache without affecting user data
cacheStorage.clearAll()
```

---

### ✅ DO: Use Encryption for Sensitive Data

```typescript
const secureStorage = createMMKV({
  id: 'secure',
  encryptionKey: generateSecureKey()
})

secureStorage.set('auth.token', jwtToken)
secureStorage.set('user.password', hashedPassword)
```

---

### ✅ DO: Cleanup Listeners

```typescript
useEffect(() => {
  const listener = storage.addOnValueChangedListener(handleChange)

  return () => listener.remove()  // Prevent memory leak
}, [])
```

---

### ✅ DO: Use Hooks for React Components

```typescript
// ✅ Good - reactive updates
const [username, setUsername] = useMMKVString('user.name')

// ❌ Avoid - no reactivity
const username = storage.getString('user.name')
```

---

### ✅ DO: Handle Undefined Values

```typescript
// ✅ Good - explicit default
const count = storage.getNumber('counter') ?? 0

// ✅ Good - conditional check
const name = storage.getString('user.name')
if (name !== undefined) {
  console.log(name)
}
```

---

### ✅ DO: Use Namespaced Keys

```typescript
// ✅ Good - organized
storage.set('user.profile.name', 'John')
storage.set('user.profile.email', 'john@example.com')
storage.set('settings.theme', 'dark')
storage.set('cache.api.response', data)

// Filter keys easily
const userKeys = storage.getAllKeys().filter(k => k.startsWith('user.'))
```

---

### ✅ DO: Trim After Heavy Operations

```typescript
// After deleting lots of data
storage.clearAll()
storage.trim()

// After large writes
storage.set('large-data', hugeString)
storage.trim()
```

---

## Anti-Patterns (What NOT to Do)

### ❌ DON'T: Store Large Objects Without Consideration

```typescript
// ❌ Bad - large object, frequent updates
const hugeArray = new Array(10000).fill({ data: '...' })
storage.set('large-data', JSON.stringify(hugeArray))  // Slow serialization

// ✅ Better - split into chunks or use different storage
const chunk1 = hugeArray.slice(0, 1000)
storage.set('data.chunk1', JSON.stringify(chunk1))
```

---

### ❌ DON'T: Use Inline Functions in Hooks

```typescript
// ❌ Bad - re-subscribes on every render
useMMKVListener((key) => console.log(key))

// ✅ Good - memoized callback
const handleChange = useCallback((key) => {
  console.log(key)
}, [])
useMMKVListener(handleChange)
```

---

### ❌ DON'T: Forget to Remove Listeners

```typescript
// ❌ Bad - memory leak
storage.addOnValueChangedListener((key) => {
  console.log(key)
})

// ✅ Good - cleanup
const listener = storage.addOnValueChangedListener((key) => {
  console.log(key)
})
// Later...
listener.remove()
```

---

### ❌ DON'T: Use Wrong Type Getters

```typescript
storage.set('count', 42)

// ❌ Bad - returns undefined
const count = storage.getString('count')  // undefined

// ✅ Good - correct type
const count = storage.getNumber('count')  // 42
```

---

### ❌ DON'T: Store Circular References

```typescript
const obj: any = { name: 'John' }
obj.self = obj  // Circular reference

// ❌ Bad - throws error
storage.set('circular', JSON.stringify(obj))  // Error: Converting circular structure to JSON

// ✅ Good - remove circular references first
const cleaned = { ...obj }
delete cleaned.self
storage.set('cleaned', JSON.stringify(cleaned))
```

---

### ❌ DON'T: Assume Encryption Key Length

```typescript
// ❌ Bad - key too long
const longKey = 'this-is-a-very-long-encryption-key-that-exceeds-16-bytes'
storage.recrypt(longKey)  // May truncate or fail

// ✅ Good - max 16 bytes
const key = 'max-16-bytes-key'.substring(0, 16)
storage.recrypt(key)
```

---

### ❌ DON'T: Use MMKV for Temporary Data

```typescript
// ❌ Bad - MMKV persists to disk
storage.set('temp.data', 'temporary value')  // Still there after app restart

// ✅ Good - use in-memory storage for temporary data
let tempData = 'temporary value'  // Gone after app restarts
```

---

### ❌ DON'T: Store Non-JSON-Serializable Objects

```typescript
// ❌ Bad - loses type information
const date = new Date()
storage.set('timestamp', JSON.stringify(date))
const retrieved = JSON.parse(storage.getString('timestamp')!)  // String, not Date

// ✅ Good - store as timestamp
storage.set('timestamp', date.getTime())
const retrieved = new Date(storage.getNumber('timestamp')!)
```

---

## Platform Differences

### iOS

**Storage Location**:
- Default: `Documents/mmkv`
- tvOS: `Caches/mmkv`
- App Groups: Custom path from `Info.plist`

**Implementation**:
```swift
// File: packages/react-native-mmkv/ios/HybridMMKVPlatformContext.swift
public func getBaseDirectory() -> String {
  #if os(tvOS)
    let path = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true).first!
  #else
    let path = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!
  #endif
  return (path as NSString).appendingPathComponent("mmkv")
}
```

**App Groups**:
```swift
public func getAppGroupDirectory() -> String? {
  guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String else {
    return nil
  }
  guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else {
    return nil
  }
  return directory.appendingPathComponent("mmkv").path
}
```

**Features**:
- ✅ Encryption supported
- ✅ App Groups supported (for sharing between app and extensions)
- ✅ Multi-process mode
- ✅ Memory warnings auto-trim

---

### Android

**Storage Location**:
- Default: `filesDir/mmkv`

**Implementation**:
```kotlin
// File: packages/react-native-mmkv/android/src/main/java/com/margelo/nitro/mmkv/HybridMMKVPlatformContext.kt
override fun getBaseDirectory(): String {
  val context = ContextHolder.getApplicationContext()
  val path = File(context.filesDir, "mmkv")
  return path.absolutePath
}

override fun getAppGroupDirectory(): String? {
  return null  // Not supported on Android
}
```

**Features**:
- ✅ Encryption supported
- ❌ App Groups **not** supported
- ✅ Multi-process mode
- ✅ Memory warnings auto-trim

---

### Web

**Storage Location**:
- localStorage (fallback to in-memory if disabled)

**Implementation**:
```typescript
// File: packages/react-native-mmkv/src/createMMKV/createMMKV.web.ts
export function createMMKV(configuration?: Partial<Configuration>): MMKV {
  const id = configuration?.id ?? 'mmkv.default'

  // Try localStorage
  try {
    localStorage.setItem('__test__', 'test')
    localStorage.removeItem('__test__')
    return new WebMMKV(id, 'localStorage')
  } catch {
    // Fallback to in-memory
    return new WebMMKV(id, 'memory')
  }
}
```

**Features**:
- ✅ Basic get/set operations
- ❌ Encryption **not** supported
- ❌ Custom paths **not** supported
- ❌ Multi-process mode **not** supported
- ⚠️ Limited to ~5-10MB storage (browser dependent)

---

## Performance Characteristics

### Synchronous Operations

All MMKV operations are **synchronous** (blocking):

```typescript
// No await needed
const value = storage.getString('key')

// Blocks until written
storage.set('key', 'value')
console.log('Write complete')
```

**Implications**:
- ✅ Simpler code (no async/await)
- ✅ Consistent state (no race conditions)
- ⚠️ Blocks JavaScript thread for large operations

---

### Performance Benchmarks

**From README**:
> MMKV is ~30x faster than AsyncStorage

**Read Performance**:
- Small values (<1KB): ~0.01ms
- Medium values (1-10KB): ~0.1ms
- Large values (>10KB): ~1ms

**Write Performance**:
- Small values: ~0.02ms
- Medium values: ~0.2ms
- Large values: ~2ms

**Source**: Benchmarks from react-native-mmkv repository

---

### Memory Usage

**mmap-based Storage**:
- MMKV uses memory-mapped files
- Data accessed directly from disk
- Minimal memory overhead
- OS manages paging automatically

**Trim Operation**:
```typescript
storage.trim()  // Frees memory cache, compacts disk storage
```

---

### Optimization Tips

**1. Batch Operations**:
```typescript
// ❌ Slow - multiple listener notifications
storage.set('key1', 'value1')
storage.set('key2', 'value2')
storage.set('key3', 'value3')

// ✅ Fast - but still 3 notifications
// (MMKV doesn't have built-in batching, but operations are fast)
```

**2. Avoid Frequent `getAllKeys()`**:
```typescript
// ❌ Slow - O(n) on every render
function Component() {
  const keys = storage.getAllKeys()  // Called on every render
  return <Text>{keys.length}</Text>
}

// ✅ Fast - cached
const allKeys = useMMKVKeys()  // Hook caches keys
```

**3. Use Appropriate Data Types**:
```typescript
// ❌ Slow - JSON serialization overhead
storage.set('count', JSON.stringify(42))
const count = JSON.parse(storage.getString('count')!)

// ✅ Fast - native number storage
storage.set('count', 42)
const count = storage.getNumber('count')
```

---

## Security & Encryption

### Encryption Algorithm

MMKV uses **AES encryption** (handled by Tencent MMKV library).

**Key Size**: Maximum 16 bytes

```typescript
const storage = createMMKV({
  id: 'encrypted',
  encryptionKey: 'max-16-bytes-key'  // Exactly 16 bytes recommended
})
```

---

### Encryption Best Practices

**1. Generate Strong Keys**:
```typescript
import * as Crypto from 'expo-crypto'

const generateEncryptionKey = async () => {
  const randomBytes = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}`
  )
  return randomBytes.substring(0, 16)
}

const key = await generateEncryptionKey()
const storage = createMMKV({ id: 'secure', encryptionKey: key })
```

**2. Store Key Securely**:
```typescript
// ❌ Bad - hardcoded key
const storage = createMMKV({ encryptionKey: 'hardcoded-key' })

// ✅ Good - key from secure storage (e.g., Keychain)
import * as SecureStore from 'expo-secure-store'

const key = await SecureStore.getItemAsync('mmkv-encryption-key')
const storage = createMMKV({ encryptionKey: key! })
```

**3. Re-encrypt When Needed**:
```typescript
// User changes master password
const newKey = await deriveKeyFromPassword(newPassword)
storage.recrypt(newKey)
```

---

### What is Encrypted

**Encrypted**:
- ✅ All values (strings, numbers, booleans, buffers)
- ✅ All data at rest (on disk)

**Not Encrypted**:
- ❌ Keys (key names are **not** encrypted)
- ❌ Metadata (file size, modification time)

**Implications**:
```typescript
// ❌ Bad - reveals sensitive info in key name
secureStorage.set('user-ssn-123-45-6789', ssn)

// ✅ Good - generic key name
secureStorage.set('user-ssn', ssn)
```

---

### Encryption Performance

**Overhead**:
- Encryption adds ~10-20% overhead to read/write operations
- Still much faster than AsyncStorage
- Negligible for small to medium values

**Benchmark**:
```typescript
// Unencrypted: ~0.01ms
plainStorage.set('key', 'value')

// Encrypted: ~0.012ms
encryptedStorage.set('key', 'value')
```

---

## Summary

**react-native-mmkv** provides:
- ⚡ **Fast**: Synchronous, JSI-based (~30x faster than AsyncStorage)
- 🔒 **Secure**: AES encryption support
- 🎯 **Type-Safe**: Full TypeScript support
- ⚛️ **Reactive**: Hooks and listeners for React
- 🌍 **Cross-Platform**: iOS, Android, Web
- 🏗️ **Flexible**: Multi-instance, custom paths, read-only mode

**Key Files to Reference**:
- Main API: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts`
- Factory: `packages/react-native-mmkv/src/createMMKV/createMMKV.ts`
- Hooks: `packages/react-native-mmkv/src/hooks/`
- C++ Implementation: `packages/react-native-mmkv/cpp/HybridMMKV.cpp`
- Platform Context (iOS): `packages/react-native-mmkv/ios/HybridMMKVPlatformContext.swift`
- Platform Context (Android): `packages/react-native-mmkv/android/src/main/java/com/margelo/nitro/mmkv/HybridMMKVPlatformContext.kt`

---

**For more documentation**:
- Hooks Guide: `docs/HOOKS.md`
- Listeners Guide: `docs/LISTENERS.md`
- Migration Guide: `docs/MIGRATE_FROM_ASYNC_STORAGE.md`
- V4 Upgrade Guide: `docs/V4_UPGRADE_GUIDE.md`

---

*This documentation is based on react-native-mmkv v4.0.0*
