---
id: overview
title: Overview
---

The floating menu is a start button for your mobile debug tools. Drop it into your app, describe the tools you care about, and let the host handle lifecycle, persistence, and layout.

## Why use it?
- One bubble for every tool your team needs.
- Built-in host keeps modals consistent and remembers what was open.
- Ships with optional inspectors (env, network, storage, React Query)—install only what you want.
- Stay in control: add, remove, or reorder tools by editing one array.

## Quick look
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@react-buoy/core';
import { EnvVarsModal } from '@react-buoy/env';
import { NetworkModal } from '@react-buoy/network';
import { StorageModalWithTabs } from '@react-buoy/storage';
import { ReactQueryDevToolsModal } from '@react-buoy/react-query';
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
  ReactQueryIcon,
} from '@react-buoy/shared-ui';

const queryClient = new QueryClient();

const APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: <EnvLaptopIcon size={16} />,
    component: EnvVarsModal,
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
];

export function DevtoolsRoot({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        {children}
        <FloatingMenu apps={APPS} />
      </AppHostProvider>
    </QueryClientProvider>
  );
}
```
Install only the tool packages you reference in `APPS`.

## Learn more
- Install + wire providers: [Quick Start](./quick-start.md)
- Launch bundled tools: [Devtools](./devtools.md)
- Add your own: [Building a Tool](../../guides/building-a-tool.md)
