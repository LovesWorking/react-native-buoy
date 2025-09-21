# @react-buoy/storage

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fstorage)](https://www.npmjs.com/package/@react-buoy/storage)


Async storage browser for the floating dev tools menu.

## Install
```bash
pnpm add @react-buoy/storage @react-native-async-storage/async-storage @react-buoy/shared-ui
```

## Register it
```tsx
import { StorageModalWithTabs } from '@react-buoy/storage';
import { StorageStackIcon } from '@react-buoy/shared-ui';

export const STORAGE_TOOL = {
  id: 'storage',
  name: 'Storage',
  icon: <StorageStackIcon size={16} />,
  component: StorageModalWithTabs,
  singleton: true,
  props: {
    requiredStorageKeys: [
      { key: 'AUTH_TOKEN', description: 'Current session token' },
    ],
  },
};
```
Add it to your `apps` array and launch from the bubble or programmatically via `useAppHost().open()`.

## Features
- Key/value grid with copy, delete, and inspect actions.
- Live events timeline for AsyncStorage operations.
- Support for required keys and ignored patterns.