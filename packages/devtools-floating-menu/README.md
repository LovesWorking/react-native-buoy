# @react-buoy/core

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fcore)](https://www.npmjs.com/package/@react-buoy/core)


Floating dev tools launcher and host provider for React Native apps.

## Install
```bash
pnpm add @react-buoy/core @react-buoy/shared-ui
```

## Quick Start
```tsx
import { AppHostProvider, FloatingMenu } from '@react-buoy/core';
import type { InstalledApp } from '@react-buoy/core';
import { EnvVarsModal } from '@react-buoy/env';

const APPS: InstalledApp[] = [
  {
    id: 'env',
    name: 'Environment',
    icon: '🛰️',
    component: EnvVarsModal,
    singleton: true,
  },
];

export function DevToolsHost() {
  return (
    <AppHostProvider>
      <FloatingMenu apps={APPS} />
    </AppHostProvider>
  );
}
```

## Key Exports
- `AppHostProvider` – Context provider that manages installed dev tools.
- `FloatingMenu` – Cyberpunk-inspired floating entrypoint for tools.
- `AppOverlay` & `useAppHost()` – Programmatic APIs for opening tools.

The menu hosts any `InstalledApp` descriptor. Combine it with other `@react-buoy/*` packages for a full suite of debug panels.