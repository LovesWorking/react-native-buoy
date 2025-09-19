---
id: useNetworkEvents
title: useNetworkEvents
---

## `useNetworkEvents`

Hook powering the Network Monitor. It subscribes to a shared event store, filters network traffic, and exposes controls for interception.

```ts
import { useNetworkEvents } from '@monorepo/network';

const {
  events,
  stats,
  filter,
  setFilter,
  clearEvents,
  toggleInterception,
  isEnabled,
} = useNetworkEvents();
```

**Returns**

- `events: NetworkEvent[]`
  - Filtered list of captured requests.
- `stats: NetworkStats`
  - Aggregated totals (requests, successes, failures, duration summaries).
- `filter: NetworkFilter`
  - Current filter state (`method`, `status`, `contentType`, `searchText`, etc.).
- `setFilter(next: NetworkFilter | (prev: NetworkFilter) => NetworkFilter): void`
  - Update filter state; triggers memoized recomputation.
- `clearEvents(): void`
  - Purge captured events.
- `toggleInterception(): void`
  - Start/stop the listener.
- `isEnabled: boolean`
  - Whether interception is currently active.

**Behavior**

- Starts the listener automatically if it is not already active.
- Deduplicates expensive operations with memoized `Set` lookups for methods/content types.
- Filters out ignored URLs (symbolicate, Metro) by default.
- Subscribes to `networkEventStore` for push updates and cleans up on unmount.

Use it in custom dashboards or to build lightweight network indicators outside the modal.
