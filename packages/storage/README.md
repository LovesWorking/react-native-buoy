# @react-buoy/storage

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fstorage)](https://www.npmjs.com/package/@react-buoy/storage)

Storage browser and monitoring tool for React Native development. Supports both AsyncStorage and MMKV.

## Features

- **Storage Browser**: Browse all AsyncStorage and MMKV keys and values
- **MMKV Support**: Monitor and debug MMKV instances (including encrypted storage)
- **Multiple Storage Types**: Support for AsyncStorage, MMKV, and multiple MMKV instances
- **Live Event Monitoring**: Track all storage operations in real-time
- **Edit & Delete**: Modify or remove storage items directly
- **Add New Items**: Create new storage entries
- **Required Key Validation**: Define and validate required storage keys
- **Type Checking**: Validate storage value types
- **Value Validation**: Check if values match expected patterns
- **Search & Filter**: Search through keys and filter by status
- **Copy Functionality**: Easily copy keys and values
- **Beautiful UI**: Modern, game-themed interface matching other React Buoy tools

## Installation

This package is part of the React Buoy monorepo and is automatically available to other packages and the example app.

For external projects:

```bash
# Required: Core storage package and AsyncStorage
npm install @react-buoy/storage @react-native-async-storage/async-storage

# Optional: MMKV support (recommended for better performance)
npm install react-native-mmkv
```

Or with pnpm/yarn:

```bash
# Required
pnpm add @react-buoy/storage @react-native-async-storage/async-storage

# Optional: MMKV support
pnpm add react-native-mmkv
```

## Quick Start

### Simplest Setup - Just 1 Line!

**Import the preset and add it to your tools array. Done!**

```typescript
import { storageToolPreset } from '@react-buoy/storage';
import { FloatingDevTools } from '@react-buoy/core';

const installedApps = [
  storageToolPreset, // That's it! One line.
  // ...your other tools
];

function App() {
  return (
    <FloatingDevTools
      apps={installedApps}
      environment="local"
      userRole="admin"
    />
  );
}
```

**Done!** The preset automatically:
- ✅ Browses all AsyncStorage keys
- ✅ Monitors storage operations
- ✅ Provides edit/delete/add functionality
- ✅ No configuration required

### Custom Configuration

If you need to validate specific storage keys:

```typescript
import { createStorageTool } from '@react-buoy/storage';

const requiredStorageKeys = [
  {
    key: "@app/session",
    expectedType: "string",
    description: "User session token",
    storageType: "async",
  },
  {
    key: "@app/settings:theme",
    expectedValue: "dark",
    description: "Preferred theme",
    storageType: "async",
  },
];

const myStorageTool = createStorageTool({
  requiredStorageKeys,
  colorPreset: "purple",
  enableSharedModalDimensions: true,
});

const installedApps = [
  myStorageTool,
  // ...other tools
];
```

### Alternative: Manual Setup

If you're not using FloatingDevTools or want more control:

```typescript
import { StorageModalWithTabs } from '@react-buoy/storage';

const requiredStorageKeys = [
  {
    key: "@app/session",
    expectedType: "string",
    description: "User session token",
    storageType: "async",
  },
];

function App() {
  const [showStorage, setShowStorage] = useState(false);

  return (
    <>
      <Button onPress={() => setShowStorage(true)}>
        Open Storage Browser
      </Button>

      <StorageModalWithTabs
        visible={showStorage}
        onClose={() => setShowStorage(false)}
        requiredStorageKeys={requiredStorageKeys}
      />
    </>
  );
}
```

## MMKV Support

React Buoy Storage fully supports [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv), a fast, efficient storage solution for React Native.

### Why MMKV?

- **10x faster** than AsyncStorage
- **Synchronous API** - no async/await needed
- **Encryption support** - built-in AES encryption
- **Multi-process support** - share data between extensions
- **Small bundle size** - ~30KB

### Setup Requirements

**⚠️ IMPORTANT:** Manual registration is **required** for MMKV v4. Auto-detection is not possible due to Metro bundler and ES6 module limitations.

You must call `registerMMKVInstance()` for each MMKV instance you want to monitor in the DevTools.

### Basic MMKV Setup

```typescript
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

// 1. Create your MMKV instance
export const storage = createMMKV({
  id: 'mmkv.default'
});

// 2. Register it with DevTools (required!)
registerMMKVInstance('mmkv.default', storage);
```

**That's it!** Your MMKV instance is now visible in the Storage DevTools.

### Encrypted MMKV Setup

```typescript
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

// Create encrypted instance
export const secureStorage = createMMKV({
  id: 'secure-storage',
  encryptionKey: 'my-encryption-key'
});

// Register with encrypted flag
registerMMKVInstance('secure-storage', secureStorage, {
  encrypted: true
});
```

### Multiple MMKV Instances

You can create and monitor multiple MMKV instances for different purposes:

```typescript
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

// User preferences
export const userPrefs = createMMKV({ id: 'user-prefs' });
registerMMKVInstance('user-prefs', userPrefs);

// API cache
export const apiCache = createMMKV({ id: 'api-cache' });
registerMMKVInstance('api-cache', apiCache);

// Secure auth storage
export const authStorage = createMMKV({
  id: 'auth',
  encryptionKey: process.env.ENCRYPTION_KEY
});
registerMMKVInstance('auth', authStorage, { encrypted: true });
```

### MMKV with FloatingDevTools

Once registered, MMKV instances automatically appear in the Storage Browser:

```typescript
import { FloatingDevTools } from '@react-buoy/core';
import { storageToolPreset } from '@react-buoy/storage';
import './mmkv-setup'; // Import your MMKV setup file

function App() {
  return (
    <FloatingDevTools
      apps={[storageToolPreset]}
      environment="local"
      userRole="admin"
    />
  );
}
```

The Storage Browser will show:
- All your MMKV instances (default, user-prefs, api-cache, auth, etc.)
- All AsyncStorage keys
- Real-time updates when data changes
- Ability to edit, delete, and add keys

### MMKV Registration API

#### `registerMMKVInstance(id, instance, config?)`

Register an MMKV instance with DevTools for monitoring and debugging.

**Parameters:**
- `id` (string) - Unique identifier for this instance (should match the `id` used in `createMMKV`)
- `instance` (MMKV) - The MMKV instance returned from `createMMKV()`
- `config` (optional) - Configuration object
  - `encrypted` (boolean) - Set to `true` if instance uses encryption

**Returns:** `void`

**Example:**
```typescript
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

const storage = createMMKV({ id: 'my-storage' });
registerMMKVInstance('my-storage', storage);
```

#### `unregisterMMKVInstance(id)`

Unregister an MMKV instance from DevTools monitoring. Typically not needed unless you're dynamically creating/destroying instances.

**Parameters:**
- `id` (string) - The instance ID to unregister

**Returns:** `void`

**Example:**
```typescript
import { unregisterMMKVInstance } from '@react-buoy/storage';

unregisterMMKVInstance('my-storage');
```

### Why Manual Registration?

Auto-detection is fundamentally impossible for MMKV v4 due to:

1. **ES6 Module Exports are Sealed** - Cannot monkey-patch `createMMKV` function
2. **Metro Bundler Limitations** - No access to `require.cache` or module interception
3. **Nitro Modules Architecture** - MMKV instances created in native C++ layer

Manual registration is a simple one-line call per instance and provides explicit control over what's monitored.

### MMKV Best Practices

**Recommended structure:**

```typescript
// utils/storage.ts
import { createMMKV } from 'react-native-mmkv';
import { registerMMKVInstance } from '@react-buoy/storage';

export const storage = createMMKV({ id: 'mmkv.default' });
export const secureStorage = createMMKV({
  id: 'secure',
  encryptionKey: 'your-key'
});

if (__DEV__) {
  registerMMKVInstance('mmkv.default', storage);
  registerMMKVInstance('secure', secureStorage, { encrypted: true });
}
```

Then import in your app:

```typescript
import { storage, secureStorage } from './utils/storage';

// Use anywhere in your app
storage.set('user.name', 'John Doe');
secureStorage.set('auth.token', 'secret-token');
```

## API Reference

### Presets

#### `storageToolPreset`

Pre-configured AsyncStorage browser tool ready to use with FloatingDevTools.

**Example:**
```typescript
import { storageToolPreset } from '@react-buoy/storage';

const installedApps = [storageToolPreset];
```

#### `createStorageTool(options?)`

Create a custom AsyncStorage browser tool configuration.

**Options:**
```typescript
{
  /** Tool name (default: "STORAGE") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "green") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  /** Custom tool ID (default: "storage") */
  id?: string;
  /** Array of required storage keys to validate */
  requiredStorageKeys?: RequiredStorageKey[];
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
import { createStorageTool } from '@react-buoy/storage';

const requiredStorageKeys = [
  {
    key: "@app/session",
    expectedType: "string",
    description: "User session token",
    storageType: "async",
  },
];

const myStorageTool = createStorageTool({
  name: "APP STORAGE",
  requiredStorageKeys,
  colorPreset: "cyan",
  enableSharedModalDimensions: true,
});
```

### Components

#### `StorageModalWithTabs`

Main modal component with two tabs: Browser and Events.

**Props:**
```typescript
interface StorageModalWithTabsProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional back button handler */
  onBack?: () => void;
  /** Whether to use shared modal dimensions */
  enableSharedModalDimensions?: boolean;
  /** Array of required storage keys to validate */
  requiredStorageKeys?: RequiredStorageKey[];
}
```

**Example:**
```typescript
<StorageModalWithTabs
  visible={isVisible}
  onClose={handleClose}
  requiredStorageKeys={requiredKeys}
  enableSharedModalDimensions={true}
/>
```

### Types

#### `RequiredStorageKey`

```typescript
interface RequiredStorageKey {
  /** Storage key to validate */
  key: string;
  /** Optional description of the key */
  description?: string;
  /** Expected value type */
  expectedType?: "string" | "number" | "boolean" | "object" | "array";
  /** Expected value */
  expectedValue?: any;
  /** Storage type: "async" for AsyncStorage, "mmkv" for MMKV, "secure" for Secure Storage */
  storageType: "async" | "mmkv" | "secure";
  /** Whether the key is required */
  required?: boolean;
}
```

#### `AsyncStorageEvent`

```typescript
interface AsyncStorageEvent {
  /** Unique event ID */
  id: string;
  /** Event type (set, get, remove, clear, etc.) */
  type: "set" | "get" | "remove" | "clear" | "multiGet" | "multiSet" | "multiRemove";
  /** Storage key(s) involved */
  key?: string | string[];
  /** Value (for set operations) */
  value?: any;
  /** Timestamp of the event */
  timestamp: number;
  /** Whether the operation succeeded */
  success: boolean;
  /** Error message if operation failed */
  error?: string;
}
```

## Use Cases

### Session Management

Monitor and validate user session storage:

```typescript
import { createStorageTool } from '@react-buoy/storage';

const requiredStorageKeys = [
  {
    key: "@app/session:token",
    expectedType: "string",
    description: "JWT auth token",
    storageType: "async",
    required: true,
  },
  {
    key: "@app/session:userId",
    expectedType: "string",
    description: "Current user ID",
    storageType: "async",
    required: true,
  },
];

const storageTool = createStorageTool({ requiredStorageKeys });
```

### App Settings

Validate app configuration storage:

```typescript
const requiredStorageKeys = [
  {
    key: "@app/settings:theme",
    expectedValue: "dark",
    description: "UI theme preference",
    storageType: "async",
  },
  {
    key: "@app/settings:notifications",
    expectedType: "boolean",
    description: "Notifications enabled",
    storageType: "async",
  },
  {
    key: "@app/settings:language",
    expectedType: "string",
    description: "User language preference",
    storageType: "async",
  },
];
```

### Cache Management

Monitor cached data:

```typescript
const requiredStorageKeys = [
  {
    key: "@app/cache:userData",
    expectedType: "object",
    description: "Cached user profile data",
    storageType: "async",
  },
  {
    key: "@app/cache:timestamp",
    expectedType: "number",
    description: "Cache timestamp",
    storageType: "async",
  },
];
```

## Features in Detail

### Browser Tab

- **View All Keys**: See all AsyncStorage keys and their values
- **Search**: Search through keys by name
- **Filter**: Filter by validation status (all, missing, issues)
- **Edit**: Modify existing values directly
- **Delete**: Remove storage entries
- **Add**: Create new storage entries
- **Copy**: Copy keys and values to clipboard
- **Validation**: See which required keys are missing or invalid

### Events Tab

- **Live Monitoring**: Watch all storage operations in real-time
- **Event Types**: Track set, get, remove, clear, and multi-operations
- **Filtering**: Filter events by type or key
- **Search**: Search through event history
- **Timeline**: See chronological order of operations
- **Pause/Resume**: Control event capture
- **Clear**: Clear event history

### Validation

Required storage keys can be validated for:
- **Existence**: Check if the key exists
- **Type**: Validate the value type (string, number, boolean, object, array)
- **Value**: Check if the value matches an expected value
- **Custom Validation**: Implement custom validation logic

## Dependencies

- `@react-buoy/shared-ui` - Common UI components and utilities
- `@react-native-async-storage/async-storage` - AsyncStorage implementation (peer dependency)
- `react-native-mmkv` - MMKV storage implementation (optional peer dependency)
- React and React Native (peer dependencies)

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Clean Build

```bash
pnpm clean
```

## License

MIT

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/LovesWorking/react-native-buoy/issues).
