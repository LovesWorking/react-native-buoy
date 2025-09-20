---
id: quick-start
title: Quick Start
---

You already installed the floating menu and any dev tool packages you want. Now wire them up.

## 1. Create `installedApps.ts`
```tsx
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
  ReactQueryIcon,
} from '@monorepo/shared';
import { EnvVarsModal } from '@monorepo/env-tools';
import { NetworkModal } from '@monorepo/network';
import { StorageModalWithTabs } from '@monorepo/storage';
import { ReactQueryDevToolsModal } from '@monorepo/react-query';

export const INSTALLED_APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: <EnvLaptopIcon size={16} />,
    component: EnvVarsModal,
    props: {
      requiredEnvVars: [
        { key: 'API_URL', description: 'Backend base URL' },
        { key: 'SENTRY_DSN', description: 'Crash reporting DSN' },
      ],
    },
  },
  {
    id: 'network',
    name: 'Network',
    icon: <WifiCircuitIcon size={16} />,
    component: NetworkModal,
    launchMode: 'host-modal',
    singleton: true,
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: <StorageStackIcon size={16} />,
    component: StorageModalWithTabs,
    singleton: true,
  },
  {
    id: 'query',
    name: 'React Query',
    icon: <ReactQueryIcon size={16} />,
    component: ReactQueryDevToolsModal,
    singleton: true,
  },
];
```
Remove any entries you did not install—the menu only needs the tools you actually use.

## 2. Mount the menu near the root
```tsx
import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { FloatingMenu } from '@monorepo/devtools-floating-menu';
import { INSTALLED_APPS } from './installedApps';

export default function AppShell() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Tap the bubble to open Dev Tools</Text>
      <FloatingMenu
        apps={INSTALLED_APPS}
        environment={{ name: 'QA', color: '#22d3ee' }}
        userRole="internal"
      />
    </SafeAreaView>
  );
}
```
Render `AppShell` inside the providers added during [installation](./installation.md) so `AppHostProvider` and `QueryClientProvider` wrap your tree once.

The menu calls `registerApps` under the hood so the host can restore open tools after reloads.

## 3. Launch it
```bash
pnpm start
```
You should see the floating row with your icons, plus the dial when you tap the bubble.

## 4. Open the tools
Tap each icon:
- **Environment** – Checks the required keys and highlights anything missing.
- **Network** – Streams requests in a host modal.
- **Storage** – Shows async storage keys and live events.
- **React Query** – Opens TanStack Query Devtools.

## 5. Add a settings button (optional)
```tsx
import { Button } from 'react-native';
import { DevToolsSettingsModal, useAppHost } from '@monorepo/devtools-floating-menu';
import { INSTALLED_APPS } from './installedApps';

export function OpenSettings() {
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
          props: { availableApps: INSTALLED_APPS },
        })
      }
    />
  );
}
```
Disable a tool, reload the app, and confirm the preference sticks.

Next: dive into the [App Host lifecycle](../../guides/app-host.md) or tweak slots in [Customizing the Floating Menu](../../guides/customizing-floating-menu.md).
