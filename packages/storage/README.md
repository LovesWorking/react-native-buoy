# @monorepo/storage

Async storage browser for the floating dev tools menu.

## Install
```bash
pnpm add @monorepo/storage @react-native-async-storage/async-storage @monorepo/shared
```

## Register it
```tsx
import { StorageModalWithTabs } from '@monorepo/storage';
import { StorageStackIcon } from '@monorepo/shared';

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
