---
id: devtools
title: Devtools
---

The floating menu becomes indispensable when paired with its companion tools. This page explains what ships out of the box, how to add third-party utilities, and how to surface them in the dial without bloating the UI.

## Included Tools

- **Environment Inspector** – Audits required env vars, surfaces drift, and shows friendly remediation tips.
- **Network Monitor** – Captures fetch/XMLHttpRequest traffic with filtering, stats, and payload inspection.
- **Storage Browser** – Lists async storage keys, shows diffs, and monitors mutations.
- **React Query Panel** – Embeds TanStack Query Devtools so data-fetching state stays transparent.

Each tool is optional. You choose whether to render it in the row, dial, or both by setting the `slot` property.

## Register the Tools

[//]: # 'Example'
```tsx
import {
  AppHostProvider,
  FloatingMenu,
  DevToolsSettingsModal,
} from '@monorepo/devtools-floating-menu';
import { EnvVarsModal } from '@monorepo/env-tools';
import { NetworkModal } from '@monorepo/network';
import { StorageModalWithTabs } from '@monorepo/storage';
import { ReactQueryDevToolsModal } from '@monorepo/react-query';
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
  ReactQueryIcon,
} from '@monorepo/shared';

const INSTALLED_APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: <EnvLaptopIcon size={16} />, // renders in row and dial by default
    component: EnvVarsModal,
    props: { requiredEnvKeys: ['API_URL'] },
  },
  {
    id: 'network',
    name: 'Network',
    icon: <WifiCircuitIcon size={16} />,
    component: NetworkModal,
    launchMode: 'host-modal',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: <StorageStackIcon size={16} />,
    component: StorageModalWithTabs,
  },
  {
    id: 'query',
    name: 'React Query',
    icon: <ReactQueryIcon size={16} />,
    component: ReactQueryDevToolsModal,
    launchMode: 'self-modal',
    singleton: true,
  },
];
```
[//]: # 'Example'

> IMPORTANT: `ReactQueryDevToolsModal` expects a `QueryClientProvider` ancestor. See the [Quick Start](./quick-start.md) for the setup snippet.

## Keep the Menu Lean

- Group low-priority tools under the dial by setting `slot: 'dial'`.
- Hide tools by default and let engineers enable them through the settings modal.
- Use `singleton: true` for heavy overlays so the App Host reuses the same instance.

## Extend the Toolbox

Add your own installed apps by pointing `component` to any React component. Keep these rules in mind:

- Components launching in `self-modal` mode receive `visible` and `onClose` props from the App Host. Respect them to avoid orphaned overlays.
- `host-modal` wraps your component in a plain `Modal`; treat it like a normal full-screen child.
- `inline` renders absolutely positioned content above the app—perfect for HUDs or debug banners.

## Next Steps

- Deep dive into component lifecycle in the [App Host guide](../guides/app-host.md)
- Customize placement, persistence, and theming in [Customizing the Floating Menu](../guides/customizing-floating-menu.md)
- Explore tool-specific docs in the [Plugins section](../plugins/environment-inspector.md)
