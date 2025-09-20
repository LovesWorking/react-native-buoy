---
id: FloatingMenu
title: FloatingMenu
---

## `FloatingMenu`

Renders the draggable devtools bubble, tool row, and dial launcher. It registers the provided apps with the App Host so persistence works across reloads.

```tsx
import { FloatingMenu } from '@react-buoy/core';

<FloatingMenu
  apps={apps}
  environment={{ name: 'Staging', color: '#8B5CF6' }}
  userRole="internal"
/>;
```

**Props**

- `apps: InstalledApp[]`
  - **Required**
  - Declarative description of each tool that can be launched.
- `state?: FloatingMenuState`
  - Optional context object forwarded to tool icon renderers.
- `actions?: FloatingMenuActions`
  - Optional callbacks forwarded to tool icon renderers (`closeMenu`, `showFloatingRow`, etc.).
- `hidden?: boolean`
  - Hide the bubble without unmounting it.
- `environment?: { name: string; color?: string }`
  - Controls the optional environment badge when enabled in settings.
- `userRole?: 'admin' | 'internal' | 'user'`
  - Selects the badge used to open the dial.

When mounted, the menu calls `registerApps(apps)` on the App Host so the persistence layer can restore previously open tools.

## `InstalledApp`

```ts
interface InstalledApp {
  id: string;
  name: string;
  icon: React.ReactNode | ((ctx: FloatingMenuRenderCtx) => React.ReactNode);
  slot?: 'row' | 'dial' | 'both';
  color?: string;
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  launchMode?: 'self-modal' | 'host-modal' | 'inline';
  singleton?: boolean;
}
```

- `icon` can be a static node or a function receiving `{ slot, size, state, actions }`.
- `slot`
  - `row` – Only render in the horizontal bubble.
  - `dial` – Only render inside the dial overlay.
  - `both` (default) – Render in both spots.
- `launchMode`
  - `self-modal` (default) – App Host injects `visible`/`onClose` props.
  - `host-modal` – App Host wraps the component in a stock `Modal`.
  - `inline` – Renders in-place in the overlay layer.
- `singleton`
  - Ensures only one instance exists. Repeat `open` calls bring the same instance to the front.

## `FloatingMenuRenderCtx`

```ts
interface FloatingMenuRenderCtx {
  slot: 'row' | 'dial';
  size: number;
  state?: FloatingMenuState;
  actions?: FloatingMenuActions;
}
```

Use this when `icon` is a render function.

## `FloatingMenuActions`

```ts
type FloatingMenuActions = Record<string, (...args: any[]) => void>;
```

Common actions passed by the menu include:

- `closeMenu()` – Closes the dial overlay.
- `hideFloatingRow()` – Temporarily hide the row icons.
- `showFloatingRow()` – Reveal the row icons.

Extend the object to include custom actions your icons need.

## `FloatingMenuState`

Simple dictionary for passing shared state into icon renderers. Use it to surface counts or statuses without reopening tools.

## `resolveOpenAppsState`

The menu relies on `resolveOpenAppsState(current, definition, generateId)` to compute the new open-app list. It ensures singleton tools reuse the same instance id while non-singleton tools append to the stack.

```ts
import { resolveOpenAppsState } from '@react-buoy/core/floatingMenu/AppHostLogic';
```

> IMPORTANT: `resolveOpenAppsState` is currently internal. If you need to customize launch ordering, copy the helper when forking the App Host implementation.

## Related Helpers

- [`useAppHost`](./AppHostProvider.md#useapphost) – Open and close tools programmatically.
- [`DevToolsSettingsModal`](./DevToolsSettingsModal.md) – Let users toggle which apps appear in the menu.
