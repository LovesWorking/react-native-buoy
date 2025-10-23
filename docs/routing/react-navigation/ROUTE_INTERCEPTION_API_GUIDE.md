# Complete API Guide: React Navigation Route Interception for DevTools

> A comprehensive guide to implementing route interception, swizzling, and monitoring in React Navigation and Expo Router for building developer tools.

---

## Table of Contents

### Part 1: Quick Start
- [Quick Start Guide](#quick-start-guide)
- [5-Minute Implementation](#5-minute-implementation)
- [Common Use Cases](#common-use-cases)

### Part 2: Core Concepts
- [How React Navigation Routing Works](#how-react-navigation-routing-works)
- [The Event System](#the-event-system)
- [Action Dispatch Flow](#action-dispatch-flow)
- [State Management Architecture](#state-management-architecture)

### Part 3: Interception Methods
- [Method 1: __unsafe_action__ Event (Recommended)](#method-1-__unsafe_action__-event-recommended)
- [Method 2: beforeRemove Event (Prevention)](#method-2-beforeremove-event-prevention)
- [Method 3: onStateChange Callback](#method-3-onstatechange-callback)
- [Method 4: Router Override (Advanced)](#method-4-router-override-advanced)
- [Method 5: Combining Multiple Points](#method-5-combining-multiple-points)

### Part 4: Complete API Reference
- [NavigationContainerRef API](#navigationcontainerref-api)
- [Navigation Events](#navigation-events)
- [Navigation Actions](#navigation-actions)
- [State Types & Interfaces](#state-types--interfaces)
- [TypeScript Integration](#typescript-integration)

### Part 5: Implementation Patterns
- [DevTools Integration Pattern](#devtools-integration-pattern)
- [Analytics Tracking Pattern](#analytics-tracking-pattern)
- [State Persistence Pattern](#state-persistence-pattern)
- [Time-Travel Debugging Pattern](#time-travel-debugging-pattern)

### Part 6: Best Practices
- [Do's and Don'ts](#dos-and-donts)
- [Performance Considerations](#performance-considerations)
- [Error Handling](#error-handling)
- [Testing Strategies](#testing-strategies)

### Part 7: Edge Cases & Troubleshooting
- [Nested Navigators](#nested-navigators)
- [Lazy Loading](#lazy-loading)
- [Deep Links](#deep-links)
- [State Persistence](#state-persistence)
- [Common Issues & Solutions](#common-issues--solutions)

### Part 8: Expo Router Specific
- [Expo Router Integration](#expo-router-integration)
- [File-Based Routing Interception](#file-based-routing-interception)
- [Expo-Specific Patterns](#expo-specific-patterns)

### Part 9: Advanced Topics
- [Custom Router Creation](#custom-router-creation)
- [Multi-Navigator Tracking](#multi-navigator-tracking)
- [Performance Optimization](#performance-optimization)
- [Production vs Development](#production-vs-development)

### Part 10: Examples & Code
- [Complete DevTools Example](#complete-devtools-example)
- [Analytics Example](#analytics-example)
- [Debugging Tools Example](#debugging-tools-example)
- [Real-World Patterns](#real-world-patterns)

---

## Quick Start Guide

### What is Route Interception?

Route interception is the ability to monitor, track, or modify navigation events in a React Navigation app. Similar to intercepting network requests or storage operations, route interception allows dev tools to:

- Track when users navigate between screens
- Log navigation actions for debugging
- Capture route parameters and state
- Prevent navigation when needed
- Record navigation history for time-travel debugging

### Prerequisites

```bash
npm install @react-navigation/native
# OR with Expo
expo install react-navigation
```

### Core Concepts in 60 Seconds

1. **Navigation Actions** - Commands like `navigate()`, `goBack()`, `reset()`
2. **Events** - Emitted during navigation lifecycle (`__unsafe_action__`, `beforeRemove`, `state`, etc.)
3. **State** - The current navigation tree structure
4. **Interception Points** - Where you hook into the navigation flow

---

## 5-Minute Implementation

### Basic Action Tracking

```typescript
import { useNavigationContainerRef } from '@react-navigation/native';
import { useEffect } from 'react';

function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (!navigationRef.current) return;

    // ✅ Track all navigation actions
    const unsubscribe = navigationRef.current.addListener('__unsafe_action__', (e) => {
      const { action, noop } = e.data;

      console.log('Navigation action:', action.type);
      console.log('Target screen:', action.payload?.name);
      console.log('Was no-op?:', noop);
    });

    return unsubscribe;
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      {/* Your navigators */}
    </NavigationContainer>
  );
}
```

**That's it!** You're now tracking all navigation actions.

### Adding State Tracking

```typescript
<NavigationContainer
  ref={navigationRef}
  onStateChange={(state) => {
    // ✅ Track state after every navigation
    const currentRoute = state?.routes[state?.index];
    console.log('Current screen:', currentRoute?.name);
    console.log('Route params:', currentRoute?.params);
  }}
>
  {/* Your navigators */}
</NavigationContainer>
```

---

## Common Use Cases

### Use Case 1: Analytics Tracking

```typescript
navigationRef.current.addListener('__unsafe_action__', (e) => {
  if (e.data.action.type === 'NAVIGATE') {
    analytics.track('screen_view', {
      screen: e.data.action.payload.name,
      params: e.data.action.payload.params,
    });
  }
});
```

### Use Case 2: Navigation Logging

```typescript
const navigationHistory: NavigationAction[] = [];

navigationRef.current.addListener('__unsafe_action__', (e) => {
  navigationHistory.push({
    ...e.data.action,
    timestamp: Date.now(),
  });
});
```

### Use Case 3: Preventing Navigation

```typescript
// In your screen component
navigation.addListener('beforeRemove', (e) => {
  if (hasUnsavedChanges) {
    e.preventDefault();

    Alert.alert(
      'Discard changes?',
      'You have unsaved changes',
      [
        { text: 'Cancel' },
        {
          text: 'Discard',
          onPress: () => navigation.dispatch(e.data.action),
          style: 'destructive',
        },
      ]
    );
  }
});
```

---

## How React Navigation Routing Works

### Architecture Overview

```
User Action (tap, swipe, navigate())
  ↓
Action Dispatch (navigation.dispatch(action))
  ↓
Action Bubbling (up to parents, down to children)
  ↓
Router Processing (getStateForAction)
  ↓
State Update (setState)
  ↓
React Re-render
  ↓
Event Emission (focus, blur, state, __unsafe_action__)
  ↓
Screen Transition
```

### Key Components

1. **NavigationContainer** - Root component managing state & emitting events
2. **Navigators** (Stack, Tab, Drawer) - Define screen structure
3. **Routers** - Process actions and compute new state
4. **Event Emitter** - Broadcasts navigation events
5. **State Store** - Holds current navigation state

### File Locations

| Component | File |
|-----------|------|
| NavigationContainer | `/packages/core/src/BaseNavigationContainer.tsx` |
| Event Emitter | `/packages/core/src/useEventEmitter.tsx` |
| Action Handler | `/packages/core/src/useOnAction.tsx` |
| State Store | `/packages/core/src/useSyncState.tsx` |
| Stack Router | `/packages/routers/src/StackRouter.tsx` |

---

## The Event System

### Event Types

#### Core Events (Available on all screens)

| Event | Preventable | Data | When It Fires |
|-------|-------------|------|---------------|
| `focus` | ❌ | `undefined` | Screen becomes active |
| `blur` | ❌ | `undefined` | Screen loses focus |
| `state` | ❌ | `{ state }` | Navigation state changes |
| `beforeRemove` | ✅ | `{ action }` | BEFORE route is removed |

#### Container Events (Available on NavigationContainer ref)

| Event | Preventable | Data | When It Fires |
|-------|-------------|------|---------------|
| `ready` | ❌ | `undefined` | Container initialized |
| `__unsafe_action__` | ❌ | `{ action, noop, stack }` | ANY action dispatched |
| `options` | ❌ | `{ options }` | Screen options change |

#### Navigator-Specific Events

| Event | Navigator | Data | When It Fires |
|-------|-----------|------|---------------|
| `transitionStart` | Stack | `{ closing }` | Transition animation starts |
| `transitionEnd` | Stack | `{ closing }` | Transition animation ends |
| `tabPress` | Tab/Drawer | `undefined` | Tab bar button pressed (preventable) |
| `gestureStart` | Stack/Drawer | `undefined` | User starts swipe gesture |
| `gestureEnd` | Stack/Drawer | `undefined` | User completes swipe gesture |

### Event Listener API

```typescript
// Add listener
const unsubscribe = navigation.addListener(eventType, callback);

// Remove listener
unsubscribe();

// OR
navigation.removeListener(eventType, callback);
```

### Event Object Structure

```typescript
type EventArg<EventName, CanPreventDefault, Data> = {
  readonly type: EventName;
  readonly target?: string;  // Route key
} & (CanPreventDefault extends true ? {
  readonly defaultPrevented: boolean;
  preventDefault(): void;
} : {}) & {
  readonly data: Readonly<Data>;
};
```

---

## Action Dispatch Flow

### How Actions Flow Through the System

```
1. navigation.navigate('Screen')
     ↓
2. dispatch(CommonActions.navigate('Screen'))
     ↓
3. useOnAction receives action
     ↓
4. Check if target matches (action.target === state.key)
     ↓
5. Emit __unsafe_action__ event
     ↓
6. Call router.getStateForAction(state, action)
     ↓
7. Check beforeRemove listeners (can preventDefault)
     ↓
8. setState(newState)
     ↓
9. React renders new state
     ↓
10. Emit focus/blur events
     ↓
11. Emit state event
     ↓
12. Call onStateChange callback
```

### Action Types

#### CommonActions (All Navigators)

```typescript
import { CommonActions } from '@react-navigation/native';

// Navigate to screen
CommonActions.navigate('ScreenName', { param: 'value' });

// Go back
CommonActions.goBack();

// Reset navigation state
CommonActions.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});

// Set params on current route
CommonActions.setParams({ key: 'value' });

// Preload a route
CommonActions.preload('ScreenName');
```

#### StackActions (Stack Navigator)

```typescript
import { StackActions } from '@react-navigation/native';

// Push new screen onto stack
StackActions.push('ScreenName', params);

// Pop N screens from stack
StackActions.pop(2);

// Pop to top (go to first screen)
StackActions.popToTop();

// Replace current screen
StackActions.replace('NewScreen', params);

// Pop to specific screen
StackActions.popTo('ScreenName');
```

#### TabActions (Tab Navigator)

```typescript
import { TabActions } from '@react-navigation/native';

// Jump to tab
TabActions.jumpTo('TabName', params);
```

#### DrawerActions (Drawer Navigator)

```typescript
import { DrawerActions } from '@react-navigation/native';

DrawerActions.openDrawer();
DrawerActions.closeDrawer();
DrawerActions.toggleDrawer();
```

### Action Structure

```typescript
type NavigationAction = {
  type: string;           // e.g., 'NAVIGATE', 'GO_BACK'
  payload?: object;       // Action-specific data
  source?: string;        // Route key that dispatched action
  target?: string;        // Navigator key that should handle action
};
```

---

## State Management Architecture

### NavigationState Structure

```typescript
type NavigationState = {
  key: string;                  // Unique identifier
  index: number;                // Currently focused route index
  routeNames: string[];         // Valid route names
  routes: Route[];              // Array of routes
  type: string;                 // Router type ('stack', 'tab', 'drawer')
  stale: false;                 // Rehydration flag
  history?: unknown[];          // Optional history (Tab/Drawer)
};

type Route = {
  key: string;                  // Unique route key
  name: string;                 // Route name
  params?: object;              // Route parameters
  path?: string;                // Deep link path
  state?: NavigationState;      // Nested navigator state
};
```

### State Storage

State is stored in a closure-based store created by `useSyncState`:

```typescript
// Simplified version
const store = {
  state: deepFreeze(initialState),  // Frozen in dev
  listeners: Set<() => void>(),

  setState(newState) {
    this.state = deepFreeze(newState);
    this.listeners.forEach(cb => cb());
  },

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
};
```

### State Immutability

- State is **deep frozen** in development (not in production)
- `params` objects are NOT frozen (user-provided)
- All updates must return new objects
- Reference equality check determines if state changed

---

## Method 1: __unsafe_action__ Event (Recommended)

### Overview

The `__unsafe_action__` event is emitted for **EVERY** navigation action dispatch, making it the most comprehensive interception point.

### Why It's Recommended

✅ **Pros:**
- Captures 100% of navigation actions
- Includes action metadata (type, payload, source, target)
- Provides stack trace in development
- Indicates if action was a no-op
- Non-invasive (doesn't affect app behavior)
- Used by React Navigation DevTools

❌ **Cons:**
- Cannot prevent actions
- Marked "unsafe" (but actually stable)
- Stack trace only in development

### Implementation

```typescript
import { useNavigationContainerRef } from '@react-navigation/native';
import { useEffect, useRef } from 'react';

function useNavigationTracking() {
  const navigationRef = useNavigationContainerRef();
  const actionsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!navigationRef.current) return;

    const unsubscribe = navigationRef.current.addListener(
      '__unsafe_action__',
      (e) => {
        const { action, noop, stack } = e.data;

        // Store action with metadata
        actionsRef.current.push({
          action,
          noop,
          stack,
          timestamp: Date.now(),
        });

        // Log to console
        console.log('[Navigation Action]', {
          type: action.type,
          payload: action.payload,
          wasNoOp: noop,
        });

        // Send to dev tools
        window.postMessage({
          type: 'NAVIGATION_ACTION',
          data: { action, noop, stack },
        }, '*');
      }
    );

    return unsubscribe;
  }, [navigationRef]);

  return { navigationRef, actions: actionsRef.current };
}
```

### Event Data Structure

```typescript
type UnsafeActionEvent = EventArg<
  '__unsafe_action__',
  false,  // Cannot prevent
  {
    action: NavigationAction;
    noop: boolean;              // Was state unchanged?
    stack: string | undefined;  // Call stack (dev only)
  }
>;
```

### Real-World Example (from DevTools)

```typescript
// packages/devtools/src/useDevToolsBase.tsx
const unsubscribeAction = navigation.addListener('__unsafe_action__', (e) => {
  const action = e.data.action;
  const stack = e.data.stack;

  send({
    type: 'action',
    action,
    state: lastStateRef.current,
    stack,
  });
});
```

### File Location

- **Emission Point**: `/packages/core/src/BaseNavigationContainer.tsx` lines 230-237
- **Usage Example**: `/packages/devtools/src/useDevToolsBase.tsx`

---

## Method 2: beforeRemove Event (Prevention)

### Overview

The `beforeRemove` event is the **ONLY** preventable navigation event. It fires synchronously BEFORE a route is removed from the navigator.

### When to Use

- Confirming unsaved changes
- Blocking navigation in certain states
- Showing exit dialogs
- Protecting against accidental navigation

### Implementation

```typescript
import { useEffect } from 'react';

function usePreventUnsavedChanges(hasUnsavedChanges: boolean) {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
        // No unsaved changes, allow navigation
        return;
      }

      // Prevent navigation
      e.preventDefault();

      // Show confirmation dialog
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          { text: "Don't leave", style: 'cancel' },
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => {
              // User confirmed, dispatch the blocked action
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);
}
```

### High-Level Hook (usePreventRemove)

React Navigation provides a convenience hook:

```typescript
import { usePreventRemove } from '@react-navigation/native';

function MyScreen() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    Alert.alert(
      'Discard changes?',
      'You have unsaved changes',
      [
        { text: 'Cancel' },
        {
          text: 'Discard',
          onPress: () => navigation.dispatch(data.action),
        },
      ]
    );
  });

  return (/* ... */);
}
```

### Event Timing

```
Action Dispatch
  ↓
useOnAction handler
  ↓
router.getStateForAction (returns new state)
  ↓
Emit __unsafe_action__ event
  ↓
shouldPreventRemove check  ← beforeRemove fires HERE (SYNC)
  ↓
If not prevented: setState(newState)
  ↓
React render
```

### File Location

- **Emission Point**: `/packages/core/src/useOnPreventRemove.tsx` lines 61-66
- **High-Level Hook**: `/packages/core/src/usePreventRemove.tsx`
- **Check Logic**: `/packages/core/src/useOnAction.tsx` lines 106-114

---

## Method 3: onStateChange Callback

### Overview

The `onStateChange` callback fires **AFTER** every navigation state update with the fully rehydrated state tree.

### When to Use

- State persistence
- Analytics tracking (final state)
- Logging complete navigation tree
- Syncing state to external store

### Implementation

```typescript
<NavigationContainer
  onStateChange={(state) => {
    if (!state) return;

    // Get current route
    const currentRoute = state.routes[state.index];

    // Track screen view
    analytics.logScreenView({
      screen_name: currentRoute.name,
      screen_params: currentRoute.params,
    });

    // Persist state
    AsyncStorage.setItem(
      'NAVIGATION_STATE',
      JSON.stringify(state)
    );

    // Log to console
    console.log('Navigation State:', state);
  }}
  onReady={() => {
    console.log('Navigation ready');
  }}
>
  {/* navigators */}
</NavigationContainer>
```

### Extracting Current Route

```typescript
function getCurrentRoute(state: NavigationState | PartialState<NavigationState>) {
  if (!state || !state.routes) return null;

  const route = state.routes[state.index];

  // Recursively find focused route in nested navigators
  if (route.state) {
    return getCurrentRoute(route.state);
  }

  return route;
}
```

### Complete Example with Persistence

```typescript
function App() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('NAVIGATION_STATE');
        const state = savedState ? JSON.parse(savedState) : undefined;

        setInitialState(state);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        AsyncStorage.setItem('NAVIGATION_STATE', JSON.stringify(state));
      }}
    >
      {/* navigators */}
    </NavigationContainer>
  );
}
```

### File Location

- **Callback Point**: `/packages/core/src/BaseNavigationContainer.tsx` lines 320-397

---

## Method 4: Router Override (Advanced)

### Overview

Router override provides the **deepest** level of control, allowing you to intercept and modify the router's `getStateForAction` method.

### When to Use

- Custom navigation logic
- Action transformation
- Advanced state manipulation
- Building custom navigators

### Implementation

```typescript
import { StackRouter } from '@react-navigation/native';

<Stack.Navigator
  router={(original) => {
    const customRouter = {
      ...original,

      getStateForAction(state, action, options) {
        // Log action before processing
        console.log('[Router] Processing action:', action.type);

        // Modify action if needed
        if (action.type === 'NAVIGATE' && action.payload.name === 'Admin') {
          if (!user.isAdmin) {
            console.warn('Blocked admin navigation');
            return state;  // Return unchanged state (no navigation)
          }
        }

        // Call original router
        const result = original.getStateForAction(state, action, options);

        // Log result
        console.log('[Router] New state:', result);

        return result;
      },
    };

    return customRouter;
  }}
>
  {/* screens */}
</Stack.Navigator>
```

### Custom Action Creators

```typescript
router={(original) => ({
  ...original,

  // Add custom action creators
  actionCreators: {
    ...original.actionCreators,

    navigateWithDelay(name: string, delay: number) {
      return (dispatch) => {
        setTimeout(() => {
          dispatch(CommonActions.navigate(name));
        }, delay);
      };
    },
  },
})}
```

### File Location

- **Router Prop**: `/packages/core/src/types.tsx` lines 99-107
- **Usage**: `/packages/core/src/useNavigationBuilder.tsx` lines 312-345

---

## Method 5: Combining Multiple Points

### Overview

For comprehensive tracking, combine multiple interception methods to capture different aspects of navigation.

### Recommended Pattern

```typescript
function useComprehensiveNavigationTracking() {
  const navigationRef = useNavigationContainerRef();
  const trackingData = useRef({
    actions: [],
    states: [],
    preventions: [],
  });

  // 1. Track all action dispatches
  useEffect(() => {
    if (!navigationRef.current) return;

    const unsubscribe = navigationRef.current.addListener(
      '__unsafe_action__',
      (e) => {
        trackingData.current.actions.push({
          type: 'action',
          action: e.data.action,
          noop: e.data.noop,
          timestamp: Date.now(),
        });
      }
    );

    return unsubscribe;
  }, [navigationRef]);

  // 2. Track final states
  const handleStateChange = useCallback((state) => {
    trackingData.current.states.push({
      type: 'state',
      state,
      timestamp: Date.now(),
    });
  }, []);

  // 3. Track prevention attempts (at screen level)
  const useTrackPreventions = (navigation) => {
    useEffect(() => {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (e.defaultPrevented) {
          trackingData.current.preventions.push({
            type: 'prevention',
            action: e.data.action,
            timestamp: Date.now(),
          });
        }
      });

      return unsubscribe;
    }, [navigation]);
  };

  return {
    navigationRef,
    onStateChange: handleStateChange,
    useTrackPreventions,
    getData: () => trackingData.current,
  };
}

// Usage
function App() {
  const {
    navigationRef,
    onStateChange,
    getData,
  } = useComprehensiveNavigationTracking();

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={onStateChange}
    >
      {/* navigators */}
    </NavigationContainer>
  );
}
```

---

## NavigationContainerRef API

### Creating a Ref

```typescript
import { useNavigationContainerRef } from '@react-navigation/native';

const navigationRef = useNavigationContainerRef<RootParamList>();

<NavigationContainer ref={navigationRef}>
  {/* ... */}
</NavigationContainer>
```

### Available Methods

```typescript
// Navigation methods
navigationRef.current?.navigate('Screen', params);
navigationRef.current?.goBack();
navigationRef.current?.dispatch(action);
navigationRef.current?.reset(state);

// State access
const state = navigationRef.current?.getRootState();
const currentRoute = navigationRef.current?.getCurrentRoute();
const options = navigationRef.current?.getCurrentOptions();

// Utilities
const isReady = navigationRef.current?.isReady();
const canGoBack = navigationRef.current?.canGoBack();

// Events
const unsubscribe = navigationRef.current?.addListener(type, callback);
navigationRef.current?.removeListener(type, callback);
```

### Type-Safe Navigation

```typescript
type RootParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: { section?: string };
};

const navigationRef = useNavigationContainerRef<RootParamList>();

// ✅ Type-safe
navigationRef.current?.navigate('Profile', { userId: '123' });

// ❌ Type error - missing required param
navigationRef.current?.navigate('Profile');

// ❌ Type error - invalid screen
navigationRef.current?.navigate('InvalidScreen');
```

---

## Navigation Events

### Complete Event Reference

```typescript
// Core events (all screens)
navigation.addListener('focus', () => {});
navigation.addListener('blur', () => {});
navigation.addListener('state', (e) => {
  const { state } = e.data;
});
navigation.addListener('beforeRemove', (e) => {
  e.preventDefault(); // Only this event can be prevented
  const { action } = e.data;
});

// Container events (NavigationContainerRef)
navigationRef.current.addListener('ready', () => {});
navigationRef.current.addListener('__unsafe_action__', (e) => {
  const { action, noop, stack } = e.data;
});
navigationRef.current.addListener('options', (e) => {
  const { options } = e.data;
});

// Stack navigator events
navigation.addListener('transitionStart', (e) => {
  const { closing } = e.data;
});
navigation.addListener('transitionEnd', (e) => {
  const { closing } = e.data;
});
navigation.addListener('gestureStart', () => {});
navigation.addListener('gestureEnd', () => {});
navigation.addListener('gestureCancel', () => {});

// Tab navigator events
navigation.addListener('tabPress', (e) => {
  e.preventDefault(); // Can prevent tab switch
});
navigation.addListener('tabLongPress', () => {});

// Drawer navigator events
navigation.addListener('drawerOpen', () => {});
navigation.addListener('drawerClose', () => {});
```

### Event Listener Patterns

**Pattern 1: useEffect Hook**
```typescript
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Runs when screen comes into focus
  });

  return unsubscribe;
}, [navigation]);
```

**Pattern 2: Screen listeners Prop**
```typescript
<Stack.Screen
  name="MyScreen"
  component={MyScreen}
  listeners={{
    focus: () => console.log('Focused'),
    beforeRemove: (e) => {
      if (hasChanges) e.preventDefault();
    },
  }}
/>
```

**Pattern 3: Dynamic listeners Function**
```typescript
<Stack.Screen
  name="MyScreen"
  component={MyScreen}
  listeners={({ route, navigation }) => ({
    focus: () => {
      console.log(`${route.name} focused`);
    },
  })}
/>
```

---

## Navigation Actions

### Action Properties

```typescript
type NavigationAction = {
  type: string;           // Action type constant
  payload?: object;       // Action-specific data
  source?: string;        // Route key that initiated action
  target?: string;        // Navigator key to handle action
};
```

### Creating Actions

```typescript
import { CommonActions, StackActions } from '@react-navigation/native';

// Navigate
const navigateAction = CommonActions.navigate('Screen', { id: '123' });

// With options
const navigateAction = CommonActions.navigate({
  name: 'Screen',
  params: { id: '123' },
  merge: true,  // Merge with existing params
});

// Stack push
const pushAction = StackActions.push('Screen', params);

// Reset
const resetAction = CommonActions.reset({
  index: 1,
  routes: [
    { name: 'Home' },
    { name: 'Profile', params: { userId: '123' } },
  ],
});
```

### Dispatching Actions

```typescript
// Via navigation prop
navigation.dispatch(action);

// Via ref
navigationRef.current?.dispatch(action);

// With callback
navigation.dispatch((state) => {
  // Create action based on current state
  return CommonActions.navigate('Screen');
});
```

---

## State Types & Interfaces

### Core Types

```typescript
import type {
  NavigationState,
  PartialState,
  InitialState,
  Route,
  NavigationAction,
  NavigationContainerRef,
  NavigationProp,
  RouteProp,
} from '@react-navigation/native';
```

### State Hierarchy

```typescript
// Full navigation state
type NavigationState<ParamList = ParamListBase> = {
  key: string;
  index: number;
  routeNames: string[];
  routes: Route[];
  type: string;
  stale: false;
  history?: unknown[];
};

// Partial state (for rehydration)
type PartialState<State> = Partial<Omit<State, 'stale' | 'routes'>> & {
  stale?: true;
  routes: PartialRoute[];
};

// Initial state (for persistence)
type InitialState = Omit<NavigationState, 'stale' | 'routes'> & {
  routes: Omit<Route, 'key'>[];  // No keys in persisted state
};
```

### Route Types

```typescript
type Route<RouteName, Params> = {
  key: string;
  name: RouteName;
  params?: Params;
  path?: string;
  state?: NavigationState;  // Nested navigator state
};
```

---

## TypeScript Integration

### Type-Safe Param Lists

```typescript
type RootStackParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: { section: 'general' | 'privacy' };
};

type TabParamList = {
  Feed: undefined;
  Notifications: { filter?: 'all' | 'unread' };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

### Type-Safe Navigation

```typescript
import type { NavigationProp } from '@react-navigation/native';

type Props = {
  navigation: NavigationProp<RootStackParamList, 'Profile'>;
};

function ProfileScreen({ navigation }: Props) {
  // ✅ Type-safe
  navigation.navigate('Settings', { section: 'general' });

  // ❌ Type error
  navigation.navigate('Settings', { section: 'invalid' });
}
```

### Type-Safe Hooks

```typescript
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

function MyScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Profile'>>();

  // route.params is typed correctly
  const userId = route.params.userId;
}
```

---

## DevTools Integration Pattern

### Complete Implementation

```typescript
// devtools.ts
import type {
  NavigationContainerRef,
  NavigationAction,
  NavigationState,
} from '@react-navigation/native';

interface DevToolsMessage {
  type: 'action' | 'state';
  data: any;
  timestamp: number;
}

export function setupDevTools(
  navigationRef: React.RefObject<NavigationContainerRef<any>>
) {
  const messages: DevToolsMessage[] = [];
  let devToolsPort: MessagePort | null = null;

  // Connect to dev tools window
  if (typeof window !== 'undefined') {
    window.addEventListener('message', (event) => {
      if (event.data.type === 'DEVTOOLS_CONNECT') {
        devToolsPort = event.ports[0];

        // Send current state
        devToolsPort.postMessage({
          type: 'INITIAL_STATE',
          state: navigationRef.current?.getRootState(),
        });
      }
    });
  }

  // Track actions
  const unsubscribeAction = navigationRef.current?.addListener(
    '__unsafe_action__',
    (e) => {
      const message: DevToolsMessage = {
        type: 'action',
        data: {
          action: e.data.action,
          noop: e.data.noop,
          stack: e.data.stack,
        },
        timestamp: Date.now(),
      };

      messages.push(message);
      devToolsPort?.postMessage(message);
    }
  );

  // Track state changes
  const handleStateChange = (state: NavigationState | undefined) => {
    const message: DevToolsMessage = {
      type: 'state',
      data: { state },
      timestamp: Date.now(),
    };

    messages.push(message);
    devToolsPort?.postMessage(message);
  };

  return {
    unsubscribeAction,
    handleStateChange,
    getMessages: () => messages,
    disconnect: () => {
      unsubscribeAction?.();
      devToolsPort?.close();
    },
  };
}

// Usage
function App() {
  const navigationRef = useNavigationContainerRef();
  const devToolsRef = useRef<ReturnType<typeof setupDevTools>>();

  useEffect(() => {
    if (navigationRef.current) {
      devToolsRef.current = setupDevTools(navigationRef);
    }

    return () => devToolsRef.current?.disconnect();
  }, []);

  return (
    <NavigationContainer
      ref={navigationRef}
      onStateChange={devToolsRef.current?.handleStateChange}
    >
      {/* navigators */}
    </NavigationContainer>
  );
}
```

---

## Analytics Tracking Pattern

### Screen View Tracking

```typescript
function useAnalytics() {
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef<string>();

  useEffect(() => {
    if (!navigationRef.current) return;

    const unsubscribe = navigationRef.current.addListener('state', (e) => {
      const currentRoute = getCurrentRoute(e.data.state);
      const previousRouteName = routeNameRef.current;
      const currentRouteName = currentRoute?.name;

      if (previousRouteName !== currentRouteName) {
        // Track screen view
        analytics.logScreenView({
          screen_name: currentRouteName,
          screen_params: currentRoute?.params,
          previous_screen: previousRouteName,
        });
      }

      routeNameRef.current = currentRouteName;
    });

    return unsubscribe;
  }, [navigationRef]);

  return { navigationRef };
}
```

### Navigation Event Tracking

```typescript
navigationRef.current?.addListener('__unsafe_action__', (e) => {
  const { action } = e.data;

  // Track navigation events
  switch (action.type) {
    case 'NAVIGATE':
      analytics.track('navigate', {
        to: action.payload.name,
        params: action.payload.params,
      });
      break;

    case 'GO_BACK':
      analytics.track('go_back');
      break;

    case 'RESET':
      analytics.track('navigation_reset');
      break;
  }
});
```

---

## State Persistence Pattern

### AsyncStorage Implementation

```typescript
const PERSISTENCE_KEY = 'NAVIGATION_STATE';

function usePersistence() {
  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restore = async () => {
      try {
        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        const state = savedState ? JSON.parse(savedState) : undefined;

        if (state !== undefined) {
          setInitialState(state);
        }
      } catch (e) {
        // Handle error
        console.warn('Failed to restore state:', e);
      } finally {
        setIsReady(true);
      }
    };

    restore();
  }, []);

  const onStateChange = useCallback((state) => {
    AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
  }, []);

  return { isReady, initialState, onStateChange };
}

// Usage
function App() {
  const { isReady, initialState, onStateChange } = usePersistence();

  if (!isReady) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={onStateChange}
    >
      {/* navigators */}
    </NavigationContainer>
  );
}
```

---

## Time-Travel Debugging Pattern

### Implementation

```typescript
function useTimeTravel() {
  const navigationRef = useNavigationContainerRef();
  const history = useRef<NavigationState[]>([]);
  const currentIndex = useRef(0);

  // Record state changes
  const handleStateChange = useCallback((state: NavigationState) => {
    // Truncate future history if we're not at the end
    history.current = history.current.slice(0, currentIndex.current + 1);

    // Add new state
    history.current.push(state);
    currentIndex.current = history.current.length - 1;
  }, []);

  // Go back in history
  const goToPast = useCallback((steps: number = 1) => {
    const newIndex = Math.max(0, currentIndex.current - steps);
    currentIndex.current = newIndex;

    const pastState = history.current[newIndex];
    navigationRef.current?.resetRoot(pastState);
  }, [navigationRef]);

  // Go forward in history
  const goToFuture = useCallback((steps: number = 1) => {
    const newIndex = Math.min(
      history.current.length - 1,
      currentIndex.current + steps
    );
    currentIndex.current = newIndex;

    const futureState = history.current[newIndex];
    navigationRef.current?.resetRoot(futureState);
  }, [navigationRef]);

  return {
    navigationRef,
    handleStateChange,
    goToPast,
    goToFuture,
    canGoToPast: currentIndex.current > 0,
    canGoToFuture: currentIndex.current < history.current.length - 1,
  };
}
```

---

## Do's and Don'ts

### ✅ DO

- **DO** use `__unsafe_action__` for comprehensive tracking
- **DO** combine multiple interception methods for complete coverage
- **DO** clean up listeners when components unmount
- **DO** use TypeScript for type safety
- **DO** handle edge cases (nested navigators, lazy loading, etc.)
- **DO** test with different navigator types (Stack, Tab, Drawer)
- **DO** debounce high-frequency operations
- **DO** use selectors with `useNavigationState` for efficiency

### ❌ DON'T

- **DON'T** rely on `__unsafe_action__` for prevention (use `beforeRemove`)
- **DON'T** mutate state directly (always immutable)
- **DON'T** forget to unsubscribe from listeners
- **DON'T** assume all events are preventable (only `beforeRemove` and `tabPress`)
- **DON'T** ignore `noop` flag (indicates no state change)
- **DON'T** access `navigation` before container is ready
- **DON'T** synchronously dispatch actions in listeners (can cause loops)

---

## Performance Considerations

### Optimization Strategies

1. **Debounce High-Frequency Events**
```typescript
const debouncedHandler = useMemo(
  () => debounce((state) => {
    // Handle state change
  }, 100),
  []
);

<NavigationContainer onStateChange={debouncedHandler}>
```

2. **Use Selectors for State Subscription**
```typescript
const currentRouteName = useNavigationState(
  (state) => state?.routes[state?.index]?.name
);
// Only re-renders when route name changes
```

3. **Batch Multiple Listeners**
```typescript
// ❌ Bad: Multiple separate listeners
navigation.addListener('focus', handler1);
navigation.addListener('focus', handler2);

// ✅ Good: Single listener with batched operations
navigation.addListener('focus', () => {
  handler1();
  handler2();
});
```

4. **Lazy Initialization**
```typescript
const devToolsRef = useRef<DevTools>();

useEffect(() => {
  // Only initialize devtools when navigation is ready
  if (navigationRef.current && !devToolsRef.current) {
    devToolsRef.current = initializeDevTools(navigationRef);
  }
}, [navigationRef.current]);
```

---

## Error Handling

### Common Errors

**Error: "Couldn't find a navigation object"**
```typescript
// ❌ Accessing navigation before ready
useEffect(() => {
  navigationRef.current.navigate('Screen'); // Error!
}, []);

// ✅ Wait for ready
useEffect(() => {
  if (navigationRef.current?.isReady()) {
    navigationRef.current.navigate('Screen');
  }
}, []);
```

**Error: "The action '...' was not handled"**
```typescript
// Means the action was dispatched but no router handled it
// Check:
// 1. Route name is correct
// 2. Navigator is mounted
// 3. Target is correct

navigationRef.current?.addListener('__unsafe_action__', (e) => {
  if (e.data.noop) {
    console.warn('Action not handled:', e.data.action);
  }
});
```

### Error Boundaries

```typescript
<NavigationContainer
  onError={(error) => {
    console.error('Navigation error:', error);
    Sentry.captureException(error);
  }}
  fallback={<ErrorScreen />}
>
  {/* navigators */}
</NavigationContainer>
```

---

## Testing Strategies

### Unit Testing Listeners

```typescript
import { renderHook } from '@testing-library/react-hooks';

describe('useNavigationTracking', () => {
  it('tracks actions', () => {
    const navigationRef = {
      current: {
        addListener: jest.fn(),
      },
    };

    renderHook(() => useNavigationTracking(navigationRef));

    expect(navigationRef.current.addListener).toHaveBeenCalledWith(
      '__unsafe_action__',
      expect.any(Function)
    );
  });
});
```

### Integration Testing

```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('Navigation Tracking', () => {
  it('tracks screen navigation', async () => {
    const onAction = jest.fn();
    const { getByText } = render(<App onAction={onAction} />);

    fireEvent.press(getByText('Go to Profile'));

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'NAVIGATE',
        payload: { name: 'Profile' },
      })
    );
  });
});
```

---

## Nested Navigators

### Tracking Nested Navigation

```typescript
// Each navigator has its own event emitter
// Container-level listeners only track root navigator

// To track nested navigators:
function NestedScreen() {
  const navigation = useNavigation();

  useEffect(() => {
    // This tracks THIS navigator's events
    const unsubscribe = navigation.addListener('state', (e) => {
      console.log('Nested navigator state:', e.data.state);
    });

    return unsubscribe;
  }, [navigation]);
}
```

### Composed State

```typescript
// onStateChange receives FULL state tree including nested states
<NavigationContainer
  onStateChange={(state) => {
    // state includes nested navigator states
    const route = state.routes[state.index];
    if (route.state) {
      console.log('Nested state:', route.state);
    }
  }}
>
```

---

## Lazy Loading

### Tracking Lazy Screens

```typescript
// Tab/Drawer navigators support lazy loading
<Tab.Navigator lazy={true}>
  <Tab.Screen name="Feed" component={FeedScreen} />
  <Tab.Screen name="Profile" component={ProfileScreen} />
</Tab.Navigator>

// Track when screens actually mount
function ProfileScreen() {
  useEffect(() => {
    console.log('ProfileScreen mounted');
    return () => console.log('ProfileScreen unmounted');
  }, []);
}
```

### Preloading Detection

```typescript
navigationRef.current?.addListener('__unsafe_action__', (e) => {
  if (e.data.action.type === 'PRELOAD') {
    console.log('Preloading:', e.data.action.payload.name);
  }
});
```

---

## Deep Links

### Tracking Deep Link Navigation

```typescript
<NavigationContainer
  linking={{
    prefixes: ['myapp://'],
    config: {
      screens: {
        Profile: 'user/:id',
      },
    },
  }}
  onStateChange={(state) => {
    // Detect deep link navigation
    const route = getCurrentRoute(state);
    if (route?.path) {
      console.log('Deep link path:', route.path);
      analytics.track('deep_link', { path: route.path });
    }
  }}
>
```

### Initial URL Tracking

```typescript
useEffect(() => {
  // Track initial deep link
  Linking.getInitialURL().then((url) => {
    if (url) {
      console.log('App opened with URL:', url);
      analytics.track('app_open_url', { url });
    }
  });
}, []);
```

---

## State Persistence

### Serialization Validation

```typescript
import { checkSerializable } from '@react-navigation/native';

const handleStateChange = (state) => {
  if (__DEV__) {
    const result = checkSerializable(state);
    if (!result.serializable) {
      console.warn(
        'State is not serializable:',
        result.location,
        result.reason
      );
    }
  }

  AsyncStorage.setItem('STATE', JSON.stringify(state));
};
```

### Migration Strategy

```typescript
const PERSISTENCE_VERSION = 2;

async function restoreState() {
  const saved = await AsyncStorage.getItem('STATE');
  if (!saved) return undefined;

  const { version, state } = JSON.parse(saved);

  if (version !== PERSISTENCE_VERSION) {
    // Migrate old state
    return migrateState(state, version);
  }

  return state;
}
```

---

## Common Issues & Solutions

### Issue: Listeners Not Firing

**Problem:**
```typescript
useEffect(() => {
  navigation.addListener('focus', () => {
    console.log('Focus'); // Never logs
  });
}, [navigation]);
```

**Solution:**
```typescript
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    console.log('Focus');
  });

  return unsubscribe; // ← Must return cleanup function
}, [navigation]);
```

### Issue: Multiple Listener Registrations

**Problem:**
```typescript
useEffect(() => {
  navigation.addListener('focus', () => {
    // Registered on every render
  });
}, []); // ← Missing navigation dependency
```

**Solution:**
```typescript
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    // Registered once
  });

  return unsubscribe;
}, [navigation]); // ← Include dependency
```

### Issue: State Not Updating

**Problem:**
```typescript
onStateChange={(state) => {
  myState = state; // ← Mutation
}}
```

**Solution:**
```typescript
const [myState, setMyState] = useState();

onStateChange={(state) => {
  setMyState(state); // ← Proper state update
}}
```

---

## Expo Router Integration

### How Expo Router Uses React Navigation

Expo Router generates React Navigation configuration from your file system:

```
app/
├── (tabs)/
│   ├── index.tsx → Tab 'index'
│   └── profile.tsx → Tab 'profile'
└── settings.tsx → Screen 'settings'
```

Becomes:

```typescript
createBottomTabNavigator({
  screens: {
    index: { screen: Index },
    profile: { screen: Profile },
  }
});
```

### Interception in Expo Router

All React Navigation interception methods work identically:

```typescript
// app/_layout.tsx
export default function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    if (!navigationRef.current) return;

    const unsubscribe = navigationRef.current.addListener(
      '__unsafe_action__',
      (e) => {
        console.log('Action in Expo Router:', e.data.action);
      }
    );

    return unsubscribe;
  }, [navigationRef]);

  return (
    <Stack />
  );
}
```

---

## File-Based Routing Interception

### Dynamic Route Tracking

```typescript
// Track when dynamic routes are accessed
navigationRef.current?.addListener('state', (e) => {
  const route = getCurrentRoute(e.data.state);

  // Detect dynamic route segments
  if (route?.path?.includes('[')) {
    console.log('Dynamic route:', route.name);
    console.log('Path:', route.path);
    console.log('Params:', route.params);
  }
});
```

### Layout Changes

```typescript
// Track when layouts change (tab to stack, etc.)
let previousRouterType: string;

onStateChange={(state) => {
  const currentType = state?.type;

  if (previousRouterType !== currentType) {
    console.log(`Layout changed: ${previousRouterType} → ${currentType}`);
  }

  previousRouterType = currentType;
}}
```

---

## Expo-Specific Patterns

### useSegments Hook

```typescript
import { useSegments } from 'expo-router';

function useRouteTracking() {
  const segments = useSegments();

  useEffect(() => {
    console.log('Current path segments:', segments);
    // Example: ['(tabs)', 'profile']
  }, [segments]);
}
```

### usePathname Hook

```typescript
import { usePathname } from 'expo-router';

function usePathnameTracking() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('Current pathname:', pathname);
    analytics.track('page_view', { path: pathname });
  }, [pathname]);
}
```

---

## Custom Router Creation

### Building a Custom Router

```typescript
import { BaseRouter } from '@react-navigation/routers';

function CustomRouter(options) {
  return {
    ...BaseRouter,

    type: 'custom',

    getStateForAction(state, action, options) {
      // Custom routing logic
      console.log('[Custom Router]', action.type);

      // Delegate to BaseRouter for common actions
      return BaseRouter.getStateForAction(state, action);
    },
  };
}

// Usage
<Navigator router={CustomRouter}>
  {/* screens */}
</Navigator>
```

---

## Multi-Navigator Tracking

### Tracking All Navigators

```typescript
function useMultiNavigatorTracking() {
  const navigators = useRef(new Map<string, any>());

  const registerNavigator = useCallback((key: string, ref: any) => {
    if (ref) {
      navigators.current.set(key, ref);

      // Add listener to this navigator
      const unsubscribe = ref.addListener('__unsafe_action__', (e) => {
        console.log(`[${key}] Action:`, e.data.action);
      });

      // Store cleanup
      return () => {
        unsubscribe();
        navigators.current.delete(key);
      };
    }
  }, []);

  return { registerNavigator };
}
```

---

## Performance Optimization

### Lazy DevTools Initialization

```typescript
const devToolsRef = useRef<DevTools>();

useEffect(() => {
  if (__DEV__ && navigationRef.current && !devToolsRef.current) {
    // Only load devtools in development
    import('./devtools').then(({ initDevTools }) => {
      devToolsRef.current = initDevTools(navigationRef);
    });
  }
}, [navigationRef.current]);
```

### Conditional Tracking

```typescript
const shouldTrack = __DEV__ || config.enableAnalytics;

useEffect(() => {
  if (!shouldTrack || !navigationRef.current) return;

  const unsubscribe = navigationRef.current.addListener(
    '__unsafe_action__',
    handler
  );

  return unsubscribe;
}, [shouldTrack, navigationRef]);
```

---

## Production vs Development

### Development-Only Features

```typescript
if (__DEV__) {
  // Stack traces available
  navigationRef.current?.addListener('__unsafe_action__', (e) => {
    console.log('Stack:', e.data.stack); // Only in dev
  });

  // State validation
  onStateChange={(state) => {
    const result = checkSerializable(state);
    if (!result.serializable) {
      console.warn('Non-serializable state:', result);
    }
  }}
}
```

### Production Optimizations

```typescript
const handler = __DEV__
  ? (e) => {
      // Detailed logging in dev
      console.log('Action:', e.data.action);
      console.log('Stack:', e.data.stack);
    }
  : (e) => {
      // Minimal logging in prod
      if (e.data.action.type === 'ERROR') {
        Sentry.captureException(new Error('Navigation error'));
      }
    };
```

---

## Complete DevTools Example

See [Method 5: Combining Multiple Points](#method-5-combining-multiple-points) and [DevTools Integration Pattern](#devtools-integration-pattern) for complete working examples.

---

## Analytics Example

See [Analytics Tracking Pattern](#analytics-tracking-pattern) for a complete implementation.

---

## Debugging Tools Example

```typescript
function useNavigationDebugger() {
  const navigationRef = useNavigationContainerRef();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!navigationRef.current) return;

    // Track all actions
    const unsubscribeAction = navigationRef.current.addListener(
      '__unsafe_action__',
      (e) => {
        setHistory((prev) => [
          ...prev,
          {
            type: 'action',
            action: e.data.action,
            noop: e.data.noop,
            timestamp: Date.now(),
          },
        ]);
      }
    );

    return unsubscribeAction;
  }, [navigationRef]);

  const handleStateChange = useCallback((state) => {
    setHistory((prev) => [
      ...prev,
      {
        type: 'state',
        state,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // Debug panel component
  const DebugPanel = () => (
    <View style={styles.debug}>
      <Text>Navigation History ({history.length} events)</Text>
      <FlatList
        data={history}
        renderItem={({ item }) => (
          <Text>{item.type}: {JSON.stringify(item, null, 2)}</Text>
        )}
      />
    </View>
  );

  return {
    navigationRef,
    handleStateChange,
    DebugPanel,
    history,
  };
}
```

---

## Real-World Patterns

### Pattern: Navigation Logger

```typescript
class NavigationLogger {
  private logs: any[] = [];

  trackAction(action: NavigationAction, noop: boolean) {
    this.logs.push({
      type: 'action',
      action,
      noop,
      timestamp: Date.now(),
    });
  }

  trackState(state: NavigationState) {
    this.logs.push({
      type: 'state',
      state,
      timestamp: Date.now(),
    });
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }

  export() {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

### Pattern: Route Guard

```typescript
function useRouteGuard(
  shouldBlock: (route: string) => boolean
) {
  const navigation = useNavigation();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      const targetRoute = e.data.action.payload?.name;

      if (targetRoute && shouldBlock(targetRoute)) {
        e.preventDefault();
        Alert.alert('Access Denied', 'You cannot access this screen');
      }
    });

    return unsubscribe;
  }, [navigation, shouldBlock]);
}
```

---

## Conclusion

This guide provides everything you need to implement robust route interception in React Navigation and Expo Router. Key takeaways:

1. **Use `__unsafe_action__`** for comprehensive action tracking
2. **Use `beforeRemove`** for prevention/confirmation
3. **Use `onStateChange`** for final state tracking
4. **Combine methods** for complete coverage
5. **Type safety** with TypeScript
6. **Test thoroughly** with all navigator types

For questions or issues, refer to:
- [React Navigation Documentation](https://reactnavigation.org)
- [Expo Router Documentation](https://docs.expo.dev/router)
- [GitHub Issues](https://github.com/react-navigation/react-navigation/issues)

---

*Last Updated: January 2025*
*Based on React Navigation v6+*
