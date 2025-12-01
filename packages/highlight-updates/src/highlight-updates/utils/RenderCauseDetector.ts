/**
 * RenderCauseDetector
 *
 * Detects WHY a component rendered by comparing current fiber state
 * to previously stored state. Supports detection of:
 * - First mount
 * - Props changes (with changed key names)
 * - Hooks/state changes (with hook indices)
 * - Parent re-renders
 *
 * TWO-LEVEL CAUSATION:
 * 1. Native level: Why did the native view's props change? (style, accessibilityState, etc.)
 * 2. Component level: Why did the owning React component re-render? (props, state, parent)
 *
 * This gives the full picture:
 * "StepperValueDisplay re-rendered because PARENT, which caused native Text to update PROPS [style]"
 *
 * COMPONENT-SPECIFIC DETECTION:
 * Different native components have different important props:
 * - RCTText: `children` IS the text content - always track it
 * - RCTView: `children` is React elements - skip it
 * - RCTImageView: `source` is the image URL - track it
 *
 * See: RENDER_CAUSE_TEXT_COMPONENT_PLAN.md for full documentation
 */

"use strict";

import type { RenderCause, RenderCauseType, ComponentCauseType, HookStateChange, DebugLogLevel } from "./RenderTracker";

// ============================================================================
// TYPE DEFINITIONS
// Based on React Native source: packages/react-native/Libraries/Renderer/
// ============================================================================

/**
 * React Fiber Work Tags
 * Identifies the type of fiber node in the tree
 *
 * Source: ReactWorkTags.js in React source
 */
type WorkTag =
  | 0   // FunctionComponent - function MyComponent() {}
  | 1   // ClassComponent - class MyComponent extends React.Component
  | 2   // IndeterminateComponent - not yet determined
  | 3   // HostRoot - root of the fiber tree
  | 4   // HostPortal - React portal
  | 5   // HostComponent - native elements (View, Text, Image, etc.)
  | 6   // HostText - raw text nodes (RCTRawText)
  | 7   // Fragment - React.Fragment
  | 8   // Mode - StrictMode, ConcurrentMode, etc.
  | 9   // ContextConsumer - Context.Consumer
  | 10  // ContextProvider - Context.Provider
  | 11  // ForwardRef - React.forwardRef
  | 12  // Profiler - React.Profiler
  | 13  // SuspenseComponent - React.Suspense
  | 14  // MemoComponent - React.memo (with comparison function)
  | 15  // SimpleMemoComponent - React.memo (without comparison function)
  | 16  // LazyComponent - React.lazy
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

/**
 * React Native Host Component Types
 * Native view types that we can detect and handle specifically
 *
 * Source: packages/react-native/Libraries/Components/
 */
type RNHostComponentType =
  | "RCTView"           // View - generic container
  | "RCTText"           // Text - text display (children = text content)
  | "RCTVirtualText"    // Nested Text (inside another Text)
  | "RCTRawText"        // Raw text node (tag 6)
  | "RCTImageView"      // Image component
  | "RCTScrollView"     // ScrollView
  | "RCTTextInput"      // TextInput
  | "RCTSwitch"         // Switch toggle
  | "RCTActivityIndicatorView"  // ActivityIndicator
  | "RCTModalHostView"  // Modal
  | "RCTRefreshControl" // Pull-to-refresh
  | string;             // Other native components

/**
 * Component-specific prop detection configuration
 * Defines which props are meaningful for each native component type
 */
interface ComponentPropConfig {
  /** Props that should always be tracked (meaningful content) */
  alwaysTrack: string[];
  /** Props that should be skipped (noise or always changing) */
  skip: string[];
  /** Description for debugging */
  description: string;
}

/**
 * Detected hook type for categorization
 * Determines what kind of React hook we're looking at
 */
type DetectedHookType = 'useState' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback' | 'useEffect' | 'unknown';

/**
 * Extracted hook state with type information
 * Represents a single hook's current state for comparison
 */
interface ExtractedHookState {
  /** Hook index in the linked list (0-based) */
  index: number;
  /** Detected type of the hook */
  type: DetectedHookType;
  /** The actual value stored in the hook */
  value: any;
  /** Raw memoizedState reference for comparison */
  rawState: any;
}

/**
 * Configuration for each native component type
 * Tells us which props are meaningful to track for render cause detection
 */
const COMPONENT_PROP_CONFIGS: Record<string, ComponentPropConfig> = {
  // Text components - children IS the actual text content
  RCTText: {
    alwaysTrack: ["children"], // The displayed text/number
    skip: [],
    description: "Text component - children is the displayed content",
  },
  RCTVirtualText: {
    alwaysTrack: ["children"], // Nested text content
    skip: [],
    description: "Virtual Text (nested) - children is the displayed content",
  },

  // View - children is React elements, not meaningful for diff
  RCTView: {
    alwaysTrack: [],
    skip: ["children"], // React elements, not useful to track
    description: "View container - children are React elements",
  },

  // Image - source is the important prop
  RCTImageView: {
    alwaysTrack: ["source"],
    skip: ["children"],
    description: "Image - source contains the image URL/require",
  },

  // TextInput - value is important
  RCTTextInput: {
    alwaysTrack: ["value", "defaultValue"],
    skip: ["children"],
    description: "TextInput - value is the input content",
  },

  // Switch - value is the on/off state
  RCTSwitch: {
    alwaysTrack: ["value"],
    skip: ["children"],
    description: "Switch - value is the toggle state",
  },

  // Default for unknown components
  default: {
    alwaysTrack: [],
    skip: ["children"], // Skip children by default
    description: "Unknown component type",
  },
};

/**
 * Get the prop configuration for a native component type
 */
function getComponentPropConfig(fiberType: string | undefined): ComponentPropConfig {
  if (!fiberType) return COMPONENT_PROP_CONFIGS.default;
  return COMPONENT_PROP_CONFIGS[fiberType] || COMPONENT_PROP_CONFIGS.default;
}

/**
 * Stored fiber state for comparison between renders
 */
interface FiberState {
  memoizedProps: any;
  memoizedState: any;
  timestamp: number;
}

// ============================================================================
// COMPONENT FIBER STATE STORAGE
// ============================================================================

/**
 * Stored component fiber state for comparison between renders.
 * Now includes extracted hook states for Phase 3 hook value tracking.
 */
interface StoredComponentState {
  memoizedProps: any;
  memoizedState: any;
  /** Extracted hook states for value comparison (Phase 3) */
  extractedHooks: ExtractedHookState[] | null;
}

/**
 * Storage for previous component fiber states
 *
 * IMPORTANT: React uses double-buffering with "current" and "work-in-progress" fibers.
 * The fiber reference changes between renders as React swaps the trees.
 * We need to check both the fiber AND its alternate when looking up state.
 *
 * WeakMap is used to automatically clean up when fibers are garbage collected.
 */
const componentFiberStates = new WeakMap<any, StoredComponentState>();

/**
 * Get previous state for a component fiber, checking both current and alternate.
 *
 * React's reconciler maintains two fiber trees:
 * - "current" - the tree currently rendered to screen
 * - "workInProgress" - the tree being built for the next render
 *
 * These are linked via the `alternate` property. When a render completes,
 * they swap roles. So the fiber we see this render may be the alternate
 * of what we saw last render.
 *
 * See: packages/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js
 */
function getComponentFiberPrevState(fiber: any): StoredComponentState | undefined {
  if (!fiber) return undefined;

  // First, try the fiber itself
  let prev = componentFiberStates.get(fiber);
  if (prev) return prev;

  // If not found, try its alternate (the other side of double-buffering)
  if (fiber.alternate) {
    prev = componentFiberStates.get(fiber.alternate);
    if (prev) return prev;
  }

  return undefined;
}

/**
 * Store state for a component fiber.
 * Stores on both the fiber and its alternate to ensure we find it next render.
 */
function setComponentFiberState(fiber: any, state: StoredComponentState): void {
  if (!fiber) return;

  // Store on the current fiber
  componentFiberStates.set(fiber, state);

  // Also store on alternate if it exists, so we find it regardless of which
  // side of double-buffering we see next render
  if (fiber.alternate) {
    componentFiberStates.set(fiber.alternate, state);
  }
}

// Storage for previous fiber states
const previousStates = new Map<number, FiberState>();

// Configuration
const MAX_STORED_STATES = 500;
const MAX_CHANGED_KEYS = 10;
const MAX_HOOK_DEPTH = 50;
const MAX_PARENT_DEPTH = 50;

// React Native internal components to skip when finding user components
const INTERNAL_COMPONENT_NAMES = new Set([
  // React Native core primitives
  'View', 'Text', 'TextImpl', 'Image', 'ScrollView', 'FlatList', 'SectionList',
  'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Pressable',
  'TextInput', 'Switch', 'ActivityIndicator', 'Modal', 'StatusBar', 'KeyboardAvoidingView',
  // Animated components
  'AnimatedComponent', 'AnimatedComponentWrapper',
  // React internals
  'Fragment', 'Suspense', 'Provider', 'Consumer', 'Context', 'ForwardRef',
  // Common wrapper names
  'Unknown', 'Component',
]);

/**
 * Check if a component name is an internal React Native component
 */
function isInternalComponentName(name: string | null): boolean {
  if (!name) return true;
  if (INTERNAL_COMPONENT_NAMES.has(name)) return true;
  // Skip Animated.* wrappers
  if (name.startsWith('Animated')) return true;
  return false;
}

/**
 * Get the owning React component fiber for a host fiber.
 * Walks up the fiber tree to find the first USER-DEFINED component,
 * skipping React Native internal components like View, Text, etc.
 */
function getOwningComponentFiber(fiber: any): any {
  if (!fiber) return null;

  // Walk up to find the component that owns this host element
  let current = fiber._debugOwner || fiber.return;
  let depth = 0;
  let firstComponentFiber: any = null; // Fallback if no user component found

  while (current && depth < 30) {
    // Function components have tag 0 (FunctionComponent) or 11 (ForwardRef)
    // Class components have tag 1 (ClassComponent)
    // Host components have tag 5 (HostComponent) - skip these
    const tag = current.tag;

    // Tags: 0=FunctionComponent, 1=ClassComponent, 11=ForwardRef, 15=SimpleMemoComponent
    if (tag === 0 || tag === 1 || tag === 11 || tag === 15) {
      const name = getComponentNameFromFiber(current);

      // Remember first component as fallback
      if (!firstComponentFiber) {
        firstComponentFiber = current;
      }

      // Return if this is a user-defined component (not internal)
      if (!isInternalComponentName(name)) {
        return current;
      }
    }

    current = current.return;
    depth++;
  }

  // Return first component found as fallback (even if internal)
  return firstComponentFiber;
}

/**
 * Get component name from a fiber
 */
function getComponentNameFromFiber(fiber: any): string | null {
  if (!fiber) return null;
  const type = fiber.type;
  if (type) {
    if (typeof type === 'string') return type;
    if (type.name) return type.name;
    if (type.displayName) return type.displayName;
  }
  return null;
}

// ============================================================================
// HOOK STATE EXTRACTION (Phase 3)
// ============================================================================

/**
 * Detect the type of a hook based on its structure.
 *
 * React hooks have different shapes:
 * - useState/useReducer: Has a `queue` property with dispatch function
 * - useRef: memoizedState is { current: value }
 * - useMemo/useCallback: memoizedState is [value, deps] array
 * - useEffect/useLayoutEffect: memoizedState is an effect object with tag
 *
 * See: packages/react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev.js
 */
function detectHookType(hookState: any): DetectedHookType {
  if (!hookState || typeof hookState !== 'object') {
    return 'unknown';
  }

  // useState/useReducer: has a queue with dispatch function
  // This is the most reliable indicator
  if (hookState.queue !== null && hookState.queue !== undefined) {
    // Could be useState or useReducer - both have queue
    // useReducer typically has a more complex reducer, but we can't easily distinguish
    return 'useState';
  }

  const memoizedState = hookState.memoizedState;

  // useRef: memoizedState is an object with only { current: value }
  if (memoizedState !== null &&
      typeof memoizedState === 'object' &&
      !Array.isArray(memoizedState) &&
      'current' in memoizedState &&
      Object.keys(memoizedState).length === 1) {
    return 'useRef';
  }

  // useMemo/useCallback: memoizedState is [value, deps] array
  // The deps is an array used for dependency comparison
  if (Array.isArray(memoizedState) && memoizedState.length === 2) {
    const [, deps] = memoizedState;
    // If second element is an array (deps), it's likely useMemo/useCallback
    if (Array.isArray(deps) || deps === null) {
      // useCallback stores a function, useMemo stores any value
      if (typeof memoizedState[0] === 'function') {
        return 'useCallback';
      }
      return 'useMemo';
    }
  }

  // useEffect/useLayoutEffect: memoizedState has effect-specific properties
  if (memoizedState !== null &&
      typeof memoizedState === 'object' &&
      !Array.isArray(memoizedState) &&
      ('tag' in memoizedState || 'create' in memoizedState || 'destroy' in memoizedState)) {
    return 'useEffect';
  }

  return 'unknown';
}

/**
 * Extract the actual value from a hook's memoizedState.
 * Different hooks store values differently.
 */
function extractHookValue(hookState: any, hookType: DetectedHookType): any {
  const memoizedState = hookState?.memoizedState;

  switch (hookType) {
    case 'useState':
    case 'useReducer':
      // useState/useReducer: memoizedState IS the value directly
      return memoizedState;

    case 'useRef':
      // useRef: memoizedState is { current: value }
      return memoizedState?.current;

    case 'useMemo':
    case 'useCallback':
      // useMemo/useCallback: memoizedState is [value, deps]
      return Array.isArray(memoizedState) ? memoizedState[0] : memoizedState;

    case 'useEffect':
      // useEffect: we don't really have a "value" to show
      return '[effect]';

    default:
      return memoizedState;
  }
}

/**
 * Extract all hook states from a fiber's memoizedState linked list.
 *
 * For function components, fiber.memoizedState is a linked list where each
 * node represents one hook call. The nodes are linked via the `next` property.
 *
 * This function walks the list and extracts:
 * - The hook's index (position in the list)
 * - The detected hook type (useState, useRef, useMemo, etc.)
 * - The actual value stored in the hook
 *
 * @param fiber - The component fiber (must be a function component)
 * @returns Array of extracted hook states, or null if no hooks
 */
function extractHookStates(fiber: any): ExtractedHookState[] | null {
  if (!fiber?.memoizedState) return null;

  // Check if this looks like a hooks linked list (has 'next' property)
  // Class components have different memoizedState structure
  const firstHook = fiber.memoizedState;
  if (typeof firstHook !== 'object' || firstHook === null) {
    return null;
  }

  // If it doesn't have 'next', it might be a class component state object
  // or a single primitive value
  if (!('next' in firstHook) && !('queue' in firstHook) && !('memoizedState' in firstHook)) {
    return null;
  }

  const states: ExtractedHookState[] = [];
  let hookState = firstHook;
  let index = 0;

  // Walk the linked list, with safety limit
  while (hookState !== null && index < MAX_HOOK_DEPTH) {
    const hookType = detectHookType(hookState);
    const value = extractHookValue(hookState, hookType);

    states.push({
      index,
      type: hookType,
      value,
      rawState: hookState.memoizedState,
    });

    hookState = hookState.next;
    index++;
  }

  return states.length > 0 ? states : null;
}

/**
 * Compare two sets of hook states and find what changed.
 *
 * Returns an array of HookStateChange objects describing each change
 * with meaningful before/after values.
 *
 * @param prevStates - Previous hook states (from last render)
 * @param currentStates - Current hook states
 * @returns Array of changes, or null if no changes detected
 */
function compareHookStates(
  prevStates: ExtractedHookState[] | null,
  currentStates: ExtractedHookState[] | null
): HookStateChange[] | null {
  // Can't compare if either is missing
  if (!prevStates || !currentStates) return null;

  const changes: HookStateChange[] = [];

  // Compare each hook by index
  const maxLength = Math.max(prevStates.length, currentStates.length);

  for (let i = 0; i < maxLength; i++) {
    const prev = prevStates[i];
    const curr = currentStates[i];

    // New hook added (shouldn't normally happen, but handle it)
    if (!prev && curr) {
      changes.push({
        index: i,
        type: curr.type,
        currentValue: formatHookValue(curr.value, curr.type),
        description: `Hook[${i}] added`,
      });
      continue;
    }

    // Hook removed (shouldn't normally happen)
    if (prev && !curr) {
      changes.push({
        index: i,
        type: prev.type,
        previousValue: formatHookValue(prev.value, prev.type),
        description: `Hook[${i}] removed`,
      });
      continue;
    }

    // Both exist - compare values
    if (prev && curr) {
      // Skip if raw state reference is the same (no change)
      if (prev.rawState === curr.rawState) {
        continue;
      }

      // For effects, skip (they have complex internal state)
      if (curr.type === 'useEffect') {
        continue;
      }

      // For useMemo/useCallback, the value changing means deps changed
      // Skip these as they're not typically interesting for debugging
      if (curr.type === 'useMemo' || curr.type === 'useCallback') {
        continue;
      }

      // Only report useState/useReducer/useRef changes (most useful)
      if (curr.type === 'useState' || curr.type === 'useReducer' || curr.type === 'useRef') {
        const prevFormatted = formatHookValue(prev.value, prev.type);
        const currFormatted = formatHookValue(curr.value, curr.type);

        changes.push({
          index: i,
          type: curr.type,
          previousValue: prevFormatted,
          currentValue: currFormatted,
          description: `${prevFormatted} → ${currFormatted}`,
        });
      }
    }
  }

  return changes.length > 0 ? changes : null;
}

/**
 * Format a hook value for display.
 * Handles different value types appropriately.
 */
function formatHookValue(value: any, hookType: DetectedHookType): any {
  // For useRef, the value is already unwrapped
  if (hookType === 'useRef') {
    return formatDisplayValue(value);
  }

  // For useState/useReducer, value is the state directly
  return formatDisplayValue(value);
}

/**
 * Format any value for display, handling special cases.
 */
function formatDisplayValue(value: any): any {
  if (value === null) return null;
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    // Truncate long strings
    return value.length > 30 ? value.slice(0, 30) + '...' : value;
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  if (Array.isArray(value)) {
    return `[Array: ${value.length} items]`;
  }
  if (typeof value === 'object') {
    // For objects, just show type hint
    const keys = Object.keys(value);
    return `{Object: ${keys.length} keys}`;
  }
  return String(value);
}

// ============================================================================
// COMPONENT CAUSE DETECTION
// ============================================================================

/**
 * Result of component cause detection.
 * Includes the cause type and detailed hook state changes (Phase 3).
 */
interface ComponentCauseResult {
  /** Why the component re-rendered */
  cause: ComponentCauseType;
  /** Detailed hook state changes with actual values (only for "state" cause) */
  hookChanges: HookStateChange[] | null;
}

/**
 * Detect why a React component re-rendered (component-level cause).
 * This is different from native-level cause - it tells you WHY the
 * React component function was called, not what native props changed.
 *
 * DOUBLE-BUFFERING HANDLING:
 * React maintains two fiber trees (current/workInProgress) that swap each render.
 * We use getComponentFiberPrevState() to check both the fiber and its alternate
 * when looking up previous state, ensuring we don't falsely detect "mount".
 *
 * SWAP DETECTION:
 * After React commits, fibers swap roles. The fiber we receive might be the "old"
 * fiber (pre-update values) with its alternate being the "new" fiber (post-update).
 * We detect this by comparing against our stored previous state and swap if needed.
 *
 * DETECTION LOGIC:
 * 1. If no previous state found → "mount" (first render)
 * 2. If memoizedProps changed → "props" (parent passed different props)
 * 3. If memoizedState changed → "state" (useState/useReducer updated)
 * 4. Otherwise → "parent" (parent re-rendered, no changes to this component)
 *
 * PHASE 3 ENHANCEMENT:
 * When state changes are detected, we also extract the actual hook values
 * and compare them to provide meaningful before/after information.
 */
function detectComponentCause(componentFiber: any): ComponentCauseResult {
  if (!componentFiber) return { cause: "unknown", hookChanges: null };

  // STRATEGY: Handle React's double-buffering swap
  // The fiber we receive might be the OLD fiber (with previous values) where
  // its alternate contains the NEW values. We need to detect and correct this.
  let currentFiber = componentFiber;
  let alternateFiber = componentFiber.alternate;

  // Check if we need to swap fiber and alternate using WeakMap stored state
  const storedPrev = getComponentFiberPrevState(componentFiber);
  if (storedPrev && alternateFiber) {
    // Strategy: Compare first useState hook values to determine which is current
    // The fiber whose state matches stored is the OLD fiber; swap it!
    const fiberHooks = extractHookStates(componentFiber);
    const altHooks = extractHookStates(alternateFiber);
    const storedHooks = storedPrev.extractedHooks;

    if (fiberHooks && altHooks && storedHooks && storedHooks.length > 0) {
      // Find first useState hook for comparison
      const storedStateHook = storedHooks.find(h => h.type === 'useState');
      if (storedStateHook) {
        const fiberStateHook = fiberHooks.find(h => h.index === storedStateHook.index);
        const altStateHook = altHooks.find(h => h.index === storedStateHook.index);

        if (fiberStateHook && altStateHook) {
          const fiberMatchesStored = fiberStateHook.value === storedStateHook.value;
          const altMatchesStored = altStateHook.value === storedStateHook.value;

          // If fiber matches stored but alternate doesn't, fiber is OLD - swap!
          if (fiberMatchesStored && !altMatchesStored) {
            currentFiber = alternateFiber;
            alternateFiber = componentFiber;
          }
        }
      }
    }
  }

  // Extract hook states from the CORRECT current fiber
  const currentHooks = extractHookStates(currentFiber);

  // Get previous state from alternate (which is now correctly the OLD fiber)
  let prevMemoizedProps: any = null;
  let prevMemoizedState: any = null;
  let prevExtractedHooks: ReturnType<typeof extractHookStates> = null;

  if (alternateFiber) {
    // Alternate fiber available - use it as previous state
    prevMemoizedProps = alternateFiber.memoizedProps;
    prevMemoizedState = alternateFiber.memoizedState;
    prevExtractedHooks = extractHookStates(alternateFiber);
  } else {
    // Fall back to WeakMap storage (first render won't have alternate)
    if (storedPrev) {
      prevMemoizedProps = storedPrev.memoizedProps;
      prevMemoizedState = storedPrev.memoizedState;
      prevExtractedHooks = storedPrev.extractedHooks;
    }
  }

  // Store current state for next comparison (on both fiber and alternate)
  // This is critical for swap detection on next render
  setComponentFiberState(currentFiber, {
    memoizedProps: currentFiber.memoizedProps,
    memoizedState: currentFiber.memoizedState,
    extractedHooks: currentHooks,
  });

  // First render - no previous state found (neither alternate nor WeakMap)
  if (prevMemoizedProps === null) {
    return { cause: "mount", hookChanges: null };
  }

  // Check if props changed (shallow comparison)
  // This means the parent passed different props to this component
  const propsChanged = !shallowEqual(prevMemoizedProps, currentFiber.memoizedProps);
  if (propsChanged) {
    return { cause: "props", hookChanges: null };
  }

  // Check if state changed (for hooks, memoizedState is a linked list)
  // This means useState/useReducer triggered a re-render
  const stateChanged = prevMemoizedState !== currentFiber.memoizedState;
  if (stateChanged) {
    // Phase 3: Compare hook states to get actual value changes
    const hookChanges = compareHookStates(prevExtractedHooks, currentHooks);
    return { cause: "state", hookChanges };
  }

  // If neither props nor state changed, it's a parent re-render cascade
  // This component re-rendered because its parent did, not because of its own changes
  return { cause: "parent", hookChanges: null };
}

/**
 * Shallow equality check for props objects
 */
function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  if (typeof objA !== 'object' || typeof objB !== 'object') return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

/**
 * Safe JSON stringify that handles circular references and functions
 */
function safeStringify(obj: any, maxDepth: number = 3): any {
  const seen = new WeakSet();

  function stringify(value: any, depth: number): any {
    if (depth > maxDepth) return "[MAX_DEPTH]";
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
    if (typeof value === "symbol") return `[Symbol: ${value.toString()}]`;
    if (typeof value !== "object") return value;

    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    if (Array.isArray(value)) {
      return value.slice(0, 10).map(v => stringify(v, depth + 1));
    }

    const result: Record<string, any> = {};
    const keys = Object.keys(value).slice(0, 20); // Limit keys
    for (const key of keys) {
      try {
        result[key] = stringify(value[key], depth + 1);
      } catch {
        result[key] = "[Error accessing]";
      }
    }
    return result;
  }

  return stringify(obj, 0);
}

/**
 * Log raw fiber debug data to console
 */
function logRawFiberData(
  nativeTag: number,
  fiber: any,
  owningComponentFiber: any,
  prev: FiberState | undefined,
  current: FiberState,
  componentCause: ComponentCauseType
) {
  const componentName = getComponentNameFromFiber(owningComponentFiber) || "Unknown";

  console.log("\n========================================");
  console.log("[RN-BUOY DEBUG] RENDER EVENT");
  console.log("========================================");
  console.log(`Native Tag: ${nativeTag}`);
  console.log(`Component Name: ${componentName}`);
  console.log(`Is First Render: ${!prev}`);
  console.log(`Component Cause Detected: ${componentCause}`);
  console.log("----------------------------------------");

  // Native fiber (host component) data
  console.log("\n--- NATIVE FIBER (Host Component) ---");
  console.log("fiber.type:", fiber?.type);
  console.log("fiber.tag:", fiber?.tag);
  console.log("fiber.memoizedProps (CURRENT):", safeStringify(fiber?.memoizedProps));
  console.log("fiber.memoizedState:", safeStringify(fiber?.memoizedState));
  if (prev) {
    console.log("PREVIOUS memoizedProps:", safeStringify(prev.memoizedProps));
    console.log("PREVIOUS memoizedState:", safeStringify(prev.memoizedState));
  }

  // Component fiber (React component) data
  console.log("\n--- COMPONENT FIBER (React Component) ---");
  if (owningComponentFiber) {
    console.log("componentFiber.type:", owningComponentFiber?.type?.name || owningComponentFiber?.type);
    console.log("componentFiber.tag:", owningComponentFiber?.tag);
    console.log("componentFiber.memoizedProps:", safeStringify(owningComponentFiber?.memoizedProps));
    console.log("componentFiber.memoizedState:", safeStringify(owningComponentFiber?.memoizedState));

    // Try to extract hook state (memoizedState is a linked list for function components)
    console.log("\n--- HOOKS STATE (linked list walk) ---");
    let hookState = owningComponentFiber?.memoizedState;
    let hookIndex = 0;
    while (hookState && hookIndex < 10) {
      console.log(`Hook[${hookIndex}]:`, safeStringify({
        memoizedState: hookState.memoizedState,
        baseState: hookState.baseState,
        queue: hookState.queue ? "[Queue object]" : null,
      }));
      hookState = hookState.next;
      hookIndex++;
    }

    // Phase 3: Show extracted hook states with type detection
    console.log("\n--- EXTRACTED HOOKS (Phase 3) ---");
    const extractedHooks = extractHookStates(owningComponentFiber);
    if (extractedHooks) {
      for (const hook of extractedHooks) {
        console.log(`Hook[${hook.index}] (${hook.type}):`, formatDisplayValue(hook.value));
      }
    } else {
      console.log("(No hooks extracted)");
    }
  } else {
    console.log("(No component fiber found)");
  }

  // Children/text content
  console.log("\n--- CHILDREN/TEXT CONTENT ---");
  const children = fiber?.memoizedProps?.children;
  console.log("children type:", typeof children);
  console.log("children value:", safeStringify(children));

  console.log("\n========================================\n");
}

/**
 * Get human-readable name for a fiber work tag
 */
function getTagName(tag: number | undefined): string {
  if (tag === undefined) return 'undefined';
  const tags: Record<number, string> = {
    0: 'FunctionComponent',
    1: 'ClassComponent',
    2: 'IndeterminateComponent',
    3: 'HostRoot',
    4: 'HostPortal',
    5: 'HostComponent',
    6: 'HostText',
    7: 'Fragment',
    8: 'Mode',
    9: 'ContextConsumer',
    10: 'ContextProvider',
    11: 'ForwardRef',
    12: 'Profiler',
    13: 'SuspenseComponent',
    14: 'MemoComponent',
    15: 'SimpleMemoComponent',
  };
  return tags[tag] || `Unknown(${tag})`;
}

// ============================================================================
// DEBUG LOGGING FUNCTIONS (by level)
// ============================================================================

/**
 * MINIMAL logging - Only hook/state value changes
 * Shows just the essential info: "useState: 3334 → 3335"
 *
 * This is the most concise view for debugging state changes.
 */
function logMinimal(
  componentName: string | undefined,
  componentCauseResult: ComponentCauseResult
): void {
  // Only log if there are actual hook changes
  if (!componentCauseResult.hookChanges || componentCauseResult.hookChanges.length === 0) {
    return;
  }

  for (const change of componentCauseResult.hookChanges) {
    console.log(
      `[${componentName || 'Unknown'}] ${change.type}[${change.index}]: ${change.previousValue} → ${change.currentValue}`
    );
  }
}

/**
 * VERBOSE logging - Component info + cause + value changes
 * Shows component context with the changes.
 */
function logVerbose(
  nativeTag: number,
  fiber: any,
  owningComponentFiber: any,
  componentCauseResult: ComponentCauseResult,
  changedNativeProps: string[] | null
): void {
  const componentName = getComponentNameFromFiber(owningComponentFiber) || "Unknown";
  const nativeType = typeof fiber?.type === "string" ? fiber.type : "Unknown";
  const { cause, hookChanges } = componentCauseResult;

  // Single-line summary
  console.log(
    `[RENDER] ${componentName} (${nativeType}:${nativeTag}) | Cause: ${cause.toUpperCase()}` +
    (changedNativeProps && changedNativeProps.length > 0 ? ` | Props: [${changedNativeProps.join(', ')}]` : '')
  );

  // Hook changes on separate lines (if any)
  if (hookChanges && hookChanges.length > 0) {
    for (const change of hookChanges) {
      console.log(
        `  └─ ${change.type}[${change.index}]: ${change.previousValue} → ${change.currentValue}`
      );
    }
  }
}

/**
 * Comprehensive render debug logging (level: "all").
 * Captures EVERYTHING available from the React fiber for analysis.
 *
 * This function is called when debugLogLevel is "all".
 * Use this to understand exactly what data is available for render cause detection.
 */
function logComprehensiveRenderData(
  nativeTag: number,
  fiber: any,
  owningComponentFiber: any,
  prev: FiberState | undefined,
  componentCauseResult: ComponentCauseResult,
  batchNativeTags: Set<number>,
  renderCount: number
): void {
  const componentName = getComponentNameFromFiber(owningComponentFiber) || "Unknown";
  const nativeType = typeof fiber?.type === "string" ? fiber.type : "Unknown";

  console.log(`\n[RN-BUOY RENDER DEBUG] ═══════════════════════════════════════`);
  console.log(`Render #${renderCount} for ${nativeType} (nativeTag: ${nativeTag})`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`═══════════════════════════════════════════════════════════════\n`);

  // === NATIVE FIBER (Host Component) ===
  console.log(`NATIVE FIBER (${nativeType}):`);
  console.log(`  type: "${fiber?.type}"`);
  console.log(`  tag: ${fiber?.tag} (${getTagName(fiber?.tag)})`);

  // Use ALTERNATE for previous values (most reliable!)
  const altFiber = fiber?.alternate;
  const prevSource = altFiber ? 'alternate' : (prev ? 'storage' : 'none');
  console.log(`  Previous values source: ${prevSource}`);

  // Current and previous children - USE ALTERNATE!
  const currChildren = fiber?.memoizedProps?.children;
  const altChildren = altFiber?.memoizedProps?.children;
  const prevChildren = altChildren !== undefined ? altChildren : prev?.memoizedProps?.children;
  const childrenChanged = prevChildren !== undefined ? currChildren !== prevChildren : false;
  console.log(`  memoizedProps.children: ${formatDisplayValue(currChildren)}${childrenChanged ? ` (was: ${formatDisplayValue(prevChildren)})` : prevChildren !== undefined ? ' (unchanged)' : ' (first render)'}`);

  // Style comparison - USE ALTERNATE!
  const currStyle = fiber?.memoizedProps?.style;
  const altStyle = altFiber?.memoizedProps?.style;
  const prevStyle = altStyle !== undefined ? altStyle : prev?.memoizedProps?.style;
  const styleChanged = prevStyle !== undefined ? currStyle !== prevStyle : false;
  if (currStyle) {
    console.log(`  memoizedProps.style: ${JSON.stringify(safeStringify(currStyle, 2))}${styleChanged ? ' (REFERENCE CHANGED)' : ''}`);
    if (styleChanged && prevStyle) {
      const valuesEqual = deepEqual(currStyle, prevStyle);
      console.log(`    └─ Values actually changed: ${!valuesEqual}`);
    }
  }

  // All other props
  console.log(`  All memoizedProps keys: [${Object.keys(fiber?.memoizedProps || {}).join(', ')}]`);

  // Identifying props
  const testID = fiber?.memoizedProps?.testID;
  const nativeID = fiber?.memoizedProps?.nativeID;
  const accessibilityLabel = fiber?.memoizedProps?.accessibilityLabel;
  if (testID) console.log(`  testID: "${testID}"`);
  if (nativeID) console.log(`  nativeID: "${nativeID}"`);
  if (accessibilityLabel) console.log(`  accessibilityLabel: "${accessibilityLabel}"`);

  // Alternate fiber info
  console.log(`  alternate: ${altFiber ? 'YES' : 'NO'}`);
  if (altFiber) {
    console.log(`    alternate.memoizedProps.children: ${formatDisplayValue(altChildren)}`);
  }

  // Fiber tree structure
  console.log(`  Tree structure:`);
  console.log(`    return (parent): ${fiber?.return ? getTagName(fiber.return.tag) : 'null'}`);
  console.log(`    child: ${fiber?.child ? getTagName(fiber.child.tag) : 'null'}`);
  console.log(`    sibling: ${fiber?.sibling ? getTagName(fiber.sibling.tag) : 'null'}`);

  console.log('');

  // === COMPONENT FIBER (React Component) ===
  console.log(`COMPONENT FIBER (${componentName}):`);
  if (owningComponentFiber) {
    console.log(`  name: "${componentName}"`);
    console.log(`  type: ${typeof owningComponentFiber.type} (${owningComponentFiber.type?.name || owningComponentFiber.type?.displayName || 'anonymous'})`);
    console.log(`  tag: ${owningComponentFiber.tag} (${getTagName(owningComponentFiber.tag)})`);

    // Component props
    console.log(`  memoizedProps: ${JSON.stringify(safeStringify(owningComponentFiber.memoizedProps, 2))}`);

    // Check ALTERNATE fiber (React's built-in previous state!)
    console.log(`  alternate: ${owningComponentFiber.alternate ? 'YES' : 'NO'}`);
    if (owningComponentFiber.alternate) {
      console.log(`  ALTERNATE memoizedProps: ${JSON.stringify(safeStringify(owningComponentFiber.alternate.memoizedProps, 2))}`);
      const altPropsChanged = !shallowEqual(owningComponentFiber.alternate.memoizedProps, owningComponentFiber.memoizedProps);
      console.log(`  Props changed (vs alternate): ${altPropsChanged ? 'YES' : 'NO'}`);

      // Check state via alternate
      console.log(`  ALTERNATE memoizedState: ${owningComponentFiber.alternate.memoizedState === owningComponentFiber.memoizedState ? 'SAME' : 'DIFFERENT'}`);
    }

    // Previous component state (from WeakMap - for comparison)
    const compPrev = getComponentFiberPrevState(owningComponentFiber);
    if (compPrev) {
      console.log(`  WeakMap PREVIOUS memoizedProps: ${JSON.stringify(safeStringify(compPrev.memoizedProps, 2))}`);
      const propsChanged = !shallowEqual(compPrev.memoizedProps, owningComponentFiber.memoizedProps);
      console.log(`  Props changed (vs WeakMap): ${propsChanged ? 'YES' : 'NO'}`);
    } else {
      console.log(`  WeakMap PREVIOUS state: (not found - first render or WeakMap cleared)`);
    }

    // Debug owner chain
    if (owningComponentFiber._debugOwner) {
      const ownerName = getComponentNameFromFiber(owningComponentFiber._debugOwner);
      console.log(`  _debugOwner: "${ownerName}"`);

      // Walk up owner chain
      let owner = owningComponentFiber._debugOwner;
      let depth = 1;
      while (owner && depth < 5) {
        const name = getComponentNameFromFiber(owner);
        console.log(`    └─[${depth}] ${name || 'unknown'} (tag: ${owner.tag})`);
        owner = owner._debugOwner;
        depth++;
      }
    }

    // How far we walked to find this component
    let walkDepth = 0;
    let walker = fiber._debugOwner || fiber.return;
    while (walker && walker !== owningComponentFiber && walkDepth < 30) {
      walker = walker.return;
      walkDepth++;
    }
    console.log(`  Depth from native fiber: ${walkDepth}`);
  } else {
    console.log(`  (No component fiber found - could not walk up tree)`);
  }

  console.log('');

  // === HOOKS (For Function Components) ===
  console.log(`HOOKS:`);
  if (owningComponentFiber?.memoizedState) {
    const hooks = extractHookStates(owningComponentFiber);

    // Try to get previous hooks from ALTERNATE fiber first (more reliable!)
    const alternateHooks = owningComponentFiber.alternate
      ? extractHookStates(owningComponentFiber.alternate)
      : null;

    // Fall back to WeakMap storage
    const compPrev = getComponentFiberPrevState(owningComponentFiber);
    const prevHooks = alternateHooks || compPrev?.extractedHooks;
    const prevSource = alternateHooks ? 'alternate' : (compPrev ? 'WeakMap' : 'none');

    if (hooks && hooks.length > 0) {
      console.log(`  Total hooks: ${hooks.length}`);
      console.log(`  Previous values source: ${prevSource}`);
      hooks.forEach((hook, i) => {
        const prevHook = prevHooks?.[i];
        const changed = prevHook ? prevHook.rawState !== hook.rawState : false;
        const prevValue = prevHook ? formatDisplayValue(prevHook.value) : 'N/A';
        const marker = changed ? ' ← CHANGED' : '';
        console.log(`  [${i}] ${hook.type}: ${formatDisplayValue(hook.value)}${prevHook ? ` (was: ${prevValue})` : ' (first render)'}${marker}`);
      });
    } else {
      console.log(`  (Could not extract hooks - memoizedState structure not recognized)`);
      console.log(`  Raw memoizedState type: ${typeof owningComponentFiber.memoizedState}`);
      console.log(`  Has 'next' property: ${'next' in (owningComponentFiber.memoizedState || {})}`);
      console.log(`  Has 'queue' property: ${'queue' in (owningComponentFiber.memoizedState || {})}`);
    }
  } else {
    console.log(`  (No memoizedState - class component, no hooks, or not a function component)`);
  }

  console.log('');

  // === RAW HOOKS DATA (for deep debugging) ===
  console.log(`RAW HOOKS DATA:`);
  if (owningComponentFiber?.memoizedState && typeof owningComponentFiber.memoizedState === 'object') {
    let hookState = owningComponentFiber.memoizedState;
    let hookIndex = 0;
    while (hookState && hookIndex < 10) {
      console.log(`  Hook[${hookIndex}]:`);
      console.log(`    memoizedState: ${safeStringify(hookState.memoizedState, 2)}`);
      console.log(`    baseState: ${safeStringify(hookState.baseState, 2)}`);
      console.log(`    queue: ${hookState.queue ? '[Queue present]' : 'null'}`);
      console.log(`    next: ${hookState.next ? '[Next hook]' : 'null'}`);
      hookState = hookState.next;
      hookIndex++;
    }
    if (hookIndex === 0) {
      console.log(`  (memoizedState is not a hooks linked list)`);
    }
  }

  console.log('');

  // === DETECTION RESULTS ===
  console.log(`DETECTION RESULTS:`);
  console.log(`  Component Cause: ${componentCauseResult.cause.toUpperCase()}`);
  if (componentCauseResult.hookChanges && componentCauseResult.hookChanges.length > 0) {
    console.log(`  Hook Changes Detected:`);
    componentCauseResult.hookChanges.forEach(change => {
      console.log(`    [${change.index}] ${change.type}: ${change.previousValue} → ${change.currentValue}`);
      if (change.description) {
        console.log(`         ${change.description}`);
      }
    });
  }

  // What our prop detection would find
  const nativeType2 = typeof fiber?.type === "string" ? fiber.type : undefined;
  const changedProps = getChangedKeys(prev?.memoizedProps, fiber?.memoizedProps, nativeType2);
  if (changedProps && changedProps.length > 0) {
    console.log(`  Native Props Changed: [${changedProps.join(', ')}]`);
  } else if (prev) {
    console.log(`  Native Props Changed: (none detected)`);
  }

  console.log('');

  // === BATCH CONTEXT ===
  console.log(`BATCH CONTEXT:`);
  console.log(`  Batch size: ${batchNativeTags.size}`);
  console.log(`  All tags in batch: [${Array.from(batchNativeTags).slice(0, 20).join(', ')}${batchNativeTags.size > 20 ? '...' : ''}]`);

  const parentTag = getParentNativeTag(fiber);
  const parentInBatch = parentTag !== null && batchNativeTags.has(parentTag);
  console.log(`  Parent nativeTag: ${parentTag ?? 'not found'}`);
  console.log(`  Parent in batch: ${parentInBatch ? 'YES' : 'NO'}`);

  // Walk up to find parent components in batch
  if (batchNativeTags.size > 1) {
    console.log(`  Components in same batch:`);
    let parent = fiber?.return;
    let depth = 0;
    while (parent && depth < 10) {
      const parentNT = getNativeTagFromStateNode(parent.stateNode);
      if (parentNT !== null && batchNativeTags.has(parentNT)) {
        const parentName = getComponentNameFromFiber(parent) || parent.type;
        console.log(`    [depth ${depth}] ${parentName} (tag: ${parentNT})`);
      }
      parent = parent.return;
      depth++;
    }
  }

  console.log(`\n═══════════════════════════════════════════════════════════════\n`);
}

/**
 * Detect why a component rendered
 *
 * @param nativeTag - The native tag of the component
 * @param fiber - The React fiber object (host fiber)
 * @param batchNativeTags - Set of all nativeTags in this render batch (for parent detection)
 * @param debugLogLevel - Debug logging level: "off" | "minimal" | "verbose" | "all"
 * @returns RenderCause object describing why the component rendered
 */
export function detectRenderCause(
  nativeTag: number,
  fiber: any,
  batchNativeTags: Set<number>,
  debugLogLevel: DebugLogLevel = "off"
): RenderCause {
  const now = Date.now();

  if (!fiber) {
    return { type: "unknown", timestamp: now };
  }

  // STRATEGY: React's double-buffering means fiber and fiber.alternate swap roles each render.
  // The `internalInstanceHandle` we receive may point to either the "current" (just committed)
  // or the "workInProgress" (about to be committed) fiber depending on timing.
  //
  // To reliably get current vs previous:
  // 1. Check our stored previous state by nativeTag (we store AFTER each detection)
  // 2. The current fiber's memoizedProps should be DIFFERENT from stored previous
  // 3. If they're the same, we're looking at the alternate (need to swap)
  //
  // Detection: If fiber.memoizedProps === storedPrev.memoizedProps, we got the wrong fiber!

  let currentFiber = fiber;
  let alternateFiber = fiber.alternate;

  // Check if we need to swap fiber and alternate
  // This happens due to React's double-buffering - we might get the "old" fiber
  const storedPrev = previousStates.get(nativeTag);
  if (storedPrev && alternateFiber) {
    // Detection strategy: Compare children values to determine which fiber is "current"
    // The fiber with the DIFFERENT children value from stored is the NEW (current) fiber
    // The fiber with the SAME children value as stored is the OLD (alternate) fiber
    const storedChildren = storedPrev.memoizedProps?.children;
    const fiberChildren = fiber.memoizedProps?.children;
    const altChildren = alternateFiber.memoizedProps?.children;

    // Check by reference first (fastest), then by value for primitives
    const fiberMatchesStored = fiber.memoizedProps === storedPrev.memoizedProps ||
      (storedChildren !== undefined && fiberChildren === storedChildren);
    const altMatchesStored = alternateFiber.memoizedProps === storedPrev.memoizedProps ||
      (storedChildren !== undefined && altChildren === storedChildren);

    // If fiber matches stored but alternate doesn't, fiber is OLD - swap!
    if (fiberMatchesStored && !altMatchesStored) {
      currentFiber = alternateFiber;
      alternateFiber = fiber;
      if (debugLogLevel === "all") {
        console.log(`[RenderCause] Detected fiber swap - using alternate as current`);
      }
    }
  }

  // Get previous state from alternate fiber first, fall back to our Map
  let prevMemoizedProps: any = null;
  let prevMemoizedState: any = null;

  if (alternateFiber) {
    // Alternate fiber available - use it directly (most reliable!)
    prevMemoizedProps = alternateFiber.memoizedProps;
    prevMemoizedState = alternateFiber.memoizedState;
  } else {
    // Fall back to our Map storage (first render won't have alternate)
    if (storedPrev) {
      prevMemoizedProps = storedPrev.memoizedProps;
      prevMemoizedState = storedPrev.memoizedState;
    }
  }

  // Build prev object for compatibility with existing code
  const prev: FiberState | undefined = prevMemoizedProps !== null ? {
    memoizedProps: prevMemoizedProps,
    memoizedState: prevMemoizedState,
    timestamp: now,
  } : undefined;

  const current: FiberState = {
    memoizedProps: currentFiber.memoizedProps,
    memoizedState: currentFiber.memoizedState,
    timestamp: now,
  };

  // Store current state for next comparison (as fallback for edge cases)
  updateStoredState(nativeTag, current);

  // Get the owning React component for two-level causation
  // Use currentFiber to ensure we walk up from the correct fiber
  const owningComponentFiber = getOwningComponentFiber(currentFiber);
  const componentName = getComponentNameFromFiber(owningComponentFiber) || undefined;

  // Phase 3: detectComponentCause now returns both cause and hook changes
  const componentCauseResult = detectComponentCause(owningComponentFiber);
  const componentCause = componentCauseResult.cause;
  const componentHookChanges = componentCauseResult.hookChanges;

  // First mount detection - no alternate fiber AND no stored state
  if (!prev) {
    // Log mount event if logging is enabled
    if (debugLogLevel !== "off") {
      if (debugLogLevel === "minimal") {
        console.log(`[${componentName || 'Unknown'}] MOUNT`);
      } else if (debugLogLevel === "verbose") {
        const nativeType = typeof currentFiber?.type === "string" ? currentFiber.type : "Unknown";
        console.log(`[RENDER] ${componentName || 'Unknown'} (${nativeType}:${nativeTag}) | Cause: MOUNT`);
      } else if (debugLogLevel === "all") {
        const renderCount = previousStates.has(nativeTag) ? previousStates.size : 1;
        logComprehensiveRenderData(
          nativeTag,
          currentFiber,
          owningComponentFiber,
          prev,
          componentCauseResult,
          batchNativeTags,
          renderCount
        );
      }
    }
    return {
      type: "mount",
      timestamp: now,
      componentCause: "mount", // Override - if native is mount, component is too
      componentName,
    };
  }

  // Get the native component type for component-specific prop handling
  // currentFiber.type is the native component name (e.g., "RCTText", "RCTView")
  const nativeType: string | undefined = typeof currentFiber.type === "string" ? currentFiber.type : undefined;

  // Props change detection (native view props)
  // Pass nativeType so we can handle component-specific props (e.g., children for Text)
  const changedProps = getChangedKeys(
    prev.memoizedProps,
    current.memoizedProps,
    nativeType
  );

  // Debug logging based on level (for non-mount renders)
  if (debugLogLevel !== "off") {
    if (debugLogLevel === "minimal") {
      // Only log if there are hook changes
      logMinimal(componentName, componentCauseResult);
    } else if (debugLogLevel === "verbose") {
      logVerbose(nativeTag, currentFiber, owningComponentFiber, componentCauseResult, changedProps);
    } else if (debugLogLevel === "all") {
      const renderCount = previousStates.has(nativeTag) ? previousStates.size : 1;
      logComprehensiveRenderData(
        nativeTag,
        currentFiber,
        owningComponentFiber,
        prev,
        componentCauseResult,
        batchNativeTags,
        renderCount
      );
    }
  }
  if (changedProps && changedProps.length > 0) {
    return {
      type: "props",
      changedKeys: changedProps.slice(0, MAX_CHANGED_KEYS),
      timestamp: now,
      componentCause,
      componentName,
      // Phase 3: Include hook changes when component cause is state
      hookChanges: componentHookChanges || undefined,
    };
  }

  // Hooks/State change detection (host fiber's hooks - usually none for host components)
  const nativeHookChanges = detectHookChanges(
    prev.memoizedState,
    current.memoizedState
  );
  if (nativeHookChanges && nativeHookChanges.length > 0) {
    return {
      type: "hooks",
      hookIndices: nativeHookChanges,
      timestamp: now,
      componentCause,
      componentName,
      // Phase 3: Include hook changes when component cause is state
      hookChanges: componentHookChanges || undefined,
    };
  }

  // Parent re-rendered detection
  // Check if parent fiber's nativeTag is also in this batch
  const parentNativeTag = getParentNativeTag(currentFiber);
  if (parentNativeTag && batchNativeTags.has(parentNativeTag)) {
    return {
      type: "parent",
      timestamp: now,
      componentCause,
      componentName,
      hookChanges: componentHookChanges || undefined,
    };
  }

  // If we couldn't detect native-level cause, fall back to component cause
  // This handles cases where the component re-rendered due to state but
  // the native view props didn't change (or changed in undetectable ways)
  if (componentCause === "state") {
    return {
      type: "state",
      timestamp: now,
      componentCause,
      componentName,
      // Phase 3: Include hook changes for state-caused renders
      hookChanges: componentHookChanges || undefined,
    };
  }

  if (componentCause === "props") {
    return {
      type: "props",
      timestamp: now,
      componentCause,
      componentName,
    };
  }

  if (componentCause === "parent") {
    return {
      type: "parent",
      timestamp: now,
      componentCause,
      componentName,
    };
  }

  return {
    type: "unknown",
    timestamp: now,
    componentCause,
    componentName,
  };
}

/**
 * Shallow compare object keys to find changes
 * Returns array of changed key names
 *
 * @param prev - Previous props object
 * @param next - Current props object
 * @param fiberType - Native component type (e.g., "RCTText", "RCTView")
 *                    Used to determine which props are meaningful to track
 *
 * COMPONENT-SPECIFIC HANDLING:
 * - RCTText/RCTVirtualText: `children` IS the text content, always track it
 * - RCTView: `children` is React elements, skip it
 * - RCTImageView: `source` is important, track it
 *
 * See: COMPONENT_PROP_CONFIGS for full configuration
 */
function getChangedKeys(prev: any, next: any, fiberType?: string): string[] | null {
  // Same reference = no changes
  if (prev === next) return null;

  // Handle null/undefined cases
  if (!prev || !next) return null;
  if (typeof prev !== "object" || typeof next !== "object") return null;

  // Handle arrays (props shouldn't be arrays, but just in case)
  if (Array.isArray(prev) || Array.isArray(next)) return null;

  // Get component-specific prop configuration
  const propConfig = getComponentPropConfig(fiberType);

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed: string[] = [];

  for (const key of allKeys) {
    // Skip internal React props
    if (key.startsWith("__")) continue;

    // Check if this key should be skipped for this component type
    if (propConfig.skip.includes(key)) continue;

    // For `children` prop, use component-specific rules
    if (key === "children") {
      // Only track children if component config says to (e.g., RCTText)
      if (!propConfig.alwaysTrack.includes("children")) {
        continue; // Skip children for most components
      }

      // For Text components, compare children values
      // Children can be string, number, or array of mixed content
      const prevChildren = prev[key];
      const nextChildren = next[key];

      if (prevChildren !== nextChildren) {
        // Format the change nicely for display
        if (isPrimitive(prevChildren) && isPrimitive(nextChildren)) {
          // Show the actual value change: "children: 6 → 4"
          changed.push(`children: ${formatValue(prevChildren)} → ${formatValue(nextChildren)}`);
        } else {
          // Complex children (arrays, objects) - just note it changed
          changed.push("children (content)");
        }
      }
      continue;
    }

    // Standard shallow comparison for other props
    if (prev[key] !== next[key]) {
      // Phase 4: For object props like style, check if it's a reference-only change
      const prevVal = prev[key];
      const nextVal = next[key];

      if (key === "style") {
        // Style can be an object, array, or array with falsy values
        // Deep compare to see if values actually changed
        if (deepEqual(prevVal, nextVal)) {
          // Reference changed but values are the same - mark as ref-only
          changed.push(`${key} (ref only)`);
        } else {
          // Values actually changed
          changed.push(key);
        }
      } else if (typeof prevVal === "function" && typeof nextVal === "function") {
        // Functions are often recreated - note this for potential useCallback suggestion
        changed.push(`${key} (fn ref)`);
      } else {
        changed.push(key);
      }
    }
  }

  return changed.length > 0 ? changed : null;
}

/**
 * Check if a value is a plain object (not array, null, or class instance)
 */
function isPlainObject(value: any): boolean {
  if (value === null || typeof value !== "object") return false;
  if (Array.isArray(value)) return false;
  // Check if it's a plain object (not a class instance)
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep equality check for objects (used for style comparison)
 * Returns true if objects have the same values
 */
function deepEqual(obj1: any, obj2: any, depth: number = 0): boolean {
  // Prevent infinite recursion
  if (depth > 5) return false;

  // Same reference
  if (obj1 === obj2) return true;

  // Type check
  if (typeof obj1 !== typeof obj2) return false;

  // Primitives
  if (typeof obj1 !== "object" || obj1 === null || obj2 === null) {
    return obj1 === obj2;
  }

  // Arrays
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i], depth + 1)) return false;
    }
    return true;
  }

  // Objects
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key], depth + 1)) return false;
  }

  return true;
}

/**
 * Check if a value is a primitive (string, number, boolean, null, undefined)
 */
function isPrimitive(value: any): boolean {
  return value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean";
}

/**
 * Format a value for display in change messages
 */
function formatValue(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    // Truncate long strings
    return value.length > 20 ? `"${value.slice(0, 20)}..."` : `"${value}"`;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return String(value);
  return "[object]";
}

/**
 * Detect which hooks changed by walking the linked list
 * Returns array of hook indices that changed
 */
function detectHookChanges(prevState: any, nextState: any): number[] | null {
  // Same reference = no changes
  if (prevState === nextState) return null;

  // If either is null/undefined, can't compare
  if (prevState == null || nextState == null) return null;

  // Check if this looks like a hooks linked list
  // Hooks have a 'next' property forming a linked list
  if (typeof prevState !== "object" || typeof nextState !== "object") {
    return null;
  }

  const changes: number[] = [];
  let prevHook = prevState;
  let nextHook = nextState;
  let index = 0;

  // Walk the hooks linked list
  while (nextHook !== null && index < MAX_HOOK_DEPTH) {
    if (prevHook === null) {
      // New hook added (shouldn't happen normally, but handle it)
      changes.push(index);
    } else if (didHookChange(prevHook, nextHook)) {
      changes.push(index);
    }

    // Move to next hook in list
    nextHook = nextHook?.next ?? null;
    prevHook = prevHook?.next ?? null;
    index++;
  }

  return changes.length > 0 ? changes : null;
}

/**
 * Check if a single hook changed
 */
function didHookChange(prev: any, next: any): boolean {
  if (prev === next) return false;

  // Check memoizedState (useState, useReducer, useMemo, useCallback, useRef)
  if (prev.memoizedState !== next.memoizedState) {
    return true;
  }

  // Check baseState (useReducer specific)
  if (prev.baseState !== undefined && prev.baseState !== next.baseState) {
    return true;
  }

  return false;
}

/**
 * Get the nativeTag of the nearest parent host component
 */
function getParentNativeTag(fiber: any): number | null {
  let parent = fiber?.return;
  let depth = 0;

  while (parent && depth < MAX_PARENT_DEPTH) {
    // Check if this is a host component with a stateNode
    if (parent.stateNode) {
      const tag = getNativeTagFromStateNode(parent.stateNode);
      if (tag != null) return tag;
    }
    parent = parent.return;
    depth++;
  }

  return null;
}

/**
 * Extract nativeTag from various stateNode formats
 */
function getNativeTagFromStateNode(stateNode: any): number | null {
  if (!stateNode) return null;

  // Direct __nativeTag (Fabric)
  if (typeof stateNode.__nativeTag === "number") {
    return stateNode.__nativeTag;
  }

  // Direct _nativeTag (Legacy/Paper)
  if (typeof stateNode._nativeTag === "number") {
    return stateNode._nativeTag;
  }

  // Fabric canonical path
  if (typeof stateNode.canonical?.__nativeTag === "number") {
    return stateNode.canonical.__nativeTag;
  }

  // Public instance path
  if (typeof stateNode.canonical?.publicInstance?.__nativeTag === "number") {
    return stateNode.canonical.publicInstance.__nativeTag;
  }

  return null;
}

/**
 * Update stored state with automatic cleanup when limit is reached
 */
function updateStoredState(nativeTag: number, state: FiberState): void {
  // Enforce max limit - remove oldest 25% when full
  if (previousStates.size >= MAX_STORED_STATES) {
    const entries = Array.from(previousStates.entries());
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    // Remove oldest 25%
    const removeCount = Math.floor(MAX_STORED_STATES / 4);
    for (let i = 0; i < removeCount; i++) {
      previousStates.delete(entries[i][0]);
    }
  }

  previousStates.set(nativeTag, state);
}

/**
 * Clear all stored states
 * Call this when tracking is disabled to prevent memory leaks
 */
export function clearRenderCauseState(): void {
  previousStates.clear();
}

/**
 * Remove a specific component from state storage
 * Useful when a component is unmounted
 */
export function removeRenderCauseState(nativeTag: number): void {
  previousStates.delete(nativeTag);
}

/**
 * Get storage stats for debugging/display
 */
export function getRenderCauseStats(): {
  storedStates: number;
  maxStates: number;
} {
  return {
    storedStates: previousStates.size,
    maxStates: MAX_STORED_STATES,
  };
}

// === Props/State Snapshot Capture for History ===

// Max depth for cloning nested objects
const MAX_CLONE_DEPTH = 5;
// Max string length for values
const MAX_STRING_LENGTH = 200;
// Max array items to include
const MAX_ARRAY_ITEMS = 20;
// Max object keys to include
const MAX_OBJECT_KEYS = 30;

/**
 * Safely clone props/state for history storage.
 * Handles circular references, functions, and large objects.
 */
export function safeCloneForHistory(
  value: any,
  depth: number = 0,
  seen: WeakSet<object> = new WeakSet()
): any {
  // Handle primitives
  if (value === null || value === undefined) return value;
  if (typeof value === "boolean" || typeof value === "number") return value;

  // Handle strings (truncate long ones)
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH
      ? value.slice(0, MAX_STRING_LENGTH) + "..."
      : value;
  }

  // Handle functions - show name or placeholder
  if (typeof value === "function") {
    return `[Function: ${value.name || "anonymous"}]`;
  }

  // Handle symbols
  if (typeof value === "symbol") {
    return `[Symbol: ${value.description || ""}]`;
  }

  // Stop at max depth
  if (depth >= MAX_CLONE_DEPTH) {
    if (Array.isArray(value)) return `[Array: ${value.length} items]`;
    if (typeof value === "object") {
      const keys = Object.keys(value);
      return `[Object: ${keys.length} keys]`;
    }
    return "[...]";
  }

  // Handle circular references
  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }
    seen.add(value);
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const cloned = value.slice(0, MAX_ARRAY_ITEMS).map((item) =>
      safeCloneForHistory(item, depth + 1, seen)
    );
    if (value.length > MAX_ARRAY_ITEMS) {
      cloned.push(`[...${value.length - MAX_ARRAY_ITEMS} more]`);
    }
    return cloned;
  }

  // Handle Date
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Handle Error
  if (value instanceof Error) {
    return `[Error: ${value.message}]`;
  }

  // Handle RegExp
  if (value instanceof RegExp) {
    return value.toString();
  }

  // Handle Map
  if (value instanceof Map) {
    const obj: Record<string, any> = { __type: "Map", __size: value.size };
    let count = 0;
    for (const [k, v] of value) {
      if (count >= MAX_OBJECT_KEYS) {
        obj[`...${value.size - count} more`] = true;
        break;
      }
      const key = typeof k === "string" ? k : String(k);
      obj[key] = safeCloneForHistory(v, depth + 1, seen);
      count++;
    }
    return obj;
  }

  // Handle Set
  if (value instanceof Set) {
    return {
      __type: "Set",
      __size: value.size,
      values: Array.from(value).slice(0, MAX_ARRAY_ITEMS).map((item) =>
        safeCloneForHistory(item, depth + 1, seen)
      ),
    };
  }

  // Handle plain objects
  if (typeof value === "object") {
    const cloned: Record<string, any> = {};
    const keys = Object.keys(value);
    const keysToClone = keys.slice(0, MAX_OBJECT_KEYS);

    for (const key of keysToClone) {
      // Skip internal React props
      if (key.startsWith("__") || key === "children") continue;

      try {
        cloned[key] = safeCloneForHistory(value[key], depth + 1, seen);
      } catch {
        cloned[key] = "[Error accessing property]";
      }
    }

    if (keys.length > MAX_OBJECT_KEYS) {
      cloned[`...${keys.length - MAX_OBJECT_KEYS} more keys`] = true;
    }

    return cloned;
  }

  return "[Unknown type]";
}

/**
 * Capture props snapshot from a fiber for history storage
 */
export function capturePropsSnapshot(fiber: any): Record<string, any> | undefined {
  if (!fiber?.memoizedProps) return undefined;
  return safeCloneForHistory(fiber.memoizedProps);
}

/**
 * Capture state snapshot from a fiber for history storage
 * For function components, this walks the hooks linked list
 */
export function captureStateSnapshot(fiber: any): any {
  if (!fiber?.memoizedState) return undefined;

  const state = fiber.memoizedState;

  // Check if it's a hooks linked list (has 'next' property)
  if (typeof state === "object" && state !== null && "next" in state) {
    // It's a hooks list - extract hook values
    const hooks: any[] = [];
    let current = state;
    let index = 0;

    while (current && index < MAX_HOOK_DEPTH) {
      hooks.push({
        index,
        memoizedState: safeCloneForHistory(current.memoizedState),
      });
      current = current.next;
      index++;
    }

    return { __type: "Hooks", hooks };
  }

  // It's a regular state object (class component or simple state)
  return safeCloneForHistory(state);
}
