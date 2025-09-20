---
id: AppHostProvider
title: AppHostProvider
---

## `AppHostProvider`

Context provider that stores currently open dev tools, persists their ids, and exposes helper methods for opening and closing tools from anywhere in the app.

```tsx
import { AppHostProvider } from '@react-buoy/core';

<AppHostProvider>
  <YourApp />
</AppHostProvider>;
```

**Props**

- `children: React.ReactNode`
  - **Required**
  - The subtree that should gain access to the App Host context.

Internally the provider:

- Maintains `openApps: AppInstance[]` state.
- Persists open app ids to async storage under `@apphost_open_apps` with a 500 ms debounce.
- Restores open apps after mount when `registerApps` supplies matching metadata.
- Listens to hardware back presses to close the topmost app.

## Context Value

Use `useAppHost()` to access the host API.

### `useAppHost()`

```ts
const {
  openApps,
  isAnyOpen,
  open,
  close,
  closeAll,
  registerApps,
} = useAppHost();
```

**Returns**

- `openApps: AppInstance[]`
  - Array of active tool instances in launch order (last item is the top-most modal).
- `isAnyOpen: boolean`
  - `true` when at least one tool is open.
- `open(definition: OpenDefinition): string`
  - Creates or reuses an `AppInstance` and returns its `instanceId`.
- `close(instanceId?: string): void`
  - Removes the specified instance, or the most recent instance when omitted.
- `closeAll(): void`
  - Clears every open tool.
- `registerApps?(apps: InstalledApp[]): void`
  - Provided by the floating menu; registers available tools to support persistence restore.

**OpenDefinition**

```ts
interface OpenDefinition {
  id: string;
  title?: string;
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  launchMode?: 'self-modal' | 'host-modal' | 'inline';
  singleton?: boolean;
}
```

- `singleton` reuses an existing instance if one is already open and moves it to the top.
- `launchMode` chooses how the App Host renders the component:
  - `self-modal` (default) – component receives `visible`/`onClose` props.
  - `host-modal` – App Host wraps component in a stock `Modal`.
  - `inline` – Renders absolutely within the overlay layer.

For structural helpers used internally, see [`resolveOpenAppsState`](../reference/FloatingMenu.md#resolveopenappsstate).
