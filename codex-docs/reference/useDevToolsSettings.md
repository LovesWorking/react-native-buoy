---
id: useDevToolsSettings
title: useDevToolsSettings
---

## `useDevToolsSettings`

Hook that exposes the latest settings saved by `DevToolsSettingsModal` and refreshes when the modal broadcasts updates.

```ts
import { useDevToolsSettings } from '@monorepo/devtools-floating-menu';

const { settings, refreshSettings } = useDevToolsSettings();
```

**Returns**

- `settings: DevToolsSettings`
  - Current dial/floating configuration. Defaults mirror the built-in tool list.
- `refreshSettings: () => Promise<void>`
  - Reloads settings from async storage (useful if changes occur outside the modal).

**Behavior**

- Loads settings from `@rn_better_dev_tools_settings` and merges them with defaults.
- Subscribes to [`settingsBus`](./settingsBus.md) to receive push updates.
- Catches and logs errors while still providing baseline defaults.

Use it to conditionally render icons, badges, or counts based on user preferences.
