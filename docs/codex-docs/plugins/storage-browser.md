---
id: storage-browser
title: Storage Browser
---

Inspect async storage keys, watch mutations in real time, and monitor required values with the Storage Browser. It combines a key/value explorer with an event timeline so you can spot regressions quickly.

## Install

```bash
pnpm add @react-buoy/storage @react-native-async-storage/async-storage
```

## Register the Tool

[//]: # 'Example'
```tsx
import { StorageModalWithTabs } from '@react-buoy/storage';
import { StorageStackIcon } from '@react-buoy/shared-ui';

export const STORAGE_TOOL = {
  id: 'storage',
  name: 'Storage',
  icon: <StorageStackIcon size={16} />,
  component: StorageModalWithTabs,
  props: {
    requiredStorageKeys: [
      { key: 'AUTH_TOKEN', description: 'Current session token' },
    ],
  },
  launchMode: 'self-modal',
  singleton: true,
};
```
[//]: # 'Example'

## Tabs

- **Browser** – Grid of keys showing current values, type badges, last update time, and quick actions (copy, delete, inspect).
- **Events** – Real-time stream of AsyncStorage operations grouped by key (“conversation” view) with diff cards and payload formatting.

## Features

- **Monitoring Toggle** – Start/stop listeners; state persists across reloads (`devToolsStorageKeys.storage.isMonitoring()`).
- **Ignored Patterns** – Skip noisy keys (defaults include Redux Persist, devtools caches).
- **Filters** – Filter by operation, key name, or required/optional status.
- **Required Keys** – Pass `requiredStorageKeys` to highlight missing or outdated entries.
- **Persistence** – Remembers active tab, monitoring state, and filters in async storage.

## Usage Tips

- Call `startListening` or rely on the modal to auto-start when opened. Use `stopListening` for production builds if needed.
- Combine with the [Settings Modal](../guides/settings-modal.md) so testers can hide the tool in production.
- Pair with the [App Host guide](../guides/app-host.md) to open the modal from custom triggers when storage anomalies occur.

See [`StorageModalWithTabs`](../reference/StorageModalWithTabs.md) for prop-level reference and helper exports.
