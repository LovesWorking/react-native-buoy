# Sentry Event Filtering Guide

## Overview

This guide provides comprehensive recommendations for filtering Sentry events in DevTools based on analysis of the existing implementation and best practices for developer productivity. The current system captures **ALL** Sentry events and provides sophisticated filtering capabilities to help developers focus on relevant information.

## Current Filter Implementation Analysis

### Filter Architecture

The existing system uses a two-tiered filtering approach:

1. **Event Type Filters** - 12 distinct categories based on functionality
2. **Log Level Filters** - 5 severity levels for importance-based filtering

### Current Event Types and Their Mappings

```typescript
// Sentry Event Type → UI Log Type Mapping
SentryEventType.Error → LogType.Error           // Application errors and crashes
SentryEventType.Transaction → LogType.Navigation // Performance transactions  
SentryEventType.Span → LogType.Navigation       // Performance spans
SentryEventType.Session → LogType.System        // Session lifecycle
SentryEventType.UserFeedback → LogType.UserAction // Direct user feedback
SentryEventType.Profile → LogType.System        // Performance profiling
SentryEventType.Replay → LogType.Replay         // Session recordings
SentryEventType.Attachment → LogType.System     // Debug attachments
SentryEventType.ClientReport → LogType.System   // SDK health reports
SentryEventType.Log → LogType.Generic           // Direct log events
SentryEventType.Breadcrumb → LogType.* (context-based) // Refined by category
SentryEventType.Native → LogType.System         // React Native bridge
```

### Context-Based Type Refinement

The system intelligently refines breadcrumb types based on category:

```typescript
// Breadcrumb category → Refined LogType
"touch" → LogType.Touch
"xhr", "fetch", "http" → LogType.HTTPRequest  
"navigation" → LogType.Navigation
"auth" → LogType.Auth
"console" → LogType.System
"debug" → LogType.Debug
"ui.*" → LogType.UserAction
"replay.*" → LogType.Replay
"redux", "*state*" → LogType.State
"payment", "analytics", "webhook" → LogType.Custom
```

## Recommended Default Filtering Strategy

### Events to Show by Default (Essential for Development)

#### **High Priority - Always Visible**
- **Errors** (`LogType.Error`) - All error events and crashes
- **Auth** (`LogType.Auth`) - Authentication flows and issues
- **Navigation** (`LogType.Navigation`) - Screen transitions and routing
- **HTTPRequest** (`LogType.HTTPRequest`) - Network requests and API calls

#### **Medium Priority - Show by Default**
- **UserAction** (`LogType.UserAction`) - Direct user interactions
- **Touch** (`LogType.Touch`) - UI touch events and gestures
- **Custom** (`LogType.Custom`) - Business logic events (payment, analytics)

### Events to Hide by Default (Reduce Noise)

#### **Low Priority - Hide to Reduce Clutter**
- **System** (`LogType.System`) - Session lifecycle, profiles, SDK reports
- **Debug** (`LogType.Debug`) - Development-only debugging breadcrumbs
- **Generic** (`LogType.Generic`) - Uncategorized log events
- **State** (`LogType.State`) - Redux/state management events
- **Replay** (`LogType.Replay`) - Session replay metadata

### Log Level Filtering Recommendations

#### **Default Visible Levels**
- **Error** - Critical issues requiring immediate attention
- **Warn** - Important warnings that may indicate problems
- **Info** - Key application events and milestones

#### **Default Hidden Levels**
- **Debug** - Verbose debugging information
- **Log** - General logging output

## Smart Filtering Implementation

### Adaptive Filter Suggestions

```typescript
// Smart filtering based on event frequency and criticality
const getSmartFilterSuggestions = (events: SentryEventEntry[]) => {
  const errorCount = events.filter(e => e.level === 'error').length;
  const totalCount = events.length;
  
  // If >20% are errors, suggest focusing on errors only
  if (errorCount / totalCount > 0.2) {
    return {
      suggestion: "High error rate detected",
      filters: { levels: ['error'], types: ['Error'] }
    };
  }
  
  // If too many events, suggest hiding noise
  if (totalCount > 50) {
    return {
      suggestion: "High event volume",
      filters: { 
        hideTypes: ['System', 'Debug', 'Generic', 'Replay'],
        hideLevels: ['debug']
      }
    };
  }
  
  return null;
};
```

### Time-Based Filtering

```typescript
// Show recent critical events prominently
const getRecentCriticalEvents = (events: SentryEventEntry[], minutes = 5) => {
  const cutoff = Date.now() - (minutes * 60 * 1000);
  return events.filter(event => 
    event.timestamp > cutoff && 
    (event.level === 'error' || event.level === 'warning')
  );
};
```

### Context-Aware Filtering

```typescript
// Development vs Production filtering
const getDevelopmentFilters = () => ({
  showTypes: ['Error', 'Auth', 'Navigation', 'HTTPRequest', 'UserAction'],
  showLevels: ['error', 'warn', 'info'],
  hidePatterns: [
    /webpack/, /metro/, /hot.reload/, /dev.tools/
  ]
});

const getProductionFilters = () => ({
  showTypes: ['Error', 'Auth', 'Navigation', 'HTTPRequest'],
  showLevels: ['error', 'warn'],
  hidePatterns: [
    /debug/, /trace/, /verbose/
  ]
});
```

## Specific Filtering Rules by Event Type

### Error Events (`LogType.Error`)
- **Always Show**: Critical for debugging
- **Filter by**: Severity level (Fatal > Error > Warning)
- **Special Rules**: Never filter out fatal errors
- **Grouping**: Group similar errors by message/stack trace

### Authentication Events (`LogType.Auth`)
- **Always Show**: Essential for user flow debugging
- **Filter by**: Success vs failure states
- **Special Rules**: Hide token refresh events unless debugging auth
- **Grouping**: Group by auth action type (login, logout, refresh)

### Navigation Events (`LogType.Navigation`)
- **Show by Default**: Critical for UX debugging
- **Filter by**: Screen importance (main flows vs utility screens)
- **Special Rules**: Hide rapid navigation events in lists/tabs
- **Grouping**: Group rapid consecutive navigations

### HTTP Request Events (`LogType.HTTPRequest`)
- **Show by Default**: Essential for API debugging
- **Filter by**: 
  - Response status (errors > success)
  - Request method (prioritize POST/PUT/DELETE over GET)
- **Special Rules**: 
  - Hide successful health checks
  - Hide authentication token requests
  - Group identical requests within time window

### User Action Events (`LogType.UserAction`)
- **Show by Default**: Important for UX understanding
- **Filter by**: Action significance
- **Special Rules**: 
  - Hide rapid repeat actions (scroll, drag)
  - Show form submissions and button clicks
  - Group similar actions within short timeframe

### Touch Events (`LogType.Touch`)
- **Show Selectively**: High volume, useful for specific debugging
- **Filter by**: Element importance
- **Special Rules**:
  - Hide scroll and pan gestures by default
  - Show taps on interactive elements
  - Hide touch events during animation/transition

### System Events (`LogType.System`)
- **Hide by Default**: Low immediate value
- **Filter by**: System event importance
- **Special Rules**:
  - Show session start/end
  - Hide routine SDK health reports
  - Show performance profiles only when debugging performance

### State Events (`LogType.State`)
- **Hide by Default**: Very verbose
- **Filter by**: State change significance
- **Special Rules**:
  - Show authentication state changes
  - Hide frequent UI state updates
  - Show navigation state changes

### Custom Events (`LogType.Custom`)
- **Show by Default**: Business logic importance
- **Filter by**: Business process criticality
- **Special Rules**:
  - Always show payment-related events
  - Show analytics events during feature debugging
  - Filter webhook events by response status

### Debug Events (`LogType.Debug`)
- **Hide by Default**: Development-only noise
- **Filter by**: Development vs production environment
- **Special Rules**:
  - Show only in development builds
  - Hide verbose debug traces
  - Show debug checkpoints and milestones

### Generic Events (`LogType.Generic`)
- **Hide by Default**: Uncategorized noise
- **Filter by**: Message content analysis
- **Special Rules**:
  - Show if contains error/warning keywords
  - Hide routine log output
  - Promote to specific types when possible

### Replay Events (`LogType.Replay`)
- **Hide by Default**: Meta-information
- **Filter by**: Replay session importance
- **Special Rules**:
  - Show replay start/end for debugging sessions
  - Hide segment events unless debugging replay itself
  - Show replay errors prominently

## Advanced Filtering Features

### Search and Pattern Matching

```typescript
// Message content filtering
const messageFilters = {
  errors: /error|exception|crash|fail/i,
  performance: /slow|timeout|latency|performance/i,
  auth: /login|logout|authenticate|token|unauthorized/i,
  network: /request|response|api|http|fetch/i
};

// Advanced search with regex support
const searchEvents = (events: SentryEventEntry[], query: string) => {
  const regex = new RegExp(query, 'i');
  return events.filter(event => 
    regex.test(event.message) || 
    regex.test(JSON.stringify(event.data))
  );
};
```

### Frequency-Based Filtering

```typescript
// Hide events that occur too frequently
const filterByFrequency = (events: SentryEventEntry[], maxPerMinute = 10) => {
  const grouped = groupEventsByMessage(events);
  return events.filter(event => {
    const group = grouped[event.message];
    const recentEvents = group.filter(e => 
      Date.now() - e.timestamp < 60000
    );
    return recentEvents.length <= maxPerMinute;
  });
};
```

### Contextual Importance Scoring

```typescript
// Score events by importance for smart filtering
const getEventImportanceScore = (event: SentryEventEntry): number => {
  let score = 0;
  
  // Level importance
  switch (event.level) {
    case 'fatal': score += 100; break;
    case 'error': score += 80; break;
    case 'warning': score += 60; break;
    case 'info': score += 40; break;
    case 'debug': score += 20; break;
  }
  
  // Type importance
  switch (event.type) {
    case 'Error': score += 50; break;
    case 'Auth': score += 40; break;
    case 'HTTPRequest': 
      score += event.data?.status >= 400 ? 45 : 25; 
      break;
    case 'Navigation': score += 35; break;
    case 'UserAction': score += 30; break;
    case 'Custom': score += 35; break;
    case 'Touch': score += 15; break;
    case 'System': score += 10; break;
    case 'Debug': score += 5; break;
  }
  
  // Recency bonus
  const age = Date.now() - event.timestamp;
  if (age < 5 * 60 * 1000) score += 20; // Last 5 minutes
  
  return score;
};
```

## Filter UI/UX Recommendations

### Quick Filter Presets

```typescript
const filterPresets = {
  "Errors Only": {
    types: ['Error'],
    levels: ['error', 'fatal']
  },
  "User Journey": {
    types: ['Auth', 'Navigation', 'UserAction', 'HTTPRequest'],
    levels: ['info', 'warn', 'error']
  },
  "API Debugging": {
    types: ['HTTPRequest', 'Error'],
    levels: ['warn', 'error']
  },
  "Performance": {
    types: ['Navigation', 'HTTPRequest', 'System'],
    levels: ['warn', 'error']
  },
  "Authentication": {
    types: ['Auth', 'Error', 'HTTPRequest'],
    levels: ['info', 'warn', 'error']
  }
};
```

### Visual Filter Indicators

- **Active Filter Badge**: Show count of active filters
- **Event Count Display**: Show filtered vs total event counts
- **Filter Impact**: Show how many events each filter hides/shows
- **Smart Suggestions**: Highlight recommended filters based on current events

### Filter Persistence

```typescript
// Save and restore filter preferences
const saveFilterPreferences = (filters: FilterState) => {
  AsyncStorage.setItem('sentry_filters', JSON.stringify(filters));
};

const loadFilterPreferences = async (): Promise<FilterState> => {
  const saved = await AsyncStorage.getItem('sentry_filters');
  return saved ? JSON.parse(saved) : getDefaultFilters();
};
```

## Performance Considerations

### Efficient Filtering

- **Memoize Filter Results**: Cache filtered event lists
- **Incremental Updates**: Only refilter new events, not entire list
- **Virtual Scrolling**: Handle large filtered lists efficiently
- **Background Filtering**: Filter in background thread for large datasets

### Memory Management

- **Filter Before Store**: Apply essential filters before storing events
- **Progressive Loading**: Load and filter events in chunks
- **Cleanup Old Events**: Remove filtered-out events from memory after time threshold

## Implementation Recommendations

### 1. Default Filter Strategy
- Start with essential event types only (Error, Auth, Navigation, HTTPRequest)
- Show Warn and Error levels by default
- Hide Debug and System events initially

### 2. Progressive Disclosure
- Provide "Show More" options to reveal hidden event types
- Smart suggestions when relevant events are hidden
- Quick toggles for common debugging scenarios

### 3. Context Awareness
- Adjust filters based on development vs production
- Time-based filtering for recent issues
- Frequency-based filtering for noisy events

### 4. User Experience
- Fast filter application with immediate visual feedback
- Clear indication of what's filtered and why
- Easy filter reset and preset management

This filtering system balances comprehensive event capture with developer productivity by providing smart defaults while maintaining full flexibility for specific debugging needs.