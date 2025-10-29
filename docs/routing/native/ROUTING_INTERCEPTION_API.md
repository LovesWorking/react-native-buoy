# React Native Routing Interception API Guide

**Complete guide for intercepting and monitoring routing events in React Native applications**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Interception Points](#interception-points)
   - [Linking API Interception](#1-linking-api-interception)
   - [BackHandler Interception](#2-backhandler-interception)
   - [Global Event Bus Interception](#3-global-event-bus-interception)
   - [AppState Interception](#4-appstate-interception-optional)
4. [Complete Implementation Examples](#complete-implementation-examples)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Testing Your Interceptors](#testing-your-interceptors)
9. [Performance Considerations](#performance-considerations)
10. [Compatibility Notes](#compatibility-notes)

---

## Overview

### What This Guide Covers

This guide explains how to intercept routing-related events at the **React Native core layer**, which works across ALL routing libraries (React Navigation, Expo Router, etc.) because they all build on these primitives.

### What You'll Be Able To Capture

1. **Deep Link Navigation** - When URLs open or change the route
2. **Back Button Navigation** - Android hardware back button presses
3. **All Native Events** - Any routing-related native event
4. **App Focus Changes** - Screen visibility changes (optional)

### Important Understanding

⚠️ **React Native does NOT provide a complete routing system.** It only provides low-level primitives:
- `Linking` - Deep link/URL handling
- `BackHandler` - Hardware back button
- `EventEmitter` - Event infrastructure
- `AppState` - App lifecycle

Routing libraries like **React Navigation** and **Expo Router** implement their own:
- Navigation state management
- Route stacks and history
- Screen transitions
- Route matching

This means you **CANNOT** intercept all routing events at the React Native level alone. You'll need to also instrument the routing library itself for complete coverage.

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│         Routing Library Layer               │
│  (React Navigation / Expo Router)           │
│  - Navigation state                         │
│  - Route matching                           │
│  - Stack management                         │
└─────────────────┬───────────────────────────┘
                  │ Uses ↓
┌─────────────────▼───────────────────────────┐
│      React Native Primitives Layer          │
│                                             │
│  ┌──────────────┐  ┌──────────────┐        │
│  │   Linking    │  │ BackHandler  │        │
│  │  (URLs)      │  │ (Back btn)   │        │
│  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                 │
│         └────────┬────────┘                 │
│                  ▼                          │
│      ┌────────────────────┐                 │
│      │ RCTDeviceEvent     │ ← Global Event  │
│      │    Emitter         │   Bus          │
│      └────────────────────┘                 │
│                  │                          │
│                  ▼                          │
│      ┌────────────────────┐                 │
│      │  EventEmitter      │ ← Base Class   │
│      │  (Foundation)      │                 │
│      └────────────────────┘                 │
└─────────────────────────────────────────────┘
                  │
                  ▼
           Native Modules
       (iOS/Android/Web Bridge)
```

### Interception Strategy

You have **3 levels** of interception:

**Level 1 (Most Complete): Routing Library Layer**
- Intercept React Navigation or Expo Router directly
- Captures ALL navigation events (push, pop, replace, etc.)
- Library-specific implementation required

**Level 2 (Partial): React Native Primitives**
- Intercept `Linking` and `BackHandler`
- Only captures deep links and back button
- Works across all routing libraries
- **This is what this guide focuses on**

**Level 3 (Foundation): Global Event Bus**
- Intercept `RCTDeviceEventEmitter`
- Captures all native events (not just routing)
- Most broad but noisiest

---

## Interception Points

### 1. Linking API Interception

The `Linking` API handles deep link URLs. Routing libraries use this to handle navigation from external URLs.

#### Location
- File: `packages/react-native/Libraries/Linking/Linking.js`
- Global: `import {Linking} from 'react-native';`

#### What Gets Captured
- Deep link URLs opening the app
- URL change events
- `myapp://screen/path` navigation
- Web URL handling

#### How To Intercept

**Method A: Wrap addEventListener**

```javascript
import {Linking} from 'react-native';

// Store original method
const originalAddEventListener = Linking.addEventListener.bind(Linking);

// Replace with wrapper
Linking.addEventListener = function(eventType, listener) {
  console.log('[DevTools] Linking listener added:', eventType);

  // Wrap the listener to intercept calls
  const wrappedListener = (...args) => {
    console.log('[DevTools] Linking event fired:', eventType, args);

    // Call your dev tools handler
    myDevTools.onLinkingEvent({
      type: eventType,
      url: args[0]?.url,
      timestamp: Date.now()
    });

    // Call original listener
    return listener(...args);
  };

  // Call original addEventListener with wrapped listener
  return originalAddEventListener(eventType, wrappedListener);
};
```

**Method B: Listen Globally (Non-invasive)**

```javascript
import {Linking} from 'react-native';

// Add your own listener first
Linking.addEventListener('url', (event) => {
  console.log('[DevTools] URL event:', event.url);

  myDevTools.onLinkingEvent({
    type: 'url',
    url: event.url,
    timestamp: Date.now()
  });
});

// This will run ALONGSIDE routing library listeners
// but won't capture listener registrations
```

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Wrap addEventListener** | Captures all listeners, full visibility | More invasive, must wrap carefully |
| **Listen globally** | Simple, non-invasive | Doesn't know about other listeners |

---

### 2. BackHandler Interception

The `BackHandler` API handles Android's hardware back button. Routing libraries use this to implement back navigation.

#### Location
- File: `packages/react-native/Libraries/Utilities/BackHandler.android.js`
- Global: `import {BackHandler} from 'react-native';`
- Platform: **Android only** (iOS has no equivalent)

#### What Gets Captured
- Hardware back button presses
- Which handler handled the event
- Back navigation in routing stacks

#### How To Intercept

**Method A: Wrap addEventListener**

```javascript
import {BackHandler} from 'react-native';
import {Platform} from 'react-native';

if (Platform.OS === 'android') {
  // Store original
  const originalAddEventListener = BackHandler.addEventListener.bind(BackHandler);

  // Replace with wrapper
  BackHandler.addEventListener = function(eventName, handler) {
    console.log('[DevTools] BackHandler listener added');

    // Wrap the handler
    const wrappedHandler = () => {
      console.log('[DevTools] Back button pressed');

      // Call original handler
      const result = handler();

      // Log result (true = handled, false = not handled)
      console.log('[DevTools] Handler result:', result);

      myDevTools.onBackPress({
        handled: result === true,
        timestamp: Date.now()
      });

      return result;
    };

    // Call original
    return originalAddEventListener(eventName, wrappedHandler);
  };
}
```

**Method B: Add High-Priority Listener**

```javascript
import {BackHandler} from 'react-native';
import {Platform} from 'react-native';

if (Platform.OS === 'android') {
  // Add listener that runs FIRST (added last = runs first, LIFO order)
  const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
    console.log('[DevTools] Back button pressed');

    myDevTools.onBackPress({
      timestamp: Date.now()
    });

    // Return false to let other handlers process
    return false;
  });

  // Keep subscription alive for app lifetime
}
```

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Wrap addEventListener** | Captures all handlers, sees results | More complex |
| **High-priority listener** | Simple, guaranteed to run first | Can't see if other handlers handled it |

#### CRITICAL: Handler Execution Order

⚠️ BackHandler handlers are called in **LIFO (Last In, First Out)** order:

```javascript
BackHandler.addEventListener('hardwareBackPress', handler1); // Called 3rd
BackHandler.addEventListener('hardwareBackPress', handler2); // Called 2nd
BackHandler.addEventListener('hardwareBackPress', handler3); // Called 1st
```

If any handler returns `true`, execution stops. Your interceptor should:
1. Return `false` to allow other handlers to run
2. Or wrap handlers to see their results

---

### 3. Global Event Bus Interception

`RCTDeviceEventEmitter` is the **global event bus** for all native events. This is the most foundational interception point.

#### Location
- File: `packages/react-native/Libraries/EventEmitter/RCTDeviceEventEmitter.js`
- Global: `global.__rctDeviceEventEmitter`

#### What Gets Captured
- **ALL** native events flowing through React Native
- Includes `url` events from Linking
- Includes `hardwareBackPress` from BackHandler
- Many non-routing events (can be noisy)

#### How To Intercept

**Method A: Wrap emit (Capture All Events)**

```javascript
// Access global emitter
const RCTDeviceEventEmitter = global.__rctDeviceEventEmitter;

if (RCTDeviceEventEmitter) {
  // Store original emit
  const originalEmit = RCTDeviceEventEmitter.emit.bind(RCTDeviceEventEmitter);

  // Replace with wrapper
  RCTDeviceEventEmitter.emit = function(eventType, ...args) {
    // Filter for routing-related events
    const routingEvents = ['url', 'hardwareBackPress'];

    if (routingEvents.includes(eventType)) {
      console.log('[DevTools] Native event:', eventType, args);

      myDevTools.onNativeEvent({
        type: eventType,
        args: args,
        timestamp: Date.now()
      });
    }

    // Call original emit
    return originalEmit(eventType, ...args);
  };
}
```

**Method B: Wrap addListener (Capture Registrations)**

```javascript
const RCTDeviceEventEmitter = global.__rctDeviceEventEmitter;

if (RCTDeviceEventEmitter) {
  const originalAddListener = RCTDeviceEventEmitter.addListener.bind(RCTDeviceEventEmitter);

  RCTDeviceEventEmitter.addListener = function(eventType, listener, context) {
    console.log('[DevTools] Event listener registered:', eventType);

    // Wrap listener if it's routing-related
    const routingEvents = ['url', 'hardwareBackPress'];

    if (routingEvents.includes(eventType)) {
      const wrappedListener = (...args) => {
        console.log('[DevTools] Event fired:', eventType, args);
        myDevTools.onNativeEvent({type: eventType, args, timestamp: Date.now()});
        return listener(...args);
      };

      return originalAddListener(eventType, wrappedListener, context);
    }

    // Non-routing events pass through unchanged
    return originalAddListener(eventType, listener, context);
  };
}
```

#### Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| **Wrap emit** | Sees all events as they fire | Can't capture listener registrations |
| **Wrap addListener** | Sees listener registrations | More complex, must wrap each listener |
| **Both** | Complete visibility | Most complex, highest overhead |

#### Filtering Strategy

The global event bus emits MANY events. Here are routing-related ones:

```javascript
const ROUTING_EVENT_TYPES = [
  'url',                    // Linking - URL opened/changed
  'hardwareBackPress',      // BackHandler - Back button pressed
  'appStateDidChange',      // AppState - App foreground/background
  'appStateFocusChange',    // AppState - App focus/blur
];

function isRoutingEvent(eventType) {
  return ROUTING_EVENT_TYPES.includes(eventType);
}
```

---

### 4. AppState Interception (Optional)

`AppState` tracks app foreground/background state. Less directly related to routing, but useful for tracking screen visibility.

#### Location
- File: `packages/react-native/Libraries/AppState/AppState.js`
- Global: `import {AppState} from 'react-native';`

#### What Gets Captured
- App moving to background/foreground
- Focus/blur events (Android)
- Memory warnings

#### How To Intercept

```javascript
import {AppState} from 'react-native';

// Listen to changes
AppState.addEventListener('change', (nextAppState) => {
  console.log('[DevTools] AppState changed:', nextAppState);
  // nextAppState: 'active' | 'background' | 'inactive'

  myDevTools.onAppStateChange({
    state: nextAppState,
    timestamp: Date.now()
  });
});

// Android focus/blur
AppState.addEventListener('focus', () => {
  console.log('[DevTools] App focused');
});

AppState.addEventListener('blur', () => {
  console.log('[DevTools] App blurred');
});
```

This is typically **not necessary** for routing interception, but can be useful for understanding user behavior.

---

## Complete Implementation Examples

### Example 1: Minimal Routing Interceptor

```javascript
// routingInterceptor.js
import {Linking, BackHandler, Platform} from 'react-native';

class RoutingInterceptor {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // 1. Intercept Linking
    Linking.addEventListener('url', (event) => {
      this.onEvent({
        source: 'Linking',
        type: 'url',
        url: event.url,
        timestamp: Date.now()
      });
    });

    // 2. Intercept BackHandler (Android only)
    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', () => {
        this.onEvent({
          source: 'BackHandler',
          type: 'hardwareBackPress',
          timestamp: Date.now()
        });
        return false; // Let other handlers process
      });
    }
  }
}

// Usage
const interceptor = new RoutingInterceptor((event) => {
  console.log('[DevTools] Routing event:', event);

  // Send to your dev tools
  myDevTools.recordNavigationEvent(event);
});

export default interceptor;
```

### Example 2: Advanced Interceptor with Monkey Patching

```javascript
// advancedRoutingInterceptor.js
import {Linking, BackHandler, Platform} from 'react-native';

class AdvancedRoutingInterceptor {
  constructor(options = {}) {
    this.options = {
      logToConsole: true,
      captureListeners: true,
      ...options
    };

    this.events = [];
    this.listeners = {
      Linking: [],
      BackHandler: []
    };

    this.setup();
  }

  setup() {
    if (this.options.captureListeners) {
      this.patchLinking();
      this.patchBackHandler();
    } else {
      this.addSimpleListeners();
    }

    this.patchGlobalEventBus();
  }

  // Patch Linking.addEventListener
  patchLinking() {
    const original = Linking.addEventListener.bind(Linking);

    Linking.addEventListener = (eventType, listener) => {
      this.log('Linking listener added:', eventType);

      this.listeners.Linking.push({
        eventType,
        listener,
        addedAt: Date.now()
      });

      const wrapped = (...args) => {
        this.recordEvent({
          source: 'Linking',
          type: eventType,
          data: args[0],
          timestamp: Date.now()
        });
        return listener(...args);
      };

      return original(eventType, wrapped);
    };
  }

  // Patch BackHandler.addEventListener
  patchBackHandler() {
    if (Platform.OS !== 'android') return;

    const original = BackHandler.addEventListener.bind(BackHandler);

    BackHandler.addEventListener = (eventName, handler) => {
      this.log('BackHandler listener added');

      this.listeners.BackHandler.push({
        eventName,
        handler,
        addedAt: Date.now()
      });

      const wrapped = () => {
        const result = handler();

        this.recordEvent({
          source: 'BackHandler',
          type: 'hardwareBackPress',
          handled: result === true,
          timestamp: Date.now()
        });

        return result;
      };

      return original(eventName, wrapped);
    };
  }

  // Patch global event bus
  patchGlobalEventBus() {
    const emitter = global.__rctDeviceEventEmitter;
    if (!emitter) return;

    const originalEmit = emitter.emit.bind(emitter);

    emitter.emit = (eventType, ...args) => {
      const routingEvents = ['url', 'hardwareBackPress'];

      if (routingEvents.includes(eventType)) {
        this.recordEvent({
          source: 'RCTDeviceEventEmitter',
          type: eventType,
          args,
          timestamp: Date.now()
        });
      }

      return originalEmit(eventType, ...args);
    };
  }

  // Simple listeners (non-invasive)
  addSimpleListeners() {
    Linking.addEventListener('url', (event) => {
      this.recordEvent({
        source: 'Linking',
        type: 'url',
        url: event.url,
        timestamp: Date.now()
      });
    });

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', () => {
        this.recordEvent({
          source: 'BackHandler',
          type: 'hardwareBackPress',
          timestamp: Date.now()
        });
        return false;
      });
    }
  }

  recordEvent(event) {
    this.events.push(event);
    this.log('Event recorded:', event);

    // Trigger callback if provided
    if (this.options.onEvent) {
      this.options.onEvent(event);
    }
  }

  log(...args) {
    if (this.options.logToConsole) {
      console.log('[RoutingInterceptor]', ...args);
    }
  }

  // Public API
  getEvents() {
    return [...this.events];
  }

  getListeners() {
    return {...this.listeners};
  }

  clearEvents() {
    this.events = [];
  }

  getStats() {
    const eventsByType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalEvents: this.events.length,
      eventsByType,
      listenerCounts: {
        Linking: this.listeners.Linking.length,
        BackHandler: this.listeners.BackHandler.length
      }
    };
  }
}

export default AdvancedRoutingInterceptor;

// Usage
const interceptor = new AdvancedRoutingInterceptor({
  logToConsole: true,
  captureListeners: true,
  onEvent: (event) => {
    // Send to your dev tools server
    fetch('https://your-devtools.com/api/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
});

// Get stats
console.log(interceptor.getStats());
// { totalEvents: 42, eventsByType: { url: 5, hardwareBackPress: 37 }, ... }
```

### Example 3: Integration with Dev Tools

```javascript
// devToolsIntegration.js
import AdvancedRoutingInterceptor from './advancedRoutingInterceptor';

class DevToolsIntegration {
  constructor(config) {
    this.config = config;
    this.interceptor = null;
    this.isEnabled = false;
  }

  enable() {
    if (this.isEnabled) return;

    this.interceptor = new AdvancedRoutingInterceptor({
      logToConsole: __DEV__,
      captureListeners: true,
      onEvent: this.handleEvent.bind(this)
    });

    this.isEnabled = true;
    console.log('[DevTools] Routing interception enabled');
  }

  disable() {
    // Can't easily undo monkey patching, but can stop recording
    this.isEnabled = false;
    console.log('[DevTools] Routing interception disabled');
  }

  handleEvent(event) {
    if (!this.isEnabled) return;

    // Format for your dev tools
    const formattedEvent = {
      ...event,
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      deviceInfo: this.getDeviceInfo()
    };

    // Send to dev tools backend
    this.sendToBackend(formattedEvent);

    // Update local state
    this.updateLocalState(formattedEvent);
  }

  sendToBackend(event) {
    if (!this.config.backendUrl) return;

    fetch(`${this.config.backendUrl}/routing-events`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(event)
    }).catch(err => {
      console.error('[DevTools] Failed to send event:', err);
    });
  }

  updateLocalState(event) {
    // Store in AsyncStorage or your state management
    // For real-time debugging
  }

  getDeviceInfo() {
    return {
      platform: Platform.OS,
      version: Platform.Version
    };
  }

  getSnapshot() {
    if (!this.interceptor) return null;

    return {
      events: this.interceptor.getEvents(),
      listeners: this.interceptor.getListeners(),
      stats: this.interceptor.getStats()
    };
  }
}

export default DevToolsIntegration;

// Usage in app
import DevToolsIntegration from './devToolsIntegration';

const devTools = new DevToolsIntegration({
  sessionId: 'abc-123',
  userId: 'user-456',
  backendUrl: 'https://your-devtools.com/api'
});

// Enable on app start (in dev mode only)
if (__DEV__) {
  devTools.enable();
}
```

---

## API Reference

### RoutingInterceptor

#### Constructor

```typescript
new RoutingInterceptor(options?: InterceptorOptions)
```

**Options:**

```typescript
interface InterceptorOptions {
  logToConsole?: boolean;        // Log to console (default: true in dev)
  captureListeners?: boolean;    // Monkey patch to capture listeners (default: true)
  onEvent?: (event: RoutingEvent) => void;  // Callback for each event
  filterEvents?: (event: RoutingEvent) => boolean;  // Filter function
}
```

#### Methods

```typescript
// Get all recorded events
getEvents(): RoutingEvent[]

// Get registered listeners
getListeners(): {Linking: Listener[], BackHandler: Listener[]}

// Clear event history
clearEvents(): void

// Get statistics
getStats(): {
  totalEvents: number;
  eventsByType: Record<string, number>;
  listenerCounts: Record<string, number>;
}

// Enable/disable interception
enable(): void
disable(): void
```

#### Event Types

```typescript
interface RoutingEvent {
  source: 'Linking' | 'BackHandler' | 'RCTDeviceEventEmitter';
  type: 'url' | 'hardwareBackPress' | string;
  timestamp: number;
  data?: any;
  url?: string;
  handled?: boolean;
}
```

---

## Best Practices

### ✅ DO

1. **Initialize Early**
   ```javascript
   // In your app entry point (index.js or App.js)
   import routingInterceptor from './routingInterceptor';
   routingInterceptor.enable();
   ```

2. **Only Enable in Development**
   ```javascript
   if (__DEV__) {
     routingInterceptor.enable();
   }
   ```

3. **Filter Noise**
   ```javascript
   const interceptor = new RoutingInterceptor({
     filterEvents: (event) => {
       // Only capture what you need
       return event.type === 'url' || event.type === 'hardwareBackPress';
     }
   });
   ```

4. **Preserve Original Behavior**
   ```javascript
   // Always call original functions
   const wrapped = (...args) => {
     myDevTools.log(args);
     return originalFunction(...args);  // ✅ Call original
   };
   ```

5. **Handle Errors Gracefully**
   ```javascript
   try {
     // Interception code
   } catch (error) {
     console.error('[DevTools] Interception failed:', error);
     // App should still work even if interception fails
   }
   ```

### ❌ DON'T

1. **Don't Enable in Production**
   ```javascript
   // ❌ Bad - always enabled
   routingInterceptor.enable();

   // ✅ Good - dev only
   if (__DEV__) {
     routingInterceptor.enable();
   }
   ```

2. **Don't Forget to Return Values**
   ```javascript
   // ❌ Bad - breaks BackHandler
   BackHandler.addEventListener = (name, handler) => {
     myDevTools.log();
     handler();  // ❌ Not returning result
   };

   // ✅ Good - preserves behavior
   BackHandler.addEventListener = (name, handler) => {
     myDevTools.log();
     return handler();  // ✅ Returns result
   };
   ```

3. **Don't Mutate Event Objects**
   ```javascript
   // ❌ Bad - modifies original
   const wrapped = (event) => {
     event.intercepted = true;  // ❌ Mutation
     return listener(event);
   };

   // ✅ Good - copy first
   const wrapped = (event) => {
     myDevTools.log({...event, intercepted: true});
     return listener(event);  // ✅ Original unchanged
   };
   ```

4. **Don't Block the Main Thread**
   ```javascript
   // ❌ Bad - synchronous heavy work
   const wrapped = (event) => {
     heavyAnalysis(event);  // ❌ Blocks rendering
     return listener(event);
   };

   // ✅ Good - async processing
   const wrapped = (event) => {
     setTimeout(() => heavyAnalysis(event), 0);  // ✅ Async
     return listener(event);
   };
   ```

5. **Don't Ignore Platform Differences**
   ```javascript
   // ❌ Bad - BackHandler on iOS
   BackHandler.addEventListener(...);  // ❌ Crashes on iOS

   // ✅ Good - platform check
   if (Platform.OS === 'android') {
     BackHandler.addEventListener(...);  // ✅ Android only
   }
   ```

---

## Common Pitfalls

### Pitfall 1: BackHandler LIFO Order

**Problem:** Your interceptor doesn't run when you expect.

```javascript
// Wrong assumption: this runs first
BackHandler.addEventListener('hardwareBackPress', myHandler);
routingLibrary.init();  // Adds its own handler AFTER

// Reality: routing library handler runs FIRST (LIFO)
```

**Solution:** Add your handler LAST (or patch addEventListener)

```javascript
// Solution 1: Add after routing library initializes
routingLibrary.init();
BackHandler.addEventListener('hardwareBackPress', myHandler);

// Solution 2: Patch addEventListener
const original = BackHandler.addEventListener;
BackHandler.addEventListener = (name, handler) => {
  myInterceptor.log();
  return original(name, handler);
};
```

### Pitfall 2: Missing Initial URL

**Problem:** Missing the URL that opened the app.

```javascript
// ❌ Bad - misses initial URL
Linking.addEventListener('url', handler);  // Only future URLs
```

**Solution:** Check `getInitialURL()` separately

```javascript
// ✅ Good - captures initial URL too
Linking.getInitialURL().then(url => {
  if (url) {
    myDevTools.recordInitialURL(url);
  }
});

Linking.addEventListener('url', handler);  // Future URLs
```

### Pitfall 3: Memory Leaks

**Problem:** Event listeners never cleaned up.

```javascript
// ❌ Bad - listener never removed
useEffect(() => {
  Linking.addEventListener('url', handler);
  // No cleanup
}, []);
```

**Solution:** Always clean up subscriptions

```javascript
// ✅ Good - cleanup on unmount
useEffect(() => {
  const subscription = Linking.addEventListener('url', handler);

  return () => {
    subscription.remove();  // ✅ Cleanup
  };
}, []);
```

### Pitfall 4: Intercepting Too Late

**Problem:** Routing library already initialized before interception.

```javascript
// ❌ Bad - routing library already added listeners
import {NavigationContainer} from '@react-navigation/native';

function App() {
  setupInterceptor();  // Too late!
  return <NavigationContainer>...</NavigationContainer>;
}
```

**Solution:** Set up interception before app renders

```javascript
// ✅ Good - intercept before any imports
// index.js
import './routingInterceptor';  // ← Sets up interception first
import App from './App';
// ...
```

### Pitfall 5: Global Emitter Not Available

**Problem:** `global.__rctDeviceEventEmitter` is undefined.

```javascript
// ❌ Bad - assumes it exists
const emitter = global.__rctDeviceEventEmitter;
emitter.emit = ...  // ❌ Crashes if undefined
```

**Solution:** Check availability first

```javascript
// ✅ Good - defensive programming
const emitter = global.__rctDeviceEventEmitter;

if (emitter) {
  const originalEmit = emitter.emit.bind(emitter);
  emitter.emit = ...
} else {
  console.warn('[DevTools] RCTDeviceEventEmitter not available');
}
```

---

## Testing Your Interceptors

### Test Case 1: Deep Link Navigation

```javascript
// Test opening a URL
import {Linking} from 'react-native';

async function testDeepLink() {
  // Your interceptor should capture this
  await Linking.openURL('myapp://home/profile?id=123');

  // Verify in your dev tools:
  // - Event type: 'url'
  // - URL: 'myapp://home/profile?id=123'
}
```

### Test Case 2: Back Button

```javascript
// Test back button (Android only, or use dev menu)
import {BackHandler} from 'react-native';

function testBackButton() {
  // Simulate back press programmatically
  BackHandler.exitApp();  // Triggers hardwareBackPress event

  // Or use Android emulator: Press back button
  // Or use React Native dev menu: Press 'd' key in terminal
}
```

### Test Case 3: Multiple Listeners

```javascript
// Test that multiple listeners work correctly
function testMultipleListeners() {
  // Add multiple listeners
  const sub1 = Linking.addEventListener('url', handler1);
  const sub2 = Linking.addEventListener('url', handler2);

  // Trigger event
  Linking.openURL('myapp://test');

  // Verify both handlers called
  // Verify interceptor captured both

  // Cleanup
  sub1.remove();
  sub2.remove();
}
```

### Test Case 4: Event Ordering

```javascript
// Test that events are captured in correct order
function testEventOrdering() {
  const events = [];

  interceptor.onEvent = (event) => {
    events.push(event);
  };

  // Trigger multiple events
  Linking.openURL('myapp://screen1');
  Linking.openURL('myapp://screen2');
  BackHandler.exitApp();

  // Verify order
  console.assert(events.length === 3);
  console.assert(events[0].url === 'myapp://screen1');
  console.assert(events[1].url === 'myapp://screen2');
  console.assert(events[2].type === 'hardwareBackPress');
}
```

### Integration Test Example

```javascript
// __tests__/routingInterceptor.test.js
import {Linking, BackHandler, Platform} from 'react-native';
import RoutingInterceptor from '../routingInterceptor';

describe('RoutingInterceptor', () => {
  let interceptor;
  let events;

  beforeEach(() => {
    events = [];
    interceptor = new RoutingInterceptor({
      logToConsole: false,
      onEvent: (event) => events.push(event)
    });
  });

  it('captures Linking events', async () => {
    await Linking.openURL('myapp://test');

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      source: 'Linking',
      type: 'url',
      url: 'myapp://test'
    });
  });

  it('captures BackHandler events on Android', () => {
    if (Platform.OS !== 'android') {
      return;  // Skip on iOS
    }

    BackHandler.exitApp();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      source: 'BackHandler',
      type: 'hardwareBackPress'
    });
  });

  it('provides stats', () => {
    const stats = interceptor.getStats();

    expect(stats).toHaveProperty('totalEvents');
    expect(stats).toHaveProperty('eventsByType');
    expect(stats).toHaveProperty('listenerCounts');
  });
});
```

---

## Performance Considerations

### 1. Overhead of Interception

**Monkey patching adds overhead:**
- Function call indirection (~0.1ms per event)
- Memory for storing events
- Processing time for callbacks

**Mitigation:**
```javascript
// Only enable in dev mode
if (__DEV__) {
  interceptor.enable();
}

// Use sampling in production (if needed)
const interceptor = new RoutingInterceptor({
  sampleRate: 0.1  // Only capture 10% of events
});
```

### 2. Memory Management

**Events array can grow unbounded:**

```javascript
// ❌ Bad - unlimited growth
this.events.push(event);  // Memory leak

// ✅ Good - bounded size
this.events.push(event);
if (this.events.length > 1000) {
  this.events = this.events.slice(-1000);  // Keep last 1000
}

// ✅ Better - use ring buffer
import RingBuffer from 'ringbufferjs';
this.events = new RingBuffer(1000);
```

### 3. Async Processing

**Don't block the main thread:**

```javascript
// ❌ Bad - synchronous heavy work
onEvent(event) {
  processEvent(event);  // Blocks UI
  sendToServer(event);  // Blocks UI
}

// ✅ Good - async processing
onEvent(event) {
  // Quick logging only
  this.events.push(event);

  // Heavy work in background
  setImmediate(() => {
    processEvent(event);
    sendToServer(event);
  });
}
```

### 4. Batch Network Requests

**Don't send one request per event:**

```javascript
// ❌ Bad - one request per event
onEvent(event) {
  fetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(event)
  });
}

// ✅ Good - batch every 5 seconds
class BatchedSender {
  constructor() {
    this.queue = [];
    this.intervalId = setInterval(() => this.flush(), 5000);
  }

  add(event) {
    this.queue.push(event);
  }

  flush() {
    if (this.queue.length === 0) return;

    fetch('/api/events/batch', {
      method: 'POST',
      body: JSON.stringify(this.queue)
    });

    this.queue = [];
  }
}
```

### 5. Conditional Logging

**Avoid expensive string operations:**

```javascript
// ❌ Bad - always serializes
console.log('[DevTools]', JSON.stringify(event));

// ✅ Good - only if needed
if (__DEV__ && this.options.verbose) {
  console.log('[DevTools]', JSON.stringify(event));
}
```

---

## Compatibility Notes

### React Native Versions

| Version | Linking | BackHandler | RCTDeviceEventEmitter | Notes |
|---------|---------|-------------|----------------------|-------|
| 0.60+ | ✅ | ✅ | ✅ | All features available |
| 0.50-0.59 | ✅ | ✅ | ✅ | Slight API differences |
| < 0.50 | ⚠️ | ⚠️ | ⚠️ | Legacy API, test carefully |

### Platform Support

| Platform | Linking | BackHandler | Notes |
|----------|---------|-------------|-------|
| iOS | ✅ | ❌ | BackHandler no-op on iOS |
| Android | ✅ | ✅ | Full support |
| Web | ⚠️ | ❌ | Linking works differently on web |

### Routing Library Compatibility

| Library | Uses Linking | Uses BackHandler | Notes |
|---------|--------------|------------------|-------|
| React Navigation | ✅ | ✅ | Heavily used |
| Expo Router | ✅ | ✅ | Built on React Navigation |
| React Router Native | ⚠️ | ⚠️ | Different patterns |
| Custom | Varies | Varies | Depends on implementation |

### Known Issues

1. **Hermes Engine**
   - `global.__rctDeviceEventEmitter` may not be immediately available
   - Add defensive checks

2. **Fast Refresh**
   - Monkey patches may not survive Fast Refresh
   - Re-initialize after refresh if needed

3. **Third-Party Navigation**
   - Some libraries (react-native-navigation) use native navigation
   - May not flow through Linking/BackHandler

---

## Next Steps

### For Complete Routing Coverage

This guide covers **React Native primitives only**. For complete routing interception:

1. **Intercept Routing Library Directly**
   - React Navigation: Intercept `navigation.navigate()`, `navigation.goBack()`, etc.
   - Expo Router: Intercept `router.push()`, `router.back()`, etc.

2. **Instrument Navigation State**
   - Subscribe to navigation state changes
   - Track route stack directly

3. **Combine Both Approaches**
   - React Native primitives (this guide) for deep links and back button
   - Routing library interception for all other navigation

### Example: Full Coverage

```javascript
// Complete routing monitoring
class CompleteRoutingMonitor {
  constructor() {
    // Layer 1: React Native primitives (this guide)
    this.setupRNPrimitives();

    // Layer 2: Routing library (library-specific)
    this.setupRoutingLibrary();
  }

  setupRNPrimitives() {
    // Use techniques from this guide
    this.interceptLinking();
    this.interceptBackHandler();
  }

  setupRoutingLibrary() {
    // Intercept React Navigation
    // (Requires separate implementation)
  }
}
```

---

## Summary

### What You Learned

1. ✅ React Native provides **low-level primitives** for routing
2. ✅ Main interception points: **Linking**, **BackHandler**, **RCTDeviceEventEmitter**
3. ✅ Two approaches: **Monkey patching** vs **Simple listeners**
4. ✅ This captures **deep links** and **back button**, not all routing
5. ✅ For complete coverage, also intercept the routing library

### Key Takeaways

- **Linking API** = Deep link/URL navigation interception
- **BackHandler API** = Android back button interception
- **RCTDeviceEventEmitter** = Global event bus (most foundational)
- **Always initialize early** (before routing library)
- **Only enable in dev mode** (performance overhead)
- **Clean up subscriptions** (avoid memory leaks)

### Recommended Approach

For most dev tools:

```javascript
// 1. Use simple listeners (non-invasive)
Linking.addEventListener('url', captureDeepLink);
BackHandler.addEventListener('hardwareBackPress', captureBack);

// 2. Only use monkey patching if you need:
//    - Listener registration tracking
//    - Full event visibility
//    - Control over execution order
```

### File Structure for Your Dev Tools

```
your-devtools/
├── src/
│   ├── routing/
│   │   ├── interceptor.js           # Main interceptor class
│   │   ├── linkingInterceptor.js    # Linking-specific
│   │   ├── backHandlerInterceptor.js # BackHandler-specific
│   │   ├── eventBusInterceptor.js   # RCTDeviceEventEmitter
│   │   └── index.js                 # Public API
│   ├── storage/
│   │   └── eventStore.js            # Store captured events
│   └── index.js                     # Main entry point
└── __tests__/
    └── interceptor.test.js          # Tests
```

---

## Questions & Troubleshooting

### Q: Why aren't all navigation events captured?

**A:** React Native primitives only capture:
- Deep link navigation (Linking)
- Back button navigation (BackHandler)

For programmatic navigation (`navigation.navigate()`), you must intercept the routing library directly.

### Q: Can I use this in production?

**A:** Not recommended. The overhead and monkey patching can cause issues. If you need production monitoring, use sampling and thorough testing.

### Q: Does this work with Expo?

**A:** Yes! Expo uses React Native's Linking and BackHandler. This works in both bare and managed workflows.

### Q: What about iOS swipe-back gesture?

**A:** iOS swipe gesture is handled by the routing library (React Navigation), not React Native core. Intercept the routing library for this.

### Q: Can I undo monkey patching?

**A:** Not easily. Better approach: Keep original reference and conditionally call wrapped vs. original based on a flag.

---

**End of Guide**

For questions or issues, check:
- React Native Linking docs: https://reactnative.dev/docs/linking
- React Native BackHandler docs: https://reactnative.dev/docs/backhandler
- React Navigation docs: https://reactnavigation.org/
- Expo Router docs: https://docs.expo.dev/router/introduction/
