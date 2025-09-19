---
id: settings-modal
title: DevTools Settings Modal
---

The settings modal lets developers toggle which tools appear in the dial or row, enforce slot limits, and persist preferences per device. Behind the scenes it merges defaults with stored values and publishes updates through `settingsBus`.

## Launching the Modal

[//]: # 'Example'
```tsx
import { Button } from 'react-native';
import {
  DevToolsSettingsModal,
  useAppHost,
} from '@monorepo/devtools-floating-menu';

function OpenSettings({ apps }) {
  const { open } = useAppHost();

  return (
    <Button
      title="Customize Dev Tools"
      onPress={() =>
        open({
          id: 'settings',
          title: 'Dev Tools Settings',
          component: DevToolsSettingsModal,
          launchMode: 'host-modal',
          singleton: true,
          props: { availableApps: apps },
        })
      }
    />
  );
}
```
[//]: # 'Example'

`availableApps` ensures defaults stay aligned with the tools you register in the menu.

## Data Model

The modal stores two maps under `@rn_better_dev_tools_settings`:

- `dialTools`: `{ [id]: boolean }` – whether a tool occupies one of the six dial slots.
- `floatingTools`: `{ [id]: boolean; environment: boolean }` – controls the row icons and environment indicator.

When the modal mounts it:

1. Generates defaults from the supplied `availableApps`.
2. Merges persisted values while respecting the `MAX_DIAL_SLOTS` limit.
3. Broadcasts changes through `settingsBus` so `useDevToolsSettings` subscribers update in real time.

## Extending Defaults

Include `availableApps` entries for custom tools so defaults stick.

[//]: # 'Example'
```tsx
const AVAILABLE_APPS = [
  { id: 'env', name: 'Environment', slot: 'both' },
  { id: 'qa-dashboard', name: 'QA Dashboard', slot: 'dial' },
];

<DevToolsSettingsModal
  visible={visible}
  onClose={onClose}
  availableApps={AVAILABLE_APPS}
  initialSettings={{
    dialTools: { 'qa-dashboard': true },
    floatingTools: { environment: true },
  }}
/>
```
[//]: # 'Example'

> IMPORTANT: When you supply `initialSettings`, they still pass through `mergeWithDefaults`, so the dial slot limit and environment flag stay valid.

## Listening for Changes

Call `useDevToolsSettings` in components that need the current configuration.

[//]: # 'Example'
```tsx
import { useDevToolsSettings } from '@monorepo/devtools-floating-menu';

function DialBadge({ id, children }) {
  const { settings } = useDevToolsSettings();
  if (!settings.dialTools[id]) return null;
  return children;
}
```
[//]: # 'Example'

The hook subscribes to `settingsBus` and updates whenever the modal saves.

## Checklist

- [ ] Pass `availableApps` that cover every installed tool.
- [ ] Respect the six-slot dial limit when proposing defaults.
- [ ] Use `singleton: true` on the settings app so it never duplicates.
- [ ] Subscribe with `useDevToolsSettings` anywhere UI depends on configuration.

Reference the [`DevToolsSettingsModal` API](../reference/DevToolsSettingsModal.md) for complete prop documentation.
