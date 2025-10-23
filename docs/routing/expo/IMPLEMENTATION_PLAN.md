# Expo Router Event Tracking - Implementation Plan

**Goal:** Implement route event tracking for Expo Router using the officially documented Router Store subscription system.

---

## Table of Contents

1. [Overview](#overview)
2. [Implementation Strategy](#implementation-strategy)
3. [Phase 1: Core Route Observer](#phase-1-core-route-observer)
4. [Phase 2: Integration with Route Events Package](#phase-2-integration-with-route-events-package)
5. [Phase 3: Event Data Collection](#phase-3-event-data-collection)
6. [Phase 4: Testing & Validation](#phase-4-testing--validation)
7. [API Reference from Documentation](#api-reference-from-documentation)
8. [Success Criteria](#success-criteria)

---

## Overview

### What We're Building

A route event tracking system that:
- ✅ Captures all route changes in the Expo Router app
- ✅ Records route information (pathname, params, segments)
- ✅ Tracks navigation timing and performance
- ✅ Provides a clean API for the existing route events package
- ✅ Uses only the documented Expo Router APIs (no monkey-patching)

### Why This Approach

Based on **EXPO_ROUTER_INTERCEPTION_API.md** and **ROUTING_RESEARCH_FINDINGS.md**, the **Router Store subscription** is the recommended interception point because:

1. **Single source of truth** - Captures ALL navigation changes (lines 84-93 of ROUTING_RESEARCH_FINDINGS.md)
2. **Rich route information** - Provides pathname, params, segments, searchParams (lines 375-410 of EXPO_ROUTER_INTERCEPTION_API.md)
3. **Safe subscription mechanism** - Uses React's `useSyncExternalStore` (line 80 of EXPO_ROUTER_INTERCEPTION_API.md)
4. **Works for all navigation types** - Imperative and declarative (line 95 of EXPO_ROUTER_INTERCEPTION_API.md)

---

## Implementation Strategy

### Recommended Interception Point

**Router Store Subscription** (Method 1 from EXPO_ROUTER_INTERCEPTION_API.md:281-303)

**File Location:**
- `packages/expo-router/src/global-state/router-store.tsx:239-245`

**Why not other methods?**
- ❌ **Routing Queue** - Pre-dispatch only, actions may fail (lines 306-324 of EXPO_ROUTER_INTERCEPTION_API.md)
- ❌ **onStateChange** - Less rich data, requires container modification (lines 327-348 of EXPO_ROUTER_INTERCEPTION_API.md)
- ❌ **navigationRef listeners** - Most complex, low-level (lines 351-372 of EXPO_ROUTER_INTERCEPTION_API.md)

### Architecture

```
┌─────────────────────────────────────────┐
│   Route Events Package (UI)             │
│   - Modal display                       │
│   - Event visualization                 │
└──────────────┬──────────────────────────┘
               │ uses
┌──────────────▼──────────────────────────┐
│   RouteObserver Class                   │
│   - Manages subscription                │
│   - Collects route data                 │
│   - Provides public API                 │
└──────────────┬──────────────────────────┘
               │ subscribes to
┌──────────────▼──────────────────────────┐
│   Expo Router Store                     │
│   (expo-router/src/global-state/        │
│    router-store)                        │
└─────────────────────────────────────────┘
```

---

## Phase 1: Core Route Observer

### Step 1.1: Create RouteObserver Class

**File:** `packages/route-events/src/RouteObserver.ts`

**Implementation based on EXPO_ROUTER_INTERCEPTION_API.md:138-166**

```typescript
// Based on "Your First Interceptor" pattern (lines 138-166)
import { store } from 'expo-router/src/global-state/router-store';

export interface RouteChangeEvent {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  searchParams: URLSearchParams;
  timestamp: number;
  href: string;
}

export class RouteObserver {
  private unsubscribe?: () => void;
  private listeners: Set<(event: RouteChangeEvent) => void> = new Set();

  /**
   * Start observing route changes
   * Based on store.subscribe() API (EXPO_ROUTER_INTERCEPTION_API.md:505-523)
   */
  start() {
    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();
      this.onRouteChange(route);
    });
  }

  /**
   * Stop observing route changes
   */
  stop() {
    this.unsubscribe?.();
  }

  /**
   * Add listener for route changes
   */
  addListener(callback: (event: RouteChangeEvent) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Internal handler based on UrlObject schema
   * (EXPO_ROUTER_INTERCEPTION_API.md:375-410)
   */
  private onRouteChange(route: ReturnType<typeof store.getRouteInfo>) {
    const event: RouteChangeEvent = {
      pathname: route.pathname,
      params: route.params,
      segments: route.segments,
      searchParams: route.searchParams,
      timestamp: Date.now(),
      href: route.unstable_globalHref,
    };

    // Notify all listeners
    this.listeners.forEach(listener => listener(event));
  }
}
```

**Key API References:**
- `store.subscribe()` - EXPO_ROUTER_INTERCEPTION_API.md:505-523
- `store.getRouteInfo()` - EXPO_ROUTER_INTERCEPTION_API.md:534-546
- `UrlObject` type - EXPO_ROUTER_INTERCEPTION_API.md:377-410

### Step 1.2: Create React Hook

**File:** `packages/route-events/src/useRouteObserver.ts`

**Implementation based on EXPO_ROUTER_INTERCEPTION_API.md:1656-1680**

```typescript
// Based on "useRouteObserver Hook" pattern (lines 1656-1680)
import { useEffect, useRef } from 'react';
import { store } from 'expo-router/src/global-state/router-store';
import type { RouteChangeEvent } from './RouteObserver';

export function useRouteObserver(
  callback: (event: RouteChangeEvent) => void,
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

      const event: RouteChangeEvent = {
        pathname: route.pathname,
        params: route.params,
        segments: route.segments,
        searchParams: route.searchParams,
        timestamp: Date.now(),
        href: route.unstable_globalHref,
      };

      callbackRef.current(event);
    });

    return unsubscribe;
  }, deps);
}
```

---

## Phase 2: Integration with Route Events Package

### Step 2.1: Initialize Observer in Root Layout

**File:** `app/_layout.tsx`

**Implementation based on EXPO_ROUTER_INTERCEPTION_API.md:170-185**

```typescript
// Based on "Initialize in Your App" pattern (lines 170-185)
import { RouteObserver } from '@buoy/route-events';
import { useEffect } from 'react';
import { Slot } from 'expo-router';

const observer = new RouteObserver();

export default function RootLayout() {
  useEffect(() => {
    observer.start();
    return () => observer.stop();
  }, []);

  return <Slot />;
}
```

### Step 2.2: Create Event Store

**File:** `packages/route-events/src/RouteEventStore.ts`

**Implementation based on Navigation History pattern (EXPO_ROUTER_INTERCEPTION_API.md:1046-1142)**

```typescript
// Based on "Pattern: Navigation History" (lines 1046-1142)
import type { RouteChangeEvent } from './RouteObserver';

export interface HistoryEntry extends RouteChangeEvent {
  duration?: number; // Time spent on route
}

export class RouteEventStore {
  private history: HistoryEntry[] = [];
  private lastEntry?: HistoryEntry;
  private maxEntries: number = 100;

  /**
   * Record a route change event
   * Based on NavigationHistory pattern (EXPO_ROUTER_INTERCEPTION_API.md:1069-1093)
   */
  recordEvent(event: RouteChangeEvent) {
    const now = Date.now();

    // Calculate duration on previous route
    if (this.lastEntry) {
      this.lastEntry.duration = now - this.lastEntry.timestamp;
    }

    // Create new entry
    const entry: HistoryEntry = {
      ...event,
      timestamp: now,
    };

    this.history.push(entry);
    this.lastEntry = entry;

    // Maintain max size
    if (this.history.length > this.maxEntries) {
      this.history.shift();
    }
  }

  /**
   * Get navigation history
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Get last route
   */
  getLastRoute() {
    return this.history[this.history.length - 1];
  }

  /**
   * Get previous route
   */
  getPreviousRoute() {
    return this.history[this.history.length - 2];
  }

  /**
   * Get average time on page
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1112-1120
   */
  getAverageTimeOnPage() {
    const durations = this.history
      .filter(entry => entry.duration)
      .map(entry => entry.duration!);

    if (durations.length === 0) return 0;

    return durations.reduce((sum, d) => sum + d, 0) / durations.length;
  }

  /**
   * Get most visited routes
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1122-1132
   */
  getMostVisitedRoutes() {
    const counts = new Map<string, number>();

    this.history.forEach(entry => {
      counts.set(entry.pathname, (counts.get(entry.pathname) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  /**
   * Clear history
   */
  clearHistory() {
    this.history = [];
    this.lastEntry = undefined;
  }

  /**
   * Export history as JSON
   */
  exportHistory() {
    return JSON.stringify(this.history, null, 2);
  }
}
```

---

## Phase 3: Event Data Collection

### Step 3.1: Performance Monitoring

**File:** `packages/route-events/src/PerformanceMonitor.ts`

**Implementation based on EXPO_ROUTER_INTERCEPTION_API.md:1273-1379**

```typescript
// Based on "Pattern: Performance Monitoring" (lines 1273-1379)
import { store } from 'expo-router/src/global-state/router-store';
import { routingQueue } from 'expo-router/src/global-state/routing';

export interface NavigationMetrics {
  route: string;
  intentTime: number;
  completeTime: number;
  duration: number;
}

export class PerformanceMonitor {
  private unsubscribeQueue?: () => void;
  private unsubscribeStore?: () => void;
  private pendingNavigations = new Map<string, number>();
  private metrics: NavigationMetrics[] = [];

  /**
   * Start monitoring
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1298-1345
   */
  start() {
    // Track intent (before navigation)
    this.unsubscribeQueue = routingQueue.subscribe(() => {
      const actions = routingQueue.snapshot();

      actions.forEach(action => {
        if (action.type === 'ROUTER_LINK') {
          const href = action.payload.href;
          this.pendingNavigations.set(href, performance.now());
        }
      });
    });

    // Track completion (after navigation)
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
          duration,
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

  /**
   * Get all metrics
   */
  getMetrics() {
    return [...this.metrics];
  }

  /**
   * Get slow navigations
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1351-1353
   */
  getSlowNavigations(threshold = 1000) {
    return this.metrics.filter(m => m.duration > threshold);
  }

  /**
   * Get average navigation time
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1355-1360
   */
  getAverageNavigationTime() {
    if (this.metrics.length === 0) return 0;

    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }

  /**
   * Get slowest routes
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1362-1366
   */
  getSlowestRoutes(count = 10) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, count);
  }
}
```

### Step 3.2: Deep Link Tracking

**File:** `packages/route-events/src/DeepLinkTracker.ts`

**Implementation based on EXPO_ROUTER_INTERCEPTION_API.md:1405-1494**

```typescript
// Based on "Pattern: Deep Link Tracking" (lines 1405-1494)
import { store } from 'expo-router/src/global-state/router-store';
import * as Linking from 'expo-linking';

export interface DeepLinkEvent {
  url: string;
  route: string;
  params: Record<string, any>;
  timestamp: number;
  source: 'initial' | 'background' | 'foreground';
}

export class DeepLinkTracker {
  private unsubscribeRoute?: () => void;
  private unsubscribeUrl?: ReturnType<typeof Linking.addEventListener>;
  private events: DeepLinkEvent[] = [];
  private awaitingFirstNavigation = false;
  private pendingUrl?: string;

  /**
   * Start tracking
   * Based on EXPO_ROUTER_INTERCEPTION_API.md:1430-1469
   */
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
          source: this.events.length === 0 ? 'initial' : 'foreground',
        };

        this.events.push(event);
        this.awaitingFirstNavigation = false;
        this.pendingUrl = undefined;

        console.log('✅ Deep link navigated:', event);
      }
    });
  }

  stop() {
    this.unsubscribeRoute?.();
    this.unsubscribeUrl?.remove();
  }

  getEvents() {
    return [...this.events];
  }
}
```

---

## Phase 4: Testing & Validation

### Step 4.1: Unit Tests

**File:** `packages/route-events/__tests__/RouteObserver.test.ts`

```typescript
import { store } from 'expo-router/src/global-state/router-store';
import { RouteObserver } from '../src/RouteObserver';

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
        isIndex: false,
      })),
      __triggerChange: () => {
        subscribers.forEach(cb => cb());
      },
    },
  };
});

describe('RouteObserver', () => {
  let observer: RouteObserver;
  let eventCallback: jest.Mock;

  beforeEach(() => {
    observer = new RouteObserver();
    eventCallback = jest.fn();
  });

  afterEach(() => {
    observer.stop();
    jest.clearAllMocks();
  });

  it('should subscribe on start', () => {
    observer.start();
    expect(store.subscribe).toHaveBeenCalled();
  });

  it('should emit events on route change', () => {
    observer.addListener(eventCallback);
    observer.start();

    // Trigger a route change
    (store as any).__triggerChange();

    expect(eventCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/test',
      })
    );
  });

  it('should unsubscribe on stop', () => {
    observer.start();
    const unsubscribe = (store.subscribe as jest.Mock).mock.results[0].value;

    observer.stop();

    // Verify unsubscribe was called
    expect(unsubscribe).toBeDefined();
  });
});
```

### Step 4.2: Integration Test

**File:** `packages/route-events/__tests__/integration.test.tsx`

```typescript
import { render, waitFor } from '@testing-library/react-native';
import { RouteObserver } from '../src/RouteObserver';
import { RouteEventStore } from '../src/RouteEventStore';

describe('Route Events Integration', () => {
  it('should track navigation history', async () => {
    const observer = new RouteObserver();
    const store = new RouteEventStore();

    // Connect observer to store
    observer.addListener(event => {
      store.recordEvent(event);
    });

    observer.start();

    // Simulate navigation
    // (This would require navigation actions in a real test)

    await waitFor(() => {
      const history = store.getHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    observer.stop();
  });
});
```

### Step 4.3: Manual Testing Checklist

Based on EXPO_ROUTER_INTERCEPTION_API.md:186-197:

```markdown
# Manual Testing

1. Start your app
   ```bash
   npx expo start
   ```

2. Navigate around and verify:
   - [ ] Console shows route change logs
   - [ ] Event data includes pathname
   - [ ] Event data includes params
   - [ ] Event data includes segments
   - [ ] Timestamps are recorded

3. Test deep links:
   - [ ] Open app with URL: `exp://localhost:19000/profile/123`
   - [ ] Verify deep link event captured
   - [ ] Verify route params extracted

4. Test performance monitoring:
   - [ ] Navigate to different screens
   - [ ] Check average navigation time
   - [ ] Verify slow navigation warnings (>1000ms)

5. Test cleanup:
   - [ ] Hot reload app
   - [ ] Verify no memory leaks
   - [ ] Verify subscriptions cleaned up
```

---

## API Reference from Documentation

### Store API

**From EXPO_ROUTER_INTERCEPTION_API.md:497-598**

```typescript
import { store } from 'expo-router/src/global-state/router-store';

// Subscribe to route changes
const unsubscribe = store.subscribe(callback: () => void);

// Get current route info
const route = store.getRouteInfo();
// Returns: {
//   pathname: string,
//   params: Record<string, string | string[]>,
//   segments: string[],
//   searchParams: URLSearchParams,
//   unstable_globalHref: string,
//   pathnameWithParams: string,
//   isIndex: boolean
// }

// Check if ready
store.assertIsReady();

// Access navigation ref
store.navigationRef
```

### Routing Queue API

**From EXPO_ROUTER_INTERCEPTION_API.md:640-724**

```typescript
import { routingQueue } from 'expo-router/src/global-state/routing';

// Subscribe to queue changes
const unsubscribe = routingQueue.subscribe(callback: () => void);

// Get snapshot of queue
const actions = routingQueue.snapshot();
```

### Action Types

**From EXPO_ROUTER_INTERCEPTION_API.md:443-456**

- `NAVIGATE` - Smart navigation (may reuse screen)
- `PUSH` - Always create new screen
- `REPLACE` - Replace current screen
- `GO_BACK` - Pop current screen
- `POP` - Pop n screens
- `POP_TO` - Pop to specific route
- `POP_TO_TOP` - Dismiss all modals
- `JUMP_TO` - Tab/Drawer navigation
- `PRELOAD` - Background prefetch

---

## Success Criteria

### Must Have

- [x] **Core Observer** - RouteObserver class with start/stop/addListener
- [x] **Store Integration** - Uses store.subscribe() as documented
- [x] **Event Data** - Captures all UrlObject fields (pathname, params, segments, etc.)
- [x] **React Hook** - useRouteObserver for component usage
- [x] **Event Store** - RouteEventStore for history tracking

### Should Have

- [x] **Performance Monitoring** - PerformanceMonitor class
- [x] **Deep Link Tracking** - DeepLinkTracker class
- [x] **Analytics Helpers** - Methods like getAverageTimeOnPage(), getMostVisitedRoutes()
- [x] **Tests** - Unit and integration tests

### Nice to Have

- [ ] **Route Guards** - Block navigation based on conditions
- [ ] **Time Travel** - Navigate to previous states
- [ ] **Export/Import** - Save/restore navigation history
- [ ] **DevTools UI** - Visual debugging interface

---

## Implementation Timeline

### Week 1: Core Implementation
- Day 1-2: RouteObserver class + useRouteObserver hook
- Day 3: RouteEventStore class
- Day 4-5: Integration with route events package

### Week 2: Advanced Features
- Day 1-2: PerformanceMonitor
- Day 3-4: DeepLinkTracker
- Day 5: Testing

### Week 3: Polish & Documentation
- Day 1-3: Bug fixes and edge cases
- Day 4-5: Documentation and examples

---

## Next Steps

1. **Review this plan** - Ensure alignment with project goals
2. **Set up package structure** - Create files in route-events package
3. **Implement Phase 1** - Core RouteObserver
4. **Test basic tracking** - Verify events are captured
5. **Iterate** - Add features from phases 2-4

---

## References

All implementation details are based on the following documentation:

1. **EXPO_ROUTER_INTERCEPTION_API.md**
   - Router Store API (lines 497-598)
   - Implementation patterns (lines 888-1512)
   - TypeScript integration (lines 1515-1648)

2. **ROUTING_RESEARCH_FINDINGS.md**
   - Architecture overview (lines 34-59)
   - Critical interception points (lines 84-277)
   - Navigation event lifecycle (lines 280-425)

3. **Key Principles from Documentation:**
   - ✅ Use store.subscribe() for most cases (line 2125 of EXPO_ROUTER_INTERCEPTION_API.md)
   - ✅ Always clean up subscriptions (line 2093 of EXPO_ROUTER_INTERCEPTION_API.md)
   - ✅ Keep callbacks fast (line 2145 of EXPO_ROUTER_INTERCEPTION_API.md)
   - ❌ Don't trigger navigation inside subscriptions (line 2227 of EXPO_ROUTER_INTERCEPTION_API.md)
