---
id: devtools
title: Devtools
---

The menu ships with four optional tools. Install the packages you need and add them to your `apps` array.

## Built-ins
- **Environment Inspector** – `@react-buoy/env`
- **Network Monitor** – `@react-buoy/network`
- **Storage Browser** – `@react-buoy/storage`
- **React Query Panel** – `@react-buoy/react-query` (requires `@tanstack/react-query`)

## Register them
```tsx
import { FloatingMenu } from '@react-buoy/core';
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

const INSTALLED_APPS = [
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
  {
    id: 'query',
    name: 'React Query',
    icon: <ReactQueryIcon size={16} />,
    component: ReactQueryDevToolsModal,
    singleton: true,
  },
];
```
Install only the packages for the tools you include.

Tips:
- Keep heavy tools (`network`, `storage`) as `singleton: true` so they reuse one modal.
- Use `slot: 'dial'` when you want a tool hidden behind the dial.
- Supply `availableApps` to the settings modal so toggles stay in sync.

Need more detail? Each tool has its own page in the [Plugins](../../plugins/environment-inspector.md) section.
