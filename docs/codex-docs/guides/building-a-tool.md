---
id: building-a-tool
title: Building a Tool
---

Every tool is just a React component plus an `InstalledApp` descriptor. This guide walks through composing a new QA dashboard and registering it with the floating menu.

## Tool Blueprint

A tool needs:

- A stable `id` string (used for persistence and settings).
- A `component` that renders the UI. For `self-modal` tools, accept `visible`/`onClose` props.
- Optional `props` passed during launch.
- Launch metadata: `slot`, `launchMode`, and `singleton`.

## Step 1 – Build the Component

[//]: # 'Example'
```tsx
import React from 'react';
import { View, Text, Button } from 'react-native';

interface QaDashboardProps {
  visible: boolean;
  onClose: () => void;
  releaseChannel: string;
}

export function QaDashboard({ visible, onClose, releaseChannel }: QaDashboardProps) {
  if (!visible) return null;

  return (
    <View style={{ flex: 1, padding: 24 }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>QA Dashboard</Text>
      <Text>Release channel: {releaseChannel}</Text>
      <Button title="Close" onPress={onClose} />
    </View>
  );
}
```
[//]: # 'Example'

> IMPORTANT: In `self-modal` mode the App Host injects `visible` and `onClose`. If you pick `host-modal`, render the component normally and handle dismissal yourself.

## Step 2 – Register the App

[//]: # 'Example'
```tsx
import { FloatingMenu } from '@react-buoy/core';
import { ClipboardIcon } from '@react-buoy/shared-ui';
import { QaDashboard } from './QaDashboard';

const INSTALLED_APPS = [
  // ...default tools
  {
    id: 'qa-dashboard',
    name: 'QA Dashboard',
    icon: <ClipboardIcon size={16} />, // any React node
    component: QaDashboard,
    props: { releaseChannel: 'staging' },
    slot: 'dial',
    launchMode: 'self-modal',
    singleton: true,
  },
];

<FloatingMenu apps={INSTALLED_APPS} />;
```
[//]: # 'Example'

## Step 3 – Add Settings Support

So testers can hide the tool or move it to the row, feed it into the settings modal.

[//]: # 'Example'
```tsx
import {
  DevToolsSettingsModal,
  useDevToolsSettings,
} from '@react-buoy/core';

const { settings } = useDevToolsSettings();
const isEnabled = settings.dialTools['qa-dashboard'] ?? true;
```
[//]: # 'Example'

If you need custom defaults, merge them into the `availableApps` array passed to the modal so the merge logic picks them up.

## Step 4 – Test Launch Paths

- Launch from the dial and ensure `onClose` fires.
- Use `useAppHost().open()` to launch programmatically (e.g., deep link).
- Reload the app and confirm persistence reopens the tool if it was active.

## Common Pitfalls

### Icon Must Be a Simple Arrow Function (Not a Hook-Based Component)

When the App Host restores a tool on reload, it calls `appDef.icon({ slot, size })` as a plain function to resolve the icon. If your icon uses React hooks (`useState`, `useEffect`), this will fail silently because hooks can only be called inside a React component render context.

**Wrong - Uses hooks, breaks persistence:**
```tsx
function MyIcon({ size }: { size: number }) {
  const [active, setActive] = useState(false); // Hooks break restoration!
  useEffect(() => { /* ... */ }, []);
  return <SomeIcon size={size} color={active ? 'green' : 'gray'} />;
}

const myToolPreset = {
  id: 'my-tool',
  icon: MyIcon, // This breaks modal persistence on reload
  // ...
};
```

**Correct - Simple arrow function returning JSX:**
```tsx
const myToolPreset = {
  id: 'my-tool',
  icon: ({ size }: { size: number }) => <SomeIcon size={size} color="#10b981" />,
  // ...
};
```

If you need dynamic icon state (e.g., toggle color), use hooks in the icon for the **toggle-only** preset (which doesn't persist), but use a simple static icon for **modal** presets that need persistence.

### State Persistence

For tools that need to persist their internal state (tracking enabled, filters, etc.) across reloads:

1. Add storage keys to `devToolsStorageKeys` in `@react-buoy/shared-ui`
2. Use `safeGetItem`/`safeSetItem` (not direct AsyncStorage import) for graceful fallback
3. Use `hasLoaded` refs to prevent saving on initial load
4. Load state in a `useEffect` when `visible` becomes true
5. Save state in separate `useEffect` hooks that depend on the state values

See `StorageModalWithTabs.tsx` or `HighlightUpdatesModal.tsx` for reference implementations.

## Checklist

- [ ] Tool component gracefully handles `visible` and `onClose` (if `self-modal`).
- [ ] `id` is unique and stable across releases.
- [ ] Icons render in 16px square or smaller for the row.
- [ ] **Icon is a simple arrow function, NOT a component with hooks** (for modal persistence).
- [ ] Added to `availableApps` for settings personalization.
- [ ] State persistence uses `safeGetItem`/`safeSetItem` from shared-ui.

See the [`InstalledApp` type](../reference/FloatingMenu.md) for every property you can set.
