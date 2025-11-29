# Profiler Interception Plan: Capturing React DevTools Trace Updates

## Goal

Intercept and log all events from the React DevTools profiler's "Highlight updates when components render" feature to understand exactly what it detects vs what our implementation detects.

---

## Architecture Overview

### Event Flow (from React DevTools backend.js)

```
React Commit Phase
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Renderer (react-devtools-core backend)                       │
│                                                              │
│  1. handleCommitFiberRoot() is called on each commit         │
│  2. If traceUpdatesEnabled === true:                         │
│     - Walks fiber tree via updateFiberRecursively()          │
│     - Calls didFiberRender() to detect actual re-renders     │
│     - Adds host stateNodes to traceUpdatesForNodes Set       │
│  3. After commit: hook.emit('traceUpdates', traceUpdatesForNodes) │
│                                                              │
│  File: react-devtools-core/dist/backend.js                   │
│  Lines: 13188-13202 (detection), 13565-13566 (emit)          │
└─────────────────────────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Hook Event System                                            │
│                                                              │
│  hook.emit('traceUpdates', nodes)                            │
│       │                                                      │
│       ▼                                                      │
│  All listeners registered via hook.sub('traceUpdates', fn)   │
│  or hook.on('traceUpdates', fn) are called                   │
│                                                              │
│  File: react-devtools-core/dist/backend.js                   │
│  Lines: 17076-17080 (sub), 17083-17088 (on), 2935-2940 (emit)│
└─────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────────────┐
       ▼                                          ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│ TraceUpdates Module      │    │ Agent                        │
│ (DevTools internal)      │    │                              │
│                          │    │ agent.onTraceUpdates(nodes)  │
│ traceUpdates(nodes)      │    │ → agent.emit('traceUpdates') │
│ → Measures nodes         │    │                              │
│ → Calls draw()           │    │ File: backend.js:7549-7551   │
│ → agent.emit('drawTrace- │    └──────────────────────────────┘
│   Updates', nodesToDraw) │                   │
│                          │                   ▼
│ File: backend.js         │    ┌──────────────────────────────┐
│ Lines: 6587-6609         │    │ Agent listeners              │
│ (traceUpdates function)  │    │                              │
│ Lines: 6370-6380         │    │ DebuggingOverlayRegistry     │
│ (drawNative function)    │    │ listens to 'drawTraceUpdates'│
└──────────────────────────┘    │                              │
                                │ File: DebuggingOverlayRegistry.js │
                                │ Line: 90                     │
                                └──────────────────────────────┘
```

---

## Key Files and Line References

### 1. react-devtools-core/dist/backend.js (in node_modules)

| Line(s) | Function/Code | Purpose |
|---------|---------------|---------|
| 11409 | `var traceUpdatesEnabled = false` | Global flag controlling trace detection |
| 11410 | `var traceUpdatesForNodes = new Set()` | Set collecting nodes to highlight |
| 11973-11996 | `function didFiberRender(prevFiber, nextFiber)` | Detects if a fiber actually rendered |
| 11986-11987 | `const PerformedWork = 1; return (getFiberFlags(nextFiber) & PerformedWork) === PerformedWork` | Checks PerformedWork flag for function/class components |
| 11993-11994 | `return prevFiber.memoizedProps !== nextFiber.memoizedProps...` | Checks prop/state changes for host components |
| 13188-13202 | Detection logic in `updateFiberRecursively()` | Walks tree, calls didFiberRender, populates traceUpdatesForNodes |
| 13194 | `traceUpdatesForNodes.add(nextFiber.stateNode)` | Adds host component stateNode to set |
| 13200 | `traceNearestHostComponentUpdate = didFiberRender(prevFiber, nextFiber)` | Sets flag when component rendered |
| 13325-13332 | Bailout handling | If bailed out, find all host instances via findAllCurrentHostInstances |
| 13499-13500 | `traceUpdatesForNodes.clear()` | Clears set at start of commit |
| 13565-13566 | `hook.emit('traceUpdates', traceUpdatesForNodes)` | Emits event with collected nodes |
| 15487-15489 | `function setTraceUpdatesEnabled(isEnabled) { traceUpdatesEnabled = isEnabled; }` | Enables/disables tracing |
| 6367 | `var COLORS = ['#37afa9', ...]` | Color palette (10 colors) |
| 6370-6380 | `function drawNative(nodeToData, agent)` | Iterates nodes, emits `drawTraceUpdates` |
| 6380 | `agent.emit('drawTraceUpdates', nodesToDraw)` | Emits to agent listeners |
| 6566-6567 | `var DISPLAY_DURATION = 250` | How long highlights show |
| 6570 | `var MAX_DISPLAY_DURATION = 3000` | Maximum display time |
| 6587-6589 | `TraceUpdates_initialize(injectedAgent)` | Initializes trace module, subscribes to agent |
| 6591-6608 | `function toggleEnabled(value)` | Enables/disables isEnabled flag |
| 6611-6645 | `function traceUpdates(nodes)` | Processes incoming nodes, measures, stores data |
| 7421-7428 | `agent.setTraceUpdatesEnabled()` | Agent method that enables tracing on all renderers |
| 7549-7551 | `agent.onTraceUpdates` | Agent handler that re-emits to its listeners |
| 17076-17080 | `function sub(event, fn)` | Hook subscription function |
| 17083-17088 | `function on(event, fn)` | Hook event listener registration |
| 2935-2940 | EventEmitter `emit()` method | Calls all listeners for an event |
| 17430 | `var rendererInterfaces = new Map()` | Map of renderer IDs to interfaces |
| 17061 | `hook.rendererInterfaces.set(id, rendererInterface)` | Stores renderer interface |

### 2. React Native Files (in react-native-clone)

| File | Line(s) | Purpose |
|------|---------|---------|
| `Libraries/Types/ReactDevToolsTypes.js:23-32` | `ReactDevToolsAgentEvents` type | Defines event types including `drawTraceUpdates` |
| `Libraries/Types/ReactDevToolsTypes.js:24` | `drawTraceUpdates: [Array<{node: InstanceFromReactDevTools, color: string}>]` | Event payload type |
| `Libraries/Types/ReactDevToolsTypes.js:47-53` | `ReactDevToolsGlobalHook` type | Hook type with `on`, `off`, `reactDevtoolsAgent` |
| `Libraries/Debugging/DebuggingOverlayRegistry.js:87-93` | `#onReactDevToolsAgentAttached()` | Subscribes to agent events |
| `Libraries/Debugging/DebuggingOverlayRegistry.js:90` | `agent.addListener('drawTraceUpdates', this.#onDrawTraceUpdates)` | Listens for drawTraceUpdates |
| `Libraries/Debugging/DebuggingOverlayRegistry.js:218-260` | `#onDrawTraceUpdates()` | Processes trace updates, measures, draws |
| `Libraries/Debugging/DebuggingOverlayRegistry.js:95-119` | `#getPublicInstanceFromInstance()` | Gets public instance from DevTools instance |
| `Libraries/Core/setUpReactDevTools.js:35-39` | DevTools imports | Imports `initialize`, `connectToDevTools`, etc. |
| `Libraries/Core/setUpReactDevTools.js:65` | `initialize(hookSettings, ...)` | Installs the hook |

---

## Data Structures

### traceUpdatesForNodes (Set)
Contains stateNodes from fibers. Each stateNode is a host component instance:
```typescript
// For Fabric renderer:
stateNode = {
  canonical: {
    publicInstance: {
      measure: Function,
      __nativeTag: number,
      // ... other properties
    }
  }
}

// For Legacy renderer:
stateNode = {
  measure: Function,
  _nativeTag: number,
  // ... other properties
}
```

### drawTraceUpdates Event Payload
```typescript
Array<{
  node: InstanceFromReactDevTools,  // The stateNode
  color: string                      // e.g., "#37afa9"
}>
```

### TraceUpdates nodeToData Map Entry
```typescript
{
  count: number,           // How many times this node updated
  expirationTime: number,  // When to stop showing highlight
  lastMeasuredAt: number,  // Last measurement timestamp
  rect: {                  // Measured dimensions
    left: number,
    top: number,
    width: number,
    height: number
  },
  displayName: string      // Component name
}
```

---

## Interception Plan

### Strategy 1: Swizzle hook.emit (Recommended)

Intercept ALL events by wrapping `hook.emit`:

```typescript
// Location: In our HighlightUpdatesController.ts
function interceptHookEmit(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || !hook.emit) return;

  const originalEmit = hook.emit.bind(hook);

  hook.emit = function(event: string, ...args: any[]) {
    // Log all events
    if (event === 'traceUpdates') {
      const nodes = args[0] as Set<unknown>;
      console.log('[PROFILER] traceUpdates event:', {
        nodeCount: nodes.size,
        nodes: Array.from(nodes).map(node => ({
          node,
          publicInstance: getPublicInstance(node),
          nativeTag: getNativeTag(node),
        })),
      });
    }

    // Call original
    return originalEmit(event, ...args);
  };
}
```

### Strategy 2: Swizzle agent.emit

Intercept agent-level events:

```typescript
function interceptAgentEmit(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const agent = hook?.reactDevtoolsAgent;
  if (!agent || !agent.emit) return;

  const originalEmit = agent.emit.bind(agent);

  agent.emit = function(event: string, ...args: any[]) {
    if (event === 'drawTraceUpdates') {
      const nodesToDraw = args[0] as Array<{node: unknown, color: string}>;
      console.log('[PROFILER AGENT] drawTraceUpdates:', {
        count: nodesToDraw.length,
        nodes: nodesToDraw.map(({ node, color }) => ({
          color,
          node,
          publicInstance: getPublicInstance(node),
        })),
      });
    }

    return originalEmit(event, ...args);
  };
}
```

### Strategy 3: Swizzle DebuggingOverlayRegistry listener

Intercept what React Native's native overlay receives:

```typescript
function interceptDebuggingOverlay(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const agent = hook?.reactDevtoolsAgent;
  if (!agent) return;

  // Wrap addListener to intercept drawTraceUpdates subscription
  const originalAddListener = agent.addListener.bind(agent);

  agent.addListener = function(event: string, listener: Function) {
    if (event === 'drawTraceUpdates') {
      const wrappedListener = (traceUpdates: Array<{node: unknown, color: string}>) => {
        console.log('[DEBUGGING OVERLAY] Received drawTraceUpdates:', {
          count: traceUpdates.length,
          updates: traceUpdates.map(({ node, color }) => ({
            color,
            hasCanonical: !!(node as any)?.canonical,
            hasMeasure: typeof (node as any)?.measure === 'function',
          })),
        });

        // Call original
        return listener(traceUpdates);
      };
      return originalAddListener(event, wrappedListener);
    }
    return originalAddListener(event, listener);
  };
}
```

---

## Implementation Steps

### Step 1: Create Debug Logging Module

Create a new file that can be imported to enable comprehensive logging:

```typescript
// File: src/highlight-updates/utils/ProfilerInterceptor.ts

export function installProfilerInterceptor(): void {
  interceptHookEmit();
  interceptAgentEmit();
  logRendererInterfaces();
}

function logRendererInterfaces(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook?.rendererInterfaces) return;

  console.log('[PROFILER] Renderer interfaces:', {
    count: hook.rendererInterfaces.size,
    interfaces: Array.from(hook.rendererInterfaces.entries()).map(([id, iface]) => ({
      id,
      hasSetTraceUpdatesEnabled: typeof (iface as any).setTraceUpdatesEnabled === 'function',
    })),
  });
}
```

### Step 2: Add Comparison Logging

Log both profiler data and our data side-by-side:

```typescript
function compareWithOurDetection(profilerNodes: Set<unknown>): void {
  // After profiler detects nodes
  console.log('[COMPARISON]', {
    profilerNodeCount: profilerNodes.size,
    ourNodeCount: ourDetectedNodes.size,
    profilerOnly: [...profilerNodes].filter(n => !ourDetectedNodes.has(n)),
    oursOnly: [...ourDetectedNodes].filter(n => !profilerNodes.has(n)),
    common: [...profilerNodes].filter(n => ourDetectedNodes.has(n)),
  });
}
```

### Step 3: Enable Tracing Without DevTools Frontend

The key insight is that we need to call `setTraceUpdatesEnabled(true)` on renderer interfaces:

```typescript
function enableTracing(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook?.rendererInterfaces) return;

  hook.rendererInterfaces.forEach((rendererInterface, id) => {
    if (typeof (rendererInterface as any).setTraceUpdatesEnabled === 'function') {
      (rendererInterface as any).setTraceUpdatesEnabled(true);
      console.log(`[PROFILER] Enabled tracing on renderer ${id}`);
    }
  });
}
```

---

## What to Compare

When logging both profiler and our detection:

1. **Node count** - Are we detecting the same number of components?
2. **Node identity** - Are they the exact same stateNode objects?
3. **Public instances** - Can we get the same public instances?
4. **Native tags** - Do we get the same native tags?
5. **Timing** - Are we receiving events at the same time?
6. **Colors** - Are colors assigned consistently?

---

## Differences to Investigate

Based on the screenshots showing profiler detecting more components than us:

1. **Tab buttons** - Profiler shows tab buttons highlighted, we don't
2. **Nested components** - Profiler shows more nested highlights
3. **Timing** - Our highlights may be missing rapid successive updates

Possible causes:
- Our `setTraceUpdatesEnabled` call may not be reaching all renderers
- We may be filtering out some nodes incorrectly in `getPublicInstance`
- We may be hitting the 20-node limit in our `handleTraceUpdates`
- The `isProcessing` flag may be blocking some updates

---

## Testing Commands

After implementing interception, run these in the app:

```javascript
// In React Native debugger console:

// 1. Check hook availability
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__)

// 2. Check renderer interfaces
console.log(window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces)

// 3. Manually enable tracing
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.rendererInterfaces.forEach((iface, id) => {
  iface.setTraceUpdatesEnabled(true);
  console.log('Enabled on renderer', id);
});

// 4. Subscribe to events manually
window.__REACT_DEVTOOLS_GLOBAL_HOOK__.sub('traceUpdates', (nodes) => {
  console.log('Got traceUpdates:', nodes.size, 'nodes');
});
```

---

## Next Steps

1. **Implement ProfilerInterceptor.ts** with all swizzling functions
2. **Import and call** `installProfilerInterceptor()` in HighlightUpdatesController
3. **Test in app** - trigger UI updates and compare logs
4. **Identify discrepancies** between profiler detection and our detection
5. **Fix our implementation** to match profiler exactly
6. **Remove debug logging** once working correctly
