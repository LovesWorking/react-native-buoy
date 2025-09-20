---
id: quick-start
title: Quick Start
---

This walkthrough wires the floating menu into an Expo or React Native app, registers three core tools, and demonstrates launching them from the dial.

- [Install the packages](./installation.md)
- Inject the providers and menu
- Register tools with the App Host
- Verify persistence and visibility rules

[//]: # 'Example'
```tsx
import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@monorepo/devtools-floating-menu';
import { EnvVarsModal } from '@monorepo/env-tools';
import { NetworkModal } from '@monorepo/network';
import { StorageModalWithTabs } from '@monorepo/storage';
import { EnvironmentIndicator } from '@monorepo/shared';

const queryClient = new QueryClient();

const INSTALLED_APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: ({ size }) => (
      <EnvironmentIndicator environment={{ name: 'QA' }} size={size} />
    ),
    component: EnvVarsModal,
    props: {
      requiredEnvKeys: ['API_URL', 'SENTRY_DSN'],
    },
  },
  {
    id: 'network',
    name: 'Network',
    icon: ({ size }) => <Text style={{ color: 'white' }}>NET</Text>,
    component: NetworkModal,
    launchMode: 'host-modal',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: ({ size }) => <Text style={{ color: 'white' }}>KV</Text>,
    component: StorageModalWithTabs,
  },
];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Tap the floating bubble to open Dev Tools</Text>
        </SafeAreaView>

        <FloatingMenu
          apps={INSTALLED_APPS}
          environment={{ name: 'QA', color: '#22d3ee' }}
          userRole="internal"
        />
      </AppHostProvider>
    </QueryClientProvider>
  );
}
```
[//]: # 'Example'

## Step 1 – Confirm the Bubble

Run `pnpm start` and open the app. You should see the draggable bubble plus row icons for each tool. Drag it around; position is persisted to async storage.

## Step 2 – Launch Tools

Tap the bubble to open the dial and launch:

- **Environment** – Verifies required variables and highlights missing ones.
- **Network** – Streams fetch/XHR activity with filtering.
- **Storage** – Lists persisted keys with detail modals.

## Step 3 – Toggle Visibility

Open the settings modal by exposing a shortcut that uses the App Host to open the built-in settings component.

[//]: # 'Example'
```tsx
import React from 'react';
import { Button } from 'react-native';
import {
  DevToolsSettingsModal,
  useAppHost,
} from '@monorepo/devtools-floating-menu';

const INSTALLED_APPS = [...]; // same array from above

export function OpenSettingsButton() {
  const { open } = useAppHost();

  return (
    <Button
      title="Customize Dev Tools"
      onPress={() =>
        open({
          id: 'settings',
          title: 'Dev Tools Settings',
          component: DevToolsSettingsModal,
          props: { availableApps: INSTALLED_APPS },
          launchMode: 'host-modal',
          singleton: true,
        })
      }
    />
  );
}
```
[//]: # 'Example'

Disable a tool in the dial tab, close the modal, and confirm it disappears from the bubble row. Reload the app to verify preferences persist.

You now have the floating menu running end to end. Continue with deep dives:

- [App Host lifecycle](../../guides/app-host.md)
- [Customizing the floating menu](../../guides/customizing-floating-menu.md)
- [Integrating the environment inspector](../../plugins/environment-inspector.md)
