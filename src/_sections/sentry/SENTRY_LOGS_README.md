# Sentry Logs Section - Comprehensive Documentation

## Overview

The Sentry Logs section is a comprehensive real-time monitoring and debugging tool that captures, stores, filters, and displays all Sentry events within a React Native application. This tool provides developers with deep insights into application behavior, errors, performance metrics, and user interactions by intercepting and logging all Sentry SDK events before they are sent to the Sentry servers.

## Core Functionality

### What It Captures

The Sentry Logs section captures **ALL** Sentry events across multiple categories:

#### 1. **Error Events** (`SentryEventType.Error`)

- Application crashes and exceptions
- Network request failures
- JavaScript errors and promise rejections
- Fatal crashes that terminate the application
- **Maps to**: `LogType.Error`

#### 2. **Performance Events**

- **Transactions** (`SentryEventType.Transaction`): Navigation and performance transactions
- **Spans** (`SentryEventType.Span`): Individual performance measurements within transactions
- **Profiles** (`SentryEventType.Profile`): Performance profiling data
- **Maps to**: `LogType.Navigation` (transactions/spans), `LogType.System` (profiles)

#### 3. **User Interaction Events**

- **Breadcrumbs** (`SentryEventType.Breadcrumb`): User actions, navigation, and app state changes
- **User Feedback** (`SentryEventType.UserFeedback`): Direct user feedback submissions
- **Touch Events**: UI interactions and gesture tracking
- **Maps to**: Various types based on context (see Type Mapping section)

#### 4. **System Events**

- **Sessions** (`SentryEventType.Session`): User session lifecycle tracking
- **Attachments** (`SentryEventType.Attachment`): Debug files and supplementary data
- **Client Reports** (`SentryEventType.ClientReport`): SDK health and diagnostic reports
- **Native Bridge Events** (`SentryEventType.Native`): React Native bridge communications
- **Maps to**: `LogType.System`

#### 5. **Content Events**

- **Replay Events** (`SentryEventType.Replay`): Session replay recordings and metadata
- **Log Events** (`SentryEventType.Log`): Direct application logs
- **Maps to**: `LogType.Replay`, `LogType.Generic`

### Event Interception Methods

The system uses multiple interception strategies to capture events:

#### 1. **Envelope Interception**

```typescript
client.on("beforeEnvelope", (envelope) => {
  // Intercepts all events before they're sent to Sentry servers
  // Parses envelope format and extracts individual events
});
```

#### 2. **Event-Specific Listeners**

```typescript
client.on("beforeSend", (event) => {
  /* Error events */
});
client.on("beforeSendTransaction", (transaction) => {
  /* Performance */
});
client.on("beforeAddBreadcrumb", (breadcrumb) => {
  /* User actions */
});
```

#### 3. **Native Bridge Monitoring** (Disabled due to bundler issues)

- Would capture React Native bridge communications
- Currently disabled for Metro bundler compatibility

### Data Storage and Management

#### Reactive Event Store

```typescript
class ReactiveSentryEventStore {
  private events: SentryEventEntry[] = [];
  private maxEvents: number = 100; // Configurable limit
  private listeners = new Set<Listener>();
}
```

**Key Features**:

- **Reactive Updates**: Automatic UI updates when new events arrive
- **Memory Management**: Automatic trimming when event limit is reached
- **Subscription Model**: Similar to React Query's cache system
- **Event Ordering**: Newest events first (LIFO)
- **Thread Safety**: Deferred notifications to avoid render-phase updates

## Type System and Mapping

### Core Data Structures

#### SentryEventEntry

```typescript
export type SentryEventEntry = {
  id: string; // Unique identifier
  timestamp: number; // Unix timestamp in milliseconds
  source: "envelope" | "span" | "transaction" | "breadcrumb" | "native";
  eventType: SentryEventType; // Primary event classification
  level: SentryEventLevel; // Severity level
  message: string; // Human-readable description
  data: Record<string, unknown>; // Processed event data
  rawData: unknown; // Original Sentry event object
};
```

#### Event Type Enumeration

```typescript
export enum SentryEventType {
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

#### Event Level Enumeration

```typescript
export enum SentryEventLevel {
  Debug = "debug",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Fatal = "fatal",
}
```

#### UI Log Types

```typescript
export enum LogType {
  Auth = "Auth", // Authentication events
  Custom = "Custom", // Custom business logic events
  Debug = "Debug", // Development and debugging
  Error = "Error", // Errors and exceptions
  Generic = "Generic", // General application events
  HTTPRequest = "HTTP Request", // Network requests
  Navigation = "Navigation", // Screen navigation and routing
  Replay = "Replay", // Session replay events
  State = "State", // Application state changes
  System = "System", // System-level events
  Touch = "Touch", // User touch interactions
  UserAction = "User Action", // User-initiated actions
}
```

#### UI Log Levels

```typescript
export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Log = "log",
  Warn = "warn",
  Error = "error",
}
```

### Type Mapping Logic

#### Primary Type Mapping

```typescript
const mapEventTypeToLogType = (eventType: SentryEventType): LogType => {
  switch (eventType) {
    case SentryEventType.Error:
      return LogType.Error;
    case SentryEventType.Transaction:
      return LogType.Navigation;
    case SentryEventType.Span:
      return LogType.Navigation;
    case SentryEventType.Session:
      return LogType.System;
    case SentryEventType.UserFeedback:
      return LogType.UserAction;
    case SentryEventType.Profile:
      return LogType.System;
    case SentryEventType.Replay:
      return LogType.Replay;
    case SentryEventType.Attachment:
      return LogType.System;
    case SentryEventType.ClientReport:
      return LogType.System;
    case SentryEventType.Log:
      return LogType.Generic;
    case SentryEventType.Breadcrumb:
      return LogType.Generic; // Refined by context
    case SentryEventType.Native:
      return LogType.System;
    default:
      return LogType.Generic;
  }
};
```

#### Context-Based Type Refinement

```typescript
const refineLogTypeFromContext = (
  entry: SentryEventEntry,
  baseType: LogType
): LogType => {
  const category = entry.data?.category as string;

  if (category) {
    switch (category) {
      case "touch":
        return LogType.Touch;
      case "xhr":
      case "fetch":
      case "http":
        return LogType.HTTPRequest;
      case "navigation":
        return LogType.Navigation;
      case "auth":
        return LogType.Auth;
      case "console":
        return LogType.System;
      case "debug":
        return LogType.Debug;
      default:
        if (category.startsWith("ui.")) return LogType.UserAction;
        if (category.startsWith("replay.")) return LogType.Replay;
        if (category.includes("redux") || category.includes("state"))
          return LogType.State;
        if (category.includes("payment") || category.includes("analytics"))
          return LogType.Custom;
    }
  }

  return baseType;
};
```

#### Level Mapping

```typescript
const mapEventLevelToLogLevel = (eventLevel: SentryEventLevel): LogLevel => {
  switch (eventLevel) {
    case SentryEventLevel.Debug:
      return LogLevel.Debug;
    case SentryEventLevel.Info:
      return LogLevel.Info;
    case SentryEventLevel.Warning:
      return LogLevel.Warn;
    case SentryEventLevel.Error:
      return LogLevel.Error;
    case SentryEventLevel.Fatal:
      return LogLevel.Error;
    default:
      return LogLevel.Info;
  }
};
```

## User Interface and Features

### Main Interface Components

#### 1. **Event List View**

- **Performance Optimized**: Uses Shopify's FlashList for efficient rendering
- **Stable Component Trees**: Following React Native Fabric requirements
- **Real-time Updates**: Reactive updates when new events arrive
- **Compact Display**: Shows essential information (type, level, message, timestamp)
- **Inverted List**: Newest events at top

#### 2. **Statistics Header**

```typescript
// Real-time event statistics
{filteredEntries.length} of {totalCount} events
{(selectedTypes.size > 0 || selectedLevels.size > 0) && " (filtered)"}
```

#### 3. **Action Controls**

- **Filter Button**: Opens comprehensive filtering interface
- **Pause/Resume**: Temporarily halt event logging without losing existing events
- **Generate Test Data**: Creates comprehensive sample events for testing
- **Clear All**: Removes all stored events

### Filtering System

#### Filter Interface

The filtering system provides granular control over displayed events:

#### **Log Level Filters**

```typescript
const ALL_LOG_LEVELS = [
  { level: LogLevel.Info, color: "#22D3EE" }, // Cyan
  { level: LogLevel.Debug, color: "#60A5FA" }, // Blue
  { level: LogLevel.Warn, color: "#FBBF24" }, // Yellow
  { level: LogLevel.Error, color: "#F87171" }, // Red
];
```

#### **Event Type Filters**

```typescript
const ALL_LOG_TYPES = [
  { type: LogType.Navigation, Icon: Route, color: "#34D399" }, // Green
  { type: LogType.Touch, Icon: Hand, color: "#FBBF24" }, // Yellow
  { type: LogType.System, Icon: Settings, color: "#A78BFA" }, // Purple
  { type: LogType.HTTPRequest, Icon: Globe, color: "#2DD4BF" }, // Teal
  { type: LogType.State, Icon: Database, color: "#8B5CF6" }, // Violet
  { type: LogType.UserAction, Icon: User, color: "#FB923C" }, // Orange
  { type: LogType.Auth, Icon: Key, color: "#F59E0B" }, // Amber
  { type: LogType.Error, Icon: AlertTriangle, color: "#F87171" }, // Red
  { type: LogType.Debug, Icon: Bug, color: "#60A5FA" }, // Blue
  { type: LogType.Custom, Icon: Palette, color: "#06B6D4" }, // Cyan
  { type: LogType.Generic, Icon: Box, color: "#94A3B8" }, // Gray
  { type: LogType.Replay, Icon: Play, color: "#EC4899" }, // Pink
];
```

#### Filter Logic

```typescript
const filteredEntries = useMemo(() => {
  if (selectedTypes.size === 0 && selectedLevels.size === 0) {
    return entries; // No filters applied
  }

  return entries.filter((entry) => {
    const typeMatch = selectedTypes.size === 0 || selectedTypes.has(entry.type);
    const levelMatch =
      selectedLevels.size === 0 || selectedLevels.has(entry.level);
    return typeMatch && levelMatch; // AND logic for multi-filter
  });
}, [entries, selectedTypes, selectedLevels]);
```

### Event Detail View

#### Tabbed Interface

When an event is selected, users can view detailed information across four tabs:

#### **1. Message Tab**

- Clean, readable display of the main event message
- Monospace font for technical content
- Selectable text for copying

#### **2. Event Data Tab**

- Processed event metadata and context
- Interactive data explorer with expandable objects
- Type indicators and syntax highlighting
- Maximum depth: 15 levels

#### **3. Raw Data Tab**

- Original Sentry event object
- Unprocessed data exactly as received from Sentry
- Full fidelity for debugging
- Includes internal Sentry fields

#### **4. Debug Info Tab**

- System metadata: ID, timestamp, log type, level
- Event classification information
- Technical debugging details

### Mock Data Generation

#### Comprehensive Test Events

The system includes a sophisticated test data generator that creates realistic events across all categories:

```typescript
export function generateTestSentryEvents(): void {
  const testEvents: SentryEventEntry[] = [
    // Error events
    {
      eventType: SentryEventType.Error,
      level: SentryEventLevel.Error,
      message: "Network request failed",
      data: { category: "error", endpoint: "/api/users", statusCode: 500 },
    },

    // Auth events
    {
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "User logged in successfully",
      data: { category: "auth", action: "login", userId: "user123" },
    },

    // Navigation events
    {
      eventType: SentryEventType.Transaction,
      level: SentryEventLevel.Info,
      message: "Screen navigation completed",
      data: { category: "navigation", from: "Home", to: "Profile" },
    },

    // Performance events
    {
      eventType: SentryEventType.Span,
      level: SentryEventLevel.Info,
      message: "API request completed",
      data: { category: "http", method: "GET", duration: 150 },
    },

    // Complex nested data showcase
    {
      eventType: SentryEventType.Error,
      level: SentryEventLevel.Error,
      message: "🔍 DataExplorer Test Event - All Data Types Showcase",
      data: {
        // Includes every possible JavaScript data type
        primitives: {
          /* strings, numbers, booleans, null, undefined */
        },
        collections: {
          /* arrays, objects, maps, sets */
        },
        specialTypes: {
          /* dates, errors, functions, symbols */
        },
        deeplyNested: {
          /* 10+ levels of nesting */
        },
        circularRef: {
          /* circular reference testing */
        },
      },
    },
  ];
}
```

**Generated Test Data Includes**:

- **12 Event Types**: Error, Auth, Custom, Debug, Generic, HTTP, Navigation, Replay, State, System, Touch, UserAction
- **All Severity Levels**: Debug, Info, Warning, Error, Fatal
- **Complex Data Structures**: Arrays, objects, nested data, circular references
- **Real-world Scenarios**: Login flows, API calls, navigation, user interactions
- **Edge Cases**: Circular references, deeply nested objects, special data types

## Reactive State Management

### Subscription Pattern

```typescript
export function useSentryEvents(options: UseSentryEventsOptions = {}) {
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>([]);

  useEffect(() => {
    const updateEntries = () => {
      const newEntries = calculateEntries();
      // Only update if entries actually changed (deep equality check)
      if (!isEqual(entriesRef.current, newStates)) {
        setEntries(newEntries);
      }
    };

    // Subscribe to reactive store - auto-updates when new events arrive
    const unsubscribe = reactiveSentryEventStore.subscribe(updateEntries);
    return () => unsubscribe();
  }, []);
}
```

### Performance Optimizations

#### Memory Management

- **Event Limit**: Configurable maximum (default: 100 events)
- **Automatic Trimming**: Removes oldest events when limit reached
- **Deduplication**: Removes duplicate events based on ID

#### Rendering Performance

- **FlashList**: Advanced view recycling for large datasets
- **getItemType**: Optimized cell recycling based on event type and level
- **Stable Constants**: Module-scope functions to prevent re-creation
- **Memoized Filters**: Expensive filtering operations cached

#### React Optimizations

- **Latest Ref Pattern**: Avoids dependency arrays in effects
- **Component Composition**: Specialized modal components over conditional rendering
- **Stable Style Objects**: StyleSheet.create for consistent styling

## Error Handling and Edge Cases

### Self-Filtering

```typescript
// Prevent infinite loops from dev tools events
if (
  category === "console" &&
  (message.includes("Sentry") ||
    message.includes("event logger") ||
    message.includes("✅") ||
    message.includes("📦") ||
    message.includes("⚡") ||
    message.includes("🍞"))
) {
  return null; // Don't log our own breadcrumbs
}

// Filter out admin component events
if (message.toLowerCase().includes("ignore")) {
  return null;
}
```

### Graceful Degradation

```typescript
// Handle missing Sentry SDK
if (!clientGetter) {
  console.warn("Sentry SDK not available - event logging disabled");
  return false;
}

// Handle incompatible Sentry versions
if (!clientWithEvents.on || typeof clientWithEvents.on !== "function") {
  console.warn("Sentry client does not support event listeners");
  return false;
}
```

### Data Integrity

- **Type Safety**: Comprehensive TypeScript interfaces
- **Runtime Validation**: Safe property access with fallbacks
- **Error Boundaries**: Graceful handling of malformed events
- **Circular Reference Detection**: Safe JSON serialization

## Configuration and Setup

### Automatic Detection

```typescript
// Dynamic import to avoid bundling if not installed
import("@sentry/react-native").then((sentry) => {
  getSentryClient = sentry.getClient;
});
```

### Manual Configuration

```typescript
import { configureSentryClient } from "react-native-react-query-devtools";
import { getClient } from "@sentry/react-native";

// Configure before calling setupSentryEventListeners
configureSentryClient(getClient);
```

### Setup Process

```typescript
const isEnabled = setupSentryEventListeners();
if (isEnabled) {
  console.log("✅ Sentry event logger configured successfully");
} else {
  console.warn("❌ Sentry event logging disabled");
}
```

## Integration Points

### Modal System Integration

```typescript
<SentryLogsModal
  visible={visible}
  onClose={onClose}
  getSentrySubtitle={() => `${totalEvents} events captured`}
  onBack={onBack}
  enableSharedModalDimensions={true}
/>
```

### DevTools Console Integration

- **Sectioned Interface**: Part of larger DevTools console
- **Consistent Design**: Matches other debugging tools
- **Shared State**: Integrates with overall DevTools state management

### React Query DevTools Integration

- **Unified Interface**: Single entry point for all debugging tools
- **Consistent UX**: Similar patterns across all tools
- **Performance Alignment**: Follows same optimization principles

## Troubleshooting and Debugging

### Common Issues

#### Events Not Appearing

1. **Check Sentry Installation**: Ensure `@sentry/react-native` is installed
2. **Verify Setup**: Confirm `setupSentryEventListeners()` returns `true`
3. **Check Filters**: Verify no filters are excluding events
4. **Event Limit**: Check if max events limit has been reached

#### Performance Issues

1. **Reduce Event Limit**: Lower `maxEvents` setting
2. **Apply Filters**: Use type/level filters to reduce displayed events
3. **Clear Old Events**: Use clear function to reset event store

#### Missing Event Types

1. **Check Sentry Configuration**: Ensure Sentry is capturing the event type
2. **Verify Breadcrumbs**: Check if breadcrumb collection is enabled
3. **Check Categories**: Verify event categories match expected mappings

### Debug Information

Available in the Debug tab of event details:

- Event ID and timestamp
- Classification (type and level)
- Source information (envelope, breadcrumb, etc.)
- Processing metadata

### Logging Output

The system provides detailed console logging:

```
✅ Sentry event logger configured successfully
📦 Envelope intercepted: 3 events processed
⚡ Transaction captured: Screen navigation
🍞 Breadcrumb added: User interaction
Generated 25 comprehensive test Sentry events covering all event types
```

## Security and Privacy

### Data Handling

- **Local Storage Only**: Events stored in memory, not persisted
- **No Network Transmission**: Events captured locally for debugging
- **Automatic Cleanup**: Events automatically removed when app closes
- **Memory Limits**: Configurable limits prevent memory leaks

### Sensitive Data

- **Raw Data Access**: Full access to original Sentry events
- **PII Awareness**: Same privacy concerns as main Sentry integration
- **Debug Context**: Additional debugging information available

## Future Enhancements

### Planned Features

- **Export Functionality**: Save events to file for analysis
- **Advanced Filtering**: Time-based, regex, and custom filters
- **Event Statistics**: Detailed analytics and metrics
- **Real-time Monitoring**: Live event stream with notifications

### Extensibility

- **Custom Event Types**: Support for application-specific event categories
- **Plugin System**: Extensible event processing pipeline
- **Custom Renderers**: Specialized displays for different event types
- **Integration APIs**: Hooks for external monitoring tools

---

## Summary

The Sentry Logs section is a comprehensive, production-ready debugging tool that provides developers with unprecedented visibility into their React Native applications. By intercepting and displaying all Sentry events in real-time, it enables rapid debugging, performance optimization, and user experience monitoring without requiring external tools or network access.

Key strengths:

- **Complete Coverage**: Captures all Sentry event types
- **Real-time Updates**: Reactive interface with instant event display
- **Performance Optimized**: Efficient rendering and memory management
- **Developer Friendly**: Intuitive interface with comprehensive filtering
- **Production Safe**: Local-only operation with configurable limits
- **Type Safe**: Comprehensive TypeScript integration with runtime validation

This tool represents a significant advancement in React Native debugging capabilities, providing the depth of server-side monitoring with the convenience of local development tools.
