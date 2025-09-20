---
id: ReactQueryDevToolsModal
title: ReactQueryDevToolsModal
---

## `ReactQueryDevToolsModal`

Floating menu-compatible wrapper around TanStack Query Devtools. Launch it in `self-modal` mode to inspect query and mutation caches inside your app.

```tsx
import { ReactQueryDevToolsModal } from '@react-buoy/react-query';

<ReactQueryDevToolsModal visible={visible} onClose={onClose} />;
```

**Props**

- `visible: boolean`
  - **Required**
  - Controls panel visibility.
- `onClose: () => void`
  - **Required**
  - Called when the panel requests dismissal. Resets internal selection state before closing.
- `enableSharedModalDimensions?: boolean`
  - Defaults to `true`
  - Persist size using the shared modal namespace so it matches other devtools.

**Behavior**

- Renders the full TanStack Query explorer, mutation inspector, and data editor.
- Tracks selected query/mutation, active filters, and active tab.
- Resets selections when the modal closes so each launch starts fresh.

**Requirements**

- App must be wrapped in `QueryClientProvider`.
- Works best when launched as a `singleton` to reuse the internal devtools state.

See additional exports in [`ReactQueryDevTools`](https://github.com/TanStack/query) for standalone components and hooks.
