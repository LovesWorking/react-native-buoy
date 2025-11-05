# @react-buoy/network

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fnetwork)](https://www.npmjs.com/package/@react-buoy/network)

Network request monitoring and inspection tool for React Native development.

## Features

- 🌐 **Complete Network Interception** - Captures ALL fetch and XMLHttpRequest calls
- 🔍 **Request/Response Inspection** - View headers, payloads, query parameters, and more
- ⚡ **Real-time Monitoring** - See requests as they happen
- 🎯 **Advanced Filtering** - Filter by status, method, URL pattern, or custom criteria
- ⏱️ **Performance Tracking** - Monitor request timing and identify bottlenecks
- 🔎 **Powerful Search** - Search through all captured network events
- ⏸️ **Pause/Resume** - Control when to capture events
- 🧹 **Clear History** - Clear captured events on demand
- 📊 **Statistics** - View network activity stats and trends
- 🎨 **Beautiful UI** - Modern, game-themed interface

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
- ✅ Monitors all network requests (fetch + XHR)
- ✅ Intercepts at React Native core layer
- ✅ Parses query parameters correctly
- ✅ Provides filtering, search, and statistics
- ✅ No configuration required

---

## How It Works

### Network Interception Architecture

rn-buoy/network uses **method swizzling** at the React Native core layer to intercept all network traffic:

```
User Code (fetch/axios)
    ↓
whatwg-fetch polyfill
    ↓
XMLHttpRequest (React Native) ← Intercepted here
    ↓
RCTNetworking (Bridge)
    ↓
Native Layer (NSURLSession/OkHttp)
```

**Key Points:**
- **fetch() uses XMLHttpRequest internally** - One interception point captures both
- **Intercepts before native layer** - Works across all platforms (iOS/Android/Web)
- **Query parameters fully captured** - Parsed from URL and stored separately
- **Non-invasive** - Doesn't break existing functionality

For detailed architecture, see [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md).

---

## Configuration Options

### Custom Tool Configuration

```typescript
import { createNetworkTool } from '@react-buoy/network';

const myNetworkTool = createNetworkTool({
  name: "API CALLS",
  description: "Monitor all API requests",
  colorPreset: "green",
  id: "custom-network",
  enableSharedModalDimensions: true,
});

const installedApps = [myNetworkTool];
```

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | string | "NET" | Tool name displayed in UI |
| `description` | string | "Network request logger" | Tool description |
| `colorPreset` | string | "cyan" | Icon color: "orange", "cyan", "purple", "pink", "yellow", "green" |
| `id` | string | "network" | Unique tool identifier |
| `enableSharedModalDimensions` | boolean | true | Use shared modal dimensions |

---

## API Reference

### Presets

#### `networkToolPreset`

Pre-configured network monitoring tool ready to use with FloatingDevTools.

**Example:**
```typescript
import { networkToolPreset } from '@react-buoy/network';

const installedApps = [networkToolPreset];
```

---

#### `createNetworkTool(options?)`

Create a custom network monitoring tool configuration.

**Type:**
```typescript
function createNetworkTool(options?: NetworkToolOptions): ToolPreset
```

**Example:**
```typescript
const myNetworkTool = createNetworkTool({
  name: "REQUESTS",
  colorPreset: "purple",
});
```

---

### Components

#### `NetworkModal`

Main modal component for monitoring network requests.

**Props:**
```typescript
interface NetworkModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
import { NetworkModal } from '@react-buoy/network';

function MyComponent() {
  const [visible, setVisible] = useState(false);

  return (
    <NetworkModal
      visible={visible}
      onClose={() => setVisible(false)}
      enableSharedModalDimensions={true}
    />
  );
}
```

---

#### `NetworkEventDetailView`

Component for displaying detailed information about a single network event.

**Props:**
```typescript
interface NetworkEventDetailViewProps {
  event: NetworkEvent;
  onClose: () => void;
}
```

**Example:**
```typescript
import { NetworkEventDetailView } from '@react-buoy/network';

<NetworkEventDetailView
  event={selectedEvent}
  onClose={() => setSelectedEvent(null)}
/>
```

---

### Hooks

#### `useNetworkEvents()`

Access the list of captured network events and control functions.

**Returns:**
```typescript
{
  events: NetworkEvent[];
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  clear: () => void;
  stats: NetworkStats;
  filter: (criteria: FilterCriteria) => NetworkEvent[];
}
```

**Example:**
```typescript
import { useNetworkEvents } from '@react-buoy/network';

function MyComponent() {
  const {
    events,
    isEnabled,
    enable,
    disable,
    clear,
    stats
  } = useNetworkEvents();

  return (
    <View>
      <Text>Captured: {events.length} requests</Text>
      <Text>Success: {stats.successCount}</Text>
      <Text>Failed: {stats.errorCount}</Text>

      <Button onPress={isEnabled ? disable : enable}>
        {isEnabled ? 'Pause' : 'Resume'}
      </Button>
      <Button onPress={clear}>Clear</Button>
    </View>
  );
}
```

---

### Types

#### `NetworkEvent`

Complete network event information.

```typescript
interface NetworkEvent {
  // Identity
  id: string;
  timestamp: Date;

  // Request
  url: string;
  query?: string; // Query string (?key=value)
  method: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;

  // Response
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  responseSize?: number;

  // Timing
  startTime?: number;
  endTime?: number;
  duration?: number;

  // Error
  error?: {
    message: string;
    name: string;
  };

  // Metadata
  client: 'fetch' | 'xhr' | 'axios';
}
```

---

#### `NetworkStats`

Statistics about captured network events.

```typescript
interface NetworkStats {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  totalBytes: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<number, number>;
}
```

---

#### `FilterCriteria`

Criteria for filtering network events.

```typescript
interface FilterCriteria {
  method?: string | string[];
  status?: number | number[];
  urlPattern?: string | RegExp;
  minDuration?: number;
  maxDuration?: number;
  hasError?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}
```

**Example:**
```typescript
const { filter } = useNetworkEvents();

// Find slow POST requests
const slowPosts = filter({
  method: 'POST',
  minDuration: 1000, // Over 1 second
});

// Find failed requests
const errors = filter({
  hasError: true,
});

// Find specific API calls
const apiCalls = filter({
  urlPattern: /api\.example\.com/,
  status: [200, 201],
});
```

---

## Features in Detail

### 1. Request Interception

**What's Captured:**
- All `fetch()` requests
- All `XMLHttpRequest` requests
- All third-party libraries (axios, etc.) that use fetch/XHR

**How It Works:**
```typescript
// Before interception
fetch('https://api.example.com/users?id=123')

// Intercepted and logged:
{
  url: 'https://api.example.com/users',
  query: '?id=123',
  params: { id: '123' },
  method: 'GET',
  // ... full details
}
```

---

### 2. Query Parameter Handling

**IMPORTANT:** Query parameters are fully captured and parsed:

```typescript
// Request URL
'https://api.example.com/search?q=test&limit=10'

// Captured as:
{
  url: 'https://api.example.com/search',
  query: '?q=test&limit=10',
  params: {
    q: 'test',
    limit: '10'
  }
}
```

If query parameters don't appear in the UI, see [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) for the fix.

---

### 3. Filtering & Search

**Built-in Filters:**
- By HTTP method (GET, POST, PUT, DELETE, etc.)
- By status code (200, 404, 500, etc.)
- By success/error state
- By URL pattern

**Custom Filtering:**
```typescript
const { filter } = useNetworkEvents();

// Complex filtering
const results = filter({
  method: ['POST', 'PUT'],
  status: [200, 201],
  urlPattern: /^https:\/\/api\.example\.com/,
  minDuration: 500,
});
```

---

### 4. Performance Tracking

**Metrics Captured:**
- Request duration (milliseconds)
- Response size (bytes)
- Average request time
- Slowest requests
- Request frequency

**Example:**
```typescript
const { stats } = useNetworkEvents();

console.log(`Average: ${stats.averageDuration}ms`);
console.log(`Total data: ${stats.totalBytes} bytes`);
console.log(`Success rate: ${stats.successCount / stats.totalRequests * 100}%`);
```

---

### 5. Request/Response Inspection

**View Complete Details:**
- Full URL with query parameters
- Request headers (Content-Type, Authorization, etc.)
- Request body (JSON, FormData, text)
- Response headers (Content-Type, Cache-Control, etc.)
- Response body (JSON, text, binary)
- Error messages and stack traces

**UI Features:**
- Syntax highlighting for JSON
- Collapsible sections
- Copy to clipboard
- Search within body

---

## Use Cases

### 1. API Debugging

Monitor all API calls to your backend:

```typescript
import { networkToolPreset } from '@react-buoy/network';

const installedApps = [networkToolPreset];

// Now you can:
// ✓ See all API requests in real-time
// ✓ Inspect request/response payloads
// ✓ Check response times
// ✓ Debug failed requests
// ✓ Verify query parameters
```

---

### 2. Performance Monitoring

Track and optimize slow network requests:

```typescript
import { useNetworkEvents } from '@react-buoy/network';

function PerformanceMonitor() {
  const { events, stats } = useNetworkEvents();

  const slowRequests = events.filter(e => e.duration && e.duration > 1000);

  return (
    <View>
      <Text>Average Response Time: {stats.averageDuration}ms</Text>
      <Text>Slow Requests (&gt;1s): {slowRequests.length}</Text>

      {slowRequests.map(req => (
        <View key={req.id}>
          <Text>{req.url}</Text>
          <Text>Duration: {req.duration}ms</Text>
          <Text>Size: {req.responseSize} bytes</Text>
        </View>
      ))}
    </View>
  );
}
```

---

### 3. Error Tracking

Monitor failed requests and network errors:

```typescript
const { filter } = useNetworkEvents();

const errors = filter({ hasError: true });

errors.forEach(error => {
  console.error('Failed request:', {
    url: error.url,
    method: error.method,
    error: error.error?.message,
    status: error.status,
  });
});
```

---

### 4. Authentication Debugging

Verify authentication headers:

```typescript
const { events } = useNetworkEvents();

const authRequests = events.filter(event =>
  event.requestHeaders?.Authorization
);

authRequests.forEach(req => {
  console.log('Auth request:', {
    url: req.url,
    token: req.requestHeaders.Authorization,
    status: req.status,
  });
});
```

---

### 5. Data Transfer Monitoring

Track bandwidth usage:

```typescript
const { stats } = useNetworkEvents();

console.log('Network Stats:');
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Total data transferred: ${(stats.totalBytes / 1024).toFixed(2)} KB`);
console.log(`Average request size: ${(stats.totalBytes / stats.totalRequests).toFixed(2)} bytes`);
```

---

## Advanced Usage

### Custom Event Processing

```typescript
import { networkEventStore } from '@react-buoy/network';

// Subscribe to all network events
const unsubscribe = networkEventStore.subscribe(event => {
  console.log('New network event:', event);

  // Send to analytics
  if (event.type === 'error') {
    analytics.trackNetworkError(event);
  }

  // Alert on slow requests
  if (event.duration && event.duration > 2000) {
    Alert.alert('Slow Request', `${event.url} took ${event.duration}ms`);
  }
});

// Later: unsubscribe
unsubscribe();
```

---

### Integration with Logging Services

```typescript
import { useNetworkEvents } from '@react-buoy/network';

function NetworkLogger() {
  const { events } = useNetworkEvents();

  useEffect(() => {
    // Send to logging service
    events.forEach(event => {
      if (event.type === 'error') {
        loggingService.log({
          level: 'error',
          message: `Network error: ${event.url}`,
          metadata: {
            method: event.method,
            status: event.status,
            error: event.error,
          },
        });
      }
    });
  }, [events]);

  return null;
}
```

---

### Export Network Data

```typescript
import { useNetworkEvents } from '@react-buoy/network';

function ExportNetworkData() {
  const { events } = useNetworkEvents();

  const exportToJSON = () => {
    const json = JSON.stringify(events, null, 2);
    // Save to file or send to server
    console.log(json);
  };

  const exportToHAR = () => {
    // Convert to HAR (HTTP Archive) format
    const har = {
      log: {
        version: '1.2',
        creator: { name: 'rn-buoy', version: '1.0.0' },
        entries: events.map(event => ({
          startedDateTime: new Date(event.startTime).toISOString(),
          time: event.duration,
          request: {
            method: event.method,
            url: event.url + (event.query || ''),
            headers: Object.entries(event.requestHeaders || {}).map(
              ([name, value]) => ({ name, value })
            ),
          },
          response: {
            status: event.status,
            headers: Object.entries(event.responseHeaders || {}).map(
              ([name, value]) => ({ name, value })
            ),
          },
        })),
      },
    };

    console.log(JSON.stringify(har, null, 2));
  };

  return (
    <View>
      <Button onPress={exportToJSON}>Export as JSON</Button>
      <Button onPress={exportToHAR}>Export as HAR</Button>
    </View>
  );
}
```

---

## Troubleshooting

### Query Parameters Not Showing

**Problem:** Query parameters are captured but not displayed in UI.

**Solution:** See [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) for detailed fix.

**Quick fix:**
```typescript
// In NetworkEventDetailView.tsx
<UrlBreakdown url={event.url + (event.query || '')} />
```

---

### Interceptor Not Working

**Problem:** Network requests not being captured.

**Possible Causes:**
1. Interceptor initialized too late
2. Another interceptor conflicts (e.g., Chrome debugger)
3. Library doesn't use fetch/XHR (native networking)

**Solution:**
```typescript
// Initialize BEFORE app code
// index.js
import '@react-buoy/network'; // ← First!
import {AppRegistry} from 'react-native';
import App from './App';
```

---

### Performance Impact

**Problem:** App feels slower with network monitoring enabled.

**Solution:**
- Only enable in development mode
- Limit event history size
- Disable body capture for large responses

```typescript
// Only in dev
if (__DEV__) {
  networkToolPreset.enable();
}

// Limit history
networkEventStore.setMaxEvents(100); // Default: 500
```

---

### Memory Usage

**Problem:** High memory usage after many requests.

**Solution:** Clear events periodically:

```typescript
const { clear } = useNetworkEvents();

// Clear every 1000 requests
useEffect(() => {
  if (events.length > 1000) {
    clear();
  }
}, [events.length]);
```

---

## Best Practices

### ✅ DO

1. **Only enable in development**
   ```typescript
   if (__DEV__) {
     const installedApps = [networkToolPreset];
   }
   ```

2. **Initialize early**
   ```typescript
   // index.js - before any imports
   import '@react-buoy/network';
   ```

3. **Filter sensitive data**
   ```typescript
   // Don't log passwords, tokens in production
   const sanitizeHeaders = (headers) => {
     const sanitized = {...headers};
     delete sanitized.Authorization;
     delete sanitized['X-API-Key'];
     return sanitized;
   };
   ```

4. **Clear history regularly**
   ```typescript
   // Prevent memory issues
   useEffect(() => {
     const interval = setInterval(() => {
       networkEventStore.clear();
     }, 60000); // Clear every minute

     return () => clearInterval(interval);
   }, []);
   ```

### ❌ DON'T

1. **Don't enable in production** (performance overhead)
2. **Don't log sensitive data** (passwords, tokens)
3. **Don't capture huge responses** (memory issues)
4. **Don't ignore errors** (handle gracefully)

---

## Documentation

- [NETWORK_INTERCEPTION_API.md](NETWORK_INTERCEPTION_API.md) - Complete interception guide
- [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) - Deep dive into RN networking
- [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) - Query parameter fix
- [INTERCEPTION_RECOMMENDATIONS.md](INTERCEPTION_RECOMMENDATIONS.md) - Strategic recommendations

---

## Dependencies

- `@react-buoy/shared-ui` - Common UI components and utilities
- React and React Native (peer dependencies)

---

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

---

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

---

## License

MIT

---

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/LovesWorking/react-native-buoy/issues).

---

## Acknowledgments

- Built with React Native's networking layer
- Uses method swizzling for interception
- Inspired by Chrome DevTools Network panel
- Part of the React Buoy dev tools suite
