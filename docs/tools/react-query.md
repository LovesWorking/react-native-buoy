---
title: React Query DevTools
id: tools-react-query
---

The React Query DevTools integration brings the power of TanStack Query DevTools to React Native.

## Installation

```bash
npm install @react-buoy/react-query @tanstack/react-query
```

## Features

- View all queries and mutations
- Inspect query state (loading, error, success)
- See cached data
- Manually refetch queries
- Invalidate cache
- View query timing

## Setup

Wrap your app with the QueryClientProvider and add the devtools:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools } from "@react-buoy/core";
import "@react-buoy/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <FloatingDevTools environment="local" />
    </QueryClientProvider>
  );
}
```

## Query States

The tool displays query states with color coding:

| State | Color | Description |
|-------|-------|-------------|
| **fresh** | Green | Data is fresh and valid |
| **stale** | Yellow | Data is stale, will refetch on next access |
| **fetching** | Blue | Currently fetching data |
| **paused** | Gray | Query is paused |
| **error** | Red | Query encountered an error |

## Query Details

For each query, you can view:

- **Query Key**: The unique identifier
- **State**: Current fetch state
- **Data**: Cached response data
- **Data Updated At**: When data was last fetched
- **Error**: Error message if failed
- **Observers**: Number of active observers

## Actions

| Action | Description |
|--------|-------------|
| **Refetch** | Manually trigger a refetch |
| **Invalidate** | Mark query as stale |
| **Reset** | Reset to initial state |
| **Remove** | Remove from cache |

## Mutations

View active and past mutations:

```tsx
const mutation = useMutation({
  mutationFn: updateUser,
  mutationKey: ["updateUser"],
});
```

Mutation details include:
- Status (idle, pending, success, error)
- Variables passed to the mutation
- Response data or error
- Submission time

## Filtering

Filter queries and mutations by:
- Query key (search)
- State (fresh, stale, fetching, error)
- Active/Inactive

## Configuration

```tsx
import { ReactQueryConfig } from "@react-buoy/react-query";

const queryConfig: ReactQueryConfig = {
  // Show inactive queries
  showInactive: true,

  // Default expanded sections
  defaultExpanded: ["queries"],

  // Sort order
  sortBy: "lastUpdated",
};

<FloatingDevTools
  environment="local"
  reactQueryConfig={queryConfig}
/>
```

## Next Steps

- [FloatingDevTools](../floating-devtools) - Core component reference
- [Custom Tools](../custom-tools) - Build your own tools
