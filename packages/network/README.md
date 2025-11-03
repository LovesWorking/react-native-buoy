# @react-buoy/network

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fnetwork)](https://www.npmjs.com/package/@react-buoy/network)

Network request monitoring and inspection tool for React Native development.

## Features

- **Live Network Monitoring**: Track all fetch and XMLHttpRequest calls in real-time
- **Request/Response Inspection**: View detailed information about headers, payloads, and responses
- **Filtering**: Filter requests by status code, HTTP method, or URL pattern
- **Timing Information**: See request duration and timing details
- **Search**: Search through captured network events
- **Pause/Resume**: Control when to capture network events
- **Clear History**: Clear captured events when needed
- **Beautiful UI**: Modern, game-themed interface matching other React Buoy tools

## Installation

This package is part of the React Buoy monorepo and is automatically available to other packages and the example app.

For external projects:

```bash
npm install @react-buoy/network
# or
pnpm add @react-buoy/network
# or
yarn add @react-buoy/network
```

## Quick Start

### Simplest Setup - Just 1 Line!

**Import the preset and add it to your tools array. Done!**

```typescript
import { networkToolPreset } from '@react-buoy/network';
import { FloatingDevTools } from '@react-buoy/core';

const installedApps = [
  networkToolPreset, // That's it! One line.
  // ...your other tools
];

function App() {
  return (
    <FloatingDevTools
      apps={installedApps}
      environment="local"
      userRole="admin"
    />
  );
}
```

**Done!** The preset automatically:
- ✅ Monitors all network requests
- ✅ Intercepts fetch and XMLHttpRequest
- ✅ Provides filtering and search
- ✅ No configuration required

### Custom Configuration

If you want to customize the appearance or behavior:

```typescript
import { createNetworkTool } from '@react-buoy/network';

const myNetworkTool = createNetworkTool({
  name: "REQUESTS",
  colorPreset: "purple",
  enableSharedModalDimensions: true,
});

const installedApps = [
  myNetworkTool,
  // ...other tools
];
```

### Alternative: Manual Setup

If you're not using FloatingDevTools or want more control:

```typescript
import { NetworkModal } from '@react-buoy/network';

function App() {
  const [showNetwork, setShowNetwork] = useState(false);

  return (
    <>
      <Button onPress={() => setShowNetwork(true)}>
        Open Network Monitor
      </Button>

      <NetworkModal
        visible={showNetwork}
        onClose={() => setShowNetwork(false)}
      />
    </>
  );
}
```

## API Reference

### Presets

#### `networkToolPreset`

Pre-configured network monitoring tool ready to use with FloatingDevTools.

**Example:**
```typescript
import { networkToolPreset } from '@react-buoy/network';

const installedApps = [networkToolPreset];
```

#### `createNetworkTool(options?)`

Create a custom network monitoring tool configuration.

**Options:**
```typescript
{
  /** Tool name (default: "NET") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "cyan") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  /** Custom tool ID (default: "network") */
  id?: string;
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
import { createNetworkTool } from '@react-buoy/network';

const myNetworkTool = createNetworkTool({
  name: "API CALLS",
  colorPreset: "green",
  enableSharedModalDimensions: true,
});
```

### Components

#### `NetworkModal`

Main modal component for monitoring network requests.

**Props:**
```typescript
interface NetworkModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional back button handler */
  onBack?: () => void;
  /** Whether to use shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
<NetworkModal
  visible={isVisible}
  onClose={handleClose}
  enableSharedModalDimensions={true}
/>
```

### Hooks

#### `useNetworkEvents()`

Access the list of captured network events and control functions.

**Returns:**
```typescript
{
  /** Array of captured network events */
  events: NetworkEvent[];
  /** Whether interception is enabled */
  isEnabled: boolean;
  /** Enable network interception */
  enable: () => void;
  /** Disable network interception */
  disable: () => void;
  /** Clear all captured events */
  clear: () => void;
}
```

**Example:**
```typescript
import { useNetworkEvents } from '@react-buoy/network';

function MyComponent() {
  const { events, isEnabled, enable, disable, clear } = useNetworkEvents();

  return (
    <View>
      <Text>Captured {events.length} requests</Text>
      <Button onPress={isEnabled ? disable : enable}>
        {isEnabled ? 'Pause' : 'Resume'}
      </Button>
      <Button onPress={clear}>Clear</Button>
    </View>
  );
}
```

### Types

#### `NetworkEvent`

```typescript
interface NetworkEvent {
  /** Unique event ID */
  id: string;
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** HTTP status code */
  status?: number;
  /** Request headers */
  requestHeaders?: Record<string, string>;
  /** Response headers */
  responseHeaders?: Record<string, string>;
  /** Request body */
  requestBody?: any;
  /** Response body */
  responseBody?: any;
  /** Request start timestamp */
  startTime: number;
  /** Request end timestamp */
  endTime?: number;
  /** Request duration in ms */
  duration?: number;
  /** Error message if request failed */
  error?: string;
}
```

## Use Cases

### API Debugging

Monitor all API calls to your backend:

```typescript
import { networkToolPreset } from '@react-buoy/network';

// Add to your dev tools
const installedApps = [networkToolPreset];

// Now you can:
// - See all API requests in real-time
// - Inspect request/response payloads
// - Check response times
// - Debug failed requests
```

### Performance Monitoring

Track slow network requests:

```typescript
import { useNetworkEvents } from '@react-buoy/network';

function PerformanceMonitor() {
  const { events } = useNetworkEvents();

  const slowRequests = events.filter(e => e.duration && e.duration > 1000);

  return (
    <View>
      <Text>Slow Requests: {slowRequests.length}</Text>
      {slowRequests.map(req => (
        <Text key={req.id}>
          {req.url} took {req.duration}ms
        </Text>
      ))}
    </View>
  );
}
```

### Request Filtering

Filter requests by specific criteria:

```typescript
// In the Network Modal UI:
// - Filter by status code (200, 404, 500, etc.)
// - Filter by HTTP method (GET, POST, PUT, DELETE)
// - Search by URL pattern
// - Filter by success/error state
```

## Features in Detail

### Network Interception

The package automatically intercepts:
- `fetch()` calls
- `XMLHttpRequest` calls
- All HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)

### Request Details

For each request, you can view:
- Full URL and query parameters
- HTTP method and status code
- Request and response headers
- Request and response bodies
- Timing information (duration, timestamps)
- Error details if the request failed

### Filtering & Search

- **By Status**: Filter by HTTP status codes
- **By Method**: Filter by HTTP method
- **By URL**: Search through request URLs
- **By State**: Filter successful, pending, or failed requests

### Performance Tracking

- View request duration
- Identify slow requests
- Monitor request timing
- Track request count

## Dependencies

- `@react-buoy/shared-ui` - Common UI components and utilities
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
