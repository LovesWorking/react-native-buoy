---
id: basic-floating-menu
title: Basic Floating Menu
---

Launch the floating menu with three built-in tools (environment, network, storage) in an Expo app.

[//]: # 'Example'
```tsx
import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  AppHostProvider,
  FloatingMenu,
} from '@monorepo/devtools-floating-menu';
import { EnvVarsModal } from '@monorepo/env-tools';
import { NetworkModal } from '@monorepo/network';
import { StorageModalWithTabs } from '@monorepo/storage';
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
} from '@monorepo/shared';

const queryClient = new QueryClient();

const APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: <EnvLaptopIcon size={16} />,
    component: EnvVarsModal,
    props: { requiredEnvVars: [{ key: 'API_URL' }] },
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
  },
];

export default function Example() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Tap the badge to open Dev Tools.</Text>
        </SafeAreaView>
        <FloatingMenu apps={APPS} environment={{ name: 'QA', color: '#22d3ee' }} />
      </AppHostProvider>
    </QueryClientProvider>
  );
}
```
[//]: # 'Example'

**Highlights**

- Registers three tools with sensible defaults.
- Provides a staging environment badge for quick orientation.
- Uses `singleton: true` on the network tool to avoid multiple heavy modals.

Try launching each tool, closing it with the back button, then reloading the app to see persistence in action.
