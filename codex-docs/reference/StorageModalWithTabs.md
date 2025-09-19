---
id: StorageModalWithTabs
title: StorageModalWithTabs
---

## `StorageModalWithTabs`

Async storage inspector modal with a browser tab and an events timeline. Works best with App Host `self-modal` launch mode.

```tsx
import { StorageModalWithTabs } from '@monorepo/storage';

<StorageModalWithTabs
  visible={visible}
  onClose={onClose}
  requiredStorageKeys={['AUTH_TOKEN']}
/>;
```

**Props**

- `visible: boolean`
  - **Required**
  - Whether the modal is open.
- `onClose: () => void`
  - **Required**
  - Callback for dismissal.
- `onBack?: () => void`
  - Shows a back button when stacking modals.
- `enableSharedModalDimensions?: boolean`
  - Persist size with the shared modal namespace instead of storage-specific keys.
- `requiredStorageKeys?: RequiredStorageKey[]`
  - Highlight critical keys and show guidance when missing.

## `RequiredStorageKey`

```ts
type RequiredStorageKey =
  | string
  | { key: string; expectedValue: string; description?: string }
  | { key: string; expectedType: string; description?: string }
  | { key: string; storageType: 'async' | 'mmkv' | 'secure'; description?: string };
```

## Behavior

- Persists active tab (`browser` or `events`) via `devToolsStorageKeys.storage.activeTab()`.
- Remembers whether live monitoring is enabled (`devToolsStorageKeys.storage.isMonitoring()`).
- Groups events by key, showing diff cards and payload previews.
- Provides filter view for operation type, ignored patterns, and key matching.

## Related Utilities

- `startListening` / `stopListening` – Control global AsyncStorage listeners.
- `StorageEventsSection`, `StorageKeySection` – Compose custom UIs with the same primitives.

Launch via [`useAppHost`](./AppHostProvider.md#useapphost) and expose toggles through the [Settings Modal](./DevToolsSettingsModal.md).
