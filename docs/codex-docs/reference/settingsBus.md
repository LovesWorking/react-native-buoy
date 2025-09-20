---
id: settingsBus
title: settingsBus
---

## `settingsBus`

Lightweight event emitter used by `DevToolsSettingsModal` and `useDevToolsSettings` to share configuration changes across the app.

```ts
import { settingsBus } from '@react-buoy/core';

const unsubscribe = settingsBus.addListener((settings) => {
  console.log('Settings updated', settings);
});

settingsBus.emit(newSettings);
```

**API**

- `settingsBus.emit(settings: DevToolsSettings): void`
  - Broadcasts the latest settings snapshot to all listeners.
- `settingsBus.addListener(listener: (settings: DevToolsSettings) => void): () => void`
  - Registers a listener and returns an unsubscribe function.

**Notes**

- Internally wraps a `Set` of listeners.
- Catches listener errors to avoid breaking other subscribers.
- Used by `useDevToolsSettings` to keep React state in sync.

Most consumers should prefer `useDevToolsSettings()` unless they need to integrate with non-React code.
