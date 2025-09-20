---
id: app-host
title: App Host
---

The App Host owns tool lifecycle. It exposes a context with `open`, `close`, and `closeAll`, restores any persisted apps on startup, and routes launch requests into modals or inline overlays depending on each tool's `launchMode`.

## When to Use It

- You need consistent modal behavior across heterogeneous debug tools.
- Tools should remember whether they were open after reloads.
- Multiple entry points (bubble press, keyboard shortcut, deep links) must launch the same UI.

## Architecture Overview

1. **Provider** – `AppHostProvider` wraps the tree, stores `openApps` in state, and persists ids to async storage.
2. **Context API** – `open`, `close`, `closeAll`, and `registerApps` functions let the menu and custom logic drive tool visibility.
3. **Launch Modes** – Tools opt into `self-modal`, `host-modal`, or `inline` rendering.
4. **Singleton Support** – If a tool sets `singleton: true`, repeat launches reuse the same instance id.

## State Flow

[//]: # 'Example'
```tsx
import {
  AppHostProvider,
  useAppHost,
} from '@react-buoy/core';
import { NetworkModal } from '@react-buoy/network';

export function DevtoolsRoot({ children }) {
  return <AppHostProvider>{children}</AppHostProvider>;
}

export function useLaunchNetwork() {
  const { open } = useAppHost();
  return () =>
    open({
      id: 'network',
      title: 'Network Monitor',
      component: NetworkModal,
      launchMode: 'host-modal',
      singleton: true,
    });
}
```
[//]: # 'Example'

Under the hood, each `open` call passes through `resolveOpenAppsState`, which either creates a new `instanceId` or reorders an existing singleton to the top of the stack.

## Persistence Strategy

- Open app ids are stored in async storage (`@apphost_open_apps`).
- On mount, the provider restores those ids once `registerApps` supplies the matching app metadata.
- `registerApps` is called by the floating menu after it receives the `apps` array.
- Persistence writes are debounced (500 ms) to avoid redundant storage churn.

## Handling Hardware Back

When any tool is open, the provider listens for `hardwareBackPress`. Pressing back closes the topmost tool by calling `close()` with no arguments. You can replicate that logic elsewhere (e.g., escape key handlers) by calling `close()` yourself.

## Custom Launch Sources

Use the context anywhere—deep link handler, command palette, or custom debug button.

[//]: # 'Example'
```tsx
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useAppHost } from '@react-buoy/core';
import { ErrorReporterModal } from './ErrorReporterModal';

export function AutoOpenOnBackgroundErrors() {
  const { open } = useAppHost();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && global.__LAST_ERROR__) {
        open({
          id: 'errors',
          title: 'Error Reporter',
          component: ErrorReporterModal,
          launchMode: 'host-modal',
          singleton: true,
        });
      }
    });

    return () => sub.remove();
  }, [open]);

  return null;
}
```
[//]: # 'Example'

## Checklist

- [ ] Wrap your app once with `AppHostProvider`.
- [ ] Pass the same `apps` array to `<FloatingMenu />` so `registerApps` can hydrate persistence.
- [ ] Use `singleton: true` for overlays that should not spawn duplicates.
- [ ] Expose `open`, `close`, or `closeAll` to other systems via custom hooks or services.

For detailed prop descriptions, see the [`AppHostProvider` reference](../reference/AppHostProvider.md).
