---
id: react-query-panel
title: React Query Panel
---

Embed TanStack Query Devtools directly inside the floating menu. The React Query Panel mirrors the web devtools experience with query explorers, mutation inspectors, and cache editing.

## Install

```bash
pnpm add @react-buoy/react-query @tanstack/react-query
```

Ensure your app wraps components in a `QueryClientProvider`.

## Register the Tool

[//]: # 'Example'
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@react-buoy/core';
import { ReactQueryDevToolsModal } from '@react-buoy/react-query';
import { ReactQueryIcon } from '@react-buoy/shared-ui';

const queryClient = new QueryClient();

const QUERY_TOOL = {
  id: 'query',
  name: 'React Query',
  icon: <ReactQueryIcon size={16} />,
  component: ReactQueryDevToolsModal,
  launchMode: 'self-modal',
  singleton: true,
};

<QueryClientProvider client={queryClient}>
  <AppHostProvider>
    <FloatingMenu apps={[QUERY_TOOL]} />
  </AppHostProvider>
</QueryClientProvider>;
```
[//]: # 'Example'

## Features

- **Query Explorer** – Browse queries, inspect keys, view data snapshots, and toggle observers.
- **Mutation Explorer** – Track in-flight and completed mutations, replay or edit payloads.
- **Cache Tools** – Clear cache, refetch, or manipulate data via the built-in action buttons.
- **Offline Toggle** – Simulate offline/online states to verify retry behavior.
- **Editor Modes** – Switch between browser, mutation, data editor, and mutation editor modes using the header controls.

## Usage Tips

- Keep the panel `singleton` to avoid multiple modals fighting over the cache.
- Pair with [React Query docs](https://tanstack.com/query/latest) so teammates can look up APIs quickly.
- Import the exported hooks and utilities from `@react-buoy/react-query` if you need custom dashboards outside the modal.

For API specifics see the [`ReactQueryDevToolsModal` reference](../reference/ReactQueryDevToolsModal.md) and TanStack Query’s official docs.
