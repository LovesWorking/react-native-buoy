# MMKV Architecture Deep Dive

> **Source Repository**: `/Users/austinjohnson/Desktop/react native mmkv clone`
>
> **Purpose**: Understanding how react-native-mmkv works internally for building dev tools
>
> **Last Updated**: 2025-01-04

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [High-Level Architecture](#high-level-architecture)
3. [Layer-by-Layer Breakdown](#layer-by-layer-breakdown)
4. [Data Flow Analysis](#data-flow-analysis)
5. [Listener System Architecture](#listener-system-architecture)
6. [Memory Management](#memory-management)
7. [Encryption Implementation](#encryption-implementation)
8. [Platform-Specific Details](#platform-specific-details)
9. [Code Generation (Nitro Modules)](#code-generation-nitro-modules)
10. [Build System](#build-system)
11. [Key Insights for Dev Tools](#key-insights-for-dev-tools)

---

## Executive Summary

### What is MMKV?

**react-native-mmkv** is a React Native library that provides synchronous key-value storage through direct JSI (JavaScript Interface) bindings to the Tencent MMKV C++ library.

**Key Characteristics**:
- **Synchronous**: All operations block until complete (no Promises)
- **Fast**: ~30x faster than AsyncStorage due to JSI and mmap
- **Type-Safe**: TypeScript interfaces + C++ type checking
- **Modern**: Built with Nitro Modules (next-gen TurboModules)

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: React Application Code                             │
│   • import { createMMKV, useMMKVString } from 'react-native-mmkv' │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: TypeScript API Layer                               │
│   • createMMKV() factory function                           │
│   • React Hooks (useMMKVString, useMMKVNumber, etc.)        │
│   • TypeScript type definitions                             │
│   Files: packages/react-native-mmkv/src/                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: JSI Bridge (Nitro Modules)                         │
│   • Direct JavaScript-to-C++ calls (synchronous)            │
│   • Type conversion (JS ↔ C++)                              │
│   • HybridObject protocol                                   │
│   Files: nitrogen/generated/                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: C++ Wrapper Layer (HybridMMKV)                     │
│   • Type handling with std::variant                         │
│   • Listener registry management                            │
│   • ArrayBuffer memory management                           │
│   Files: packages/react-native-mmkv/cpp/                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Tencent MMKV Core (C++)                            │
│   • mmap-based file I/O                                     │
│   • Protocol Buffers serialization                          │
│   • AES encryption                                           │
│   • Memory management                                        │
│   External dependency: MMKVCore (CocoaPods/CMake)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Platform Storage Layer                             │
│   • iOS: Documents/mmkv (mmap files)                        │
│   • Android: filesDir/mmkv (mmap files)                     │
│   • Web: localStorage or in-memory Map                      │
│   Platform APIs: Swift (iOS), Kotlin (Android), JS (Web)    │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

**JSI (JavaScript Interface)**:
- Enables synchronous C++ calls from JavaScript
- No serialization overhead (direct memory access)
- Shared memory between JS and C++
- Introduced in React Native 0.59

**Nitro Modules**:
- Next-generation native modules (successor to TurboModules)
- Auto-generates JSI bindings from TypeScript specs
- Type-safe across JS/C++ boundary
- Better developer experience than manual JSI

**mmap (Memory-Mapped Files)**:
- Files mapped directly into memory
- OS handles paging and caching
- Fast reads/writes (like in-memory operations)
- Automatic persistence to disk

---

## High-Level Architecture

### Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        JavaScript Layer                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────┐          ┌──────────────────┐              │
│  │  createMMKV()   │──────────│  React Hooks     │              │
│  │  Factory        │          │  - useMMKVString │              │
│  └────────┬────────┘          │  - useMMKVNumber │              │
│           │                   │  - useMMKVObject │              │
│           │                   └────────┬─────────┘              │
│           │                            │                          │
│           └────────────┬───────────────┘                          │
│                        │                                          │
│              ┌─────────▼──────────┐                              │
│              │  MMKV Interface    │                              │
│              │  (TypeScript Type) │                              │
│              └─────────┬──────────┘                              │
│                        │                                          │
└────────────────────────┼──────────────────────────────────────────┘
                         │
                    JSI Bridge
                         │
┌────────────────────────▼──────────────────────────────────────────┐
│                         C++ Layer                                 │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              MMKVValueChangedListenerRegistry               │  │
│  │  (Static Global Singleton)                                  │  │
│  │                                                              │  │
│  │  Map<string, Map<uint64_t, Callback>>                       │  │
│  │   ^instanceID  ^listenerID  ^callback                       │  │
│  └────────────────────────────────────────────────────────────┘  │
│                               △                                   │
│                               │ notifyOnValueChanged()            │
│                               │                                   │
│  ┌────────────────────────────┴───────────────────────────────┐  │
│  │              HybridMMKV                                     │  │
│  │  (C++ Wrapper for MMKV Instance)                            │  │
│  │                                                              │  │
│  │  - set(key, variant<bool,string,double,ArrayBuffer>)       │  │
│  │  - getString(key) -> optional<string>                       │  │
│  │  - getNumber(key) -> optional<double>                       │  │
│  │  - addOnValueChangedListener(callback) -> Listener         │  │
│  │                                                              │  │
│  │  Private:                                                    │  │
│  │    mmkv::MMKV* _instance   (pointer to Tencent MMKV)       │  │
│  │    string _instanceID       (for listener registry)         │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                       │
│                           │ delegates to                          │
│                           ▼                                       │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Tencent MMKV Core                              │  │
│  │  (Third-party C++ Library)                                  │  │
│  │                                                              │  │
│  │  - mmkvWithID() -> MMKV*                                    │  │
│  │  - set(value, key)                                          │  │
│  │  - getString(key, &result, inplaceModification)            │  │
│  │  - trim(), clearAll(), reKey()                              │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                           │                                       │
└───────────────────────────┼───────────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────────────┐
│                   Platform Native Layer                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                     │
│  iOS (Swift):                   Android (Kotlin):                 │
│  ┌─────────────────────┐        ┌──────────────────────────┐     │
│  │ HybridMMKVPlatform  │        │ HybridMMKVPlatformContext│     │
│  │ Context             │        │                          │     │
│  │                     │        │  - getBaseDirectory()    │     │
│  │ - getBaseDirectory()│        │    -> filesDir/mmkv      │     │
│  │   -> Documents/mmkv │        │                          │     │
│  │ - getAppGroupDir()  │        │  - getAppGroupDirectory()│     │
│  │   -> AppGroup/mmkv  │        │    -> null               │     │
│  └─────────────────────┘        └──────────────────────────┘     │
│                                                                     │
└───────────────────────────────────────────────────────────────────┘
```

### Data Flow: Set Operation

```
User Code:
  storage.set('user.name', 'John Doe')
              ↓
TypeScript Layer (createMMKV):
  - Validates parameters
  - Calls instance.set()
              ↓
JSI Bridge (Nitro Generated):
  - Converts JS string → C++ std::string
  - Converts JS string value → C++ std::string
  - Calls HybridMMKV::set()
              ↓
C++ Wrapper (HybridMMKV):
  void HybridMMKV::set(key, variant<...> value)
    - Pattern match on variant type
    - For string: _instance->set(stringValue, key)
    - After write: MMKVValueChangedListenerRegistry::notifyOnValueChanged(_instanceID, key)
              ↓
Tencent MMKV Core:
  void MMKV::set(string value, string key)
    - Serializes value using Protocol Buffers
    - Encrypts if encryption key present
    - Writes to mmap file
    - OS handles flushing to disk
              ↓
Listener Notification:
  MMKVValueChangedListenerRegistry::notifyOnValueChanged("mmkv.default", "user.name")
    - Looks up all listeners for instance "mmkv.default"
    - Calls each callback with key "user.name"
              ↓
JavaScript Callbacks:
  - React hooks receive notification
  - useMMKVString re-renders with new value
```

### Data Flow: Get Operation

```
User Code:
  const name = storage.getString('user.name')
              ↓
TypeScript Layer:
  - Calls instance.getString()
              ↓
JSI Bridge:
  - Converts JS string → C++ std::string
  - Calls HybridMMKV::getString()
  - Returns optional<string>
  - Converts C++ optional<string> → JS string | undefined
              ↓
C++ Wrapper:
  optional<string> HybridMMKV::getString(key)
    - Creates result string
    - Calls _instance->getString(key, result, true)
    - If hasValue: return result
    - Else: return nullopt
              ↓
Tencent MMKV Core:
  bool MMKV::getString(key, &result, inplaceModification=true)
    - Reads from mmap file
    - Decrypts if encrypted
    - Deserializes Protocol Buffers
    - Writes to result reference
    - Returns true if key exists
              ↓
Return to JavaScript:
  - C++ std::optional<string> → JS string | undefined
  - User receives value
```

---

## Layer-by-Layer Breakdown

### Layer 6: React Application Code

**What Developers See**:
```typescript
import { createMMKV, useMMKVString } from 'react-native-mmkv'

const storage = createMMKV()

function App() {
  const [username, setUsername] = useMMKVString('user.name')

  return (
    <View>
      <Text>{username}</Text>
      <Button onPress={() => setUsername('John')} />
    </View>
  )
}
```

**Characteristics**:
- Simple, intuitive API
- TypeScript type safety
- React-friendly hooks
- No async/await needed

---

### Layer 5: TypeScript API Layer

**Location**: `packages/react-native-mmkv/src/`

#### createMMKV() Factory

**File**: `packages/react-native-mmkv/src/createMMKV/createMMKV.ts`

**Implementation**:
```typescript
let factory: MMKVFactory | null = null
let platformContext: MMKVPlatformContext | null = null
let baseDirectory: string | null = null
let didAddMemoryWarningListener = false

export function createMMKV(configuration?: Partial<Configuration>): MMKV {
  // Lazy initialization
  if (factory == null) {
    factory = NitroModules.createHybridObject<MMKVFactory>('MMKVFactory')
  }
  if (platformContext == null) {
    platformContext = NitroModules.createHybridObject<MMKVPlatformContext>('MMKVPlatformContext')
  }

  // Initialize MMKV library once
  if (baseDirectory == null) {
    baseDirectory = platformContext.getBaseDirectory()
    factory.initializeMMKV(baseDirectory)
  }

  // Handle iOS App Groups
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

  // Create instance
  const instance = factory.createMMKV({
    id: 'mmkv.default',
    ...configuration,
  })

  // Auto-trim on memory warnings (once)
  if (!didAddMemoryWarningListener) {
    addMemoryWarningListener(() => instance.trim())
    didAddMemoryWarningListener = true
  }

  return instance
}
```

**Key Points**:
1. **Singleton Pattern**: Factory and platform context created once
2. **Lazy Init**: MMKV library initialized on first call
3. **App Groups**: iOS-specific feature for sharing storage
4. **Memory Management**: Auto-trim listener added once

---

#### React Hooks

**Pattern**: All hooks use `createMMKVHook()` factory

**File**: `packages/react-native-mmkv/src/hooks/createMMKVHook.ts`

**Implementation**:
```typescript
type MMKVHookDefinition<T> = {
  get: (instance: MMKV, key: string) => T | undefined
  set: (instance: MMKV, key: string, value: T) => void
  isEqual: (a: T | undefined, b: T | undefined) => boolean
}

export function createMMKVHook<T>(definition: MMKVHookDefinition<T>) {
  return function useMMKVHook(
    key: string,
    instance?: MMKV
  ): [T | undefined, (value: T | ((current: T | undefined) => T | undefined) | undefined) => void] {
    const i = instance ?? getDefaultMMKVInstance()

    // Bump counter to force re-render when value changes
    const [bumpCounter, setBumpCounter] = useState(0)

    // Get current value (recomputed on every bump)
    const value = useMemo(() => {
      return definition.get(i, key)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [i, key, bumpCounter])

    // Setter function
    const setValue = useCallback(
      (v: T | ((current: T | undefined) => T | undefined) | undefined) => {
        // Handle functional updates
        const newValue = typeof v === 'function' ? (v as Function)(definition.get(i, key)) : v

        if (newValue === undefined) {
          // Remove key
          i.remove(key)
        } else {
          // Set value
          definition.set(i, key, newValue)
        }
      },
      [i, key]
    )

    // Listen to value changes
    useEffect(() => {
      const listener = i.addOnValueChangedListener((changedKey) => {
        if (changedKey === key) {
          // Value changed, bump counter to trigger re-render
          setBumpCounter((c) => c + 1)
        }
      })

      return () => listener.remove()
    }, [i, key])

    return [value, setValue]
  }
}
```

**Reactivity Mechanism**:
1. **Bump Counter**: State variable incremented when value changes
2. **useMemo**: Re-computes value when bump counter changes
3. **Listener**: Subscribes to changes, bumps counter when key matches
4. **Cleanup**: Removes listener on unmount

**Example Usage**:
```typescript
// File: packages/react-native-mmkv/src/hooks/useMMKVString.ts
export const useMMKVString = createMMKVHook<string>({
  get: (instance, key) => instance.getString(key),
  set: (instance, key, value) => instance.set(key, value),
  isEqual: (a, b) => a === b,
})
```

---

### Layer 4: JSI Bridge (Nitro Modules)

**What is JSI?**
- JavaScript Interface (introduced in RN 0.59)
- Direct JavaScript-to-C++ bindings
- No JSON serialization (like old React Native bridge)
- Synchronous calls
- Shared memory between JS and C++

**What is Nitro?**
- Code generator for JSI bindings
- Input: TypeScript interface specs
- Output: C++ JSI boilerplate
- Alternative to TurboModules/Codegen

#### Nitro Specs

**File**: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts`

```typescript
import { HybridObject } from 'react-native-nitro-modules'
import type { Listener } from './Listener.nitro'

export interface MMKV extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  set(key: string, value: boolean | string | number | ArrayBuffer): void
  getString(key: string): string | undefined
  getNumber(key: string): number | undefined
  getBoolean(key: string): boolean | undefined
  getBuffer(key: string): ArrayBuffer | undefined
  contains(key: string): boolean
  remove(key: string): boolean
  getAllKeys(): string[]
  clearAll(): void
  recrypt(key: string | undefined): void
  trim(): void
  readonly size: number
  readonly isReadOnly: boolean
  addOnValueChangedListener(onValueChanged: (key: string) => void): Listener
}
```

**Code Generation**:
```bash
# Command: bun run specs
# 1. Compile TypeScript
tsc --noEmit

# 2. Run Nitro code generator
nitrogen

# Output: nitrogen/generated/
```

**Generated Files** (examples):
- `nitrogen/generated/shared/c++/HybridMMKVSpec.hpp` - C++ base class
- `nitrogen/generated/ios/HybridMMKVSpecSwift.cpp` - Swift bridge
- `nitrogen/generated/android/JHybridMMKVSpec.cpp` - JNI bridge

#### Type Conversion

**JSI handles type conversion automatically**:

| JavaScript | C++ |
|------------|-----|
| `string` | `std::string` |
| `number` | `double` |
| `boolean` | `bool` |
| `undefined` | `std::nullopt` |
| `ArrayBuffer` | `std::shared_ptr<ArrayBuffer>` |
| `function` | `std::function` |
| `object` | `std::unordered_map` or custom type |

**Example: `getString()` conversion**:
```cpp
// C++ returns std::optional<std::string>
std::optional<std::string> HybridMMKV::getString(const std::string& key) {
  // ...
  return result;  // or std::nullopt
}

// Nitro-generated code converts to:
// - std::nullopt → JavaScript undefined
// - std::string → JavaScript string
```

---

### Layer 3: C++ Wrapper Layer (HybridMMKV)

**Location**: `packages/react-native-mmkv/cpp/`

#### HybridMMKV Class

**File**: `packages/react-native-mmkv/cpp/HybridMMKV.hpp`

**Header**:
```cpp
#pragma once

#include "HybridMMKVSpec.hpp"
#include "MMKVTypes.hpp"
#include <memory>
#include <string>

namespace margelo::nitro::mmkv {

using namespace facebook;

class HybridMMKV : public HybridMMKVSpec {
public:
  explicit HybridMMKV(mmkv::MMKV* instance, const std::string& instanceID)
      : HybridMMKVSpec(TAG), _instance(instance), _instanceID(instanceID) {}

  // Write operation
  void set(const std::string& key,
           const std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double>& value) override;

  // Read operations
  std::optional<std::string> getString(const std::string& key) override;
  std::optional<double> getNumber(const std::string& key) override;
  std::optional<bool> getBoolean(const std::string& key) override;
  std::optional<std::shared_ptr<ArrayBuffer>> getBuffer(const std::string& key) override;

  // Key management
  bool contains(const std::string& key) override;
  bool remove(const std::string& key) override;
  std::vector<std::string> getAllKeys() override;
  void clearAll() override;

  // Security & memory
  void recrypt(const std::optional<std::string>& key) override;
  void trim() override;
  double size() override;
  bool isReadOnly() override;

  // Listeners
  std::shared_ptr<HybridListenerSpec> addOnValueChangedListener(
      const std::function<void(const std::string&)>& onValueChanged) override;

private:
  mmkv::MMKV* _instance;       // Pointer to Tencent MMKV instance
  std::string _instanceID;     // Instance ID for listener registry

  static constexpr auto TAG = "HybridMMKV";
};

} // namespace margelo::nitro::mmkv
```

**Key Implementation: `set()` with `std::variant`**

**File**: `packages/react-native-mmkv/cpp/HybridMMKV.cpp`

```cpp
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
        auto buffer = std::static_pointer_cast<ManagedMMBuffer>(v);
        auto& mmBuffer = buffer->getBuffer();
        _instance->set(mmBuffer, key);
      }
    },
    value);

  // Notify all listeners
  MMKVValueChangedListenerRegistry::notifyOnValueChanged(_instanceID, key);
}
```

**How It Works**:
1. **`std::variant`**: Union type (can hold bool, string, number, or ArrayBuffer)
2. **`std::visit`**: Pattern matching on variant type
3. **`if constexpr`**: Compile-time type checking
4. **Delegates**: Calls appropriate Tencent MMKV method
5. **Notifies**: Triggers listeners after write

---

#### MMKVValueChangedListenerRegistry

**File**: `packages/react-native-mmkv/cpp/MMKVValueChangedListenerRegistry.hpp`

**Purpose**: Global registry for tracking all value change listeners across all MMKV instances.

**Header**:
```cpp
#pragma once

#include <atomic>
#include <functional>
#include <mutex>
#include <string>
#include <unordered_map>

namespace margelo::nitro::mmkv {

class MMKVValueChangedListenerRegistry {
public:
  using ListenerID = uint64_t;
  using Callback = std::function<void(const std::string& /* key */)>;

  /**
   * Add a listener for the given MMKV instance ID.
   * @returns Unique listener ID
   */
  static ListenerID addListener(const std::string& mmkvInstanceId, const Callback& callback);

  /**
   * Remove a listener by ID.
   */
  static void removeListener(const std::string& mmkvInstanceId, ListenerID listenerId);

  /**
   * Notify all listeners for a specific instance and key.
   */
  static void notifyOnValueChanged(const std::string& mmkvInstanceId, const std::string& key);

private:
  // Map: instanceID → (listenerID → callback)
  static std::unordered_map<std::string, std::unordered_map<ListenerID, Callback>> _listeners;

  // Thread-safe atomic counter for listener IDs
  static std::atomic<ListenerID> _nextListenerID;

  // Mutex for thread-safe access
  static std::mutex _mutex;
};

} // namespace margelo::nitro::mmkv
```

**Implementation**:

**File**: `packages/react-native-mmkv/cpp/MMKVValueChangedListenerRegistry.cpp`

```cpp
#include "MMKVValueChangedListenerRegistry.hpp"

namespace margelo::nitro::mmkv {

// Static member initialization
std::unordered_map<std::string, std::unordered_map<MMKVValueChangedListenerRegistry::ListenerID,
                                                     MMKVValueChangedListenerRegistry::Callback>>
    MMKVValueChangedListenerRegistry::_listeners;

std::atomic<MMKVValueChangedListenerRegistry::ListenerID> MMKVValueChangedListenerRegistry::_nextListenerID{0};

std::mutex MMKVValueChangedListenerRegistry::_mutex;

MMKVValueChangedListenerRegistry::ListenerID
MMKVValueChangedListenerRegistry::addListener(const std::string& mmkvInstanceId, const Callback& callback) {
  std::lock_guard<std::mutex> lock(_mutex);

  // Generate unique listener ID
  ListenerID id = _nextListenerID++;

  // Add to registry
  _listeners[mmkvInstanceId][id] = callback;

  return id;
}

void MMKVValueChangedListenerRegistry::removeListener(const std::string& mmkvInstanceId, ListenerID listenerId) {
  std::lock_guard<std::mutex> lock(_mutex);

  // Find instance listeners
  auto instanceIt = _listeners.find(mmkvInstanceId);
  if (instanceIt != _listeners.end()) {
    // Remove specific listener
    instanceIt->second.erase(listenerId);

    // Clean up empty instance entry
    if (instanceIt->second.empty()) {
      _listeners.erase(instanceIt);
    }
  }
}

void MMKVValueChangedListenerRegistry::notifyOnValueChanged(const std::string& mmkvInstanceId,
                                                             const std::string& key) {
  std::lock_guard<std::mutex> lock(_mutex);

  // Find instance listeners
  auto instanceIt = _listeners.find(mmkvInstanceId);
  if (instanceIt != _listeners.end()) {
    // Call all listeners for this instance
    for (const auto& [listenerId, callback] : instanceIt->second) {
      callback(key);
    }
  }
}

} // namespace margelo::nitro::mmkv
```

**Key Design Decisions**:
1. **Static Singleton**: Single global registry for all instances
2. **Thread-Safe**: Uses mutex for concurrent access
3. **Atomic Counter**: Thread-safe listener ID generation
4. **Per-Instance**: Listeners grouped by instance ID
5. **Cleanup**: Removes empty instance entries

**Data Structure**:
```
_listeners: {
  "mmkv.default": {
    0: (key) => console.log(key),
    1: (key) => updateUI(key),
    2: (key) => syncToServer(key)
  },
  "user-storage": {
    3: (key) => handleUserChange(key)
  }
}

_nextListenerID: 4  (atomic counter)
```

---

#### ManagedMMBuffer

**File**: `packages/react-native-mmkv/cpp/ManagedMMBuffer.hpp`

**Purpose**: Manage ownership of MMKV buffers when passed to JavaScript as ArrayBuffer.

**Implementation**:
```cpp
#pragma once

#include "MMKVTypes.hpp"
#include <NitroModules/ArrayBuffer.hpp>

namespace margelo::nitro::mmkv {

using namespace margelo::nitro;

/**
 * An ArrayBuffer that holds ownership of a MMBuffer.
 */
class ManagedMMBuffer : public ArrayBuffer {
public:
  explicit ManagedMMBuffer(mmkv::MMBuffer&& buffer) : _buffer(std::move(buffer)) {
    // MMBuffer ownership transferred to ManagedMMBuffer
  }

  uint8_t* data() override {
    return static_cast<uint8_t*>(_buffer.getPtr());
  }

  size_t size() override {
    return _buffer.length();
  }

  mmkv::MMBuffer& getBuffer() {
    return _buffer;
  }

private:
  mmkv::MMBuffer _buffer;  // Owned buffer
};

} // namespace margelo::nitro::mmkv
```

**Why Needed?**:
- MMKV returns `MMBuffer` (custom buffer type)
- JavaScript expects `ArrayBuffer`
- Must transfer ownership to prevent use-after-free
- `ManagedMMBuffer` bridges the two

**Usage**:
```cpp
// In HybridMMKV::getBuffer()
std::optional<std::shared_ptr<ArrayBuffer>> HybridMMKV::getBuffer(const std::string& key) {
  mmkv::MMBuffer buffer = _instance->getBytes(key);
  if (buffer.length() > 0) {
    // Wrap MMBuffer in ManagedMMBuffer (transfers ownership)
    auto arrayBuffer = std::make_shared<ManagedMMBuffer>(std::move(buffer));
    return arrayBuffer;
  }
  return std::nullopt;
}
```

---

### Layer 2: Tencent MMKV Core (C++)

**External Dependency**: This is the actual MMKV library from Tencent.

**iOS**: CocoaPods dependency `MMKVCore` (~2.2.4)
**Android**: CMake includes MMKV C++ sources

**Key Methods** (from Tencent MMKV):
```cpp
namespace mmkv {

class MMKV {
public:
  // Instance creation
  static MMKV* mmkvWithID(const std::string& mmapID,
                          MMKVMode mode = MMKV_SINGLE_PROCESS,
                          const std::string* cryptKey = nullptr,
                          const std::string* rootPath = nullptr);

  // Write operations
  bool set(bool value, const std::string& key);
  bool set(int32_t value, const std::string& key);
  bool set(int64_t value, const std::string& key);
  bool set(float value, const std::string& key);
  bool set(double value, const std::string& key);
  bool set(const std::string& value, const std::string& key);
  bool set(const MMBuffer& value, const std::string& key);

  // Read operations
  bool getBool(const std::string& key, bool defaultValue = false);
  int32_t getInt32(const std::string& key, int32_t defaultValue = 0);
  int64_t getInt64(const std::string& key, int64_t defaultValue = 0);
  float getFloat(const std::string& key, float defaultValue = 0.0f);
  double getDouble(const std::string& key, double defaultValue = 0.0);
  bool getString(const std::string& key, std::string& result, bool inplaceModification = false);
  MMBuffer getBytes(const std::string& key);

  // Key management
  bool contains(const std::string& key);
  void removeValueForKey(const std::string& key);
  std::vector<std::string> allKeys();
  void clearAll();

  // Security
  void reKey(const std::string& cryptKey);

  // Memory management
  void trim();
  size_t totalSize();

  // Properties
  bool isFileValid();
  bool isReadOnly();
};

} // namespace mmkv
```

**How It Works**:
1. **mmap (Memory-Mapped Files)**: Files mapped into memory address space
2. **Protocol Buffers**: Efficient binary serialization format
3. **Encryption**: AES encryption for all data
4. **Incremental Write**: Append-only writes for performance
5. **Compaction**: Periodic cleanup to remove deleted keys

**Storage Format** (on disk):
```
/path/to/storage/mmkv.default
├── mmkv.default        # Main data file (mmap)
└── mmkv.default.crc    # CRC checksum file
```

**File Structure**:
```
┌─────────────────────────────────────┐
│ Header (magic number, version, etc)│
├─────────────────────────────────────┤
│ Key-Value Pairs (Protocol Buffers) │
│   - Encrypted if key present        │
│   - Append-only writes              │
│   - Deleted keys marked, not removed│
├─────────────────────────────────────┤
│ Free Space / Padding                │
└─────────────────────────────────────┘
```

---

### Layer 1: Platform Storage Layer

#### iOS Implementation

**File**: `packages/react-native-mmkv/ios/HybridMMKVPlatformContext.swift`

```swift
import Foundation
import NitroModules

class HybridMMKVPlatformContext: HybridMMKVPlatformContextSpec {
  public var hybridContext = margelo.nitro.HybridContext()

  public var memorySize: Int {
    return getSizeOf(self)
  }

  public func getBaseDirectory() -> String {
    #if os(tvOS)
      let path = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true).first!
    #else
      let path = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!
    #endif
    return (path as NSString).appendingPathComponent("mmkv")
  }

  public func getAppGroupDirectory() -> String? {
    // Read from Info.plist
    guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String else {
      return nil
    }

    // Get App Group container
    guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else {
      return nil
    }

    return directory.appendingPathComponent("mmkv").path
  }
}
```

**Storage Paths**:
- **Default**: `/var/mobile/Containers/Data/Application/{UUID}/Documents/mmkv/`
- **tvOS**: `/var/mobile/Containers/Data/Application/{UUID}/Library/Caches/mmkv/`
- **App Group**: `/var/mobile/Containers/Shared/AppGroup/{GROUP_ID}/mmkv/`

**App Groups Setup**:
1. Add `AppGroup` key to Info.plist: `group.com.yourcompany.yourapp`
2. Enable App Groups capability in Xcode
3. MMKV automatically uses App Group directory

---

#### Android Implementation

**File**: `packages/react-native-mmkv/android/src/main/java/com/margelo/nitro/mmkv/HybridMMKVPlatformContext.kt`

```kotlin
package com.margelo.nitro.mmkv

import android.content.Context
import com.margelo.nitro.core.HybridContext
import com.margelo.nitro.mmkv.ContextHolder
import java.io.File

class HybridMMKVPlatformContext: HybridMMKVPlatformContextSpec() {
  override val hybridContext = HybridContext()

  override fun getBaseDirectory(): String {
    val context: Context = ContextHolder.getApplicationContext()
    val path = File(context.filesDir, "mmkv")
    return path.absolutePath
  }

  override fun getAppGroupDirectory(): String? {
    // App Groups not supported on Android
    return null
  }

  override val memorySize: Long
    get() = 0L  // Not implemented
}
```

**Storage Path**:
- **Default**: `/data/data/{package_name}/files/mmkv/`

**No App Groups**: Android doesn't have equivalent feature (use ContentProvider for sharing).

---

## Data Flow Analysis

### Complete Flow: Set Operation

**Step 1: User calls `storage.set('key', 'value')`**

**Location**: JavaScript application code

```typescript
const storage = createMMKV()
storage.set('user.name', 'John Doe')
```

---

**Step 2: TypeScript validates and delegates**

**Location**: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts`

- TypeScript ensures type safety (key is string, value is boolean | string | number | ArrayBuffer)
- Call goes through JSI bridge

---

**Step 3: JSI Bridge converts types**

**Location**: Nitro-generated code in `nitrogen/generated/`

**Type Conversion**:
```cpp
// JavaScript → C++
std::string key = jsi::String::createFromAscii(runtime, "user.name").utf8(runtime);
std::string value = jsi::String::createFromAscii(runtime, "John Doe").utf8(runtime);

// Wrap in variant
std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double> variantValue = value;
```

---

**Step 4: HybridMMKV handles type dispatch**

**Location**: `packages/react-native-mmkv/cpp/HybridMMKV.cpp:36-50`

```cpp
void HybridMMKV::set(const std::string& key,
                     const std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double>& value) {
  std::visit(
    [=, this](auto&& v) {
      using T = std::decay_t<decltype(v)>;
      if constexpr (std::is_same_v<T, std::string>) {
        // Value is string, call MMKV::set(string, key)
        _instance->set(v, key);
      }
      // ... other types
    },
    value);

  // Notify listeners
  MMKVValueChangedListenerRegistry::notifyOnValueChanged(_instanceID, key);
}
```

**Pattern Matching**:
- `std::visit` acts like a type switch
- `if constexpr` is compile-time type checking
- Calls appropriate MMKV method

---

**Step 5: Tencent MMKV core writes to storage**

**Location**: MMKVCore library (third-party)

```cpp
bool MMKV::set(const std::string& value, const std::string& key) {
  // 1. Serialize using Protocol Buffers
  MMKVKeyValue keyValue;
  keyValue.set_key(key);
  keyValue.set_string_value(value);

  std::string serialized;
  keyValue.SerializeToString(&serialized);

  // 2. Encrypt if encryption key present
  if (_cryptKey != nullptr) {
    serialized = aes_encrypt(serialized, _cryptKey);
  }

  // 3. Write to mmap file (appends to end)
  size_t offset = _file->append(serialized.data(), serialized.size());

  // 4. Update in-memory index
  _dict[key] = offset;

  // 5. Write CRC checksum
  updateCRC();

  return true;
}
```

**Key Steps**:
1. Serialize with Protocol Buffers
2. Encrypt (if encryption key set)
3. Append to mmap file
4. Update in-memory index
5. Update CRC

---

**Step 6: Listener notification**

**Location**: `packages/react-native-mmkv/cpp/MMKVValueChangedListenerRegistry.cpp`

```cpp
void MMKVValueChangedListenerRegistry::notifyOnValueChanged(const std::string& mmkvInstanceId,
                                                             const std::string& key) {
  std::lock_guard<std::mutex> lock(_mutex);

  auto instanceIt = _listeners.find(mmkvInstanceId);
  if (instanceIt != _listeners.end()) {
    // Call all registered listeners
    for (const auto& [listenerId, callback] : instanceIt->second) {
      callback(key);  // Callback to JavaScript
    }
  }
}
```

---

**Step 7: JavaScript callbacks fire**

**Location**: React hooks (`useMMKVString`, etc.)

```typescript
// Inside useMMKVString hook
useEffect(() => {
  const listener = instance.addOnValueChangedListener((changedKey) => {
    if (changedKey === key) {
      // Bump counter to trigger re-render
      setBumpCounter((c) => c + 1)
    }
  })

  return () => listener.remove()
}, [instance, key])
```

**React re-renders** with new value.

---

### Complete Flow: Get Operation

**Step 1: User calls `storage.getString('key')`**

```typescript
const name = storage.getString('user.name')
```

---

**Step 2: JSI Bridge**

Converts string to C++:
```cpp
std::string key = jsi::String::createFromAscii(runtime, "user.name").utf8(runtime);
```

---

**Step 3: HybridMMKV delegates**

**Location**: `packages/react-native-mmkv/cpp/HybridMMKV.cpp:52-58`

```cpp
std::optional<std::string> HybridMMKV::getString(const std::string& key) {
  std::string result;
  bool hasValue = _instance->getString(key, result, true);  // inplaceModification=true
  if (hasValue) {
    return result;
  }
  return std::nullopt;
}
```

**Note**: `inplaceModification=true` enables MMKV to write directly to `result` string (optimization).

---

**Step 4: Tencent MMKV reads from storage**

```cpp
bool MMKV::getString(const std::string& key, std::string& result, bool inplaceModification) {
  // 1. Check in-memory index
  auto it = _dict.find(key);
  if (it == _dict.end()) {
    return false;  // Key doesn't exist
  }

  // 2. Read from mmap file
  size_t offset = it->second;
  std::string serialized = _file->read(offset);

  // 3. Decrypt if encrypted
  if (_cryptKey != nullptr) {
    serialized = aes_decrypt(serialized, _cryptKey);
  }

  // 4. Deserialize Protocol Buffers
  MMKVKeyValue keyValue;
  keyValue.ParseFromString(serialized);

  // 5. Write to result
  if (inplaceModification) {
    result = std::move(keyValue.string_value());  // Move to avoid copy
  } else {
    result = keyValue.string_value();
  }

  return true;
}
```

---

**Step 5: Return to JavaScript**

```cpp
// C++ returns std::optional<std::string>
// Nitro converts to:
//   - std::nullopt → undefined
//   - std::string → string
```

**JavaScript receives**:
```typescript
const name = storage.getString('user.name')  // 'John Doe' or undefined
```

---

## Listener System Architecture

### Overview

MMKV implements a **push-based** reactive system using value change listeners.

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Code                          │
│                                                               │
│  const listener = storage.addOnValueChangedListener((key) => {│
│    console.log(`Changed: ${key}`)                           │
│  })                                                          │
│                                                               │
│  // Later...                                                 │
│  storage.set('foo', 'bar')  ← Triggers listener             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│           MMKVValueChangedListenerRegistry (C++)            │
│                                                               │
│  _listeners: {                                               │
│    "mmkv.default": {                                         │
│      0: (key) => console.log(key),  ← Listener ID 0         │
│      1: (key) => updateUI(key),     ← Listener ID 1         │
│    }                                                         │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    (on set/remove)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   HybridMMKV::set()                          │
│                                                               │
│  _instance->set(value, key);                                │
│  MMKVValueChangedListenerRegistry::notifyOnValueChanged(    │
│    _instanceID, key                                          │
│  );                                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
                  Calls all callbacks
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 React Hook Listeners                         │
│                                                               │
│  if (changedKey === key) {                                   │
│    setBumpCounter(c => c + 1)  ← Force re-render            │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Listener Lifecycle

**1. Registration**:
```typescript
const listener = storage.addOnValueChangedListener((key) => {
  console.log(`Value changed: ${key}`)
})
```

**C++ side**:
```cpp
std::shared_ptr<HybridListenerSpec> HybridMMKV::addOnValueChangedListener(
    const std::function<void(const std::string&)>& onValueChanged) {

  // Add to global registry
  auto listenerId = MMKVValueChangedListenerRegistry::addListener(_instanceID, onValueChanged);

  // Return listener object with remove() method
  return std::make_shared<HybridListener>([=, this]() {
    MMKVValueChangedListenerRegistry::removeListener(_instanceID, listenerId);
  });
}
```

**2. Notification**:
```typescript
storage.set('key', 'value')  // Triggers listeners
```

**C++ side**:
```cpp
void HybridMMKV::set(...) {
  // ... write value ...

  // Notify all listeners for this instance
  MMKVValueChangedListenerRegistry::notifyOnValueChanged(_instanceID, key);
}
```

**3. Cleanup**:
```typescript
listener.remove()  // Unregister
```

**C++ side**:
```cpp
void MMKVValueChangedListenerRegistry::removeListener(const std::string& mmkvInstanceId,
                                                       ListenerID listenerId) {
  std::lock_guard<std::mutex> lock(_mutex);

  auto instanceIt = _listeners.find(mmkvInstanceId);
  if (instanceIt != _listeners.end()) {
    instanceIt->second.erase(listenerId);

    // Cleanup empty instance
    if (instanceIt->second.empty()) {
      _listeners.erase(instanceIt);
    }
  }
}
```

### React Integration

**Hook Pattern** (from `createMMKVHook`):
```typescript
export function createMMKVHook<T>(definition) {
  return function useMMKVHook(key, instance?) {
    const i = instance ?? getDefaultMMKVInstance()
    const [bumpCounter, setBumpCounter] = useState(0)

    // Re-compute value when bump changes
    const value = useMemo(() => {
      return definition.get(i, key)
    }, [i, key, bumpCounter])

    // Listen to changes
    useEffect(() => {
      const listener = i.addOnValueChangedListener((changedKey) => {
        if (changedKey === key) {
          setBumpCounter((c) => c + 1)  // Trigger re-render
        }
      })

      return () => listener.remove()  // Cleanup
    }, [i, key])

    return [value, setValue]
  }
}
```

**Key Points**:
1. **Bump Counter**: State variable that forces re-render
2. **useMemo**: Re-computes value only when bump counter changes
3. **useEffect**: Registers listener and cleans up on unmount
4. **Key Filtering**: Only bump when specific key changes

---

## Memory Management

### mmap (Memory-Mapped Files)

**What is mmap?**
- System call that maps a file into virtual memory
- File appears as byte array in memory address space
- OS handles paging (loading/unloading pages)
- Reads/writes go through CPU cache (very fast)

**Benefits**:
- ✅ Fast: No explicit read/write calls
- ✅ Efficient: OS manages memory automatically
- ✅ Persistent: Changes flushed to disk by OS
- ✅ Shared: Multiple processes can map same file (multi-process mode)

**How MMKV Uses mmap**:
```cpp
// Tencent MMKV core (simplified)
class MMKV {
  void* _mappedPtr;   // Pointer to mapped memory
  size_t _mappedSize; // Size of mapped region

  void initWithPath(const std::string& path) {
    int fd = open(path.c_str(), O_RDWR | O_CREAT);
    _mappedPtr = mmap(NULL, _mappedSize, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0);
  }

  void set(const std::string& value, const std::string& key) {
    // Write directly to mapped memory
    memcpy(_mappedPtr + offset, data, size);
    // OS flushes to disk automatically
  }
};
```

---

### trim() Operation

**Purpose**: Free memory and compact storage.

**When Called**:
- Manually: `storage.trim()`
- Automatically: On memory warnings (iOS/Android)

**What It Does**:
```cpp
void MMKV::trim() {
  // 1. Flush all pending writes to disk
  msync(_mappedPtr, _mappedSize, MS_SYNC);

  // 2. Unmap memory (frees RAM)
  munmap(_mappedPtr, _mappedSize);

  // 3. Compact file (remove deleted keys)
  compactFile();

  // 4. Re-map file
  _mappedPtr = mmap(...);
}
```

**Compaction**:
- MMKV uses append-only writes
- Deleted keys marked, not removed immediately
- `trim()` rewrites file without deleted keys
- Reduces disk usage

---

### Auto-Trim on Memory Warnings

**File**: `packages/react-native-mmkv/src/createMMKV/createMMKV.ts:47-50`

```typescript
if (!didAddMemoryWarningListener) {
  addMemoryWarningListener(() => instance.trim())
  didAddMemoryWarningListener = true
}
```

**`addMemoryWarningListener`**:

**File**: `packages/react-native-mmkv/src/addMemoryWarningListener/addMemoryWarningListener.ts`

```typescript
import { AppState, Platform } from 'react-native'

export function addMemoryWarningListener(callback: () => void): void {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Listen to app state changes
    const subscription = AppState.addEventListener('memoryWarning', callback)
  }
}
```

**iOS**: System calls `didReceiveMemoryWarning`
**Android**: System calls `onTrimMemory(TRIM_MEMORY_RUNNING_LOW)`

---

### ArrayBuffer Memory Management

**Challenge**: MMKV returns `MMBuffer` (custom type), but JavaScript expects `ArrayBuffer`.

**Solution**: `ManagedMMBuffer` transfers ownership.

**File**: `packages/react-native-mmkv/cpp/ManagedMMBuffer.hpp`

```cpp
class ManagedMMBuffer : public ArrayBuffer {
public:
  explicit ManagedMMBuffer(mmkv::MMBuffer&& buffer) : _buffer(std::move(buffer)) {
    // Takes ownership of buffer (move semantics)
  }

  uint8_t* data() override {
    return static_cast<uint8_t*>(_buffer.getPtr());
  }

  size_t size() override {
    return _buffer.length();
  }

private:
  mmkv::MMBuffer _buffer;  // Owned buffer
};
```

**Why `std::move`?**
- Transfers ownership without copying
- Original `MMBuffer` becomes invalid (cannot be used)
- Prevents double-free or use-after-free

**Usage**:
```cpp
std::optional<std::shared_ptr<ArrayBuffer>> HybridMMKV::getBuffer(const std::string& key) {
  mmkv::MMBuffer buffer = _instance->getBytes(key);
  if (buffer.length() > 0) {
    // Transfer ownership to ManagedMMBuffer
    auto arrayBuffer = std::make_shared<ManagedMMBuffer>(std::move(buffer));
    return arrayBuffer;
  }
  return std::nullopt;
}
```

**JavaScript Side**:
```typescript
const buffer = storage.getBuffer('key')
// buffer is ArrayBuffer, memory managed by C++
// When buffer is garbage collected, ManagedMMBuffer destructor frees memory
```

---

## Encryption Implementation

### AES Encryption

**Algorithm**: AES (Advanced Encryption Standard)
**Mode**: Likely CBC or CTR (not documented in react-native-mmkv, depends on Tencent MMKV)
**Key Size**: Maximum 16 bytes (128-bit)

### Encryption Flow

**Create Encrypted Instance**:
```typescript
const storage = createMMKV({
  id: 'encrypted-storage',
  encryptionKey: 'my-secret-key!!'  // Max 16 bytes
})
```

**C++ Instance Creation**:
```cpp
MMKV* HybridMMKVFactory::createMMKVInstance(const Configuration& config) {
  std::string* cryptKey = nullptr;
  if (config.encryptionKey.has_value()) {
    cryptKey = new std::string(config.encryptionKey.value());
  }

  MMKV* instance = MMKV::mmkvWithID(
    config.id,
    config.mode,
    cryptKey,  // Pass encryption key
    &config.path
  );

  return instance;
}
```

### What Gets Encrypted

**Encrypted**:
- ✅ All values (strings, numbers, booleans, buffers)
- ✅ Data at rest (on disk)

**Not Encrypted**:
- ❌ Keys (key names visible in index)
- ❌ Metadata (file size, modification time)
- ❌ File structure

**Implications**:
```typescript
// ❌ Bad - key reveals sensitive info
storage.set('user-credit-card-4111-1111-1111-1111', cardData)

// ✅ Good - generic key name
storage.set('user-payment-method', cardData)
```

### Re-Encryption

**Change or remove encryption key**:
```typescript
// Add encryption
storage.recrypt('new-key')

// Change key
storage.recrypt('different-key')

// Remove encryption
storage.recrypt(undefined)
```

**C++ Implementation**:
```cpp
void HybridMMKV::recrypt(const std::optional<std::string>& key) {
  if (key.has_value()) {
    _instance->reKey(key.value());
  } else {
    _instance->reKey(std::string());  // Empty string = no encryption
  }
}
```

**How `reKey()` Works** (Tencent MMKV):
1. Read all key-value pairs (decrypt with old key)
2. Write to new file (encrypt with new key)
3. Swap files atomically
4. Delete old file

**⚠️ Performance**: Re-encryption is **expensive** (re-writes all data).

---

## Platform-Specific Details

### iOS

**Language**: Swift (platform context) + C++ (core)

**Storage Path**:
```swift
#if os(tvOS)
  let path = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true).first!
#else
  let path = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true).first!
#endif
return (path as NSString).appendingPathComponent("mmkv")
```

**Paths**:
- **iPhone/iPad**: `Documents/mmkv/`
- **tvOS**: `Caches/mmkv/` (Documents not available on tvOS)

**App Groups**:
```swift
guard let appGroup = Bundle.main.object(forInfoDictionaryKey: "AppGroup") as? String else {
  return nil
}
guard let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) else {
  return nil
}
return directory.appendingPathComponent("mmkv").path
```

**Setup**:
1. Add to Info.plist: `<key>AppGroup</key><string>group.com.yourcompany.yourapp</string>`
2. Enable capability in Xcode
3. MMKV automatically uses shared directory

**Dependency**: CocoaPods `MMKVCore` (~2.2.4)

**Podspec**:
```ruby
# File: packages/react-native-mmkv/NitroMmkv.podspec
Pod::Spec.new do |s|
  # ...
  s.dependency 'MMKVCore', '~> 2.2.4'
  # ...
end
```

---

### Android

**Language**: Kotlin (platform context) + C++ (core)

**Storage Path**:
```kotlin
override fun getBaseDirectory(): String {
  val context: Context = ContextHolder.getApplicationContext()
  val path = File(context.filesDir, "mmkv")
  return path.absolutePath
}
```

**Path**: `/data/data/{package_name}/files/mmkv/`

**No App Groups**: Android doesn't have equivalent. Use ContentProvider for sharing.

**Build**: CMake compiles MMKV C++ sources

**CMakeLists.txt**:
```cmake
# File: packages/react-native-mmkv/android/CMakeLists.txt
cmake_minimum_required(VERSION 3.9.0)
project(NitroMmkv)

# Include MMKV sources
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../cpp/mmkv-core)

# Build native library
add_library(NitroMmkv SHARED
  src/main/cpp/cpp-adapter.cpp
  ../cpp/HybridMMKV.cpp
  ../cpp/HybridMMKVFactory.cpp
  ../cpp/MMKVValueChangedListenerRegistry.cpp
)

target_link_libraries(NitroMmkv
  MMKV
  # ...
)
```

---

### Web

**Language**: TypeScript (no native code)

**Implementation**: `packages/react-native-mmkv/src/createMMKV/createMMKV.web.ts`

**Storage Backend**:
1. Try localStorage
2. Fallback to in-memory Map

```typescript
export function createMMKV(configuration?: Partial<Configuration>): MMKV {
  const id = configuration?.id ?? 'mmkv.default'

  try {
    // Test if localStorage is available
    localStorage.setItem('__test__', 'test')
    localStorage.removeItem('__test__')
    return new WebMMKV(id, 'localStorage')
  } catch {
    // localStorage disabled (private browsing, etc.)
    return new WebMMKV(id, 'memory')
  }
}
```

**WebMMKV Class**:
```typescript
class WebMMKV implements MMKV {
  private _id: string
  private _backend: 'localStorage' | 'memory'
  private _memoryStorage: Map<string, any> = new Map()

  set(key: string, value: any): void {
    const prefixedKey = `${this._id}.${key}`
    if (this._backend === 'localStorage') {
      localStorage.setItem(prefixedKey, JSON.stringify(value))
    } else {
      this._memoryStorage.set(prefixedKey, value)
    }
  }

  getString(key: string): string | undefined {
    const prefixedKey = `${this._id}.${key}`
    if (this._backend === 'localStorage') {
      const item = localStorage.getItem(prefixedKey)
      return item ? JSON.parse(item) : undefined
    } else {
      return this._memoryStorage.get(prefixedKey)
    }
  }

  // ... other methods
}
```

**Limitations**:
- ❌ No encryption
- ❌ No custom paths
- ❌ No multi-process mode
- ⚠️ localStorage size limit (~5-10MB)
- ⚠️ JSON serialization overhead (slower)

---

## Code Generation (Nitro Modules)

### What is Nitro?

**Nitro Modules** is a code generator for React Native native modules. It's an alternative to TurboModules/Codegen.

**Input**: TypeScript interface specifications
**Output**: C++, Swift, Kotlin JSI bindings

**Benefits**:
- ✅ Type-safe across JS/C++ boundary
- ✅ Auto-generates boilerplate
- ✅ Better DX than manual JSI
- ✅ Supports complex types (objects, arrays, callbacks)

### Nitro Workflow

**1. Write TypeScript Spec**:

**File**: `packages/react-native-mmkv/src/specs/MMKV.nitro.ts`

```typescript
export interface MMKV extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  set(key: string, value: boolean | string | number | ArrayBuffer): void
  getString(key: string): string | undefined
  // ...
}
```

**2. Run Code Generator**:

```bash
bun run specs
```

**Script** (`package.json`):
```json
{
  "scripts": {
    "specs": "tsc --noEmit && nitrogen"
  }
}
```

**3. Nitro Generates Code**:

**Output**: `nitrogen/generated/`

**Directory Structure**:
```
nitrogen/generated/
├── shared/
│   └── c++/
│       ├── HybridMMKVSpec.hpp          # C++ base class
│       ├── HybridMMKVFactorySpec.hpp
│       ├── Configuration.hpp           # Type definitions
│       ├── Mode.hpp
│       └── Listener.hpp
├── ios/
│   ├── HybridMMKVPlatformContextSpecSwift.cpp  # Swift bridge
│   └── NitroMmkvAutolinking.mm                 # iOS autolinking
└── android/
    ├── JHybridMMKVPlatformContextSpec.cpp      # JNI bridge
    ├── JHybridMMKVPlatformContextSpec.hpp
    └── HybridMMKVPlatformContextSpec.kt        # Kotlin bridge
```

**4. Implement Spec**:

**File**: `packages/react-native-mmkv/cpp/HybridMMKV.hpp`

```cpp
#include "HybridMMKVSpec.hpp"  // Generated base class

class HybridMMKV : public HybridMMKVSpec {
public:
  // Implement all methods from spec
  void set(...) override;
  std::optional<std::string> getString(...) override;
  // ...
};
```

### Generated Base Class

**File**: `nitrogen/generated/shared/c++/HybridMMKVSpec.hpp`

```cpp
namespace margelo::nitro::mmkv {

class HybridMMKVSpec : public virtual HybridObject {
public:
  // Pure virtual methods (must be implemented)
  virtual void set(const std::string& key,
                   const std::variant<bool, std::shared_ptr<ArrayBuffer>, std::string, double>& value) = 0;
  virtual std::optional<std::string> getString(const std::string& key) = 0;
  virtual std::optional<double> getNumber(const std::string& key) = 0;
  // ...

  // JSI integration (auto-generated)
  static jsi::Object createJSIObject(jsi::Runtime& runtime, std::shared_ptr<HybridMMKVSpec> instance);
  // ...
};

} // namespace
```

### Nitro Configuration

**File**: `packages/react-native-mmkv/nitro.json`

```json
{
  "cxxNamespace": ["margelo", "nitro", "mmkv"],
  "autolinking": {
    "ios": {
      "NitroMmkv": "NitroMmkvOnLoad"
    },
    "android": {
      "NitroMmkv": "margelo::nitro::mmkv::NitroMmkvOnLoad"
    }
  }
}
```

**Fields**:
- `cxxNamespace`: C++ namespace for generated code
- `autolinking`: Registration functions for iOS/Android

---

## Build System

### iOS Build

**1. CocoaPods**:

**Podspec**: `packages/react-native-mmkv/NitroMmkv.podspec`

```ruby
Pod::Spec.new do |s|
  s.name         = "NitroMmkv"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => "13.0", :tvos => "13.0" }
  s.source       = { :git => package["repository"]["url"], :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{swift,h,m,mm}",
    "cpp/**/*.{hpp,cpp}",
    "nitrogen/generated/**/*.{hpp,cpp,mm}"
  ]

  # Dependencies
  s.dependency "MMKVCore", "~> 2.2.4"  # Tencent MMKV
  s.dependency "NitroModules"
  s.dependency "React-Core"

  # Swift support
  s.swift_version = "5.9"
end
```

**2. Xcode Build**:
- Compiles Swift files (`ios/`)
- Compiles C++ files (`cpp/`)
- Compiles Nitro-generated code (`nitrogen/generated/`)
- Links MMKVCore framework

---

### Android Build

**1. Gradle**:

**build.gradle**: `packages/react-native-mmkv/android/build.gradle`

```gradle
android {
  compileSdkVersion 34
  ndkVersion "26.1.10909125"

  defaultConfig {
    minSdkVersion 24
    targetSdkVersion 34

    externalNativeBuild {
      cmake {
        cppFlags "-std=c++20 -fexceptions -frtti"
        arguments "-DANDROID_STL=c++_shared"
      }
    }
  }

  externalNativeBuild {
    cmake {
      path "CMakeLists.txt"
    }
  }
}

dependencies {
  implementation 'com.facebook.react:react-native:+'
  implementation project(':react-native-nitro-modules')
}
```

**2. CMake**:

**CMakeLists.txt**: `packages/react-native-mmkv/android/CMakeLists.txt`

```cmake
cmake_minimum_required(VERSION 3.9.0)
project(NitroMmkv)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Include MMKV core
add_subdirectory(${CMAKE_CURRENT_SOURCE_DIR}/../cpp/mmkv-core)

# Build native library
add_library(NitroMmkv SHARED
  src/main/cpp/cpp-adapter.cpp
  ../cpp/HybridMMKV.cpp
  ../cpp/HybridMMKVFactory.cpp
  ../cpp/MMKVValueChangedListenerRegistry.cpp
  ../nitrogen/generated/shared/c++/HybridMMKVSpec.cpp
  ../nitrogen/generated/android/JHybridMMKVPlatformContextSpec.cpp
)

target_include_directories(NitroMmkv PRIVATE
  ../cpp
  ../nitrogen/generated/shared/c++
  ../nitrogen/generated/android
)

target_link_libraries(NitroMmkv
  MMKV
  log
  android
)
```

**3. JNI Adapter**:

**File**: `packages/react-native-mmkv/android/src/main/cpp/cpp-adapter.cpp`

```cpp
#include <jni.h>
#include "HybridMMKVFactory.hpp"

extern "C" JNIEXPORT void JNICALL
Java_com_margelo_nitro_mmkv_NitroMmkvPackage_initialize(JNIEnv* env, jobject thiz) {
  // Register Nitro modules
  margelo::nitro::mmkv::NitroMmkvOnLoad();
}
```

---

## Key Insights for Dev Tools

### How to Monitor MMKV

Based on this architecture analysis, here are the **key interception points** for building dev tools:

#### 1. **Listener-Based Monitoring** (Recommended)

**Approach**: Use MMKV's built-in listener system.

**Pros**:
- ✅ Official API (no swizzling)
- ✅ Works across all instances
- ✅ Efficient (push-based)
- ✅ Type-safe

**Implementation**:
```typescript
// Dev tools setup
const devTools = createMMKV({ id: 'dev-tools-storage' })

// Monitor default instance
const defaultStorage = createMMKV()
defaultStorage.addOnValueChangedListener((key) => {
  const value = defaultStorage.getString(key)
  const timestamp = Date.now()

  // Log to dev tools storage
  devTools.set(`log.${timestamp}`, JSON.stringify({
    instance: 'mmkv.default',
    key,
    value,
    timestamp,
    operation: 'set'
  }))

  // Or send to UI
  DevToolsUI.logStorageEvent({ instance: 'mmkv.default', key, value })
})
```

**Limitations**:
- ❌ Only notifies on **changes** (not reads)
- ❌ Requires listener per instance
- ❌ No type information (don't know if string, number, etc.)

---

#### 2. **Method Swizzling** (More Invasive)

**Approach**: Wrap MMKV methods to intercept all operations.

**Pros**:
- ✅ Captures reads **and** writes
- ✅ Can track operation type (get vs set)
- ✅ Can measure performance
- ✅ Single interception point

**Cons**:
- ❌ Requires modifying createMMKV
- ❌ Breaks if MMKV API changes
- ❌ More complex to maintain

**Implementation**:
```typescript
// Wrap createMMKV
const originalCreateMMKV = createMMKV

export function createMMKV(config?) {
  const instance = originalCreateMMKV(config)

  // Wrap methods
  const originalSet = instance.set.bind(instance)
  const originalGetString = instance.getString.bind(instance)

  instance.set = (key, value) => {
    // Log to dev tools
    DevTools.logOperation({
      instance: config?.id ?? 'mmkv.default',
      operation: 'set',
      key,
      value,
      timestamp: Date.now()
    })

    // Call original
    return originalSet(key, value)
  }

  instance.getString = (key) => {
    const value = originalGetString(key)

    // Log read
    DevTools.logOperation({
      instance: config?.id ?? 'mmkv.default',
      operation: 'getString',
      key,
      value,
      timestamp: Date.now()
    })

    return value
  }

  // Wrap other methods...

  return instance
}
```

---

#### 3. **Hybrid Approach** (Best of Both)

**Approach**: Listeners for writes, swizzling for reads.

```typescript
export function monitorMMKVInstance(instance: MMKV, instanceId: string) {
  // 1. Use listeners for writes
  instance.addOnValueChangedListener((key) => {
    DevTools.logWrite({
      instance: instanceId,
      key,
      timestamp: Date.now()
    })
  })

  // 2. Wrap getters for reads
  const originalGetString = instance.getString.bind(instance)
  instance.getString = (key) => {
    const value = originalGetString(key)
    DevTools.logRead({
      instance: instanceId,
      key,
      value,
      type: 'string',
      timestamp: Date.now()
    })
    return value
  }

  // Wrap other getters...
}
```

---

### What to Capture

For comprehensive dev tools, capture:

**1. Operation Metadata**:
- Instance ID
- Operation type (set, getString, remove, clearAll)
- Key name
- Timestamp
- Stack trace (optional, for debugging)

**2. Value Information**:
- Value (or truncated if large)
- Type (string, number, boolean, buffer)
- Size (bytes)

**3. Performance**:
- Operation duration
- Storage size before/after

**4. Instance Info**:
- All active instances
- Instance configuration (encrypted, read-only, etc.)
- Total size per instance

---

### Storage Format for Dev Tools

**Separate MMKV Instance**:
```typescript
const devTools = createMMKV({ id: 'dev-tools' })

// Log format
interface StorageLog {
  id: string
  instance: string
  operation: 'set' | 'getString' | 'remove' | 'clearAll'
  key?: string
  value?: any
  type?: 'string' | 'number' | 'boolean' | 'buffer'
  timestamp: number
  duration?: number
}

// Store logs
devTools.set(`log.${Date.now()}`, JSON.stringify(log))

// Retrieve logs
const allKeys = devTools.getAllKeys().filter(k => k.startsWith('log.'))
const logs = allKeys.map(k => JSON.parse(devTools.getString(k)!))
```

---

### UI Considerations

**Display**:
- List of all MMKV instances
- Real-time log of operations
- Storage size per instance
- Key-value browser
- Search/filter by key or value

**Actions**:
- Clear instance
- Export data
- Import data
- Toggle monitoring per instance

---

## Summary

This architecture deep dive covered:

1. **6-layer architecture** from React app to file system
2. **JSI bridge** for synchronous JavaScript-to-C++ calls
3. **Nitro Modules** for code generation
4. **Listener system** for reactivity
5. **mmap** for fast file I/O
6. **Encryption** with AES
7. **Platform differences** (iOS, Android, Web)
8. **Build system** (CocoaPods, Gradle, CMake)
9. **Dev tools strategies** (listeners, swizzling, hybrid)

**Key Takeaway for Dev Tools**:
Use **MMKV's listener API** as the primary monitoring mechanism, optionally supplemented with method swizzling for read operations.

---

*Next Steps*: See `MMKV_INTERCEPTION_GUIDE.md` for practical implementation of dev tools integration.
