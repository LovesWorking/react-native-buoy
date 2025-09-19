---
id: state-visibility
title: Managing Visibility State
---

Visibility is shared between the floating menu, your tools, and global app state. This guide explains how to detect when anything is open, coordinate bubble hiding, and stay in sync with the settings modal.

## Track Open Tools

Use `useAppHost` to know whether any tools are active.

[//]: # 'Example'
```tsx
import { useAppHost } from '@monorepo/devtools-floating-menu';

function HideBubbleWhileOpen({ children }) {
  const { isAnyOpen } = useAppHost();
  return children(isAnyOpen);
}
```
[//]: # 'Example'

## Aggregate Modal State

`useDevToolsVisibility` accepts an array or map of boolean flags and returns `true` if any are active. Use it to hide the menu when non-App-Host modals open.

[//]: # 'Example'
```tsx
import { FloatingMenu, useDevToolsVisibility } from '@monorepo/devtools-floating-menu';

const hidden = useDevToolsVisibility({
  env: isEnvOpen,
  network: isNetworkOpen,
  qaDashboard: isQaDashboardOpen,
});

<FloatingMenu apps={apps} hidden={hidden || isAnyOpen} />;
```
[//]: # 'Example'

## Sync With Settings

Whenever the settings modal changes dial or floating visibility, it emits through `settingsBus`. Subscribe with `useDevToolsSettings` and adjust your UI accordingly.

[//]: # 'Example'
```tsx
import { EnvironmentIndicator } from '@monorepo/shared';
import { useDevToolsSettings } from '@monorepo/devtools-floating-menu';

function EnvironmentBadge({ environment }) {
  const { settings } = useDevToolsSettings();
  if (!settings.floatingTools.environment) return null;
  return <EnvironmentIndicator environment={environment} />;
}
```
[//]: # 'Example'

## Provide Escape Hatches

Manual hides should always reset once tools close. Use the `actions` object passed to icons to re-open the bubble.

[//]: # 'Example'
```tsx
import { Button } from 'react-native';

function HideForScreenshot({ actions }) {
  return (
    <Button
      title="Hide for 30s"
      onPress={() => {
        actions.hideFloatingRow?.();
        setTimeout(() => actions.showFloatingRow?.(), 30000);
      }}
    />
  );
}
```
[//]: # 'Example'

## Checklist

- [ ] Combine `isAnyOpen` and `useDevToolsVisibility` for comprehensive hiding logic.
- [ ] Respect settings preferences before rendering badges or buttons.
- [ ] Restore the bubble after temporary hides.
- [ ] Use context helpers instead of custom state whenever possible.

Dig into the implementation details in [`useDevToolsVisibility`](../reference/useDevToolsVisibility.md) and [`settingsBus`](../reference/settingsBus.md).
