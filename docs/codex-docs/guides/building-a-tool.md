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

## Checklist

- [ ] Tool component gracefully handles `visible` and `onClose` (if `self-modal`).
- [ ] `id` is unique and stable across releases.
- [ ] Icons render in 16px square or smaller for the row.
- [ ] Added to `availableApps` for settings personalization.

See the [`InstalledApp` type](../reference/FloatingMenu.md) for every property you can set.
