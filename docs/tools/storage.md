---
title: Storage Explorer
id: tools-storage
---

The Storage Explorer tool lets you view and manage AsyncStorage data in your React Native app.

## Installation

```bash
npm install @react-buoy/storage
```

## Features

- View all stored key-value pairs
- Edit values in real-time
- Delete individual keys
- Clear all storage
- Search/filter keys

## Usage

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import "@react-buoy/storage"; // Import to enable storage inspection

function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools environment="local" />
    </>
  );
}
```

## Supported Storage Backends

The tool automatically detects and supports:

- **AsyncStorage** (default)
- **MMKV** (if installed)
- **SecureStore** (Expo)

## Configuration

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import { StorageConfig } from "@react-buoy/storage";

const storageConfig: StorageConfig = {
  // Keys to hide from the inspector (e.g., sensitive data)
  hiddenKeys: ["auth_token", "refresh_token"],

  // Custom storage adapter (if not using AsyncStorage)
  adapter: myCustomAdapter,
};

<FloatingDevTools
  environment="local"
  storageConfig={storageConfig}
/>
```

## StorageConfig Schema

```typescript
interface StorageConfig {
  /** Keys to hide from display */
  hiddenKeys?: string[];

  /** Custom storage adapter */
  adapter?: StorageAdapter;

  /** Enable real-time updates */
  watchChanges?: boolean;
}

interface StorageAdapter {
  getAllKeys(): Promise<string[]>;
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}
```

## Actions

| Action | Description |
|--------|-------------|
| **View** | See current value for any key |
| **Edit** | Modify values directly |
| **Delete** | Remove a single key |
| **Clear All** | Remove all stored data |
| **Refresh** | Reload all keys |
| **Export** | Export all data as JSON |

## JSON Formatting

Values that are valid JSON are automatically formatted for readability:

```json
{
  "user": {
    "id": 123,
    "name": "John Doe"
  }
}
```

## Next Steps

- [FloatingDevTools](../floating-devtools) - Core component reference
- [Custom Tools](../custom-tools) - Build your own tools
