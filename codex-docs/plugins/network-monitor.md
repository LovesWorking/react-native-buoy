---
id: network-monitor
title: Network Monitor
---

The Network Monitor captures fetch/XMLHttpRequest traffic, lets you slice events by method, status, or host, and gives you detail views without leaving the device. It mirrors Reactotron-style workflows while fitting inside the floating menu system.

## Install

```bash
pnpm add @monorepo/network
```

## Register the Tool

[//]: # 'Example'
```tsx
import { NetworkModal } from '@monorepo/network';
import { WifiCircuitIcon } from '@monorepo/shared';

export const NETWORK_TOOL = {
  id: 'network',
  name: 'Network',
  icon: <WifiCircuitIcon size={16} />,
  component: NetworkModal,
  launchMode: 'host-modal',
  singleton: true,
};
```
[//]: # 'Example'

## Features

- **Live Event Stream** – Uses `useNetworkEvents` to subscribe to the event store, auto-starts listeners, and groups stats.
- **Filters & Search** – Toggle filter view to limit by status, method, host, or content type. Inline search finds URLs, paths, or error messages.
- **Ignored Patterns** – Persist domains or substrings to skip (stored under `devToolsStorageKeys.network.ignoredDomains()`).
- **Detail View** – Inspect request/response bodies, headers, and status timeline in a split panel.
- **Interception Control** – Start/stop capture per session, with status indicator in the header.

## Props

- `visible: boolean` (from App Host when `self-modal`)
- `onClose: () => void`
- `onBack?: () => void` – Displays a back arrow when stacked.
- `enableSharedModalDimensions?: boolean` – Persist layout using the shared modal namespace.

Because the modal is heavy, keep `singleton: true` so subsequent launches reuse the same instance.

## Usage Tips

- Combine with [Custom visibility rules](../guides/state-visibility.md) to hide the bubble while the inspector is open.
- Surface quick filters (e.g., “Errors only”) by calling `useNetworkEvents().setFilter` from other components.
- Clear noisy requests by adding ignored patterns for analytics domains.

Review the hook API in [`useNetworkEvents`](../reference/useNetworkEvents.md).
