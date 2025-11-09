# Expo Router Event Interception API - Complete Guide

**The Definitive Book on Intercepting Expo Router Navigation Events**

---

## 📖 Table of Contents

### Part I: Getting Started
1. [Introduction](#introduction)
2. [Quick Start](#quick-start)
3. [Installation & Setup](#installation--setup)
4. [Your First Interceptor](#your-first-interceptor)

### Part II: Core Concepts
5. [Understanding the Navigation System](#understanding-the-navigation-system)
6. [The Four Interception Points](#the-four-interception-points)
7. [Route Information Schema](#route-information-schema)
8. [Navigation Action Types](#navigation-action-types)

### Part III: API Reference
9. [Router Store API](#router-store-api)
10. [Routing Queue API](#routing-queue-api)
11. [NavigationContainer API](#navigationcontainer-api)
12. [NavigationRef Event API](#navigationref-event-api)

### Part IV: Implementation Patterns
13. [Pattern: Simple Route Tracking](#pattern-simple-route-tracking)
14. [Pattern: Pre-Navigation Analytics](#pattern-pre-navigation-analytics)
15. [Pattern: Navigation History](#pattern-navigation-history)
16. [Pattern: Route Guard/Blocker](#pattern-route-guardblocker)
17. [Pattern: Performance Monitoring](#pattern-performance-monitoring)
18. [Pattern: Deep Link Tracking](#pattern-deep-link-tracking)

### Part V: Advanced Topics
19. [TypeScript Integration](#typescript-integration)
20. [React Hooks for Interception](#react-hooks-for-interception)
21. [Server-Side Considerations](#server-side-considerations)
22. [Testing Your Interceptors](#testing-your-interceptors)
23. [Performance Optimization](#performance-optimization)

### Part VI: Best Practices
24. [What TO Do](#what-to-do)
25. [What NOT To Do](#what-not-to-do)
26. [Common Pitfalls](#common-pitfalls)
27. [Debugging Guide](#debugging-guide)

### Part VII: Reference
28. [Complete Code Examples](#complete-code-examples)
29. [Type Definitions](#type-definitions)
30. [Migration Guide](#migration-guide)
31. [FAQ](#faq)

---

# Part I: Getting Started

## Introduction

### What is Routing Event Interception?

Routing event interception allows you to observe, track, and react to navigation changes in your Expo Router application. Similar to how you might intercept network requests or storage changes, routing interception gives you visibility into every route transition.

### Why Intercept Routing Events?

**Common Use Cases:**
- 📊 **Analytics** - Track page views and user navigation flows
- 🔍 **Developer Tools** - Build debugging tools that visualize routing
- 📝 **Logging** - Record navigation history for support/debugging
- 🛡️ **Guards** - React to navigation (note: cannot prevent)
- ⚡ **Performance** - Measure navigation timing and performance
- 🔗 **Deep Links** - Track deep link usage and success rates

### Key Advantages

1. **Non-invasive** - No monkey-patching required
2. **Type-safe** - Full TypeScript support
3. **Complete** - Captures all navigation types (imperative, declarative, deep links)
4. **Performant** - Zero overhead when not subscribed
5. **Reliable** - Built on React's `useSyncExternalStore`

---

## Quick Start

### 30-Second Implementation

```typescript
import { store } from 'expo-router/src/global-state/router-store';

// Subscribe to all route changes
const unsubscribe = store.subscribe(() => {
  const route = store.getRouteInfo();
  console.log('Navigated to:', route.pathname);
});

// Later: cleanup
unsubscribe();
```

That's it! You're now tracking all navigation in your Expo Router app.

---

## Installation & Setup

### Prerequisites

- Expo Router 6.0+ (this guide is based on 6.0.6)
- React Native / Expo SDK 50+
- TypeScript 5.0+ (recommended)

### Project Structure

No additional dependencies needed! Everything you need is already in `expo-router`.

### Accessing Internal APIs

The interception APIs are located in internal source files:

```typescript
// Option 1: Direct import (if using source)
import { store } from 'expo-router/src/global-state/router-store';
import { routingQueue } from 'expo-router/src/global-state/routing';

// Option 2: Re-export in your codebase
// Create: src/utils/expo-router-internal.ts
export { store } from 'expo-router/src/global-state/router-store';
export { routingQueue } from 'expo-router/src/global-state/routing';
```

**Note:** These are internal APIs. While stable in practice, they may change between major versions. Always test after upgrading Expo Router.

---

## Your First Interceptor

### Step 1: Create a RouteObserver Class

```typescript
// src/utils/RouteObserver.ts
import { store } from 'expo-router/src/global-state/router-store';

export class RouteObserver {
  private unsubscribe?: () => void;

  start() {
    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      this.onRouteChange(route);
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  private onRouteChange(route: ReturnType<typeof store.getRouteInfo>) {
    console.log('📍 Route changed:', {
      pathname: route.pathname,
      params: route.params,
      segments: route.segments,
    });
  }
}
```

### Step 2: Initialize in Your App

```typescript
// app/_layout.tsx
import { RouteObserver } from '@/utils/RouteObserver';
import { useEffect } from 'react';

const observer = new RouteObserver();

export default function RootLayout() {
  useEffect(() => {
    observer.start();
    return () => observer.stop();
  }, []);

  return <Slot />;
}
```

### Step 3: Test It

```bash
# Start your app
npx expo start

# Navigate around and watch the console
```

You should see route change logs every time you navigate!

---

# Part II: Core Concepts

## Understanding the Navigation System

### The Three Layers of Expo Router

```
┌─────────────────────────────────────┐
│   Application Layer                 │
│   (Your code: <Link>, router.push) │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   Expo Router Layer                 │
│   (Routing queue, store, actions)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   React Navigation Layer            │
│   (State management, navigators)    │
└─────────────────────────────────────┘
```

### Navigation Flow Diagram

```
User Action
    │
    ├─ <Link href="/profile"> ──┐
    ├─ router.push("/profile") ─┤
    └─ Deep Link ───────────────┘
                                │
    ┌───────────────────────────▼────────────────────────┐
    │  linkTo() / routingQueue.add()                     │
    │  ⚡ INTERCEPTION POINT 1: routingQueue.subscribe() │
    └───────────────────────────┬────────────────────────┘
                                │
    ┌───────────────────────────▼────────────────────────┐
    │  useImperativeApiEmitter                           │
    │  (processes queue via useSyncExternalStore)        │
    └───────────────────────────┬────────────────────────┘
                                │
    ┌───────────────────────────▼────────────────────────┐
    │  navigationRef.dispatch(action)                    │
    │  ⚡ INTERCEPTION POINT 2: navigationRef.listener   │
    └───────────────────────────┬────────────────────────┘
                                │
    ┌───────────────────────────▼────────────────────────┐
    │  React Navigation State Change                     │
    │  ⚡ INTERCEPTION POINT 3: onStateChange callback   │
    └───────────────────────────┬────────────────────────┘
                                │
    ┌───────────────────────────▼────────────────────────┐
    │  store.onStateChange(newState)                     │
    │  ⚡ INTERCEPTION POINT 4: store.subscribe()        │
    └────────────────────────────────────────────────────┘
```

### Key Differences from Other Frameworks

| Aspect | React Router | Next.js Router | Expo Router |
|--------|-------------|----------------|-------------|
| **Architecture** | Browser history | Server-side | File-based + React Nav |
| **State Management** | History API | Custom | React Navigation + Store |
| **Interception** | history.listen() | middleware | store.subscribe() |
| **Native Support** | No | No | Yes ✅ |
| **Type Safety** | Partial | Partial | Full ✅ |

---

## The Four Interception Points

### Overview Table

| Point | Timing | Data Available | Use Case | Difficulty |
|-------|--------|----------------|----------|------------|
| **Router Store** | After navigation | Full route info | Analytics, logging | ⭐ Easy |
| **Routing Queue** | Before dispatch | Action intent | Pre-navigation tracking | ⭐⭐ Medium |
| **onStateChange** | After navigation | Navigation state | Integration with existing code | ⭐ Easy |
| **navigationRef** | After navigation | Raw RN state | Low-level debugging | ⭐⭐⭐ Advanced |

### 1. Router Store Subscription ⭐ **RECOMMENDED**

**When to use:**
- You want to track every completed navigation
- You need rich route information (pathname, params, segments)
- You're building analytics or dev tools
- You want the simplest, most reliable approach

**Pros:**
- ✅ Single subscription captures everything
- ✅ Clean, type-safe API
- ✅ Includes derived route information
- ✅ Works with React's concurrent features
- ✅ No performance overhead

**Cons:**
- ❌ Only triggers AFTER navigation completes
- ❌ Cannot prevent navigation
- ❌ Internal API (subject to change)

**Code Location:** `packages/expo-router/src/global-state/router-store.tsx:239-245`

---

### 2. Routing Queue Subscription

**When to use:**
- You need to observe navigation BEFORE it happens
- You're tracking user intent vs. actual navigation
- You're building pre-navigation analytics
- You want to see raw action objects

**Pros:**
- ✅ Fires before dispatch
- ✅ See the original action type (PUSH, REPLACE, etc.)
- ✅ Capture hrefs before resolution
- ✅ Useful for intent tracking

**Cons:**
- ❌ Actions may not complete (errors, redirects)
- ❌ Less rich data than store
- ❌ Need to handle action conversion logic

**Code Location:** `packages/expo-router/src/global-state/routing.ts:47-94`

---

### 3. onStateChange Callback

**When to use:**
- You're already using NavigationContainer
- You want standard React Navigation patterns
- You need access to full navigation state tree
- You're integrating with existing RN code

**Pros:**
- ✅ Standard React Navigation API
- ✅ Full navigation state tree
- ✅ Well-documented pattern
- ✅ Stable API

**Cons:**
- ❌ Requires modifying container setup
- ❌ Only one callback (must compose)
- ❌ Need to extract route info manually

**Code Location:** `packages/expo-router/src/ExpoRoot.tsx:165`

---

### 4. navigationRef Event Listener

**When to use:**
- You need low-level React Navigation events
- You're debugging complex navigation issues
- You want multiple event types ('state', 'options', etc.)
- You need fine-grained control

**Pros:**
- ✅ Low-level access
- ✅ Multiple event types
- ✅ Can have multiple listeners
- ✅ Direct from React Navigation

**Cons:**
- ❌ Most complex to use
- ❌ Need to handle state parsing
- ❌ Timing can be tricky
- ❌ Requires navigation ref access

**Code Location:** `packages/expo-router/src/fork/useLinking.ts:475`

---

## Route Information Schema

### UrlObject Type

When you call `store.getRouteInfo()`, you receive:

```typescript
type UrlObject = {
  // The full pathname of the current route
  pathname: string;
  // Example: "/profile/john-doe/posts"

  // Route parameters as key-value pairs
  params: Record<string, string | string[]>;
  // Example: { id: "john-doe", tab: "posts" }

  // Route segments as array
  segments: string[];
  // Example: ["profile", "[id]", "posts"]

  // Search/query parameters
  searchParams: URLSearchParams;
  // Example: URLSearchParams { "filter" => "recent", "page" => "2" }

  // Full href including search params
  unstable_globalHref: string;
  // Example: "/profile/john-doe/posts?filter=recent&page=2"

  // Pathname with resolved params (no search params)
  pathnameWithParams: string;
  // Example: "/profile/john-doe/posts"

  // Whether this is an index route
  isIndex: boolean;
  // Example: true for "/profile" if profile/index.tsx
};
```

### Example Values

```typescript
// For route: /profile/[id]/[tab]
// Navigated to: /profile/john-doe/posts?filter=recent

const route = store.getRouteInfo();

route.pathname
// => "/profile/john-doe/posts"

route.params
// => { id: "john-doe", tab: "posts", filter: "recent" }

route.segments
// => ["profile", "john-doe", "posts"]

route.searchParams.get('filter')
// => "recent"

route.unstable_globalHref
// => "/profile/john-doe/posts?filter=recent"

route.isIndex
// => false
```

---

## Navigation Action Types

### Action Type Reference

| Action Type | Trigger | Navigator | Behavior |
|------------|---------|-----------|----------|
| `NAVIGATE` | `router.navigate()`, `<Link>` | All | Smart navigation (may reuse screen) |
| `PUSH` | `router.push()`, `<Link push>` | Stack | Always create new screen |
| `REPLACE` | `router.replace()`, `<Link replace>` | Stack | Replace current screen |
| `GO_BACK` | `router.back()`, back button | Stack | Pop current screen |
| `POP` | `router.dismiss(n)` | Stack | Pop n screens |
| `POP_TO` | `router.dismissTo(href)` | Stack | Pop to specific route |
| `POP_TO_TOP` | `router.dismissAll()` | Stack | Dismiss all modals |
| `JUMP_TO` | Tab/Drawer navigation | Tab/Drawer | Switch to tab/drawer |
| `PRELOAD` | `router.prefetch(href)` | All | Background prefetch |

### Action Object Structure

#### LinkAction (before conversion)

```typescript
{
  type: 'ROUTER_LINK',
  payload: {
    href: '/profile/123',
    options: {
      event: 'PUSH',  // or 'NAVIGATE', 'REPLACE', etc.
      params: { ... },
      withAnchor: boolean,
      relativeToDirectory: string
    }
  }
}
```

#### NavigationAction (after conversion)

```typescript
{
  type: 'NAVIGATE',  // or 'PUSH', 'REPLACE', etc.
  target: 'stack-abc123',  // Navigator key
  payload: {
    name: 'profile',
    params: { id: '123' },
    screen: 'profile',
    params: { ... }
  }
}
```

---

# Part III: API Reference

## Router Store API

### Location
```typescript
import { store } from 'expo-router/src/global-state/router-store';
```

### Methods

#### `store.subscribe(callback: () => void): () => void`

Subscribe to all route changes. Returns an unsubscribe function.

**Parameters:**
- `callback` - Called whenever the route changes (no arguments)

**Returns:**
- Unsubscribe function

**Example:**
```typescript
const unsubscribe = store.subscribe(() => {
  console.log('Route changed!');
});

// Later
unsubscribe();
```

**Important Notes:**
- ✅ Callback is called AFTER navigation completes
- ✅ Safe to call `store.getRouteInfo()` inside callback
- ✅ Can have multiple subscribers
- ❌ Don't perform expensive operations in callback
- ❌ Don't trigger navigation inside callback (infinite loop risk)

---

#### `store.getRouteInfo(): UrlObject`

Get the current route information.

**Returns:**
- `UrlObject` with all route details

**Example:**
```typescript
const route = store.getRouteInfo();
console.log(route.pathname);  // "/profile/123"
console.log(route.params);    // { id: "123" }
```

**Important Notes:**
- ✅ Returns a cached object (cheap to call repeatedly)
- ✅ Reference equality when route hasn't changed
- ✅ Safe to call anytime after navigation is ready

---

#### `store.assertIsReady(): void`

Throws if navigation is not ready.

**Throws:**
- `Error` if navigation container hasn't mounted

**Example:**
```typescript
try {
  store.assertIsReady();
  const route = store.getRouteInfo();
} catch (e) {
  console.log('Navigation not ready yet');
}
```

---

#### `store.navigationRef: NavigationContainerRefWithCurrent`

Direct access to the React Navigation container ref.

**Use Cases:**
- Low-level navigation control
- Adding event listeners
- Accessing navigation state directly

**Example:**
```typescript
// Check if ready
if (store.navigationRef.isReady()) {
  // Get root state
  const state = store.navigationRef.getRootState();

  // Get current route
  const currentRoute = store.navigationRef.getCurrentRoute();

  // Add listener
  const unsubscribe = store.navigationRef.addListener('state', (e) => {
    console.log('State changed', e.data.state);
  });
}
```

---

### Properties

#### `store.state: NavigationState | PartialState<NavigationState>`

The current React Navigation state tree.

**Example:**
```typescript
console.log(store.state);
// {
//   key: 'root',
//   index: 0,
//   routes: [
//     { key: 'home', name: 'home' },
//     { key: 'profile', name: 'profile', params: { id: '123' } }
//   ]
// }
```

---

#### `store.routeNode: RouteNode | null`

The route tree generated from file structure.

---

#### `store.linking: ExpoLinkingOptions`

Deep linking configuration.

---

#### `store.redirects: StoreRedirects[]`

Array of redirect rules.

---

## Routing Queue API

### Location
```typescript
import { routingQueue } from 'expo-router/src/global-state/routing';
```

### Methods

#### `routingQueue.subscribe(callback: () => void): () => void`

Subscribe to navigation action queue changes.

**Parameters:**
- `callback` - Called when actions are added to queue

**Returns:**
- Unsubscribe function

**Example:**
```typescript
const unsubscribe = routingQueue.subscribe(() => {
  const actions = routingQueue.snapshot();
  console.log('Queued actions:', actions);
});
```

**Important Notes:**
- ✅ Fires BEFORE actions are dispatched
- ✅ Called synchronously when action added
- ✅ Can have multiple subscribers
- ❌ Queue may be empty if already processed
- ❌ Actions may fail or be redirected

---

#### `routingQueue.snapshot(): Array<NavigationAction | LinkAction>`

Get a snapshot of the current queue.

**Returns:**
- Array of pending actions

**Example:**
```typescript
routingQueue.subscribe(() => {
  const actions = routingQueue.snapshot();

  actions.forEach(action => {
    if (action.type === 'ROUTER_LINK') {
      console.log('Link navigation:', action.payload.href);
    } else {
      console.log('Direct action:', action.type);
    }
  });
});
```

---

#### `routingQueue.add(action): void`

Add an action to the queue (internal use only).

**⚠️ Warning:** Don't call this directly. Use `router.push()`, `<Link>`, etc.

---

#### `routingQueue.run(ref): void`

Process the queue (internal use only).

**⚠️ Warning:** Called by `useImperativeApiEmitter`. Don't call directly.

---

### Properties

#### `routingQueue.queue: Array<Action>`

The internal queue array.

**⚠️ Warning:** Don't modify directly. Use `snapshot()` instead.

---

#### `routingQueue.subscribers: Set<() => void>`

Internal subscriber set.

**⚠️ Warning:** Use `subscribe()` method instead.

---

## NavigationContainer API

### Location
```typescript
import { NavigationContainer } from 'expo-router/src/fork/NavigationContainer';
```

### Props

#### `onStateChange?: (state: NavigationState | undefined) => void`

Callback when navigation state changes.

**Example:**
```typescript
<NavigationContainer
  onStateChange={(state) => {
    console.log('Navigation state:', state);
  }}
>
  {children}
</NavigationContainer>
```

**Important Notes:**
- ✅ Called after every state change
- ✅ Receives full navigation state tree
- ❌ Only one callback supported (compose if needed)

---

#### `onReady?: () => void`

Callback when navigation is ready.

**Example:**
```typescript
<NavigationContainer
  onReady={() => {
    console.log('Navigation ready!');
  }}
>
  {children}
</NavigationContainer>
```

---

#### `onUnhandledAction?: (action: NavigationAction) => void`

Callback when an action isn't handled.

**Example:**
```typescript
<NavigationContainer
  onUnhandledAction={(action) => {
    console.warn('Unhandled action:', action);
  }}
>
  {children}
</NavigationContainer>
```

---

## NavigationRef Event API

### Location
```typescript
import { store } from 'expo-router/src/global-state/router-store';
const { navigationRef } = store;
```

### Methods

#### `navigationRef.addListener(type, callback): () => void`

Add a listener for navigation events.

**Event Types:**
- `'state'` - Navigation state changed
- `'options'` - Screen options changed
- `'focus'` - Screen focused
- `'blur'` - Screen blurred

**Example:**
```typescript
const unsubscribe = store.navigationRef.addListener('state', (e) => {
  console.log('State changed:', e.data.state);
});

// Later
unsubscribe();
```

**Important Notes:**
- ✅ Can have multiple listeners per event type
- ✅ Returns unsubscribe function
- ✅ Events fire after state change
- ❌ Must check `navigationRef.isReady()` first

---

#### `navigationRef.isReady(): boolean`

Check if navigation is ready.

**Returns:**
- `true` if navigation container has mounted

**Example:**
```typescript
if (store.navigationRef.isReady()) {
  // Safe to call navigation methods
  const state = store.navigationRef.getRootState();
}
```

---

#### `navigationRef.getRootState(): NavigationState`

Get the root navigation state.

**Returns:**
- Complete navigation state tree

**Example:**
```typescript
const state = store.navigationRef.getRootState();
console.log('Current routes:', state.routes);
```

---

#### `navigationRef.getCurrentRoute(): Route & { path?: string }`

Get the currently focused route.

**Returns:**
- Route object with optional path

**Example:**
```typescript
const currentRoute = store.navigationRef.getCurrentRoute();
console.log('Current route:', currentRoute.name);
console.log('Current path:', currentRoute.path);
```

---

# Part IV: Implementation Patterns

## Pattern: Simple Route Tracking

### Use Case
Log every route change for basic analytics.

### Implementation

```typescript
// utils/SimpleRouteTracker.ts
import { store } from 'expo-router/src/global-state/router-store';

export class SimpleRouteTracker {
  private unsubscribe?: () => void;

  start() {
    console.log('🚀 Starting route tracking');

    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();

      console.log('📍 Route changed:', {
        pathname: route.pathname,
        params: route.params,
        timestamp: new Date().toISOString()
      });

      // Send to analytics
      this.sendToAnalytics(route);
    });
  }

  stop() {
    console.log('🛑 Stopping route tracking');
    this.unsubscribe?.();
  }

  private sendToAnalytics(route: ReturnType<typeof store.getRouteInfo>) {
    // Your analytics implementation
    analytics.track('page_view', {
      page_path: route.pathname,
      page_params: route.params
    });
  }
}

// Usage in app/_layout.tsx
import { SimpleRouteTracker } from '@/utils/SimpleRouteTracker';

const tracker = new SimpleRouteTracker();

export default function RootLayout() {
  useEffect(() => {
    tracker.start();
    return () => tracker.stop();
  }, []);

  return <Slot />;
}
```

### What This Pattern Does
- ✅ Logs every route change
- ✅ Captures params and timestamp
- ✅ Sends to analytics service
- ✅ Cleans up on unmount

### When To Use
- Basic page view tracking
- Simple analytics integration
- Proof of concept

---

## Pattern: Pre-Navigation Analytics

### Use Case
Track navigation intent before the action is dispatched.

### Implementation

```typescript
// utils/PreNavigationTracker.ts
import { routingQueue } from 'expo-router/src/global-state/routing';

type NavigationIntent = {
  type: 'link' | 'imperative';
  action: string;
  href?: string;
  timestamp: number;
};

export class PreNavigationTracker {
  private unsubscribe?: () => void;
  private intents: NavigationIntent[] = [];

  start() {
    this.unsubscribe = routingQueue.subscribe(() => {
      const actions = routingQueue.snapshot();

      actions.forEach(action => {
        const intent = this.parseAction(action);
        this.intents.push(intent);
        this.trackIntent(intent);
      });
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  private parseAction(action: any): NavigationIntent {
    if (action.type === 'ROUTER_LINK') {
      return {
        type: 'link',
        action: action.payload.options.event || 'NAVIGATE',
        href: action.payload.href,
        timestamp: Date.now()
      };
    }

    return {
      type: 'imperative',
      action: action.type,
      timestamp: Date.now()
    };
  }

  private trackIntent(intent: NavigationIntent) {
    console.log('🎯 Navigation intent:', intent);

    analytics.track('navigation_intent', {
      intent_type: intent.type,
      action: intent.action,
      href: intent.href
    });
  }

  getIntents() {
    return this.intents;
  }
}
```

### What This Pattern Does
- ✅ Tracks before dispatch
- ✅ Distinguishes link vs. imperative
- ✅ Records action types
- ✅ Useful for A/B testing

### When To Use
- Measuring navigation intent vs. completion
- Tracking user behavior patterns
- Debugging navigation issues

---

## Pattern: Navigation History

### Use Case
Build a complete history of all navigations with timing data.

### Implementation

```typescript
// utils/NavigationHistory.ts
import { store } from 'expo-router/src/global-state/router-store';

type HistoryEntry = {
  pathname: string;
  params: Record<string, any>;
  timestamp: number;
  duration?: number;
};

export class NavigationHistory {
  private history: HistoryEntry[] = [];
  private unsubscribe?: () => void;
  private lastEntry?: HistoryEntry;

  start() {
    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      const now = Date.now();

      // Calculate duration on previous route
      if (this.lastEntry) {
        this.lastEntry.duration = now - this.lastEntry.timestamp;
      }

      // Create new entry
      const entry: HistoryEntry = {
        pathname: route.pathname,
        params: route.params,
        timestamp: now
      };

      this.history.push(entry);
      this.lastEntry = entry;

      console.log('📚 Navigation history:', {
        current: entry.pathname,
        historyLength: this.history.length,
        lastDuration: this.lastEntry?.duration
      });
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  getHistory() {
    return this.history;
  }

  getLastRoute() {
    return this.history[this.history.length - 1];
  }

  getPreviousRoute() {
    return this.history[this.history.length - 2];
  }

  getAverageTimeOnPage() {
    const durations = this.history
      .filter(entry => entry.duration)
      .map(entry => entry.duration!);

    if (durations.length === 0) return 0;

    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  getMostVisitedRoutes() {
    const counts = new Map<string, number>();

    this.history.forEach(entry => {
      counts.set(entry.pathname, (counts.get(entry.pathname) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  clearHistory() {
    this.history = [];
    this.lastEntry = undefined;
  }

  exportHistory() {
    return JSON.stringify(this.history, null, 2);
  }
}

// Usage
const history = new NavigationHistory();
history.start();

// Later, get insights
console.log('Average time on page:', history.getAverageTimeOnPage());
console.log('Most visited routes:', history.getMostVisitedRoutes());
```

### What This Pattern Does
- ✅ Complete navigation history
- ✅ Calculates time on each route
- ✅ Provides analytics methods
- ✅ Export capability

### When To Use
- Building dev tools
- User behavior analysis
- Session replay
- Performance monitoring

---

## Pattern: Route Guard/Blocker

### Use Case
React to navigation and optionally show confirmation dialogs.

**⚠️ Important:** You cannot PREVENT navigation, but you can detect it and navigate back.

### Implementation

```typescript
// utils/RouteGuard.ts
import { store } from 'expo-router/src/global-state/router-store';
import { router } from 'expo-router';
import { Alert } from 'react-native';

type GuardCondition = (route: ReturnType<typeof store.getRouteInfo>) => boolean;
type GuardAction = (route: ReturnType<typeof store.getRouteInfo>) => void;

export class RouteGuard {
  private unsubscribe?: () => void;
  private lastRoute?: string;
  private guards: Map<GuardCondition, GuardAction> = new Map();

  start() {
    const initialRoute = store.getRouteInfo();
    this.lastRoute = initialRoute.pathname;

    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();

      // Check if route actually changed
      if (route.pathname === this.lastRoute) {
        return;
      }

      // Run all guards
      for (const [condition, action] of this.guards) {
        if (condition(route)) {
          action(route);
        }
      }

      this.lastRoute = route.pathname;
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  addGuard(condition: GuardCondition, action: GuardAction) {
    this.guards.set(condition, action);
  }

  removeGuard(condition: GuardCondition) {
    this.guards.delete(condition);
  }
}

// Usage example: Confirm before leaving form
const guard = new RouteGuard();

// Add a guard for unsaved form changes
let hasUnsavedChanges = false;

guard.addGuard(
  (route) => hasUnsavedChanges,
  (route) => {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to leave?',
      [
        { text: 'Stay', onPress: () => router.back(), style: 'cancel' },
        {
          text: 'Leave',
          onPress: () => {
            hasUnsavedChanges = false;
          },
          style: 'destructive'
        }
      ]
    );
  }
);

guard.start();
```

### What This Pattern Does
- ✅ Detects navigation events
- ✅ Can show confirmation dialogs
- ✅ Can navigate back if needed
- ❌ Cannot prevent navigation (happens after)

### When To Use
- Form unsaved changes warning
- Premium content gates
- Session timeout redirects

### Important Notes
- Navigation has already occurred when guard runs
- Use `router.back()` to reverse if needed
- Consider UX carefully (navigation then back is jarring)

---

## Pattern: Performance Monitoring

### Use Case
Measure navigation performance and identify slow routes.

### Implementation

```typescript
// utils/PerformanceMonitor.ts
import { store } from 'expo-router/src/global-state/router-store';
import { routingQueue } from 'expo-router/src/global-state/routing';

type NavigationMetrics = {
  route: string;
  intentTime: number;
  completeTime: number;
  duration: number;
};

export class PerformanceMonitor {
  private unsubscribeQueue?: () => void;
  private unsubscribeStore?: () => void;
  private pendingNavigations = new Map<string, number>();
  private metrics: NavigationMetrics[] = [];

  start() {
    // Track intent
    this.unsubscribeQueue = routingQueue.subscribe(() => {
      const actions = routingQueue.snapshot();

      actions.forEach(action => {
        if (action.type === 'ROUTER_LINK') {
          const href = action.payload.href;
          this.pendingNavigations.set(href, performance.now());
        }
      });
    });

    // Track completion
    this.unsubscribeStore = store.subscribe(() => {
      const route = store.getRouteInfo();
      const completeTime = performance.now();

      const href = route.pathname;
      const intentTime = this.pendingNavigations.get(href);

      if (intentTime) {
        const duration = completeTime - intentTime;

        const metric: NavigationMetrics = {
          route: href,
          intentTime,
          completeTime,
          duration
        };

        this.metrics.push(metric);
        this.pendingNavigations.delete(href);

        console.log(`⏱️ Navigation to ${href} took ${duration.toFixed(2)}ms`);

        // Alert on slow navigations
        if (duration > 1000) {
          console.warn(`🐌 Slow navigation detected: ${href} (${duration}ms)`);
        }
      }
    });
  }

  stop() {
    this.unsubscribeQueue?.();
    this.unsubscribeStore?.();
  }

  getMetrics() {
    return this.metrics;
  }

  getSlowNavigations(threshold = 1000) {
    return this.metrics.filter(m => m.duration > threshold);
  }

  getAverageNavigationTime() {
    if (this.metrics.length === 0) return 0;

    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  getSlowestRoutes(count = 10) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }

  exportMetrics() {
    return {
      metrics: this.metrics,
      summary: {
        total: this.metrics.length,
        averageTime: this.getAverageNavigationTime(),
        slowNavigations: this.getSlowNavigations().length,
        slowestRoutes: this.getSlowestRoutes(5)
      }
    };
  }
}

// Usage
const monitor = new PerformanceMonitor();
monitor.start();

// Later, analyze performance
console.log('Performance summary:', monitor.exportMetrics());
```

### What This Pattern Does
- ✅ Measures navigation timing
- ✅ Identifies slow routes
- ✅ Provides performance analytics
- ✅ Alerts on slow navigations

### When To Use
- Performance optimization
- Identifying bottlenecks
- Production monitoring
- Development debugging

---

## Pattern: Deep Link Tracking

### Use Case
Track deep link usage and measure conversion.

### Implementation

```typescript
// utils/DeepLinkTracker.ts
import { store } from 'expo-router/src/global-state/router-store';
import * as Linking from 'expo-linking';

type DeepLinkEvent = {
  url: string;
  route: string;
  params: Record<string, any>;
  timestamp: number;
  source: 'initial' | 'background' | 'foreground';
};

export class DeepLinkTracker {
  private unsubscribeRoute?: () => void;
  private unsubscribeUrl?: ReturnType<typeof Linking.addEventListener>;
  private events: DeepLinkEvent[] = [];
  private awaitingFirstNavigation = false;
  private pendingUrl?: string;

  async start() {
    // Track initial URL
    const initialUrl = await Linking.getInitialURL();
    if (initialUrl) {
      this.pendingUrl = initialUrl;
      this.awaitingFirstNavigation = true;
    }

    // Listen for deep links
    this.unsubscribeUrl = Linking.addEventListener('url', ({ url }) => {
      this.pendingUrl = url;
      this.awaitingFirstNavigation = true;

      console.log('🔗 Deep link received:', url);
    });

    // Track when navigation occurs
    this.unsubscribeRoute = store.subscribe(() => {
      if (this.awaitingFirstNavigation && this.pendingUrl) {
        const route = store.getRouteInfo();

        const event: DeepLinkEvent = {
          url: this.pendingUrl,
          route: route.pathname,
          params: route.params,
          timestamp: Date.now(),
          source: this.events.length === 0 ? 'initial' : 'foreground'
        };

        this.events.push(event);
        this.awaitingFirstNavigation = false;
        this.pendingUrl = undefined;

        console.log('✅ Deep link navigated:', event);

        // Send to analytics
        this.trackDeepLink(event);
      }
    });
  }

  stop() {
    this.unsubscribeRoute?.();
    this.unsubscribeUrl?.remove();
  }

  private trackDeepLink(event: DeepLinkEvent) {
    analytics.track('deep_link_opened', {
      url: event.url,
      route: event.route,
      params: event.params,
      source: event.source
    });
  }

  getEvents() {
    return this.events;
  }

  getConversionRate() {
    // Calculate how many deep links successfully navigated
    return this.events.length > 0 ? 1.0 : 0.0;
  }
}

// Usage
const deepLinkTracker = new DeepLinkTracker();
deepLinkTracker.start();
```

### What This Pattern Does
- ✅ Tracks deep link opens
- ✅ Records resulting navigation
- ✅ Distinguishes initial vs. foreground
- ✅ Measures conversion

### When To Use
- Marketing campaign tracking
- Deep link debugging
- Attribution analysis
- User acquisition metrics

---

# Part V: Advanced Topics

## TypeScript Integration

### Full Type Definitions

```typescript
// types/expo-router-interception.ts

import type { NavigationState, PartialState } from '@react-navigation/native';

/**
 * Route information extracted from navigation state
 */
export type UrlObject = {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  searchParams: URLSearchParams;
  unstable_globalHref: string;
  pathnameWithParams: string;
  isIndex: boolean;
};

/**
 * Options passed to linkTo() function
 */
export type LinkToOptions = {
  event?: 'NAVIGATE' | 'PUSH' | 'REPLACE' | 'POP_TO' | 'PRELOAD';
  params?: Record<string, any>;
  withAnchor?: boolean;
  relativeToDirectory?: string;
  __internal__PreviewKey?: string;
};

/**
 * Link action before conversion to navigation action
 */
export type LinkAction = {
  type: 'ROUTER_LINK';
  payload: {
    href: string;
    options: LinkToOptions;
  };
};

/**
 * Direct navigation actions
 */
export type NavigationAction =
  | { type: 'NAVIGATE'; payload: any }
  | { type: 'PUSH'; payload: any }
  | { type: 'REPLACE'; payload: any }
  | { type: 'GO_BACK' }
  | { type: 'POP'; payload: { count: number } }
  | { type: 'POP_TO_TOP' };

/**
 * Router store interface
 */
export interface RouterStore {
  subscribe(callback: () => void): () => void;
  getRouteInfo(): UrlObject;
  assertIsReady(): void;
  navigationRef: any;  // NavigationContainerRefWithCurrent
  state: NavigationState | PartialState<NavigationState>;
  // ... other properties
}

/**
 * Routing queue interface
 */
export interface RoutingQueue {
  subscribe(callback: () => void): () => void;
  snapshot(): Array<NavigationAction | LinkAction>;
  add(action: NavigationAction | LinkAction): void;
  run(ref: any): void;
  queue: Array<NavigationAction | LinkAction>;
  subscribers: Set<() => void>;
}
```

### Strongly Typed Interceptor

```typescript
// utils/TypedRouteObserver.ts
import type { UrlObject, RouterStore } from '@/types/expo-router-interception';

export class TypedRouteObserver<
  TRoutes extends Record<string, any> = Record<string, never>
> {
  private unsubscribe?: () => void;

  constructor(
    private store: RouterStore,
    private onRouteChange: (route: UrlObject) => void
  ) {}

  start() {
    this.unsubscribe = this.store.subscribe(() => {
      const route = this.store.getRouteInfo();
      this.onRouteChange(route);
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  // Type-safe route checking
  isRoute<K extends keyof TRoutes>(
    pathname: string,
    routeName: K
  ): boolean {
    return pathname.startsWith(`/${String(routeName)}`);
  }
}

// Usage with typed routes
type AppRoutes = {
  'profile': { id: string };
  'settings': { tab?: string };
  'home': {};
};

const observer = new TypedRouteObserver<AppRoutes>(
  store,
  (route) => {
    if (observer.isRoute(route.pathname, 'profile')) {
      const id = route.params.id as string;
      console.log('Profile ID:', id);
    }
  }
);
```

---

## React Hooks for Interception

### useRouteObserver Hook

```typescript
// hooks/useRouteObserver.ts
import { useEffect, useRef } from 'react';
import { store } from 'expo-router/src/global-state/router-store';

export function useRouteObserver(
  callback: (route: ReturnType<typeof store.getRouteInfo>) => void,
  deps: React.DependencyList = []
) {
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      callbackRef.current(route);
    });

    return unsubscribe;
  }, deps);
}

// Usage
function MyComponent() {
  useRouteObserver((route) => {
    console.log('Route changed:', route.pathname);
  });

  return <View>...</View>;
}
```

### useNavigationHistory Hook

```typescript
// hooks/useNavigationHistory.ts
import { useState, useEffect } from 'react';
import { store } from 'expo-router/src/global-state/router-store';

type HistoryEntry = {
  pathname: string;
  timestamp: number;
};

export function useNavigationHistory(maxLength = 50) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();

      setHistory(prev => {
        const newEntry: HistoryEntry = {
          pathname: route.pathname,
          timestamp: Date.now()
        };

        const updated = [...prev, newEntry];

        // Keep only last maxLength entries
        if (updated.length > maxLength) {
          updated.shift();
        }

        return updated;
      });
    });

    return unsubscribe;
  }, [maxLength]);

  return {
    history,
    currentRoute: history[history.length - 1],
    previousRoute: history[history.length - 2],
    clearHistory: () => setHistory([])
  };
}

// Usage
function MyComponent() {
  const { history, currentRoute, previousRoute } = useNavigationHistory();

  return (
    <View>
      <Text>Current: {currentRoute?.pathname}</Text>
      <Text>Previous: {previousRoute?.pathname}</Text>
      <Text>History length: {history.length}</Text>
    </View>
  );
}
```

### useRouteAnalytics Hook

```typescript
// hooks/useRouteAnalytics.ts
import { useEffect, useRef } from 'react';
import { store } from 'expo-router/src/global-state/router-store';

export function useRouteAnalytics() {
  const entryTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      const now = Date.now();
      const timeOnPage = now - entryTimeRef.current;

      // Track page view
      analytics.track('page_view', {
        page_path: route.pathname,
        page_params: route.params,
        time_on_previous_page: timeOnPage
      });

      entryTimeRef.current = now;
    });

    return () => {
      // Track final time on page
      const timeOnPage = Date.now() - entryTimeRef.current;
      analytics.track('page_exit', {
        time_on_page: timeOnPage
      });

      unsubscribe();
    };
  }, []);
}

// Usage
function RootLayout() {
  useRouteAnalytics();

  return <Slot />;
}
```

---

## Server-Side Considerations

### SSR Compatibility

Routing interception works differently on the server:

```typescript
// utils/UniversalRouteObserver.ts
import { Platform } from 'react-native';

export class UniversalRouteObserver {
  start() {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      // Server-side: no-op or limited functionality
      console.log('Route observer disabled on server');
      return () => {};
    }

    // Client-side: full functionality
    const { store } = require('expo-router/src/global-state/router-store');

    return store.subscribe(() => {
      const route = store.getRouteInfo();
      this.onRouteChange(route);
    });
  }

  private onRouteChange(route: any) {
    // Your implementation
  }
}
```

### Hydration Considerations

```typescript
// hooks/useClientOnlyRouteObserver.ts
import { useEffect, useState } from 'react';
import { store } from 'expo-router/src/global-state/router-store';

export function useClientOnlyRouteObserver(
  callback: (route: any) => void
) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      callback(route);
    });

    return unsubscribe;
  }, [isClient, callback]);
}
```

---

## Testing Your Interceptors

### Jest Test Example

```typescript
// __tests__/RouteObserver.test.ts
import { store } from 'expo-router/src/global-state/router-store';
import { RouteObserver } from '@/utils/RouteObserver';

// Mock expo-router
jest.mock('expo-router/src/global-state/router-store', () => {
  const subscribers = new Set<() => void>();

  return {
    store: {
      subscribe: jest.fn((callback) => {
        subscribers.add(callback);
        return () => subscribers.delete(callback);
      }),
      getRouteInfo: jest.fn(() => ({
        pathname: '/test',
        params: {},
        segments: ['test'],
        searchParams: new URLSearchParams(),
        unstable_globalHref: '/test',
        pathnameWithParams: '/test',
        isIndex: false
      })),
      // Mock method to trigger subscribers
      __triggerChange: () => {
        subscribers.forEach(cb => cb());
      }
    }
  };
});

describe('RouteObserver', () => {
  let observer: RouteObserver;
  let mockCallback: jest.Mock;

  beforeEach(() => {
    mockCallback = jest.fn();
    observer = new RouteObserver();
    observer.onRouteChange = mockCallback;
  });

  afterEach(() => {
    observer.stop();
    jest.clearAllMocks();
  });

  it('should subscribe on start', () => {
    observer.start();
    expect(store.subscribe).toHaveBeenCalled();
  });

  it('should call callback on route change', () => {
    observer.start();

    // Trigger a route change
    (store as any).__triggerChange();

    expect(mockCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/test'
      })
    );
  });

  it('should unsubscribe on stop', () => {
    observer.start();
    const unsubscribe = (store.subscribe as jest.Mock).mock.results[0].value;

    observer.stop();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
```

### React Testing Library Example

```typescript
// __tests__/useRouteObserver.test.tsx
import { renderHook } from '@testing-library/react-hooks';
import { useRouteObserver } from '@/hooks/useRouteObserver';
import { store } from 'expo-router/src/global-state/router-store';

jest.mock('expo-router/src/global-state/router-store');

describe('useRouteObserver', () => {
  it('should observe route changes', () => {
    const callback = jest.fn();

    const { unmount } = renderHook(() => useRouteObserver(callback));

    // Simulate route change
    (store as any).__triggerChange();

    expect(callback).toHaveBeenCalled();

    unmount();
  });
});
```

---

## Performance Optimization

### Debouncing Route Changes

```typescript
// utils/DebouncedRouteObserver.ts
import { store } from 'expo-router/src/global-state/router-store';

export class DebouncedRouteObserver {
  private unsubscribe?: () => void;
  private timeoutId?: NodeJS.Timeout;

  constructor(
    private callback: (route: any) => void,
    private delay = 300
  ) {}

  start() {
    this.unsubscribe = store.subscribe(() => {
      // Clear previous timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Set new timeout
      this.timeoutId = setTimeout(() => {
        const route = store.getRouteInfo();
        this.callback(route);
      }, this.delay);
    });
  }

  stop() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.unsubscribe?.();
  }
}
```

### Conditional Subscription

Only subscribe when needed:

```typescript
// utils/ConditionalRouteObserver.ts
import { store } from 'expo-router/src/global-state/router-store';

export class ConditionalRouteObserver {
  private unsubscribe?: () => void;

  start(condition: boolean) {
    if (!condition) {
      console.log('Skipping route observation');
      return;
    }

    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      // Your logic
    });
  }

  stop() {
    this.unsubscribe?.();
  }
}

// Usage
const observer = new ConditionalRouteObserver();

// Only observe in development
observer.start(__DEV__);
```

### Memoized Route Info

Avoid expensive computations on every route change:

```typescript
// utils/MemoizedRouteObserver.ts
import { store } from 'expo-router/src/global-state/router-store';

export class MemoizedRouteObserver {
  private lastPathname?: string;
  private unsubscribe?: () => void;

  start() {
    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();

      // Only process if pathname actually changed
      if (route.pathname === this.lastPathname) {
        return;
      }

      this.lastPathname = route.pathname;
      this.processRoute(route);
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  private processRoute(route: any) {
    // Expensive operation only runs when pathname changes
    console.log('Processing new route:', route.pathname);
  }
}
```

---

# Part VI: Best Practices

## What TO Do

### ✅ 1. Always Clean Up Subscriptions

```typescript
// ✅ GOOD
export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      // Your logic
    });

    return () => unsubscribe(); // Clean up on unmount
  }, []);

  return <Slot />;
}
```

```typescript
// ❌ BAD - Memory leak!
export default function RootLayout() {
  useEffect(() => {
    store.subscribe(() => {
      // Your logic
    });
    // No cleanup!
  }, []);

  return <Slot />;
}
```

---

### ✅ 2. Use store.subscribe() for Most Cases

```typescript
// ✅ GOOD - Simple and reliable
const unsubscribe = store.subscribe(() => {
  const route = store.getRouteInfo();
  console.log(route.pathname);
});
```

```typescript
// ❌ OKAY BUT UNNECESSARY - More complex
const unsubscribe = routingQueue.subscribe(() => {
  const actions = routingQueue.snapshot();
  // Have to process actions manually
});
```

---

### ✅ 3. Keep Callbacks Fast

```typescript
// ✅ GOOD - Fast, non-blocking
store.subscribe(() => {
  const route = store.getRouteInfo();
  analytics.track('page_view', { path: route.pathname });
});
```

```typescript
// ❌ BAD - Slow operation blocks navigation
store.subscribe(() => {
  const route = store.getRouteInfo();

  // Expensive synchronous operation
  const data = processLargeDataset();

  // Slow network request
  fetch('/api/track', {
    method: 'POST',
    body: JSON.stringify(data)
  });
});
```

**Better:**
```typescript
// ✅ GOOD - Async operations don't block
store.subscribe(() => {
  const route = store.getRouteInfo();

  // Schedule for later
  queueMicrotask(async () => {
    const data = await processLargeDataset();
    await fetch('/api/track', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  });
});
```

---

### ✅ 4. Check If Ready Before Accessing navigationRef

```typescript
// ✅ GOOD
if (store.navigationRef.isReady()) {
  const state = store.navigationRef.getRootState();
  // Use state
}
```

```typescript
// ❌ BAD - May throw error
const state = store.navigationRef.getRootState();
```

---

### ✅ 5. Use TypeScript

```typescript
// ✅ GOOD - Type-safe
import type { UrlObject } from '@/types/expo-router-interception';

function trackRoute(route: UrlObject) {
  console.log(route.pathname); // Autocomplete works!
}

store.subscribe(() => {
  const route = store.getRouteInfo();
  trackRoute(route);
});
```

---

## What NOT To Do

### ❌ 1. Don't Trigger Navigation Inside Subscription

```typescript
// ❌ BAD - Infinite loop!
store.subscribe(() => {
  const route = store.getRouteInfo();

  if (route.pathname === '/profile') {
    router.push('/settings'); // This triggers another subscription call!
  }
});
```

**Better:**
```typescript
// ✅ GOOD - Guard against infinite loops
let isNavigating = false;

store.subscribe(() => {
  if (isNavigating) return;

  const route = store.getRouteInfo();

  if (route.pathname === '/profile') {
    isNavigating = true;
    router.push('/settings');

    // Reset after navigation completes
    setTimeout(() => {
      isNavigating = false;
    }, 100);
  }
});
```

---

### ❌ 2. Don't Store Route Info in State

```typescript
// ❌ BAD - Stale data
const [currentRoute, setCurrentRoute] = useState<UrlObject | null>(null);

useEffect(() => {
  store.subscribe(() => {
    const route = store.getRouteInfo();
    setCurrentRoute(route); // Unnecessary state
  });
}, []);
```

**Better:**
```typescript
// ✅ GOOD - Just read it when needed
useEffect(() => {
  store.subscribe(() => {
    const route = store.getRouteInfo(); // Always fresh
    console.log(route.pathname);
  });
}, []);
```

---

### ❌ 3. Don't Subscribe Multiple Times

```typescript
// ❌ BAD - Creates multiple subscriptions
function MyComponent() {
  useEffect(() => {
    store.subscribe(() => {
      console.log('Subscription 1');
    });

    store.subscribe(() => {
      console.log('Subscription 2');
    });

    store.subscribe(() => {
      console.log('Subscription 3');
    });
  }, []);

  return <View />;
}
```

**Better:**
```typescript
// ✅ GOOD - Single subscription
function MyComponent() {
  useEffect(() => {
    return store.subscribe(() => {
      console.log('Single subscription');
      // Do all your work here
    });
  }, []);

  return <View />;
}
```

---

### ❌ 4. Don't Try to Prevent Navigation

```typescript
// ❌ BAD - This won't work
store.subscribe(() => {
  const route = store.getRouteInfo();

  if (route.pathname === '/premium' && !user.isPremium) {
    return false; // Doesn't prevent navigation
  }
});
```

**Reality:**
- Navigation has ALREADY happened when subscription fires
- You cannot return false to prevent it
- You CAN navigate back if needed (but it's jarring UX)

**Better approach:**
```typescript
// ✅ GOOD - Use route components to check access
// app/premium.tsx
export default function PremiumScreen() {
  const user = useUser();

  if (!user.isPremium) {
    return <Redirect href="/subscribe" />;
  }

  return <PremiumContent />;
}
```

---

### ❌ 5. Don't Forget About Memory Leaks

```typescript
// ❌ BAD - Creates new subscription on every render
function MyComponent() {
  store.subscribe(() => {
    console.log('Route changed');
  });

  return <View />;
}
```

**Better:**
```typescript
// ✅ GOOD - Subscription only created once
function MyComponent() {
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      console.log('Route changed');
    });

    return unsubscribe;
  }, []); // Empty deps - runs once

  return <View />;
}
```

---

## Common Pitfalls

### Pitfall 1: Navigation Not Ready

**Problem:**
```typescript
// Error: Navigation not ready
const route = store.getRouteInfo();
console.log(route.pathname);
```

**Solution:**
```typescript
// Wait for ready
useEffect(() => {
  const checkReady = setInterval(() => {
    if (store.navigationRef.isReady()) {
      clearInterval(checkReady);

      const route = store.getRouteInfo();
      console.log(route.pathname);
    }
  }, 100);

  return () => clearInterval(checkReady);
}, []);
```

---

### Pitfall 2: Stale Closures

**Problem:**
```typescript
let count = 0;

useEffect(() => {
  store.subscribe(() => {
    console.log(count); // Always logs 0!
  });
}, []);

// Later...
count = 5;
```

**Solution:**
```typescript
const countRef = useRef(0);

useEffect(() => {
  store.subscribe(() => {
    console.log(countRef.current); // Always current value
  });
}, []);

// Later...
countRef.current = 5;
```

---

### Pitfall 3: Race Conditions

**Problem:**
```typescript
store.subscribe(async () => {
  const route = store.getRouteInfo();

  // Slow async operation
  await delay(1000);

  // Route may have changed!
  console.log('Tracked:', route.pathname);
});
```

**Solution:**
```typescript
let latestRoute: string;

store.subscribe(() => {
  const route = store.getRouteInfo();
  latestRoute = route.pathname;

  (async () => {
    const routeToTrack = latestRoute;

    await delay(1000);

    // Only track if still on same route
    if (latestRoute === routeToTrack) {
      console.log('Tracked:', routeToTrack);
    }
  })();
});
```

---

## Debugging Guide

### Enable Verbose Logging

```typescript
// utils/VerboseRouteObserver.ts
import { store } from 'expo-router/src/global-state/router-store';
import { routingQueue } from 'expo-router/src/global-state/routing';

export class VerboseRouteObserver {
  start() {
    console.log('🔍 Verbose route observation started');

    // Log queue actions
    routingQueue.subscribe(() => {
      const actions = routingQueue.snapshot();
      console.log('📦 Queue actions:', actions);
    });

    // Log route changes
    store.subscribe(() => {
      const route = store.getRouteInfo();
      console.log('📍 Route changed:', {
        pathname: route.pathname,
        params: route.params,
        segments: route.segments,
        href: route.unstable_globalHref,
        isIndex: route.isIndex
      });
    });

    // Log state changes
    store.navigationRef.addListener('state', (e) => {
      console.log('🔄 Navigation state:', e.data.state);
    });
  }
}

// Usage
if (__DEV__) {
  const verbose = new VerboseRouteObserver();
  verbose.start();
}
```

### Inspect Navigation State

```typescript
// Log full navigation state tree
if (store.navigationRef.isReady()) {
  const state = store.navigationRef.getRootState();
  console.log('Navigation state tree:', JSON.stringify(state, null, 2));
}
```

### Check Subscription Count

```typescript
// See how many subscriptions are active
console.log('Active subscriptions:', (routingQueue as any).subscribers.size);
```

### Verify Cleanup

```typescript
// Track subscriptions
const subscriptions = new Set();

function trackingSubscribe(callback: () => void) {
  const unsubscribe = store.subscribe(callback);

  subscriptions.add(unsubscribe);

  return () => {
    subscriptions.delete(unsubscribe);
    unsubscribe();
  };
}

// Later, check for leaks
console.log('Active subscriptions:', subscriptions.size);
```

---

# Part VII: Reference

## Complete Code Examples

### Full DevTools Implementation

```typescript
// devtools/ExpoRouterDevtools.ts
import { store } from 'expo-router/src/global-state/router-store';
import { routingQueue } from 'expo-router/src/global-state/routing';

type DevtoolsEvent = {
  id: string;
  type: 'intent' | 'complete' | 'error';
  timestamp: number;
  data: any;
};

export class ExpoRouterDevtools {
  private events: DevtoolsEvent[] = [];
  private unsubscribers: Array<() => void> = [];
  private maxEvents = 1000;

  start() {
    console.log('🛠️ Expo Router Devtools started');

    // Track intents
    this.unsubscribers.push(
      routingQueue.subscribe(() => {
        const actions = routingQueue.snapshot();

        actions.forEach(action => {
          this.addEvent({
            id: Math.random().toString(36),
            type: 'intent',
            timestamp: Date.now(),
            data: action
          });
        });
      })
    );

    // Track completions
    this.unsubscribers.push(
      store.subscribe(() => {
        const route = store.getRouteInfo();

        this.addEvent({
          id: Math.random().toString(36),
          type: 'complete',
          timestamp: Date.now(),
          data: {
            pathname: route.pathname,
            params: route.params,
            href: route.unstable_globalHref
          }
        });
      })
    );

    // Track errors
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('navigation')) {
        this.addEvent({
          id: Math.random().toString(36),
          type: 'error',
          timestamp: Date.now(),
          data: args
        });
      }
      originalError(...args);
    };
  }

  stop() {
    console.log('🛠️ Expo Router Devtools stopped');
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
  }

  private addEvent(event: DevtoolsEvent) {
    this.events.push(event);

    // Limit size
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log in dev
    if (__DEV__) {
      const emoji = event.type === 'intent' ? '🎯' : event.type === 'complete' ? '✅' : '❌';
      console.log(`${emoji} [${event.type}]`, event.data);
    }
  }

  getEvents() {
    return this.events;
  }

  getEventsByType(type: DevtoolsEvent['type']) {
    return this.events.filter(e => e.type === type);
  }

  clearEvents() {
    this.events = [];
  }

  exportJSON() {
    return JSON.stringify(this.events, null, 2);
  }

  getStats() {
    return {
      total: this.events.length,
      intents: this.getEventsByType('intent').length,
      completions: this.getEventsByType('complete').length,
      errors: this.getEventsByType('error').length,
      firstEvent: this.events[0]?.timestamp,
      lastEvent: this.events[this.events.length - 1]?.timestamp
    };
  }
}

// Usage in app/_layout.tsx
import { ExpoRouterDevtools } from '@/devtools/ExpoRouterDevtools';

const devtools = __DEV__ ? new ExpoRouterDevtools() : null;

export default function RootLayout() {
  useEffect(() => {
    devtools?.start();
    return () => devtools?.stop();
  }, []);

  return <Slot />;
}
```

---

## Type Definitions

See [TypeScript Integration](#typescript-integration) section for complete types.

---

## Migration Guide

### From React Navigation Listeners

**Before (React Navigation):**
```typescript
const unsubscribe = navigation.addListener('state', (e) => {
  const state = e.data.state;
  console.log(state);
});
```

**After (Expo Router Store):**
```typescript
const unsubscribe = store.subscribe(() => {
  const route = store.getRouteInfo();
  console.log(route.pathname);
});
```

### From URL Parsing

**Before (Manual parsing):**
```typescript
const url = window.location.pathname;
const segments = url.split('/').filter(Boolean);
const params = new URLSearchParams(window.location.search);
```

**After (Expo Router Store):**
```typescript
const route = store.getRouteInfo();
// route.pathname, route.segments, route.searchParams all available
```

---

## FAQ

### Q: Is this API stable?

**A:** The APIs are internal to Expo Router and may change between major versions. However, the patterns and concepts are stable. Always test after upgrading.

---

### Q: Can I prevent navigation?

**A:** No. Subscriptions fire AFTER navigation completes. You can navigate back if needed, but cannot prevent the original navigation.

---

### Q: Does this work on native (iOS/Android)?

**A:** Yes! It works on all platforms: iOS, Android, and Web.

---

### Q: What's the performance impact?

**A:** Minimal to zero when not subscribed. Subscriptions are cheap. Keep callbacks fast for best performance.

---

### Q: Can I use this in production?

**A:** Yes, but be aware these are internal APIs. Monitor Expo Router release notes for changes.

---

### Q: How do I debug subscription issues?

**A:** Use the [Debugging Guide](#debugging-guide) section. Enable verbose logging and inspect navigation state.

---

### Q: Can I have multiple subscribers?

**A:** Yes! You can subscribe as many times as needed. Each subscription is independent.

---

### Q: Does this work with React Server Components?

**A:** Subscriptions only work on the client. See [Server-Side Considerations](#server-side-considerations).

---

### Q: How do I test interceptors?

**A:** See [Testing Your Interceptors](#testing-your-interceptors) for Jest and React Testing Library examples.

---

## Conclusion

You now have a complete understanding of Expo Router's event interception system. Key takeaways:

1. **Use `store.subscribe()`** for most cases - it's simple and reliable
2. **Always clean up** subscriptions to avoid memory leaks
3. **Keep callbacks fast** to maintain smooth navigation
4. **You cannot prevent navigation** - only observe and react
5. **TypeScript support** makes it safer and easier

**Recommended Reading Order:**
1. Quick Start → Your First Interceptor
2. Router Store API → Pattern: Simple Route Tracking
3. What TO Do → What NOT To Do
4. Pick a pattern that fits your use case
5. Refer to API Reference as needed

Happy routing! 🎉
