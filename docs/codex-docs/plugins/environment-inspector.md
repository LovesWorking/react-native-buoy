---
id: environment-inspector
title: Environment Inspector
---

The Environment Inspector surfaces required configuration, highlights missing values, and shows optional variables for quick debugging. It auto-collects values at runtime and persists modal layout between sessions.

## Install

```bash
pnpm add @monorepo/env-tools
```

## Register the Tool

[//]: # 'Example'
```tsx
import { EnvVarsModal } from '@monorepo/env-tools';
import { EnvLaptopIcon } from '@monorepo/shared';

export const ENV_TOOL = {
  id: 'env',
  name: 'Environment',
  icon: <EnvLaptopIcon size={16} />,
  component: EnvVarsModal,
  props: {
    requiredEnvVars: [
      { key: 'API_URL', description: 'Backend base URL', type: 'string' },
      { key: 'SENTRY_DSN', description: 'Crash reporting DSN', type: 'string' },
    ],
  },
};
```
[//]: # 'Example'

## Props

- `requiredEnvVars: RequiredEnvVar[]`
  - Array describing each required key (`key`, `description`, optional `type` and `validator`).
- `onBack?: () => void`
  - Show a back button and invoke the callback—useful when stacking modals.
- `enableSharedModalDimensions?: boolean`
  - Persist window size using the shared modal namespace so dimensions sync with other tools.

## Features

- **Auto-Discovery** – Collects vars via `useDynamicEnv`, converting objects to readable strings.
- **Filter Chips** – Switch between all, missing, and issues-only views.
- **Search** – Toggle search mode from the header to filter by key, value, or description.
- **Health Meter** – Calculates present/missing stats and renders a color-coded summary.
- **Persistence** – Saves modal size/position under `@monorepo/shared` storage keys.

## Usage Tips

- Keep `requiredEnvVars` short and actionable; optional vars still show in the list.
- Group related keys by prefix (`APP_`, `EXPO_PUBLIC_`) so search filters stay effective.
- Combine with the [Settings Modal](../guides/settings-modal.md) so teams can hide the inspector when shipping to production builds.

For type definitions and helper utilities, see the [`EnvVarsModal` reference](../reference/EnvVarsModal.md).
