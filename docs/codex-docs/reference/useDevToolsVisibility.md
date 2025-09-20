---
id: useDevToolsVisibility
title: useDevToolsVisibility
---

## `useDevToolsVisibility`

Utility hook that returns `true` when any supplied modal flags are active. Use it to hide the floating menu while custom overlays or App Host tools are open.

```ts
import { useDevToolsVisibility } from '@react-buoy/core';

const isHidden = useDevToolsVisibility([
  isEnvModalOpen,
  isNetworkModalOpen,
]);
```

**Parameters**

- `modals: boolean[] | Record<string, boolean | undefined | null>`
  - Accepts an array or object of boolean-like values. `true` indicates the modal is open.

**Returns**

- `boolean`
  - `true` when any entry is truthy.

**Behavior**

- Uses memoization to avoid recalculating unless `modals` changes.
- Handles both arrays and objects without allocating extra arrays.

Pair with the `hidden` prop on [`FloatingMenu`](./FloatingMenu.md) for precise visibility control.
