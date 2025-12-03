# Highlight Updates - "Why Did You Render" Documentation

Comprehensive documentation for the React Native Highlight Updates tool, including the "Why Did You Render" feature for detecting and displaying render causes.

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Components](#core-components)
4. [APIs](#apis)
5. [React Fiber Internals](#react-fiber-internals)
6. [Double-Buffering & Swap Detection](#double-buffering--swap-detection)
7. [Debug Logging Levels](#debug-logging-levels)
8. [Troubleshooting](#troubleshooting)
9. [Performance Considerations](#performance-considerations)
10. [Future Enhancements](#future-enhancements)

---

## Overview

The Highlight Updates package provides a standalone implementation of React DevTools' "Highlight updates when components render" feature. It works **without requiring DevTools to be connected**.

### Key Features

- **Visual Highlights**: Colored borders around components that re-render
- **Render Counting**: Track how many times each component renders
- **Why Did You Render**: Detect and display WHY components re-rendered:
  - `MOUNT` - First render
  - `PROPS` - Props changed
  - `STATE` - useState/useReducer changed
  - `PARENT` - Parent component re-rendered
- **Hook Value Tracking**: Show before/after values for useState changes
- **Debug Logging**: Multiple verbosity levels for debugging

### Quick Start

```tsx
// In your app entry point
import { highlightUpdatesModalPreset } from '@react-buoy/highlight-updates';
import { FloatingDevTools } from '@react-buoy/core';

export default function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools apps={[highlightUpdatesModalPreset]} />
    </>
  );
}
```

### Programmatic Usage

```tsx
import { HighlightUpdatesController, RenderTracker } from '@react-buoy/highlight-updates';

// Enable/disable highlights
HighlightUpdatesController.enable();
HighlightUpdatesController.disable();
HighlightUpdatesController.toggle();

// Configure settings
RenderTracker.setSettings({
  trackRenderCauses: true,  // Enable "Why Did You Render"
  debugLogLevel: "minimal", // Show hook value changes in console
});
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    React DevTools Backend                        │
│  (built into React Native - always available in __DEV__)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   rendererInterfaces.setTraceUpdatesEnabled(true)               │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                            │
│              │  'traceUpdates'     │                            │
│              │  event emitted      │                            │
│              │  (Set<stateNodes>)  │                            │
│              └──────────┬──────────┘                            │
│                         │                                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              HighlightUpdatesController                          │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│   1. Subscribes to 'traceUpdates' via hook.sub()                │
│   2. Filters out devtools/overlay nodes                          │
│   3. Extracts fiber from stateNode.canonical.internalInstanceHandle │
│   4. Calls RenderCauseDetector.detectRenderCause()              │
│   5. Measures node positions with publicInstance.measure()       │
│   6. Forwards data to RenderTracker and HighlightUpdatesOverlay │
│                                                                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────────┐
│ RenderTracker   │ │RenderCauseDetector│ │HighlightUpdatesOverlay│
│ (Singleton)     │ │ (Pure Functions)  │ │ (React Component)    │
│                 │ │                   │ │                      │
│ - Stores render │ │ - Detects cause   │ │ - Renders highlight  │
│   history       │ │ - Compares fibers │ │   rectangles         │
│ - Settings      │ │ - Extracts hooks  │ │ - Shows render count │
│ - Subscriptions │ │ - Swap detection  │ │   badges             │
└─────────────────┘ └─────────────────┘ └─────────────────────┘
```

### Data Flow

1. **React renders a component** → DevTools backend detects it
2. **DevTools emits `traceUpdates`** → Set of stateNodes that rendered
3. **HighlightUpdatesController receives event** → Filters, measures, detects causes
4. **RenderCauseDetector analyzes fiber** → Returns cause type and hook changes
5. **RenderTracker stores data** → Notifies UI subscribers
6. **HighlightUpdatesOverlay renders** → Shows colored borders on screen

---

## Core Components

### 1. HighlightUpdatesController

**File**: `src/highlight-updates/utils/HighlightUpdatesController.ts`

The main controller that orchestrates everything. It:

- Initializes by finding the React DevTools global hook
- Enables trace updates on renderer interfaces
- Subscribes to `traceUpdates` events
- Coordinates between detection, tracking, and rendering

**Key Methods**:

```typescript
// Enable/disable the feature
HighlightUpdatesController.enable(): void
HighlightUpdatesController.disable(): void
HighlightUpdatesController.toggle(): void

// Check state
HighlightUpdatesController.isEnabled(): boolean
HighlightUpdatesController.isInitialized(): boolean

// Subscribe to state changes
HighlightUpdatesController.subscribe(callback: (enabled: boolean) => void): () => void

// Set the highlight callback (used by overlay)
HighlightUpdatesController.setHighlightCallback(callback: HighlightCallback | null): void

// Clear all render counts
HighlightUpdatesController.clearRenderCounts(): void
```

### 2. RenderCauseDetector

**File**: `src/highlight-updates/utils/RenderCauseDetector.ts`

Pure functions for detecting WHY a component rendered. This is the core of the "Why Did You Render" feature.

**Key Functions**:

```typescript
// Main detection function
detectRenderCause(
  nativeTag: number,
  fiber: any,
  batchNativeTags: Set<number>,
  debugLogLevel: DebugLogLevel
): RenderCause

// Clear stored state (call when disabling)
clearRenderCauseState(): void

// Get storage statistics
getRenderCauseStats(): { storedStates: number; maxStates: number }
```

**Detection Logic**:

1. **First Render (Mount)**: No previous state exists
2. **Props Changed**: `memoizedProps` differs from previous
3. **State Changed**: `memoizedState` differs (hooks linked list)
4. **Parent Re-render**: Parent's nativeTag is in the same batch

### 3. RenderTracker

**File**: `src/highlight-updates/utils/RenderTracker.ts`

Singleton that stores render history and settings. UI components subscribe to this for updates.

**Key APIs**:

```typescript
// Track a new render
RenderTracker.trackRender(data: {
  nativeTag: number;
  viewType: string;
  testID?: string;
  nativeID?: string;
  componentName?: string;
  color: string;
  count: number;
  renderCause?: RenderCause;
}): void

// Get renders
RenderTracker.getRenders(): TrackedRender[]
RenderTracker.getFilteredRenders(searchText?: string): TrackedRender[]

// Subscriptions
RenderTracker.subscribe(listener: (renders: TrackedRender[]) => void): () => void
RenderTracker.subscribeToSettings(listener: (settings: RenderTrackerSettings) => void): () => void

// Settings
RenderTracker.getSettings(): RenderTrackerSettings
RenderTracker.setSettings(settings: Partial<RenderTrackerSettings>): void
```

**Settings**:

```typescript
interface RenderTrackerSettings {
  batchSize: number;              // Max highlights per batch (10-500)
  showRenderCount: boolean;       // Show count badges
  performanceLogging: boolean;    // Log timing metrics
  trackRenderCauses: boolean;     // Enable "Why Did You Render"
  enableRenderHistory: boolean;   // Store render event history
  maxRenderHistoryPerComponent: number;  // Max events per component
  capturePropsOnRender: boolean;  // Capture props for diff view
  captureStateOnRender: boolean;  // Capture state for diff view
  debugLogLevel: DebugLogLevel;   // Console logging verbosity
}
```

### 4. ProfilerInterceptor

**File**: `src/highlight-updates/utils/ProfilerInterceptor.ts`

Swizzles React DevTools internals to capture profiler data. Used for debugging and comparison.

```typescript
// Install/uninstall
installProfilerInterceptor(): void
uninstallProfilerInterceptor(): void

// Enable/disable logging
enableProfilerLogging(): void
disableProfilerLogging(): void
isLoggingEnabled(): boolean

// Set comparison callback
setComparisonCallback(callback: ((nodes: Set<unknown>) => void) | null): void
```

### 5. PerformanceLogger

**File**: `src/highlight-updates/utils/PerformanceLogger.ts`

Tracks timing metrics for performance analysis.

```typescript
// Enable/disable
PerformanceLogger.setEnabled(enabled: boolean): void
PerformanceLogger.isEnabled(): boolean

// Start timing a batch
PerformanceLogger.startBatch(nodesReceived: number, batchSize: number): BatchTimer

// BatchTimer methods
timer.markFilteringComplete(filtered: number, toProcess: number): void
timer.markMeasurementStart(): void
timer.markMeasurementComplete(success: number, fail: number): void
timer.markTrackingComplete(): void
timer.markCallbackComplete(): void
timer.finish(): BatchMetrics
```

---

## APIs

### Exported Types

```typescript
// Render cause types
type RenderCauseType = "mount" | "props" | "state" | "hooks" | "context" | "parent" | "unknown";
type ComponentCauseType = "mount" | "props" | "state" | "parent" | "unknown";
type DebugLogLevel = "off" | "minimal" | "verbose" | "all";

// Render cause with details
interface RenderCause {
  type: RenderCauseType;
  changedKeys?: string[];        // For props: ["onClick", "style"]
  hookIndices?: number[];        // For hooks: [0, 2]
  hookChanges?: HookStateChange[]; // Detailed hook changes
  timestamp: number;
  componentCause?: ComponentCauseType;
  componentName?: string;
}

// Hook state change details
interface HookStateChange {
  index: number;                 // Hook index (0-based)
  type: 'useState' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback' | 'useEffect' | 'unknown';
  previousValue?: any;
  currentValue?: any;
  description?: string;
}

// Tracked render data
interface TrackedRender {
  id: string;
  nativeTag: number;
  viewType: string;              // "RCTView", "RCTText"
  displayName: string;           // "View", "Text"
  testID?: string;
  nativeID?: string;
  componentName?: string;
  renderCount: number;
  firstRenderTime: number;
  lastRenderTime: number;
  measurements?: { x, y, width, height };
  color: string;
  lastRenderCause?: RenderCause;
  renderHistory?: RenderEvent[];
}
```

### Preset Exports

```typescript
// For FloatingDevTools integration
import {
  highlightUpdatesPreset,        // Simple toggle
  highlightUpdatesModalPreset,   // Full modal UI
  createHighlightUpdatesTool,    // Factory for toggle
  createHighlightUpdatesModalTool, // Factory for modal
} from '@react-buoy/highlight-updates';
```

### Component Exports

```typescript
import {
  HighlightUpdatesOverlay,       // The overlay component
  HighlightUpdatesModal,         // The modal UI
  RenderListItem,                // Individual render item
  RenderDetailView,              // Detail panel
  HighlightFilterView,           // Filter controls
  RenderCauseBadge,              // Cause badge component
  RenderHistoryViewer,           // History viewer
} from '@react-buoy/highlight-updates';
```

---

## React Fiber Internals

Understanding React's fiber architecture is crucial for this tool.

### Fiber Structure

```typescript
interface Fiber {
  tag: number;              // 0=Function, 1=Class, 5=Host, 6=HostText, etc.
  type: any;                // Component function/class or string for host
  stateNode: any;           // DOM node or class instance
  memoizedProps: any;       // Current props
  memoizedState: any;       // Current state (hooks linked list for functions)
  alternate: Fiber | null;  // The "other" fiber (previous/next)
  return: Fiber | null;     // Parent fiber
  child: Fiber | null;      // First child
  sibling: Fiber | null;    // Next sibling
  _debugOwner: Fiber | null;// Parent component (debug only)
}
```

### Hooks Linked List

For function components, `memoizedState` is a linked list of hooks:

```typescript
interface HookState {
  memoizedState: any;       // The hook's current value
  baseState: any;           // Base state for useReducer
  queue: UpdateQueue | null;// Update queue (for useState/useReducer)
  next: HookState | null;   // Next hook in the list
}
```

**Hook Types Detection**:

| Hook | Detection Pattern |
|------|-------------------|
| `useState` | Has `queue` property with dispatch |
| `useReducer` | Has `queue` property (similar to useState) |
| `useRef` | memoizedState is `{ current: value }` |
| `useMemo` | memoizedState is `[value, deps]` |
| `useCallback` | memoizedState is `[function, deps]` |
| `useEffect` | memoizedState has `tag`, `create`, `destroy` |

### Accessing Fibers from stateNode

```typescript
// In traceUpdates callback, we receive stateNodes (native view instances)
// To get the fiber:
const fiber = stateNode.canonical?.internalInstanceHandle;

// To get props:
const props = fiber?.memoizedProps;

// To get hooks:
const firstHook = fiber?.memoizedState;

// To walk the hooks list:
let hook = firstHook;
let index = 0;
while (hook) {
  console.log(`Hook[${index}]:`, hook.memoizedState);
  hook = hook.next;
  index++;
}
```

---

## Double-Buffering & Swap Detection

### The Problem

React uses **double-buffering** with two fiber trees:
- **Current**: The tree rendered to screen
- **Work-in-progress**: The tree being built for next render

After each commit, these trees **swap roles**. The fiber we receive in `traceUpdates` might be:
- The NEW fiber (post-update values) ✓
- The OLD fiber (pre-update values) ✗

If we get the old fiber, our "previous" and "current" values are **backwards**!

### Example of the Bug

```
Initial: value = 3332 (stored in current fiber)
User clicks +: value becomes 3333

After commit, fibers swap:
- What was work-in-progress (3333) becomes current
- What was current (3332) becomes alternate

If we receive the OLD fiber (3332):
  fiber.memoizedState = 3332 (OLD)
  fiber.alternate.memoizedState = 3333 (NEW)

We'd incorrectly report: 3333 → 3332 instead of 3332 → 3333
```

### The Solution: Swap Detection

We detect which fiber is "current" by comparing against stored previous state:

```typescript
// In detectRenderCause():
const storedPrev = previousStates.get(nativeTag);

if (storedPrev && alternateFiber) {
  const storedChildren = storedPrev.memoizedProps?.children;
  const fiberChildren = fiber.memoizedProps?.children;
  const altChildren = alternateFiber.memoizedProps?.children;

  // If fiber matches stored (OLD values), alternate is actually current
  const fiberMatchesStored = fiberChildren === storedChildren;
  const altMatchesStored = altChildren === storedChildren;

  if (fiberMatchesStored && !altMatchesStored) {
    // Swap! Use alternate as current
    currentFiber = alternateFiber;
    alternateFiber = fiber;
  }
}
```

### Component-Level Swap Detection

The same issue occurs for component fibers. In `detectComponentCause()`:

```typescript
// Compare useState hook values to detect swap
const storedPrev = getComponentFiberPrevState(componentFiber);

if (storedPrev?.extractedHooks && alternateFiber) {
  const storedStateHook = storedPrev.extractedHooks.find(h => h.type === 'useState');
  const fiberHooks = extractHookStates(componentFiber);
  const altHooks = extractHookStates(alternateFiber);

  if (storedStateHook) {
    const fiberStateHook = fiberHooks.find(h => h.index === storedStateHook.index);
    const altStateHook = altHooks.find(h => h.index === storedStateHook.index);

    // If fiber's hook value matches stored, it's the OLD fiber
    if (fiberStateHook?.value === storedStateHook.value &&
        altStateHook?.value !== storedStateHook.value) {
      // Swap!
      currentFiber = alternateFiber;
      alternateFiber = componentFiber;
    }
  }
}
```

---

## Debug Logging Levels

### Levels

| Level | Output | Use Case |
|-------|--------|----------|
| `"off"` | Nothing | Production, normal use |
| `"minimal"` | Hook changes only | Quick debugging |
| `"verbose"` | Component + cause + hooks | Moderate debugging |
| `"all"` | Full fiber dump | Deep investigation |

### Setting the Level

```typescript
RenderTracker.setSettings({
  debugLogLevel: "minimal",
});
```

Or through the UI in the Highlight Updates modal.

### Output Examples

**Minimal**:
```
[StepperValueDisplay] useState[3]: 3332 → 3333
[AppStepper] useState[0]: false → true
```

**Verbose**:
```
[RENDER] StepperValueDisplay (RCTText:1234) | Cause: STATE
  └─ useState[3]: 3332 → 3333
```

**All** (truncated):
```
[RN-BUOY RENDER DEBUG] ═══════════════════════════════════════
Render #5 for RCTText (nativeTag: 1234)
Timestamp: 2024-01-15T10:30:45.123Z
═══════════════════════════════════════════════════════════════

NATIVE FIBER (RCTText):
  type: "RCTText"
  tag: 5 (HostComponent)
  Previous values source: alternate
  memoizedProps.children: 3333 (was: 3332)
  ...

COMPONENT FIBER (StepperValueDisplay):
  name: "StepperValueDisplay"
  tag: 0 (FunctionComponent)
  alternate: YES
  ...

HOOKS:
  Total hooks: 4
  Previous values source: alternate
  [0] useState: 3333 (was: 3332) ← CHANGED
  [1] useRef: {Object: 4 keys} (unchanged)
  ...
```

---

## Troubleshooting

### Common Issues

#### 1. "Values are backwards on first click"

**Symptom**: Log shows `3333 → 3332` when clicking + (should be `3332 → 3333`)

**Cause**: Double-buffering swap not detected

**Fix**: The swap detection compares hook values against stored state. Ensure:
- `extractHookStates()` returns correct values
- Stored state is being saved properly in `setComponentFiberState()`
- Comparison uses the correct useState hook index

**Debug**: Set `debugLogLevel: "all"` and look for:
```
Previous values source: alternate
```

If it says "alternate" but values are backwards, the swap detection failed.

#### 2. "Mount detected on every render"

**Symptom**: All renders show as "MOUNT" cause

**Cause**: Previous state not being found

**Fix**: Check:
- WeakMap storage is working (`componentFiberStates`)
- Both fiber AND alternate are being stored
- Fiber references aren't being garbage collected

**Debug**: In `"all"` mode, look for:
```
WeakMap PREVIOUS state: (not found - first render or WeakMap cleared)
```

#### 3. "No hook changes detected"

**Symptom**: Cause is "STATE" but `hookChanges` is null/empty

**Cause**: Hook extraction or comparison failed

**Fix**: Check:
- `extractHookStates()` returns non-null for function components
- Hook types are being detected correctly
- `compareHookStates()` finds the difference

**Debug**: Look at "RAW HOOKS DATA" in `"all"` mode.

#### 4. "Highlights cause infinite loop"

**Symptom**: Console floods with render events

**Cause**: Overlay components triggering detection

**Fix**: The `isOurOverlayNode()` function filters out devtools nodes. Ensure:
- All devtools components are in `DEV_TOOLS_COMPONENT_NAMES` set
- Overlay uses `nativeID` props that match `DEV_TOOLS_NATIVE_IDS`

### Debug Checklist

1. **Set `debugLogLevel: "all"`** to see everything
2. **Check "Previous values source"**: Should be "alternate" after first render
3. **Verify hook extraction**: "EXTRACTED HOOKS" section should list hooks
4. **Check swap detection**: Look for "Detected fiber swap" message
5. **Verify storage**: "WeakMap PREVIOUS state" should show stored data

### Adding Debug Logging

To add temporary debug logging in `RenderCauseDetector.ts`:

```typescript
// At the top of detectComponentCause():
console.log('[DEBUG] componentFiber:', {
  type: componentFiber?.type?.name,
  hasAlternate: !!componentFiber?.alternate,
  memoizedState: componentFiber?.memoizedState ? '[present]' : '[null]'
});

// After swap detection:
console.log('[DEBUG] After swap:', {
  currentFiber: currentFiber === componentFiber ? 'original' : 'swapped',
  currentHooks: currentHooks?.map(h => ({ i: h.index, t: h.type, v: h.value }))
});
```

---

## Performance Considerations

### Memory Usage

- **previousStates Map**: Stores up to 500 native fiber states
- **componentFiberStates WeakMap**: Automatically cleaned by GC
- **RenderTracker**: Stores up to 200 tracked components
- **Render History**: Up to 20 events per component (configurable)

### CPU Impact

- **trackRenderCauses: false**: ~0% overhead
- **trackRenderCauses: true**: ~2-5% overhead per render
- **debugLogLevel: "all"**: Significant overhead (logging is expensive)

### Recommendations

1. **Production**: Keep `trackRenderCauses: false`, `debugLogLevel: "off"`
2. **Development**: Enable as needed for debugging
3. **Large Apps**: Reduce `batchSize` if highlights cause jank
4. **Memory Issues**: Reduce `maxRenderHistoryPerComponent`

---

## Future Enhancements

### Planned Features

1. **Context Change Detection**: Detect when Context.Provider value changes
2. **Diff Visualization**: Show visual diff of props/state between renders
3. **Flamegraph Integration**: Show render causes in timeline view
4. **Export/Import**: Save render history for later analysis
5. **Automatic Suggestions**: "This component should use React.memo"

### Code Structure for Extensions

To add a new cause type:

1. Add to `RenderCauseType` in `RenderTracker.ts`
2. Add detection logic in `detectRenderCause()` in `RenderCauseDetector.ts`
3. Add color/label in `CAUSE_CONFIG` in `RenderCauseBadge.tsx`
4. Update logging functions for new cause

---

## File Reference

| File | Purpose |
|------|---------|
| `src/index.tsx` | Package exports |
| `src/preset.tsx` | FloatingDevTools presets |
| `utils/HighlightUpdatesController.ts` | Main controller, event handling |
| `utils/RenderCauseDetector.ts` | Why Did You Render detection |
| `utils/RenderTracker.ts` | State management, settings |
| `utils/ProfilerInterceptor.ts` | DevTools hook swizzling |
| `utils/PerformanceLogger.ts` | Timing metrics |
| `utils/ViewTypeMapper.ts` | Native type → display name |
| `HighlightUpdatesOverlay.tsx` | Renders highlight rectangles |
| `components/HighlightUpdatesModal.tsx` | Full modal UI |
| `components/RenderDetailView.tsx` | Component detail panel |
| `components/RenderListItem.tsx` | Individual list item |
| `components/RenderCauseBadge.tsx` | Cause badge UI |
| `components/RenderHistoryViewer.tsx` | History stepping UI |
| `components/HighlightFilterView.tsx` | Filter controls |

---

## Contributing

When modifying the detection logic:

1. **Test with a simple counter**: Increment should show correct before/after
2. **Test mount detection**: First render should show "MOUNT"
3. **Test parent cascades**: Child without state change should show "PARENT"
4. **Test with StrictMode**: Double renders should still work correctly
5. **Test fiber swaps**: Multiple quick updates should maintain order

Always verify with `debugLogLevel: "all"` to ensure the fiber data looks correct.
