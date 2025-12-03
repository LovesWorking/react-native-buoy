# Render Cause Detection: Text Component Deep Dive

## Overview

This document outlines the plan to improve render cause detection for React Native's Text component (`RCTText`). The goal is to provide developers with clear, accurate information about why components re-rendered.

## Current Issues (from Debug Logs)

### Issue 1: `children` prop is skipped but contains the actual value
```
fiber.memoizedProps (CURRENT): {..., "children": 4, ...}
PREVIOUS memoizedProps: {..., "children": 6, ...}
```
We skip `children` in our diff detection, but for Text components, `children` IS the meaningful content (the displayed text/number).

### Issue 2: Component cause detection shows `mount` incorrectly
```
Is First Render: false
Component Cause Detected: mount
```
The WeakMap for component fiber state is being cleared between renders.

### Issue 3: Hook state contains the actual value but we don't extract it
```
Hook[3]: {"baseState": 4, "memoizedState": 4, "queue": "[Queue object]"}
```
Hooks with a `queue` property are `useState`/`useReducer` and contain the actual state value.

---

## React Native Fiber Structure (from RN Source)

### Key File Locations
- `packages/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js`
- `packages/react-native/Libraries/Text/Text.js`
- `packages/react-native/Libraries/Text/TextNativeComponent.js`
- `packages/react-native/Libraries/Text/TextProps.js`

### Fiber Node Structure

```typescript
interface ReactFiber {
  // === Identity ===
  tag: WorkTag;                    // Component type (5 = HostComponent, 6 = HostText, 0 = FunctionComponent, etc.)
  key: string | null;              // React key
  type: any;                       // Component type/class (e.g., "RCTText", function reference)
  elementType: any;                // Original component type before resolution

  // === Instance ===
  stateNode: any;                  // Native instance for host components, null for function components

  // === Tree Structure ===
  return: ReactFiber | null;       // Parent fiber
  child: ReactFiber | null;        // First child fiber
  sibling: ReactFiber | null;      // Next sibling fiber
  index: number;                   // Position in parent's child list

  // === Props & State ===
  pendingProps: any;               // Props passed to component (new)
  memoizedProps: any;              // Props from last completed render
  memoizedState: any;              // State from last completed render (hooks linked list for function components)
  updateQueue: any;                // Queue of state updates
  dependencies: any;               // Context/hook dependencies

  // === Work Flags ===
  flags: number;                   // Work flags (Placement=2, Update=4, Deletion=8, etc.)
  subtreeFlags: number;            // Accumulated flags from subtree
  lanes: number;                   // Priority lanes
  childLanes: number;              // Priority lanes for children

  // === Alternate ===
  alternate: ReactFiber | null;    // Work-in-progress pair (double buffering)

  // === Refs ===
  ref: any;                        // React ref
  refCleanup: (() => void) | null; // Cleanup function for ref

  // === Debug ===
  _debugOwner: ReactFiber | null;  // Component that rendered this fiber
  _debugStack: string | null;      // Stack trace for debugging
  _debugHookTypes: string[] | null; // Hook types for debugging
}
```

### Work Tags (Fiber Types)

```typescript
type WorkTag =
  | 0   // FunctionComponent
  | 1   // ClassComponent
  | 2   // IndeterminateComponent
  | 3   // HostRoot
  | 4   // HostPortal
  | 5   // HostComponent (View, Text, Image, etc.)
  | 6   // HostText (raw text nodes - RCTRawText)
  | 7   // Fragment
  | 8   // Mode
  | 9   // ContextConsumer
  | 10  // ContextProvider
  | 11  // ForwardRef
  | 12  // Profiler
  | 13  // SuspenseComponent
  | 14  // MemoComponent
  | 15  // SimpleMemoComponent
  | 16  // LazyComponent
  | 17  // IncompleteClassComponent
  | 18  // DehydratedFragment
  | 19  // SuspenseListComponent
  | 20  // ScopeComponent
  | 21  // OffscreenComponent
  | 22  // LegacyHiddenComponent
  | 23  // CacheComponent
  | 24  // TracingMarkerComponent
  | 25  // HostHoistable
  | 26  // HostSingleton
  | 27; // IncompleteFunctionComponent
```

### Hooks State Structure (memoizedState linked list)

For function components, `memoizedState` is a linked list of hook states:

```typescript
interface HookState {
  memoizedState: any;              // Current value of the hook
  baseState: any;                  // Base state before updates
  baseQueue: Update | null;        // Pending updates
  queue: UpdateQueue | null;       // Update queue (present for useState/useReducer)
  next: HookState | null;          // Next hook in the list
}

// Identifying hook types:
// - useState/useReducer: has `queue` property (dispatch function)
// - useRef: memoizedState is { current: value }
// - useMemo/useCallback: memoizedState is [value, deps] or [callback, deps]
// - useEffect/useLayoutEffect: memoizedState is effect object
```

---

## Text Component Internals

### Native Components

| Component | Description | Use Case |
|-----------|-------------|----------|
| `RCTText` | Top-level text container | `<Text>Hello</Text>` |
| `RCTVirtualText` | Nested text (inherits styles) | `<Text>Hello <Text style={{bold}}>World</Text></Text>` |
| `RCTRawText` | Raw text node (tag 6) | String children of Text |

### Text Props (from TextProps.js)

```typescript
interface TextProps {
  // Content
  children?: React.Node;           // Text content or nested components

  // Display
  numberOfLines?: number;          // Max lines before truncation
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';

  // Styling
  style?: TextStyle;
  allowFontScaling?: boolean;
  maxFontSizeMultiplier?: number;
  minimumFontScale?: number;       // iOS only

  // Interaction
  onPress?: (event) => void;
  onLongPress?: (event) => void;
  onPressIn?: (event) => void;
  onPressOut?: (event) => void;
  disabled?: boolean;
  selectable?: boolean;
  selectionColor?: string;         // Android only

  // Accessibility
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityState?: AccessibilityState;

  // Layout
  onLayout?: (event: LayoutChangeEvent) => void;
  onTextLayout?: (event: TextLayoutEvent) => void;

  // Other
  nativeID?: string;
  testID?: string;
  adjustsFontSizeToFit?: boolean;  // iOS only
  suppressHighlighting?: boolean;  // iOS only
}
```

### How Text Children Are Processed

1. **String/Number children** → Passed directly as `children` prop to `RCTText`
2. **Nested Text** → Wrapped in `RCTVirtualText` (inherits ancestor styles)
3. **Raw text nodes** → Become `RCTRawText` fibers (tag 6)

```javascript
// Example component
<Text style={styles.label}>{value}</Text>

// Fiber structure:
// FunctionComponent (StepperValueDisplay)
//   └── HostComponent (RCTText) ← tag 5, memoizedProps.children = 6
//         └── (no child fiber for primitive children)
```

---

## Implementation Plan

### Phase 1: Fix Children Detection for Text Components

**Goal**: Detect when `children` prop changes for Text components

**Changes to `RenderCauseDetector.ts`**:

```typescript
// In getChangedKeys function:
function getChangedKeys(prev: any, next: any, fiberType?: string): string[] | null {
  // ... existing code ...

  for (const key of allKeys) {
    // Special handling for Text components - include children
    if (key === "children") {
      if (fiberType === "RCTText" || fiberType === "RCTVirtualText") {
        // For Text, children IS the content - always check it
        if (!shallowEqual(prev[key], next[key])) {
          changed.push("children (text content)");
        }
      }
      continue; // Skip children for other components
    }

    // ... rest of existing logic ...
  }
}
```

**Affected files**:
- `packages/highlight-updates/src/highlight-updates/utils/RenderCauseDetector.ts`

### Phase 2: Fix Component Cause WeakMap Issue

**Goal**: Ensure component fiber state persists across renders

**Investigation needed**:
- Why is WeakMap entry being garbage collected?
- Is the component fiber reference changing between renders?
- Should we use a different keying strategy?

**Potential solutions**:
1. Use fiber's `alternate` property to check both current and WIP fibers
2. Key by a stable identifier instead of fiber reference
3. Store state on the fiber itself (if safe)

**Changes to `RenderCauseDetector.ts`**:

```typescript
// Current problematic code:
const componentFiberStates = new WeakMap<any, {...}>();

// Potential fix - check alternate fiber too:
function detectComponentCause(componentFiber: any): ComponentCauseType {
  if (!componentFiber) return "unknown";

  // Check both current fiber and its alternate
  let prev = componentFiberStates.get(componentFiber);
  if (!prev && componentFiber.alternate) {
    prev = componentFiberStates.get(componentFiber.alternate);
  }

  // Store on current fiber
  componentFiberStates.set(componentFiber, {
    memoizedProps: componentFiber.memoizedProps,
    memoizedState: componentFiber.memoizedState,
  });

  // ... rest of detection logic ...
}
```

### Phase 3: Extract Actual State Values from Hooks

**Goal**: Show actual state values (e.g., `value: 6 → 4`) instead of just "state changed"

**Implementation**:

```typescript
interface ExtractedHookState {
  index: number;
  type: 'useState' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback' | 'useEffect' | 'unknown';
  value: any;
  previousValue?: any;
}

function extractHookStates(fiber: any): ExtractedHookState[] {
  const states: ExtractedHookState[] = [];
  let hookState = fiber?.memoizedState;
  let index = 0;

  while (hookState && index < 20) {
    const extracted: ExtractedHookState = {
      index,
      type: 'unknown',
      value: hookState.memoizedState,
    };

    // Identify hook type
    if (hookState.queue !== null) {
      // Has dispatch function - useState or useReducer
      extracted.type = 'useState'; // Could also be useReducer
      extracted.value = hookState.memoizedState;
    } else if (hookState.memoizedState?.current !== undefined) {
      // Has .current property - useRef
      extracted.type = 'useRef';
      extracted.value = hookState.memoizedState.current;
    } else if (Array.isArray(hookState.memoizedState) && hookState.memoizedState.length === 2) {
      // Array of [value, deps] - useMemo or useCallback
      extracted.type = 'useMemo'; // or useCallback
      extracted.value = hookState.memoizedState[0];
    }

    states.push(extracted);
    hookState = hookState.next;
    index++;
  }

  return states;
}
```

### Phase 4: Enhanced Render Event Data

**Goal**: Capture rich data for each render event

**New interface**:

```typescript
interface EnhancedRenderEvent {
  id: string;
  timestamp: number;
  renderNumber: number;

  // Cause detection
  cause: RenderCause;

  // Native level details
  native: {
    type: string;                          // "RCTText", "RCTView", etc.
    tag: number;                           // Fiber work tag
    changedProps: PropChange[];            // Detailed prop changes
  };

  // Component level details
  component: {
    name: string;                          // "StepperValueDisplay"
    cause: ComponentCauseType;
    changedProps?: PropChange[];           // If props caused render
    changedState?: StateChange[];          // If state caused render
  };
}

interface PropChange {
  key: string;
  previousValue: any;
  currentValue: any;
  isReference: boolean;                    // Same value, different reference?
}

interface StateChange {
  hookIndex: number;
  hookType: 'useState' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback' | 'unknown';
  previousValue: any;
  currentValue: any;
}
```

### Phase 5: Text-Specific UI Enhancements

**Goal**: Show meaningful information for Text components

**Display changes**:

For a Text component showing value `6 → 4`:

```
┌─────────────────────────────────────────────┐
│ StepperValueDisplay                         │
├─────────────────────────────────────────────┤
│ Native: RCTText                             │
│ Cause: STATE → PROPS                        │
│                                             │
│ Component State Changed:                    │
│   Hook[3] (useState): 6 → 4                 │
│                                             │
│ Native Props Changed:                       │
│   children: 6 → 4                           │
└─────────────────────────────────────────────┘
```

---

## Component-Specific Detection Rules

### Text (RCTText / RCTVirtualText)

| Prop | Importance | Notes |
|------|------------|-------|
| `children` | **HIGH** | The actual text content - always track |
| `style` | MEDIUM | Often recreated but values same - deep compare |
| `numberOfLines` | LOW | Rarely changes |
| `ellipsizeMode` | LOW | Rarely changes |
| `onPress` | MEDIUM | Often recreated - suggest useCallback |

### View (RCTView)

| Prop | Importance | Notes |
|------|------------|-------|
| `children` | LOW | Usually React elements - skip |
| `style` | MEDIUM | Often recreated but values same |
| `onLayout` | MEDIUM | Often recreated - suggest useCallback |

### Image (RCTImageView)

| Prop | Importance | Notes |
|------|------------|-------|
| `source` | **HIGH** | The image to display |
| `style` | MEDIUM | Size/positioning |
| `onLoad` | MEDIUM | Often recreated |

---

## Testing Plan

### Test Case 1: Simple State Change
```jsx
function Counter() {
  const [count, setCount] = useState(0);
  return <Text>{count}</Text>;
}
```
**Expected**: State change detected, `children: 0 → 1` shown

### Test Case 2: Parent Re-render (No Changes)
```jsx
function Parent() {
  const [, forceRender] = useState(0);
  return <Child />;
}
function Child() {
  return <Text>Static</Text>;
}
```
**Expected**: Parent cause detected, no prop changes

### Test Case 3: Style Reference Change (No Visual Change)
```jsx
function Label() {
  return <Text style={{ color: 'red' }}>Hello</Text>;
}
```
**Expected**: Props changed (style reference), but note "same values"

---

## Files to Modify

1. **`RenderCauseDetector.ts`**
   - Add fiber type to getChangedKeys
   - Fix WeakMap issue for component cause
   - Add hook state extraction
   - Add component-specific detection rules

2. **`RenderTracker.ts`**
   - Update `RenderEvent` interface with enhanced data
   - Add state value capture

3. **`RenderHistoryViewer.tsx`**
   - Display actual state values
   - Show text content changes
   - Improve diff visualization

4. **`RenderDetailView.tsx`**
   - Show hook state changes
   - Display before/after values

5. **`RenderCauseBadge.tsx`**
   - Add "text content" indicator for Text components

---

## Success Criteria

1. ✅ Text component `children` changes are detected and displayed
2. ✅ Component cause detection is stable (no false "mount" detections)
3. ✅ Actual state values are shown (`value: 6 → 4`)
4. ✅ Style reference changes are distinguished from value changes
5. ✅ Export includes all meaningful data for debugging
6. ✅ Performance impact < 5% additional overhead

---

## Next Steps

1. [ ] Implement Phase 1: Fix children detection for Text
2. [ ] Implement Phase 2: Fix WeakMap issue
3. [ ] Test with debug logging enabled
4. [ ] Implement Phase 3: Extract hook state values
5. [ ] Update UI components (Phase 4-5)
6. [ ] Write tests for each component type
7. [ ] Document patterns for other component types (View, Image, etc.)
