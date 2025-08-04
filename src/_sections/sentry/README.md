# Sentry Event Logger

A comprehensive Sentry event listener and logger for React Native applications. This package captures, stores, and provides access to all Sentry events with configurable storage limits.

## Features

- **Comprehensive Event Capture**: Captures all Sentry events including errors, transactions, spans, breadcrumbs, and native bridge events
- **Configurable Storage**: Set maximum number of events to store (default: 500)
- **Memory Management**: Automatically removes old events when limit is reached
- **Event Filtering**: Filter events by type and severity level
- **TypeScript Support**: Full TypeScript support with comprehensive type definitions
- **Admin UI Integration**: Ready for integration with admin/debug interfaces

## Installation

```bash
npm install react-native-react-query-devtools
```

### Optional Sentry Integration

The Sentry integration is **optional**. You have two ways to enable it:

#### Option 1: Install Sentry as a peer dependency (Recommended)

```bash
npm install @sentry/react-native
```

The package will automatically detect and use your Sentry installation.

#### Option 2: Dependency Injection (Advanced)

If you prefer manual control or have a custom Sentry setup:

```typescript
import { configureSentryClient } from "react-native-react-query-devtools";
import { getClient } from "@sentry/react-native";

// Configure before calling setupSentryEventListeners
configureSentryClient(getClient);
```

## Basic Usage

```typescript
import {
  setupSentryEventListeners,
  getSentryEvents,
  setMaxSentryEvents,
} from "react-native-react-query-devtools";

// Set up the event listeners (call this after Sentry.init())
const isEnabled = setupSentryEventListeners();

if (isEnabled) {
  console.log("Sentry event logging enabled");

  // Configure max events to store (optional, default is 500)
  setMaxSentryEvents(100);

  // Get all captured events
  const events = getSentryEvents();
  console.log(`Captured ${events.length} Sentry events`);
} else {
  console.log("Sentry event logging disabled - Sentry SDK not available");
}
```

## Integration with Admin UI

This package is designed to work seamlessly with the floating-bubble admin component:

```typescript
import * as Sentry from "@sentry/react-native";
import {
  FloatingStatusBubble,
  setupSentryEventListeners,
  setMaxSentryEvents,
} from "@your-org/floating-status-bubble";

// Initialize Sentry first
Sentry.init({
  dsn: "your-dsn-here",
  // ... other config
});

// Setup event listeners after Sentry initialization
setupSentryEventListeners();
setMaxSentryEvents(100); // Store up to 100 events

// Use the floating bubble with Sentry logs
function App() {
  return (
    <FloatingStatusBubble
      userRole="admin"
      environment="development"
      // The SentryLogDumpSection will automatically show captured events
    />
  );
}
```

## API Reference

### Setup Functions

#### `setupSentryEventListeners(): boolean`

Sets up all Sentry event listeners. Returns `true` if successful, `false` otherwise.

```typescript
import * as Sentry from "@sentry/react-native";
import { setupSentryEventListeners } from "@your-org/sentry-event-logger";

Sentry.init({
  dsn: "your-dsn-here",
  // ... other config
});

// Setup event listeners after Sentry initialization
const success = setupSentryEventListeners();
if (success) {
  console.log("Sentry event logger initialized");
}
```

### Configuration Functions

#### `setMaxSentryEvents(max: number): void`

Configure the maximum number of events to store in memory.

```typescript
setMaxSentryEvents(200); // Store up to 200 events
```

### Data Access Functions

#### `getSentryEvents(): SentryEventEntry[]`

Get all stored Sentry events, ordered by most recent first.

#### `getSentryEventsByType(type: SentryEventType): SentryEventEntry[]`

Get events filtered by type.

```typescript
import {
  getSentryEventsByType,
  SentryEventType,
} from "@your-org/sentry-event-logger";

const errorEvents = getSentryEventsByType(SentryEventType.Error);
const transactionEvents = getSentryEventsByType(SentryEventType.Transaction);
```

#### `getSentryEventsByLevel(level: SentryEventLevel): SentryEventEntry[]`

Get events filtered by severity level.

```typescript
import {
  getSentryEventsByLevel,
  SentryEventLevel,
} from "@your-org/sentry-event-logger";

const errorLevelEvents = getSentryEventsByLevel(SentryEventLevel.Error);
const debugLevelEvents = getSentryEventsByLevel(SentryEventLevel.Debug);
```

#### `getSentryEventCount(): number`

Get the total number of stored events.

#### `clearSentryEvents(): void`

Clear all stored events from memory.

### Utility Functions

#### `getEventEmoji(eventType: SentryEventType): string`

Get an emoji representation for an event type (useful for UI display).

#### `generateTestSentryEvents(): void`

Generate sample test events for development and testing.

## Types

### `SentryEventEntry`

The main event object stored in memory:

```typescript
type SentryEventEntry = {
  id: string; // Unique event ID
  timestamp: number; // Unix timestamp
  source: "envelope" | "span" | "transaction" | "breadcrumb" | "native";
  eventType: SentryEventType; // Categorized event type
  level: SentryEventLevel; // Severity level
  message: string; // Human-readable message
  data: Record<string, unknown>; // Processed event data
  rawData: unknown; // Original Sentry data
};
```

### `SentryEventType`

Event type enumeration:

```typescript
enum SentryEventType {
  Error = "Error",
  Transaction = "Transaction",
  Span = "Span",
  Session = "Session",
  UserFeedback = "User Feedback",
  Profile = "Profile",
  Replay = "Replay",
  Attachment = "Attachment",
  ClientReport = "Client Report",
  Log = "Log",
  Breadcrumb = "Breadcrumb",
  Native = "Native",
  Unknown = "Unknown",
}
```

### `SentryEventLevel`

Severity level enumeration:

```typescript
enum SentryEventLevel {
  Debug = "debug",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Fatal = "fatal",
}
```

## Advanced Usage

### Custom Logger Instance

You can also use the logger class directly for more control:

```typescript
import { SentryEventLogger } from "@your-org/sentry-event-logger";

const customLogger = new SentryEventLogger();
customLogger.setMaxEvents(50);
customLogger.setup();

// Use the custom logger
const events = customLogger.getEvents();
```

### React Native Integration Example

```typescript
// App.tsx
import * as Sentry from '@sentry/react-native';
import { setupSentryEventListeners, setMaxSentryEvents } from '@your-org/sentry-event-logger';

export default function App() {
  useEffect(() => {
    // Initialize Sentry
    Sentry.init({
      dsn: 'your-dsn-here',
      debug: __DEV__,
    });

    // Setup event logger
    setMaxSentryEvents(100);
    setupSentryEventListeners();
  }, []);

  return (
    // Your app content
  );
}
```

### Admin UI Integration

```typescript
// AdminPanel.tsx
import {
  getSentryEvents,
  clearSentryEvents,
  getSentryEventCount,
} from "@your-org/sentry-event-logger";

function AdminPanel() {
  const [events, setEvents] = useState(getSentryEvents());

  const refreshEvents = () => {
    setEvents(getSentryEvents());
  };

  const handleClearEvents = () => {
    clearSentryEvents();
    setEvents([]);
  };

  return (
    <div>
      <h2>Sentry Events ({getSentryEventCount()})</h2>
      <button onClick={refreshEvents}>Refresh</button>
      <button onClick={handleClearEvents}>Clear</button>

      {events.map((event) => (
        <div key={event.id}>
          <strong>{event.eventType}</strong> - {event.message}
          <small>{new Date(event.timestamp).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
}
```

## Performance Considerations

- Events are stored in memory, so setting a very high limit may impact memory usage
- The logger automatically trims old events when the limit is reached
- Event listeners are optimized to avoid infinite loops and performance bottlenecks
- Consider clearing events periodically in long-running applications

## Development

To test the logger during development:

```typescript
import {
  generateTestSentryEvents,
  getSentryEvents,
} from "@your-org/sentry-event-logger";

// Generate test events
generateTestSentryEvents();

// Verify events were captured
console.log("Test events:", getSentryEvents());
```

## License

MIT
