# @react-buoy/react-query

React Query Devtools modal tailored for the floating menu.

## Install
```bash
pnpm add @react-buoy/react-query @tanstack/react-query @react-buoy/shared-ui
```

## Use it with the floating menu
```tsx
import { ReactQueryDevToolsModal } from '@react-buoy/react-query';
import { ReactQueryIcon } from '@react-buoy/shared-ui';

export const QUERY_TOOL = {
  id: 'query',
  name: 'React Query',
  icon: <ReactQueryIcon size={16} />,
  component: ReactQueryDevToolsModal,
  singleton: true,
};
```
Wrap your app in `QueryClientProvider` once so the modal can read the cache.

## Exports
- `ReactQueryDevToolsModal` – Floating menu-ready modal.
- `react-query/*` – Re-exports TanStack helpers used by the modal.

Launch it from the floating menu or call `useAppHost().open(QUERY_TOOL)`.
