# @react-buoy/env

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fenv)](https://www.npmjs.com/package/@react-buoy/env)


Environment variables inspector tailored for the React Buoy floating menu.

## Install
```bash
pnpm add @react-buoy/env @react-buoy/shared-ui
```

## Register It
```tsx
import { EnvVarsModal } from '@react-buoy/env';
import { EnvLaptopIcon } from '@react-buoy/shared-ui';

export const ENV_TOOL = {
  id: 'env',
  name: 'Environment',
  icon: <EnvLaptopIcon size={16} />,
  component: EnvVarsModal,
  singleton: true,
  props: {
    requiredEnvVars: [
      { key: 'API_URL', description: 'Backend base URL', type: 'string' },
    ],
  },
};
```
Add `ENV_TOOL` to the `apps` array you pass into `FloatingMenu`.

## Features
- Required vs optional variable tracking with validation.
- Search, filtering, and friendly formatting helpers.
- Game UI themed layout to match the other React Buoy tools.