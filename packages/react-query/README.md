# @react-buoy/react-query

[![npm](https://img.shields.io/npm/v/@react-buoy%2Freact-query)](https://www.npmjs.com/package/@react-buoy/react-query)

React Query (TanStack Query) devtools modal for React Native development.

## Features

- **Query Inspector**: Browse and inspect all queries in your app
- **Mutation Tracking**: Monitor mutations and their states
- **Cache Inspection**: View and manipulate the React Query cache
- **Query Invalidation**: Invalidate queries directly from the UI
- **Refetch Control**: Manually trigger query refetches
- **Filter & Search**: Filter queries by status, search by key
- **WiFi Toggle**: Simulate offline mode to test query behavior
- **Performance Monitoring**: Track query timings and performance
- **Beautiful UI**: Modern, game-themed interface matching other React Buoy tools

## Installation

This package is part of the React Buoy monorepo and is automatically available to other packages and the example app.

For external projects:

```bash
npm install @react-buoy/react-query @tanstack/react-query
# or
pnpm add @react-buoy/react-query @tanstack/react-query
# or
yarn add @react-buoy/react-query @tanstack/react-query
```

## Quick Start

### Simplest Setup - Just 1 Line!

**Import the preset and add it to your tools array. Done!**

```typescript
import { reactQueryToolPreset } from '@react-buoy/react-query';
import { FloatingDevTools } from '@react-buoy/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const installedApps = [
  reactQueryToolPreset, // That's it! One line.
  // ...your other tools
];

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <FloatingDevTools
        apps={installedApps}
        environment="local"
        userRole="admin"
      />
      <YourAppContent />
    </QueryClientProvider>
  );
}
```

**Done!** The preset automatically:
- ✅ Inspects all queries and mutations
- ✅ Provides cache manipulation tools
- ✅ Includes WiFi toggle for offline testing
- ✅ No configuration required

### Custom Configuration

If you want to customize the appearance:

```typescript
import { createReactQueryTool } from '@react-buoy/react-query';

const myQueryTool = createReactQueryTool({
  name: "TANSTACK",
  colorPreset: "purple",
  enableSharedModalDimensions: true,
});

const installedApps = [
  myQueryTool,
  // ...other tools
];
```

### Alternative: Manual Setup

If you're not using FloatingDevTools or want more control:

```typescript
import { ReactQueryDevToolsModal } from '@react-buoy/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  const [showQuery, setShowQuery] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <Button onPress={() => setShowQuery(true)}>
        Open Query Inspector
      </Button>

      <ReactQueryDevToolsModal
        visible={showQuery}
        onClose={() => setShowQuery(false)}
      />
      
      <YourAppContent />
    </QueryClientProvider>
  );
}
```

## API Reference

### Presets

#### `reactQueryToolPreset`

Pre-configured React Query devtools ready to use with FloatingDevTools.

**Example:**
```typescript
import { reactQueryToolPreset } from '@react-buoy/react-query';

const installedApps = [reactQueryToolPreset];
```

#### `createReactQueryTool(options?)`

Create a custom React Query devtools configuration.

**Options:**
```typescript
{
  /** Tool name (default: "QUERY") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "red") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green" | "red";
  /** Custom tool ID (default: "query") */
  id?: string;
  /** Enable shared modal dimensions (default: true) */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
import { createReactQueryTool } from '@react-buoy/react-query';

const myQueryTool = createReactQueryTool({
  name: "RQ DEVTOOLS",
  colorPreset: "cyan",
  enableSharedModalDimensions: true,
});
```

### Components

#### `ReactQueryDevToolsModal`

Main modal component for React Query devtools.

**Props:**
```typescript
interface ReactQueryDevToolsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Whether to use shared modal dimensions (default: true) */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
<ReactQueryDevToolsModal
  visible={isVisible}
  onClose={handleClose}
  enableSharedModalDimensions={true}
/>
```

#### `WifiToggle`

Small WiFi toggle component for simulating offline mode.

**Props:**
```typescript
interface WifiToggleProps {
  /** Icon size (default: 16) */
  size?: number;
}
```

**Example:**
```typescript
import { WifiToggle } from '@react-buoy/react-query';

<WifiToggle size={20} />
```

### Hooks

#### `useWifiState()`

Hook to manage and access WiFi/online state.

**Returns:**
```typescript
{
  /** Whether the app is online */
  isOnline: boolean;
  /** Toggle WiFi state */
  handleWifiToggle: () => void;
  /** Set online state directly */
  setIsOnline: (online: boolean) => void;
}
```

**Example:**
```typescript
import { useWifiState } from '@react-buoy/react-query';

function MyComponent() {
  const { isOnline, handleWifiToggle } = useWifiState();

  return (
    <View>
      <Text>Status: {isOnline ? 'Online' : 'Offline'}</Text>
      <Button onPress={handleWifiToggle}>
        Toggle WiFi
      </Button>
    </View>
  );
}
```

## Use Cases

### Query Debugging

Inspect and debug queries in real-time:

```typescript
import { reactQueryToolPreset } from '@react-buoy/react-query';

// Add to your dev tools
const installedApps = [reactQueryToolPreset];

// Now you can:
// - See all active queries
// - View query data and status
// - Inspect stale/fresh/loading states
// - Manually refetch queries
// - Invalidate queries to trigger refetch
```

### Offline Testing

Test your app's behavior in offline mode:

```typescript
import { WifiToggle } from '@react-buoy/react-query';

// Add WiFi toggle to your header
<WifiToggle size={18} />

// Or use the hook directly
const { isOnline, handleWifiToggle } = useWifiState();
```

### Cache Manipulation

Inspect and manipulate the query cache:

```typescript
// In the React Query devtools modal:
// - View all cached queries
// - See cache sizes and data
// - Manually invalidate cache entries
// - Trigger refetches
// - Remove queries from cache
```

### Mutation Monitoring

Track mutations and their states:

```typescript
// In the React Query devtools modal:
// - View all active mutations
// - See mutation status (idle, loading, success, error)
// - Inspect mutation data and variables
// - Track mutation timing
```

## Features in Detail

### Query Browser

- **View All Queries**: See all queries registered with React Query
- **Filter by Status**: Filter by fresh, fetching, stale, or inactive
- **Search**: Search queries by key
- **Query Details**: View full query data, status, and metadata
- **Refetch**: Manually trigger query refetches
- **Invalidate**: Invalidate queries to trigger automatic refetch
- **Remove**: Remove queries from cache

### Mutation Tracking

- **View Mutations**: See all registered mutations
- **Mutation Status**: Track mutation states (idle, loading, success, error)
- **Variables**: Inspect mutation variables
- **Results**: View mutation results and errors
- **Reset**: Reset mutation states

### WiFi Toggle

- **Offline Mode**: Simulate offline state
- **Query Behavior**: Test how queries behave without network
- **Retry Logic**: Verify retry and error handling
- **Cache Fallbacks**: Test cache-first strategies

### Performance Monitoring

- **Query Timing**: See how long queries take
- **Cache Hits**: Track cache hit rates
- **Stale Time**: Monitor query freshness
- **Background Updates**: See when queries update in background

## React Query Integration

This package integrates with React Query's online manager to provide WiFi toggle functionality. When you toggle WiFi off:

- React Query treats the app as offline
- Queries won't refetch automatically
- New queries will be paused
- Mutations will be paused until online
- Background refetches are disabled

This is perfect for testing offline scenarios without actually disconnecting your device.

## Dependencies

- `@react-buoy/shared-ui` - Common UI components and utilities
- `@tanstack/react-query` - React Query library (peer dependency)
- React and React Native (peer dependencies)

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Clean Build

```bash
pnpm clean
```

## License

MIT

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/LovesWorking/react-native-buoy/issues).
