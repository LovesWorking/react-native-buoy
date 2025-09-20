# @monorepo/network

Network monitor modal for the floating dev tools menu.

## Install
```bash
pnpm add @monorepo/network @monorepo/shared
```

## Register it
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
Place this inside your `apps` array and the floating menu will launch it in a hosted modal.

## What you get
- Live fetch/XMLHttpRequest stream with filters.
- Detail panel for headers, payloads, and timings.
- Toggle to pause or resume interception.
