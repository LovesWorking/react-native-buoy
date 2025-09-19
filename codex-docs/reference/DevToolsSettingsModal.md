---
id: DevToolsSettingsModal
title: DevToolsSettingsModal
---

## `DevToolsSettingsModal`

Configuration surface for the floating menu. Lets users toggle dial slots, row icons, and the environment badge while persisting preferences to async storage.

```tsx
import { DevToolsSettingsModal } from '@monorepo/devtools-floating-menu';

<DevToolsSettingsModal
  visible={isOpen}
  onClose={handleClose}
  availableApps={installedApps}
/>;
```

**Props**

- `visible: boolean`
  - **Required**
  - Controls whether the modal renders.
- `onClose: () => void`
  - **Required**
  - Called when the modal requests dismissal.
- `onSettingsChange?: (settings: DevToolsSettings) => void`
  - Invoked whenever the settings map updates.
- `initialSettings?: DevToolsSettings`
  - Preload settings (merged with defaults and dial limits).
- `availableApps?: { id: string; name: string; slot?: 'dial' | 'row' | 'both' }[]`
  - Provide every tool so defaults and copy are accurate.

## `DevToolsSettings`

```ts
interface DevToolsSettings {
  dialTools: Record<string, boolean>;
  floatingTools: Record<string, boolean> & {
    environment: boolean;
  };
}
```

- `dialTools`
  - Keys represent `InstalledApp.id` values.
  - Values indicate whether the tool occupies one of the six dial slots.
- `floatingTools`
  - Keys match `InstalledApp.id` values shown in the row.
  - Always contains the `environment` flag for the badge.

## Persistence

- Loads/saves under `@rn_better_dev_tools_settings` using the `safeGetItem`/`safeSetItem` helpers.
- Dial slots enforce `MAX_DIAL_SLOTS = 6` via `enforceDialLimit`.
- Floating settings sanitize unknown keys but keep defaults for new tools.

## Events

- Merges defaults generated from `availableApps` with stored values.
- Broadcasts settings changes via [`settingsBus`](./settingsBus.md).
- `useDevToolsSettings()` subscribes to the bus and exposes the latest settings snapshot.

## Usage Pattern

1. Pass `availableApps` so generated defaults match your tool list.
2. Register a singleton `InstalledApp` for settings (usually `id: 'settings'`).
3. Listen for changes with `useDevToolsSettings` to update UI (icons, environment badge, etc.).

Related APIs: [`useDevToolsSettings`](./useDevToolsSettings.md) and [`FloatingMenu`](./FloatingMenu.md).
