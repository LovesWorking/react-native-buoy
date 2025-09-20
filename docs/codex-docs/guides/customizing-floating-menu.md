---
id: customizing-floating-menu
title: Customizing the Floating Menu
---

The floating menu balances visibility with screen real estate. Use these patterns to adjust layout, persistence, and UX so the menu fits your app without losing its launch-anywhere charm.

## Control Visibility

- Pass `hidden` when you want to programmatically hide the bubble (e.g., during onboarding flows).
- Combine `hidden` with `useDevToolsVisibility` so the bubble auto-hides while modals are open.

[//]: # 'Example'
```tsx
import { FloatingMenu, useDevToolsVisibility } from '@react-buoy/core';

export function DevtoolsShell({ apps, modals }) {
  const hidden = useDevToolsVisibility(modals);

  return <FloatingMenu apps={apps} hidden={hidden} userRole="internal" />;
}
```
[//]: # 'Example'

## Position Persistence

Position persistence is enabled by default: the bubble remembers where engineers drag it. If you need a fixed position (such as for kiosk or screenshot builds), fork the `FloatingMenu` component and set `enablePositionPersistence={false}` on `FloatingTools`, or contribute a prop upstream.

## Dial vs Row Slots

- `slot: 'row'` keeps a tool visible in the horizontal bubble.
- `slot: 'dial'` hides it behind the dial until the user expands the menu.
- `slot: 'both'` (default) renders in both contexts.

Set defaults that make sense for your team, then let engineers override them via the settings modal.

## Color and Branding

The menu inherits styling from `gameUIColors` in `@react-buoy/shared-ui`. To customize:

1. Extend the shared theme with your brand palette.
2. Pass custom icon components (SVG, Lottie, React nodes) per tool.
3. Override container styles by wrapping `FloatingMenu` in themed view components.

## Role-Aware Launchers

Provide a `userRole` so the built-in `UserStatus` badge drives the dial.

- `admin` – Highlights elevated access with a bright accent.
- `internal` – Default for QA or support.
- `user` – Hides developer-only affordances.

You can override the badge entirely by supplying your own launcher component through the `FloatingTools` render props (see repo examples).

## Reset Hidden State After Tools Close

The menu auto-shows once all App Host tools close. If you manually hide the bubble, call `showFloatingRow` when you want it to reappear.

[//]: # 'Example'
```tsx
import { Button } from 'react-native';

function CustomTool({ actions }) {
  return (
    <Button
      title="Done"
      onPress={() => {
        actions.closeMenu?.();
        actions.showFloatingRow?.();
      }}
    />
  );
}
```
[//]: # 'Example'

## Checklist

- [ ] Decide which tools belong in the row vs the dial.
- [ ] Wire `useDevToolsVisibility` to auto-hide the bubble around modals.
- [ ] Provide a `userRole` to surface the correct launcher UI.
- [ ] Document any forks you make to tweak persistence or layout.

Head to the [DevTools Settings Modal guide](./settings-modal.md) to let users control these same options from within the app.
