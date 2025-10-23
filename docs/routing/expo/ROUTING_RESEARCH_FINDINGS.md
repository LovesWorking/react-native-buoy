# Expo Router - Routing Research Findings

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Critical Interception Points](#critical-interception-points)
4. [Navigation Event Lifecycle](#navigation-event-lifecycle)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Implementation Patterns](#implementation-patterns)

---

## Executive Summary

### Key Discovery
Expo Router provides **multiple interception points** for observing routing events through:
1. **Router Store subscription system** - Global state observer
2. **NavigationContainer onStateChange** - React Navigation integration
3. **Routing queue subscriber** - Pre-dispatch action interception
4. **navigationRef.addListener('state')** - Direct React Navigation events

### Recommended Approach
The **router store subscription** is the ideal interception point because it:
- Captures ALL navigation changes in one place
- Provides complete route information (pathname, params, segments)
- Uses React's `useSyncExternalStore` for safe subscription
- Works for both imperative and declarative navigation
- No performance overhead

---

## Architecture Overview

### High-Level Data Flow

```
User Action (Link click, router.push(), back button, deep link)
    ↓
Navigation Trigger (linkTo() or routingQueue.add())
    ↓
Routing Queue (batches actions)
    ↓
useImperativeApiEmitter (processes queue via useSyncExternalStore)
    ↓
navigationRef.dispatch(action) [React Navigation dispatch]
    ↓
React Navigation State Change
    ↓
NavigationContainer fires 'state' event
    ↓
Multiple Listeners:
  - useLinking.ts onStateChange (URL/history sync on web)
  - store.onStateChange (global state updates)
  - Custom addListener('state') subscribers
    ↓
routeInfoSubscribers notified (via store.onStateChange)
    ↓
Components re-render (via useSyncExternalStore)
```

### Package Structure

```
packages/expo-router/
├── src/
│   ├── imperative-api.tsx         # router.push/navigate/back
│   ├── hooks.ts                   # useRouter, usePathname, useSegments
│   ├── link/
│   │   ├── Link.tsx               # Declarative navigation
│   │   └── useLinkToPathProps.tsx # Link press handlers
│   ├── global-state/
│   │   ├── router-store.tsx       # 🎯 Central state + subscriptions
│   │   └── routing.ts             # 🎯 routingQueue + navigation functions
│   ├── fork/
│   │   ├── NavigationContainer.tsx # 🎯 Wrapper with onStateChange
│   │   └── useLinking.ts          # URL/state synchronization
│   └── ExpoRoot.tsx               # Mounts everything together
```

---

## Critical Interception Points

### 1. Router Store Subscription ⭐ RECOMMENDED

**Location:** `packages/expo-router/src/global-state/router-store.tsx`

**Why this is best:**
- Single source of truth for all routing state
- Captures every navigation change
- Provides rich route information
- Safe subscription mechanism
- No risk of breaking navigation

**How to use:**

```typescript
import { store } from 'expo-router/src/global-state/router-store';

// Subscribe to all route changes
const unsubscribe = store.subscribe((snapshot) => {
  const routeInfo = store.getRouteInfo();
  console.log('Route changed:', {
    pathname: routeInfo.pathname,
    params: routeInfo.params,
    segments: routeInfo.segments,
    searchParams: Object.fromEntries(routeInfo.searchParams),
    href: routeInfo.unstable_globalHref
  });
});

// Later: unsubscribe when done
unsubscribe();
```

**Internal Implementation:**
```typescript
// In router-store.tsx (lines 239-245)
const routeInfoSubscribers = new Set<() => void>();

const routeInfoSubscribe = (callback: () => void) => {
  routeInfoSubscribers.add(callback);
  return () => {
    routeInfoSubscribers.delete(callback);
  };
};

// Subscribers notified in store.onStateChange (lines 130-132)
for (const callback of routeInfoSubscribers) {
  callback();
}
```

---

### 2. Routing Queue Subscription

**Location:** `packages/expo-router/src/global-state/routing.ts`

**Why use this:**
- Intercept actions BEFORE they're dispatched
- See the action type (PUSH, REPLACE, NAVIGATE, GO_BACK, etc.)
- Can observe intent before execution
- Useful for analytics or preventing navigation

**How to use:**

```typescript
import { routingQueue } from 'expo-router/src/global-state/routing';

const unsubscribe = routingQueue.subscribe(() => {
  const actions = routingQueue.snapshot();
  actions.forEach(action => {
    if (action.type === 'ROUTER_LINK') {
      console.log('Link navigation:', action.payload.href, action.payload.options);
    } else {
      console.log('Navigation action:', action.type, action.payload);
    }
  });
});
```

**Internal Implementation:**
```typescript
// In routing.ts (lines 47-94)
export const routingQueue = {
  queue: [] as (NavigationAction | LinkAction)[],
  subscribers: new Set<() => void>(),

  subscribe(callback: () => void) {
    routingQueue.subscribers.add(callback);
    return () => {
      routingQueue.subscribers.delete(callback);
    };
  },

  add(action: NavigationAction | LinkAction) {
    routingQueue.queue.push(action);
    // Notify subscribers immediately when action added
    for (const callback of routingQueue.subscribers) {
      callback();
    }
  },

  run(ref) {
    // Process queue and dispatch to React Navigation
    const events = routingQueue.queue;
    routingQueue.queue = [];
    while ((action = events.shift())) {
      ref.current.dispatch(action);
    }
  }
};
```

---

### 3. NavigationContainer onStateChange

**Location:** `packages/expo-router/src/ExpoRoot.tsx` (line 165)

**Why use this:**
- Standard React Navigation pattern
- Receives full navigation state tree
- Called AFTER navigation completes
- Good for tracking final state changes

**How to use:**

```typescript
import { NavigationContainer } from 'expo-router/src/fork/NavigationContainer';

<NavigationContainer
  onStateChange={(state) => {
    console.log('Navigation state changed:', state);
    const focusedRoute = getFocusedRouteNameFromState(state);
    console.log('Currently focused route:', focusedRoute);
  }}
>
  {children}
</NavigationContainer>
```

**Internal Flow:**
```typescript
// In NavigationContainer.tsx (lines 119-131)
const onStateChangeForLinkingHandling = useLatestCallback(
  (state) => {
    // 1. Update unhandled link tracking
    setLastUnhandledLink(...);

    // 2. Call user's onStateChange
    onStateChange?.(state);
  }
);

// Passed to BaseNavigationContainer (line 171)
<BaseNavigationContainer
  onStateChange={onStateChangeForLinkingHandling}
/>
```

---

### 4. Direct navigationRef Event Listener

**Location:** Any component with access to `store.navigationRef`

**Why use this:**
- Low-level React Navigation event system
- Can listen to specific events ('state', 'options', etc.)
- Direct access to navigation actions
- More control over event handling

**How to use:**

```typescript
import { store } from 'expo-router/src/global-state/router-store';

// Subscribe to state events
const unsubscribe = store.navigationRef.addListener('state', ({ data }) => {
  console.log('Navigation state event:', data.state);
});

// Later: unsubscribe
unsubscribe();
```

**Used internally in:**
- `useLinking.ts:475` - URL/state sync
- `useNextScreenId.ts:22` - Preview route detection

```typescript
// Example from useLinking.ts (line 475)
return ref.current?.addListener('state', series(onStateChange));
```

---

## Navigation Event Lifecycle

### Complete Flow: From User Action to State Update

#### 1. User Initiates Navigation

**Declarative (Link):**
```
User clicks <Link href="/profile" />
  ↓
Link.tsx onPress handler
  ↓
useLinkToPathProps() validates event
  ↓
linkTo(href, options) called
```

**Imperative (router API):**
```
Code calls router.push('/profile')
  ↓
Forwards to push() in routing.ts
  ↓
linkTo(resolveHref(url), { event: 'PUSH' })
```

#### 2. Action Queuing

```typescript
// routing.ts (lines 218-262)
export function linkTo(href: Href, options: LinkToOptions) {
  const linkAction = {
    type: 'ROUTER_LINK',
    payload: { href, options }
  };

  routingQueue.add(linkAction); // ← Queued here
}
```

**Queue Subscribers Notified:**
```typescript
// All routingQueue.subscribers called immediately
for (const callback of routingQueue.subscribers) {
  callback(); // ← Your interception point #1
}
```

#### 3. Queue Processing

```typescript
// imperative-api.tsx (lines 117-129)
export function useImperativeApiEmitter(ref) {
  const events = useSyncExternalStore(
    routingQueue.subscribe,
    routingQueue.snapshot,
    routingQueue.snapshot
  );

  useEffect(() => {
    routingQueue.run(ref); // ← Processes all queued actions
  }, [events, ref]);
}
```

**Action Conversion:**
```typescript
// routing.ts (lines 77-87)
if (action.type === 'ROUTER_LINK') {
  action = getNavigateAction(
    href,
    options,
    options.event,      // PUSH, NAVIGATE, REPLACE, etc.
    options.withAnchor,
    options.dangerouslySingular,
    !!options.__internal__PreviewKey
  );
}
```

#### 4. React Navigation Dispatch

```typescript
// routing.ts (line 86-89)
if (action) {
  ref.current.dispatch(action); // ← Sent to React Navigation
}
```

**Action Types:**
- `NAVIGATE` - Smart navigation (may reuse existing screen)
- `PUSH` - Always create new screen on stack
- `REPLACE` - Replace current screen
- `GO_BACK` - Pop current screen
- `POP_TO` - Dismiss to specific route
- `POP_TO_TOP` - Dismiss all modals
- `JUMP_TO` - Tab/drawer navigation
- `PRELOAD` - Background prefetch

#### 5. React Navigation State Change

```
React Navigation processes action
  ↓
Internal state tree updated
  ↓
'state' event emitted
  ↓
Multiple listeners triggered simultaneously:
  - useLinking.ts → URL sync (web only)
  - store.onStateChange → global state update
  - Custom addListener('state') callbacks
```

#### 6. Global State Update

```typescript
// router-store.tsx (lines 101-133)
onStateChange(newState) {
  // Store new state
  storeRef.current.state = newState;

  // Compute route info with caching
  storeRef.current.routeInfo = getCachedRouteInfo(newState);

  // Notify all subscribers ← Your interception point #2
  for (const callback of routeInfoSubscribers) {
    callback();
  }
}
```

#### 7. Component Re-renders

```typescript
// Any component using useRouteInfo()
export function useRouteInfo() {
  const routeInfo = useSyncExternalStore(
    routeInfoSubscribe,  // Subscription
    store.getRouteInfo,  // Current state
    store.getRouteInfo   // Server fallback
  );
  return routeInfo; // ← Component re-renders when this changes
}
```

---

## Detailed Component Analysis

### Router Store (`router-store.tsx`)

**Purpose:** Central state management for routing

**State Tracked:**
```typescript
{
  navigationRef: NavigationContainerRef,  // React Navigation access
  routeNode: RouteNode,                   // Route tree structure
  rootComponent: ComponentType,           // Root layout
  state: NavigationState,                 // Current nav state
  linking: ExpoLinkingOptions,            // Deep linking config
  config: any,                            // App config
  redirects: StoreRedirects[],            // Redirect rules
  routeInfo: {                            // 🎯 Derived route info
    pathname: string,                     //   e.g., "/profile/123"
    params: Record<string, any>,          //   e.g., { id: "123" }
    segments: string[],                   //   e.g., ["profile", "123"]
    searchParams: URLSearchParams,        //   e.g., ?tab=posts
    unstable_globalHref: string,          //   Full href
    isIndex: boolean                      //   Is index route?
  }
}
```

**Key Methods:**
```typescript
store.getRouteInfo()        // Get current route info
store.onStateChange(state)  // Called when nav state changes
store.subscribe(callback)   // Subscribe to changes (internal)
store.assertIsReady()       // Validate navigation is mounted
```

**Subscription System:**
```typescript
const routeInfoSubscribers = new Set<() => void>();

const routeInfoSubscribe = (callback: () => void) => {
  routeInfoSubscribers.add(callback);
  return () => routeInfoSubscribers.delete(callback);
};
```

---

### Routing Queue (`routing.ts`)

**Purpose:** Batch and process navigation actions

**Queue Structure:**
```typescript
{
  queue: Array<NavigationAction | LinkAction>,
  subscribers: Set<() => void>,

  subscribe(callback): () => void,
  snapshot(): Array<Action>,
  add(action): void,
  run(ref): void
}
```

**Action Types:**
```typescript
// Link actions (converted before dispatch)
type LinkAction = {
  type: 'ROUTER_LINK',
  payload: {
    href: string,
    options: LinkToOptions
  }
};

// Direct navigation actions (dispatched as-is)
type NavigationAction =
  | { type: 'NAVIGATE', payload: {...} }
  | { type: 'PUSH', payload: {...} }
  | { type: 'REPLACE', payload: {...} }
  | { type: 'GO_BACK' }
  | { type: 'POP', payload: { count: number } }
  | { type: 'POP_TO_TOP' };
```

**Processing Flow:**
1. User action → `linkTo()` or direct action creator
2. Action added to queue → `routingQueue.add(action)`
3. Subscribers notified immediately
4. `useImperativeApiEmitter` detects queue change
5. `routingQueue.run(ref)` processes all queued actions
6. Actions converted if needed (ROUTER_LINK → NAVIGATE/PUSH/etc)
7. Dispatched to React Navigation

---

### NavigationContainer (`fork/NavigationContainer.tsx`)

**Purpose:** Wrapper around React Navigation's BaseNavigationContainer

**Key Modifications from React Navigation:**

1. **Imperative API Integration:**
   ```typescript
   useImperativeApiEmitter(refContainer)  // Line 86
   ```

2. **Unhandled Link Tracking:**
   ```typescript
   const [lastUnhandledLink, setLastUnhandledLink] = useState()
   ```

3. **Wrapped Callbacks:**
   ```typescript
   onStateChangeForLinkingHandling(state) {
     // Track unhandled links
     setLastUnhandledLink(...);
     // Call user's callback
     onStateChange?.(state);
   }
   ```

4. **Context Providers:**
   - `LocaleDirContext` - RTL support
   - `UnhandledLinkingContext` - Track failed deep links
   - `LinkingContext` - Provide linking config

5. **Devtools Integration:**
   ```typescript
   globalThis.REACT_NAVIGATION_DEVTOOLS.set(ref, {
     linking: { enabled, prefixes, ... }
   });
   ```

---

### useLinking Hook (`fork/useLinking.ts`)

**Purpose:** Synchronize URL and navigation state (web-specific)

**Key Responsibilities:**
1. Parse initial URL to navigation state
2. Listen to browser history changes (popstate)
3. Update browser URL when navigation state changes
4. Handle forward/back browser buttons

**State Change Listener:**
```typescript
// Line 475
return ref.current?.addListener('state', series(onStateChange));
```

**The `series()` Function:**
```typescript
// Lines 66-72
export const series = (cb: () => Promise<void>) => {
  let queue = Promise.resolve();
  const callback = () => {
    queue = queue.then(cb);
  };
  return callback;
};
```
**Purpose:** Debounce/serialize async state changes to prevent race conditions

**onStateChange Logic:**
```typescript
async function onStateChange() {
  // 1. Get current path from state
  const path = getPathForRoute(route, state);

  // 2. Compare with previous state to determine operation
  const [prevFocused, currFocused] = findMatchingState(prevState, state);

  const historyDelta =
    currFocused.routes.length - prevFocused.routes.length;

  // 3. Update browser history accordingly
  if (historyDelta > 0) {
    history.push({ path, state });      // Forward navigation
  } else if (historyDelta < 0) {
    await history.go(historyDelta);     // Back navigation
    history.replace({ path, state });
  } else {
    history.replace({ path, state });   // Replace navigation
  }
}
```

---

## Implementation Patterns

### Pattern 1: Simple Route Tracking

**Use Case:** Log all route changes for analytics

```typescript
import { store } from 'expo-router/src/global-state/router-store';

class RouteTracker {
  private unsubscribe?: () => void;

  start() {
    this.unsubscribe = store.subscribe(() => {
      const route = store.getRouteInfo();

      // Log route change
      console.log('Route changed', {
        from: this.lastRoute,
        to: route.pathname,
        params: route.params,
        timestamp: Date.now()
      });

      this.lastRoute = route.pathname;
    });
  }

  stop() {
    this.unsubscribe?.();
  }

  private lastRoute?: string;
}

// Usage
const tracker = new RouteTracker();
tracker.start();
```

---

### Pattern 2: Pre-Navigation Interception

**Use Case:** Analytics on navigation intent before execution

```typescript
import { routingQueue } from 'expo-router/src/global-state/routing';

class NavigationIntentTracker {
  start() {
    return routingQueue.subscribe(() => {
      const actions = routingQueue.snapshot();

      actions.forEach(action => {
        if (action.type === 'ROUTER_LINK') {
          // Track link clicks
          analytics.track('navigation_intent', {
            type: 'link',
            href: action.payload.href,
            event: action.payload.options.event,
          });
        } else {
          // Track imperative navigation
          analytics.track('navigation_intent', {
            type: 'imperative',
            action: action.type,
            payload: action.payload
          });
        }
      });
    });
  }
}
```

---

### Pattern 3: React Navigation Event Listener

**Use Case:** Low-level navigation state monitoring

```typescript
import { store } from 'expo-router/src/global-state/router-store';
import { useEffect } from 'react';

function useNavigationStateLogger() {
  useEffect(() => {
    const unsubscribe = store.navigationRef.addListener('state', ({ data }) => {
      console.log('Navigation state event:', {
        state: data.state,
        routes: data.state.routes.map(r => r.name),
        focusedRoute: data.state.routes[data.state.index].name
      });
    });

    return unsubscribe;
  }, []);
}
```

---

### Pattern 4: Complete Devtools Integration

**Use Case:** Full routing observability for developer tools

```typescript
import { store } from 'expo-router/src/global-state/router-store';
import { routingQueue } from 'expo-router/src/global-state/routing';

class ExpoRouterDevtools {
  private history: Array<{
    type: 'intent' | 'complete',
    timestamp: number,
    data: any
  }> = [];

  private unsubscribers: Array<() => void> = [];

  start() {
    // Track navigation intents (before dispatch)
    this.unsubscribers.push(
      routingQueue.subscribe(() => {
        const actions = routingQueue.snapshot();
        actions.forEach(action => {
          this.history.push({
            type: 'intent',
            timestamp: Date.now(),
            data: action
          });
        });
      })
    );

    // Track completed navigations (after state change)
    this.unsubscribers.push(
      store.subscribe(() => {
        const route = store.getRouteInfo();
        this.history.push({
          type: 'complete',
          timestamp: Date.now(),
          data: {
            pathname: route.pathname,
            params: route.params,
            segments: route.segments,
            href: route.unstable_globalHref
          }
        });
      })
    );

    // Also listen to React Navigation events
    this.unsubscribers.push(
      store.navigationRef.addListener('state', ({ data }) => {
        console.log('Low-level state change:', data.state);
      })
    );
  }

  stop() {
    this.unsubscribers.forEach(fn => fn());
    this.unsubscribers = [];
  }

  getHistory() {
    return this.history;
  }

  clearHistory() {
    this.history = [];
  }
}

// Usage
const devtools = new ExpoRouterDevtools();
devtools.start();

// Later...
console.log(devtools.getHistory());
devtools.stop();
```

---

## Key Takeaways

### What We Learned

1. **Expo Router uses a queue-based navigation system**
   - Actions are batched for efficient processing
   - Subscriptions allow observation before dispatch

2. **Three levels of state management:**
   - Routing queue (intent level)
   - React Navigation (action level)
   - Router store (derived state level)

3. **Multiple interception points available:**
   - Queue subscription (before dispatch)
   - onStateChange callback (after navigation)
   - Store subscription (derived route info)
   - Direct event listeners (low-level)

4. **Router store is the recommended interception point:**
   - Single source of truth
   - Rich route information
   - Safe subscription mechanism
   - Works for all navigation types

### Comparison with Network/Storage Interception

| Aspect | Network Events | Storage Events | Routing Events |
|--------|---------------|----------------|----------------|
| **Native API** | `fetch`, `XMLHttpRequest` | `localStorage`, `AsyncStorage` | `router.push`, `<Link>` |
| **Interception** | Monkey-patch global | Proxy storage API | Subscribe to store |
| **Event Object** | Request/Response | Key/Value changes | Route info |
| **Timing** | Before/After request | Before/After set | Before/After navigate |
| **Cancellation** | Possible (abort) | Possible (return false) | Not directly supported |

### Routing is Unique Because:
- Uses **observer pattern** not global API override
- State changes are **batched** not immediate
- Multiple **parallel listeners** are supported
- **No monkey-patching required** - clean subscription API

---

## Next Steps

With this research complete, we can now create:

1. **Detailed API Documentation**
   - Public interception APIs
   - TypeScript definitions
   - Code examples
   - Best practices

2. **Implementation Guide**
   - Step-by-step setup
   - Integration patterns
   - Testing strategies
   - Performance considerations

3. **Dev Tools Integration**
   - Route history tracking
   - Real-time state inspection
   - Navigation replay
   - Performance monitoring
