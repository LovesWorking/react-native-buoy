# Why Did Render: Comprehensive Data Capture Plan

## Goal

Capture 100% of available data from React fiber when a Text component renders, to understand exactly what information is available for determining WHY a component re-rendered.

---

## KEY FINDING: Use `fiber.alternate` for Previous State!

**CRITICAL DISCOVERY**: React's double-buffering gives us the previous render's state for FREE via `fiber.alternate`. This is more reliable than using WeakMaps because:

1. **`fiber.alternate.memoizedProps`** - Previous props
2. **`fiber.alternate.memoizedState`** - Previous hooks linked list
3. React maintains this automatically - no storage needed!

### Before (WeakMap approach - unreliable)
```
memoizedProps.children: 3 (was: 1)  ← Stale! Should be 2
alternate.memoizedProps.children: 2  ← Correct!
matches prev storage: NO
```

### After (Alternate fiber approach - reliable)
```
Props changed (vs alternate): YES
ALTERNATE memoizedState: DIFFERENT  ← State actually changed
```

The fix was applied to `detectComponentCause()` to use `componentFiber.alternate` first, falling back to WeakMap only for first renders.

This document outlines:
1. All current logging in the codebase (to be cleaned up)
2. New logging strategy to capture EVERYTHING
3. Test procedure (simple +/- stepper with Text component)
4. What to look for in the logs
5. Expected data structure at each level

---

## Part 1: Current Logging (To Be Cleaned Up)

### Files with Console.log Statements

#### 1. `RenderCauseDetector.ts`
| Lines | Current State | Description |
|-------|--------------|-------------|
| 777-839 | `logRawFiberData()` function | Extensive fiber dump - **currently not called** |
| 882-890 | Inline debug log | Commented out with `// if (debugLogging)` |

**Action**: Remove the commented-out code. Keep `logRawFiberData()` but don't call it.

#### 2. `RenderTracker.ts`
| Lines | Description | Keep/Remove |
|-------|-------------|-------------|
| 905 | Error in listener | KEEP (error handling) |
| 916 | Error in state listener | KEEP (error handling) |
| 927 | Error in settings listener | KEEP (error handling) |

**Action**: Keep all - these are error handlers, not debug logs.

#### 3. `HighlightUpdatesController.ts`
| Lines | Current State | Description |
|-------|--------------|-------------|
| 134 | `DEBUG = false` | Global debug flag |
| 139-141 | `debugLog()` function | Only logs when DEBUG=true |
| 396 | `DEBUG_LOGGING = false` | Another debug flag |
| 709 | `DEBUG_LOG_ONLY = false` | Log-only mode flag |
| 759-790 | DEBUG_LOG_ONLY block | Extensive logging when flag is true |
| 864-867 | DEBUG_LOGGING block | Component count log |
| 887 | DEBUG_LOGGING block | No callback warning |
| 1013 | Error in measurement | KEEP (error handling) |
| 1113 | Error in state listener | KEEP (error handling) |

**Action**: Remove DEBUG_LOG_ONLY block entirely. Keep debugLog() but ensure DEBUG=false.

#### 4. `PerformanceLogger.ts`
| Lines | Description | Keep/Remove |
|-------|-------------|-------------|
| 79 | End-to-end timing | Conditional (>50ms) |
| 153/156 | Enable/disable message | KEEP |
| 316-324 | Batch metrics log | Controlled by isEnabled() |
| 328-331 | Slow batch warning | Controlled by isEnabled() |
| 345-352 | Summary stats | Controlled by isEnabled() |
| 413 | Error in listener | KEEP (error handling) |

**Action**: Keep all - these are controlled by the settings toggle.

#### 5. `ProfilerInterceptor.ts`
| Lines | Description | Keep/Remove |
|-------|-------------|-------------|
| 109, 114, 146 | Installation messages | Development-only, OK |
| 127 | traceUpdates log | Controlled by loggingEnabled |
| All others | Development diagnostics | Controlled by flags |

**Action**: Keep all - these are controlled by flags and dev-only.

#### 6. `HighlightUpdatesOverlay.tsx`
| Lines | Description | Keep/Remove |
|-------|-------------|-------------|
| 49-51 | Overlay render time | Controlled by PerformanceLogger.isEnabled() |

**Action**: Keep - controlled by settings.

---

## Part 2: New Logging Strategy

### Design Principle

Create ONE comprehensive logging function that captures EVERYTHING when a render occurs. This will be controlled by a single setting: `debugRawFiberLogging` (already exists in RenderTrackerSettings).

### New Logging Function: `captureRenderDebugData()`

Location: `RenderCauseDetector.ts`

```typescript
interface RenderDebugData {
  // === IDENTIFICATION ===
  nativeTag: number;
  timestamp: number;
  renderNumber: number;

  // === NATIVE FIBER (Host Component) ===
  native: {
    type: string;                    // "RCTText", "RCTView"
    tag: number;                     // Fiber work tag (5 = HostComponent)

    // Current props
    memoizedProps: {
      children: any;                 // For Text: the actual text content
      style: any;                    // Style object
      testID?: string;
      nativeID?: string;
      accessibilityLabel?: string;
      // ... all other props
    };

    // Previous props (if available)
    previousMemoizedProps?: {
      children: any;
      style: any;
      // ...
    };

    // State (usually null for host components)
    memoizedState: any;
    previousMemoizedState?: any;

    // Fiber tree info
    hasAlternate: boolean;
    hasReturn: boolean;
    hasChild: boolean;
    hasSibling: boolean;
  };

  // === COMPONENT FIBER (React Component) ===
  component: {
    name: string | null;             // "StepperValueDisplay"
    type: string;                    // "function" or "class"
    tag: number;                     // Fiber work tag (0 = FunctionComponent)

    // Props passed to component
    memoizedProps: any;
    previousMemoizedProps?: any;

    // State (for class components)
    memoizedState: any;
    previousMemoizedState?: any;

    // Fiber tree info
    depth: number;                   // How far up we walked to find it
    _debugOwnerName?: string;        // Owner component name
  };

  // === HOOKS (For Function Components) ===
  hooks: {
    count: number;
    states: Array<{
      index: number;
      type: 'useState' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback' | 'useEffect' | 'unknown';
      value: any;
      previousValue?: any;
      changed: boolean;
    }>;
  };

  // === CAUSE DETECTION RESULTS ===
  detection: {
    // Native level
    nativeCause: 'mount' | 'props' | 'hooks' | 'parent' | 'unknown';
    nativeChangedKeys?: string[];

    // Component level
    componentCause: 'mount' | 'props' | 'state' | 'parent' | 'unknown';
    componentChangedKeys?: string[];

    // Hook changes (if state)
    hookChanges?: Array<{
      index: number;
      type: string;
      from: any;
      to: any;
    }>;
  };

  // === CONTEXT ===
  context: {
    batchSize: number;
    batchNativeTags: number[];       // All tags in this batch
    isParentInBatch: boolean;
    parentNativeTag?: number;
  };
}
```

### Implementation Plan

1. **Create `captureRenderDebugData()` function** in RenderCauseDetector.ts
2. **Call it from `detectRenderCause()`** when `debugLogging` is true
3. **Log the complete data structure** as a single JSON object

---

## Part 3: Test Procedure

### Test Component Setup

The example app already has a simple stepper component. It should look like:

```tsx
function StepperDemo() {
  const [value, setValue] = useState(1);

  return (
    <View>
      <TouchableOpacity onPress={() => setValue(v => v - 1)}>
        <Text>-</Text>
      </TouchableOpacity>

      <StepperValueDisplay value={value} />

      <TouchableOpacity onPress={() => setValue(v => v + 1)}>
        <Text>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepperValueDisplay({ value }: { value: number }) {
  return <Text testID="stepper-value">{value}</Text>;
}
```

### Test Steps

1. **Enable Settings**:
   - Open DevTools floating menu
   - Enable "Highlight Updates"
   - Open Settings → Enable "Track Render Causes"
   - Enable "Debug Raw Fiber Logging" (new setting we'll add)

2. **Perform Two Renders**:
   - Initial state: value = 1
   - Press + button → value = 2 (First render event)
   - Press + button → value = 3 (Second render event)

3. **Capture Console Output**:
   - Look for `[RN-BUOY RENDER DEBUG]` logs
   - Copy both complete JSON objects

4. **Analyze the Data**:
   - Compare render #1 (1→2) with render #2 (2→3)
   - Verify all expected data is captured

### Expected Console Output Format

```
[RN-BUOY RENDER DEBUG] ═══════════════════════════════════════
Render #2 for Text (nativeTag: 12345)
═══════════════════════════════════════════════════════════════

NATIVE FIBER (RCTText):
  type: "RCTText"
  tag: 5 (HostComponent)
  memoizedProps.children: 2 (was: 1)
  memoizedProps.style: { fontSize: 24, ... }

COMPONENT (StepperValueDisplay):
  name: "StepperValueDisplay"
  type: function
  tag: 0 (FunctionComponent)
  memoizedProps.value: 2 (was: 1)
  depth: 3 (walked up from native fiber)

HOOKS (1 hook):
  [0] useState: 2 (was: 1) ← CHANGED

DETECTION RESULT:
  Native Cause: PROPS (children: 1 → 2)
  Component Cause: PROPS (value: 1 → 2)
  ↳ Parent component state changed, passed new props down

BATCH CONTEXT:
  Batch size: 5
  Other tags in batch: [12340, 12341, 12342, 12343, 12345]
  Parent in batch: YES (tag: 12340)

═══════════════════════════════════════════════════════════════
```

---

## Part 4: What to Look For

### Key Questions to Answer

1. **Children Value Tracking**
   - Is `fiber.memoizedProps.children` showing the actual text value (2, 3)?
   - Can we get the previous value from `alternate.memoizedProps.children`?

2. **Component Fiber Access**
   - Does walking up via `_debugOwner` or `.return` find `StepperValueDisplay`?
   - Can we access the component's props (`value: 2`)?

3. **Hook State Access**
   - For the parent component (StepperDemo), can we see the useState value?
   - Does `fiber.memoizedState` give us access to the hooks linked list?

4. **Alternate Fiber (Double Buffering)**
   - Is `fiber.alternate` available?
   - Does it contain the PREVIOUS state/props?

5. **Batch Information**
   - Which other components are in the same batch?
   - Can we detect parent-child relationships within the batch?

### Data Validation Checklist

For each render, verify:

- [ ] Native tag is correct
- [ ] Native type is "RCTText"
- [ ] `memoizedProps.children` shows current value (2 or 3)
- [ ] Previous children value is accessible
- [ ] Component name is "StepperValueDisplay"
- [ ] Component props show `value: 2` or `value: 3`
- [ ] Parent component can be identified
- [ ] Hook values are extractable
- [ ] Render cause detection is accurate

---

## Part 5: Files to Modify

### Phase 1: Cleanup (Remove old debug logs)

| File | Action |
|------|--------|
| `RenderCauseDetector.ts` | Remove commented-out debug code (lines 882-890) |
| `HighlightUpdatesController.ts` | Remove `DEBUG_LOG_ONLY` block (lines 746-792) |

### Phase 2: Add New Comprehensive Logging

| File | Action |
|------|--------|
| `RenderCauseDetector.ts` | Add `captureRenderDebugData()` function |
| `RenderCauseDetector.ts` | Call from `detectRenderCause()` when enabled |
| `RenderTracker.ts` | Add UI toggle for `debugRawFiberLogging` (already exists) |

### Phase 3: Connect to UI

The setting `debugRawFiberLogging` already exists in `RenderTrackerSettings`.
It's already passed to `detectRenderCause()` via the `debugLogging` parameter.
We just need to implement the actual logging.

---

## Part 6: Implementation Code

### New Function in RenderCauseDetector.ts

```typescript
/**
 * Capture comprehensive debug data for a render event.
 * Only called when debugRawFiberLogging is enabled.
 */
function captureRenderDebugData(
  nativeTag: number,
  fiber: any,
  owningComponentFiber: any,
  prev: FiberState | undefined,
  current: FiberState,
  componentCauseResult: ComponentCauseResult,
  batchNativeTags: Set<number>
): void {
  const componentName = getComponentNameFromFiber(owningComponentFiber) || "Unknown";
  const renderNumber = nodeRenderCounts.get(nativeTag) || 1;

  console.log(`\n[RN-BUOY RENDER DEBUG] ═══════════════════════════════════════`);
  console.log(`Render #${renderNumber} for ${fiber?.type || 'Unknown'} (nativeTag: ${nativeTag})`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  // === NATIVE FIBER ===
  console.log(`NATIVE FIBER (${fiber?.type || 'Unknown'}):`);
  console.log(`  type: "${fiber?.type}"`);
  console.log(`  tag: ${fiber?.tag} (${getTagName(fiber?.tag)})`);

  // Current and previous children
  const currChildren = fiber?.memoizedProps?.children;
  const prevChildren = prev?.memoizedProps?.children;
  const childrenChanged = currChildren !== prevChildren;
  console.log(`  memoizedProps.children: ${formatValue(currChildren)}${childrenChanged && prev ? ` (was: ${formatValue(prevChildren)})` : ''}`);

  // Style
  const currStyle = fiber?.memoizedProps?.style;
  const prevStyle = prev?.memoizedProps?.style;
  const styleChanged = currStyle !== prevStyle;
  console.log(`  memoizedProps.style: ${JSON.stringify(currStyle)}${styleChanged && prev ? ' (CHANGED)' : ''}`);

  // Identifying props
  if (fiber?.memoizedProps?.testID) {
    console.log(`  memoizedProps.testID: "${fiber.memoizedProps.testID}"`);
  }
  if (fiber?.memoizedProps?.nativeID) {
    console.log(`  memoizedProps.nativeID: "${fiber.memoizedProps.nativeID}"`);
  }

  // Alternate (previous fiber)
  console.log(`  alternate: ${fiber?.alternate ? 'YES' : 'NO'}`);
  if (fiber?.alternate?.memoizedProps) {
    console.log(`  alternate.memoizedProps.children: ${formatValue(fiber.alternate.memoizedProps.children)}`);
  }

  console.log('');

  // === COMPONENT FIBER ===
  console.log(`COMPONENT (${componentName}):`);
  if (owningComponentFiber) {
    console.log(`  name: "${componentName}"`);
    console.log(`  type: ${typeof owningComponentFiber.type}`);
    console.log(`  tag: ${owningComponentFiber.tag} (${getTagName(owningComponentFiber.tag)})`);
    console.log(`  memoizedProps: ${JSON.stringify(safeStringify(owningComponentFiber.memoizedProps, 2))}`);

    // Previous component state (from WeakMap)
    const compPrev = getComponentFiberPrevState(owningComponentFiber);
    if (compPrev) {
      console.log(`  previousMemoizedProps: ${JSON.stringify(safeStringify(compPrev.memoizedProps, 2))}`);
    }

    // Debug owner
    if (owningComponentFiber._debugOwner) {
      const ownerName = getComponentNameFromFiber(owningComponentFiber._debugOwner);
      console.log(`  _debugOwner: "${ownerName}"`);
    }
  } else {
    console.log(`  (No component fiber found)`);
  }

  console.log('');

  // === HOOKS ===
  console.log(`HOOKS:`);
  if (owningComponentFiber?.memoizedState) {
    const hooks = extractHookStates(owningComponentFiber);
    const prevHooks = getComponentFiberPrevState(owningComponentFiber)?.extractedHooks;

    if (hooks) {
      console.log(`  count: ${hooks.length}`);
      hooks.forEach((hook, i) => {
        const prevHook = prevHooks?.[i];
        const changed = prevHook && prevHook.rawState !== hook.rawState;
        const prevValue = prevHook ? formatValue(prevHook.value) : 'N/A';
        console.log(`  [${i}] ${hook.type}: ${formatValue(hook.value)}${changed ? ` (was: ${prevValue}) ← CHANGED` : ''}`);
      });
    } else {
      console.log(`  (Could not extract hooks)`);
    }
  } else {
    console.log(`  (No hooks - not a function component or no state)`);
  }

  console.log('');

  // === DETECTION RESULT ===
  console.log(`DETECTION RESULT:`);
  console.log(`  Native Cause: ${componentCauseResult.cause.toUpperCase()}`);
  console.log(`  Component Cause: ${componentCauseResult.cause.toUpperCase()}`);
  if (componentCauseResult.hookChanges) {
    console.log(`  Hook Changes:`);
    componentCauseResult.hookChanges.forEach(change => {
      console.log(`    [${change.index}] ${change.type}: ${change.previousValue} → ${change.currentValue}`);
    });
  }

  console.log('');

  // === BATCH CONTEXT ===
  console.log(`BATCH CONTEXT:`);
  console.log(`  Batch size: ${batchNativeTags.size}`);
  console.log(`  Tags in batch: [${Array.from(batchNativeTags).join(', ')}]`);

  const parentTag = getParentNativeTag(fiber);
  const parentInBatch = parentTag !== null && batchNativeTags.has(parentTag);
  console.log(`  Parent in batch: ${parentInBatch ? 'YES' : 'NO'}${parentTag ? ` (tag: ${parentTag})` : ''}`);

  console.log(`\n═══════════════════════════════════════════════════════════════\n`);
}

function getTagName(tag: number): string {
  const tags: Record<number, string> = {
    0: 'FunctionComponent',
    1: 'ClassComponent',
    5: 'HostComponent',
    6: 'HostText',
    7: 'Fragment',
    11: 'ForwardRef',
    14: 'MemoComponent',
    15: 'SimpleMemoComponent',
  };
  return tags[tag] || `Unknown(${tag})`;
}
```

---

## Part 7: Success Criteria

After implementing this plan, we should be able to:

1. **See EVERYTHING** - All available data from React fiber on each render
2. **Compare renders** - Side-by-side data from render 1→2 and 2→3
3. **Identify the cause** - Clear evidence of WHY each render happened
4. **Validate our detection** - Confirm our cause detection matches the raw data
5. **Find missing data** - Discover any data we're not currently capturing

### Expected Outcomes

For the Text component showing values 1→2→3:

| Render | Children Value | Expected Native Cause | Expected Component Cause |
|--------|---------------|----------------------|-------------------------|
| 1→2 | 1→2 | PROPS (children changed) | STATE (useState in parent) |
| 2→3 | 2→3 | PROPS (children changed) | STATE (useState in parent) |

The logs should clearly show:
- `memoizedProps.children: 2 (was: 1)`
- Parent component's useState hook changing
- Props being passed down to StepperValueDisplay
- Text's children prop reflecting the new value

---

## Part 8: Next Steps After Data Capture

Once we have comprehensive logs:

1. **Analyze the data** - Identify all useful fields
2. **Document the structure** - Create type definitions for all accessible data
3. **Improve detection** - Use newly discovered data to improve accuracy
4. **Build UI** - Display the most useful data in the render history viewer
5. **Remove debug logging** - Clean up after analysis is complete

---

## Appendix: Fiber Structure Reference

### Key Fiber Properties

```typescript
interface ReactFiber {
  // Identity
  tag: number;              // Component type (0=Function, 1=Class, 5=Host)
  type: any;                // Component type/function/string

  // Props & State
  memoizedProps: any;       // Props from last render
  pendingProps: any;        // Props for next render
  memoizedState: any;       // State/hooks from last render

  // Tree
  return: Fiber | null;     // Parent fiber
  child: Fiber | null;      // First child
  sibling: Fiber | null;    // Next sibling

  // Double buffering
  alternate: Fiber | null;  // Work-in-progress pair

  // Debug
  _debugOwner: Fiber | null;    // Component that rendered this
  _debugSource: any;            // Source location
  _debugHookTypes: string[];    // Hook type names

  // Native (for HostComponent)
  stateNode: any;           // Native view instance
}
```

### Hook State Structure (memoizedState for function components)

```typescript
interface HookState {
  memoizedState: any;       // Current value
  baseState: any;           // Base state before updates
  queue: UpdateQueue | null; // Present for useState/useReducer
  next: HookState | null;   // Next hook in list
}
```

### Native View stateNode Structure (Fabric)

```typescript
interface StateNode {
  canonical: {
    publicInstance: {
      __nativeTag: number;
      measure: (callback) => void;
    };
    viewConfig: {
      uiViewClassName: string; // "RCTText", "RCTView"
    };
    currentProps: any;
    pendingProps: any;
    internalInstanceHandle: Fiber; // THE FIBER!
  };
}
```
