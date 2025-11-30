/**
 * Highlight Updates Controller
 *
 * Standalone implementation that replicates React DevTools' "Highlight updates
 * when components render" feature WITHOUT requiring DevTools to be connected.
 *
 * Architecture:
 * This controller directly enables the DevTools backend's traceUpdates feature
 * by calling setTraceUpdatesEnabled(true) on each renderer interface. This is
 * the same function that DevTools' frontend calls when you check the
 * "Highlight updates when components render" checkbox.
 *
 * Key insight: The rendererInterfaces are available on the global hook even
 * without DevTools frontend connected. We just need to enable tracing directly.
 *
 * Flow:
 * 1. User enables highlights via toggle()
 * 2. We call rendererInterface.setTraceUpdatesEnabled(true) on all renderers
 * 3. DevTools backend now tracks renders and emits 'traceUpdates' events
 * 4. We subscribe to 'traceUpdates' via hook.sub()
 * 5. When components re-render, we receive the Set of host stateNodes
 * 6. We measure each node and render colored border highlights
 *
 * This gives us 100% accuracy with DevTools behavior because we're using the
 * exact same detection code - we're just enabling it programmatically.
 */

"use strict";

import {
  installProfilerInterceptor,
  uninstallProfilerInterceptor,
  setComparisonCallback,
  enableProfilerLogging,
  disableProfilerLogging,
} from "./ProfilerInterceptor";
import { RenderTracker } from "./RenderTracker";
import { PerformanceLogger, markEventReceived, type BatchTimer } from "./PerformanceLogger";

interface HighlightRect {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  count: number;
}

type HighlightCallback = (rects: HighlightRect[]) => void;

interface PublicInstance {
  measure: (
    callback: (
      x: number,
      y: number,
      width: number,
      height: number,
      pageX: number,
      pageY: number
    ) => void
  ) => void;
  __nativeTag?: number;
}

interface RendererInterface {
  setTraceUpdatesEnabled: (enabled: boolean) => void;
  [key: string]: unknown;
}

interface ReactDevToolsAgent {
  addListener: (event: string, callback: (...args: any[]) => void) => void;
  removeListener: (event: string, callback: (...args: any[]) => void) => void;
  setTraceUpdatesEnabled?: (enabled: boolean) => void;
  emit?: (event: string, ...args: any[]) => void;
  [key: string]: unknown;
}

interface ReactDevToolsGlobalHook {
  // Event subscription
  sub?: (event: string, callback: (...args: any[]) => void) => () => void;
  on?: (event: string, callback: (...args: any[]) => void) => void;
  off?: (event: string, callback: (...args: any[]) => void) => void;
  emit?: (event: string, ...args: any[]) => void;
  // Renderer info - Map of rendererId to RendererInterface
  rendererInterfaces?: Map<number, RendererInterface>;
  // DevTools agent
  reactDevtoolsAgent?: ReactDevToolsAgent;
  [key: string]: unknown;
}

declare const window: {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsGlobalHook;
  __HIGHLIGHT_UPDATES_CONTROLLER__?: HighlightUpdatesControllerAPI;
};

declare const __DEV__: boolean;

// State
let globalEnabled = false;
let initialized = false;
let hook: ReactDevToolsGlobalHook | null = null;
let highlightCallback: HighlightCallback | null = null;
let traceUpdatesUnsubscribe: (() => void) | null = null;
let isProcessing = false;

const stateListeners = new Set<(enabled: boolean) => void>();

// Track render counts per node (for color assignment like DevTools)
// Map from nativeTag to render count - nativeTag is stable across re-renders
const nodeRenderCounts = new Map<number, number>();

// Color palette for highlights (same as DevTools)
// From: react-devtools-core/dist/backend.js line 6361
const COLORS = [
  "#37afa9",
  "#63b19e",
  "#80b393",
  "#97b488",
  "#abb67d",
  "#beb771",
  "#cfb965",
  "#dfba57",
  "#efbb49",
  "#febc38",
];

// Set to true for verbose debugging of our implementation
// Disabled for now to focus on profiler logs only
const DEBUG = false;

function debugLog(message: string, data?: unknown): void {
  if (!DEBUG) return;
  if (data !== undefined) {
    console.log(`[HighlightUpdates] ${message}`, data);
  } else {
    console.log(`[HighlightUpdates] ${message}`);
  }
}

/**
 * Get the public instance from a stateNode (the node passed in traceUpdates)
 */
function getPublicInstance(stateNode: unknown): PublicInstance | null {
  if (!stateNode) return null;

  const node = stateNode as any;

  // Fabric: stateNode.canonical.publicInstance
  if (node.canonical?.publicInstance) {
    return node.canonical.publicInstance;
  }

  // Legacy Fabric: stateNode.canonical with measure
  if (node.canonical && typeof node.canonical.measure === "function") {
    return node.canonical;
  }

  // Legacy renderer: stateNode has measure directly
  if (typeof node.measure === "function") {
    return node;
  }

  return null;
}

/**
 * Get native tag from public instance or stateNode
 */
function getNativeTag(instance: unknown): number | null {
  const inst = instance as any;

  // Try direct properties
  if (inst.__nativeTag != null) return inst.__nativeTag;
  if (inst._nativeTag != null) return inst._nativeTag;
  if (inst.nativeTag != null) return inst.nativeTag;

  // Try canonical
  if (inst.canonical) {
    if (inst.canonical.__nativeTag != null) return inst.canonical.__nativeTag;
    if (inst.canonical._nativeTag != null) return inst.canonical._nativeTag;
  }

  return null;
}

/**
 * Extract component info from a stateNode for RenderTracker
 */
function extractComponentInfo(stateNode: unknown): {
  viewType: string;
  testID?: string;
  nativeID?: string;
  accessibilityLabel?: string;
  componentName?: string;
} {
  const node = stateNode as any;
  const info: {
    viewType: string;
    testID?: string;
    nativeID?: string;
    accessibilityLabel?: string;
    componentName?: string;
  } = {
    viewType: "Unknown",
  };

  // Get viewType from viewConfig
  if (node?.canonical?.viewConfig?.uiViewClassName) {
    info.viewType = node.canonical.viewConfig.uiViewClassName;
  } else if (node?.viewConfig?.uiViewClassName) {
    info.viewType = node.viewConfig.uiViewClassName;
  }

  // Try to get props from various locations
  const fiber = node?.canonical?.internalInstanceHandle;
  const currentProps = node?.canonical?.currentProps;
  const pendingProps = node?.canonical?.pendingProps;
  const fiberPendingProps = fiber?.pendingProps;
  const fiberMemoizedProps = fiber?.memoizedProps;

  // Extract testID
  info.testID =
    currentProps?.testID ||
    pendingProps?.testID ||
    fiberPendingProps?.testID ||
    fiberMemoizedProps?.testID ||
    undefined;

  // Extract nativeID
  info.nativeID =
    currentProps?.nativeID ||
    pendingProps?.nativeID ||
    fiberPendingProps?.nativeID ||
    fiberMemoizedProps?.nativeID ||
    undefined;

  // Extract accessibilityLabel
  info.accessibilityLabel =
    currentProps?.accessibilityLabel ||
    pendingProps?.accessibilityLabel ||
    fiberPendingProps?.accessibilityLabel ||
    fiberMemoizedProps?.accessibilityLabel ||
    undefined;

  // Extract componentName - use getOwningComponentName to get the React component
  // that rendered this host component
  info.componentName = getOwningComponentName(fiber) || undefined;

  return info;
}

/**
 * Describe a node for logging (extensive version for debugging)
 */
function describeNodeForLog(stateNode: unknown): object {
  const node = stateNode as any;
  const publicInstance = getPublicInstance(stateNode);
  const nativeTag = getNativeTag(stateNode) || getNativeTag(publicInstance);

  const info: Record<string, unknown> = {
    nativeTag: nativeTag ?? "unknown",
    type: node?.canonical ? "Fabric" : "Legacy",
    hasMeasure: typeof publicInstance?.measure === "function",
  };

  // Extract as much info as possible from the stateNode
  if (node) {
    // Direct properties on stateNode
    info.stateNodeKeys = Object.keys(node).slice(0, 20);

    // Check the 'node' property (might have useful info)
    if (node.node) {
      info.nodeKeys = Object.keys(node.node).slice(0, 20);
    }

    // Check for viewConfig (contains component type info)
    if (node.viewConfig) {
      info.viewConfig = {
        uiViewClassName: node.viewConfig.uiViewClassName,
        validAttributes: node.viewConfig.validAttributes ? Object.keys(node.viewConfig.validAttributes).slice(0, 10) : undefined,
      };
    }

    // Check canonical structure (Fabric)
    if (node.canonical) {
      const canonical = node.canonical as any;
      info.canonicalKeys = Object.keys(canonical).slice(0, 20);

      if (canonical.viewConfig) {
        info.canonicalViewConfig = {
          uiViewClassName: canonical.viewConfig.uiViewClassName,
        };
      }

      if (canonical.nativeTag != null) {
        info.canonicalNativeTag = canonical.nativeTag;
      }

      // Check internalInstanceHandle (THE FIBER!)
      if (canonical.internalInstanceHandle) {
        const fiber = canonical.internalInstanceHandle as any;
        info.fiberKeys = Object.keys(fiber).slice(0, 30);

        // Component type info
        if (fiber.type) {
          info.fiberType = typeof fiber.type === "function"
            ? (fiber.type.name || fiber.type.displayName || "function")
            : fiber.type;
        }
        if (fiber.elementType) {
          info.fiberElementType = typeof fiber.elementType === "function"
            ? (fiber.elementType.name || fiber.elementType.displayName || "function")
            : fiber.elementType;
        }

        // Debug info on fiber
        if (fiber._debugOwner) {
          const owner = fiber._debugOwner;
          info.fiberDebugOwner = owner.type?.name || owner.type?.displayName || owner.elementType?.name || "unknown";
        }
        if (fiber._debugSource) {
          info.fiberDebugSource = fiber._debugSource;
        }

        // Fiber tag (tells us what kind of fiber it is)
        if (fiber.tag != null) {
          info.fiberTag = fiber.tag;
        }

        // pendingProps on fiber might have testID/nativeID
        if (fiber.pendingProps) {
          if (fiber.pendingProps.nativeID) info.fiberPendingNativeID = fiber.pendingProps.nativeID;
          if (fiber.pendingProps.testID) info.fiberPendingTestID = fiber.pendingProps.testID;
        }
        if (fiber.memoizedProps) {
          if (fiber.memoizedProps.nativeID) info.fiberMemoizedNativeID = fiber.memoizedProps.nativeID;
          if (fiber.memoizedProps.testID) info.fiberMemoizedTestID = fiber.memoizedProps.testID;
        }
      }

      // Check publicInstance
      if (canonical.publicInstance) {
        const pub = canonical.publicInstance as any;
        info.publicInstanceKeys = Object.keys(pub).slice(0, 20);

        // Look for nativeID
        if (pub.nativeID != null) info.nativeID = pub.nativeID;
        if (pub._nativeID != null) info._nativeID = pub._nativeID;

        // Look for props
        if (pub.props) {
          info.publicInstanceProps = Object.keys(pub.props).slice(0, 15);
          if (pub.props.nativeID) info.propsNativeID = pub.props.nativeID;
          if (pub.props.testID) info.propsTestID = pub.props.testID;
          if (pub.props.accessibilityLabel) info.accessibilityLabel = pub.props.accessibilityLabel;
        }
      }

      // Check for currentProps - log actual VALUES
      if (canonical.currentProps) {
        info.currentPropsKeys = Object.keys(canonical.currentProps).slice(0, 15);
        // Log actual values of identifying props
        if (canonical.currentProps.nativeID != null) info.currentPropsNativeID = canonical.currentProps.nativeID;
        if (canonical.currentProps.testID != null) info.currentPropsTestID = canonical.currentProps.testID;
        if (canonical.currentProps.accessibilityLabel != null) info.currentPropsAccessLabel = canonical.currentProps.accessibilityLabel;
      }

      // Check for pendingProps
      if (canonical.pendingProps) {
        info.pendingPropsKeys = Object.keys(canonical.pendingProps).slice(0, 15);
        if (canonical.pendingProps.nativeID != null) info.pendingPropsNativeID = canonical.pendingProps.nativeID;
        if (canonical.pendingProps.testID != null) info.pendingPropsTestID = canonical.pendingProps.testID;
      }
    }

    // Check for fiber reference directly on node
    if (node._debugOwner) {
      const owner = node._debugOwner as any;
      info.debugOwnerType = owner.type?.name || owner.type?.displayName || typeof owner.type;
    }

    if (node._debugSource) {
      info.debugSource = node._debugSource;
    }
  }

  return info;
}

// Set to true to enable debug logging
const DEBUG_LOGGING = false;

// Lock to prevent infinite loops when rendering our overlay
let renderingLock = false;
let renderingLockTimeout: ReturnType<typeof setTimeout> | null = null;

// How long to ignore new events after starting a render (ms)
// Should match HIGHLIGHT_DURATION in the overlay to prevent false triggers
const RENDER_LOCK_DURATION = 350;

// Track nativeTags of components we're currently highlighting
// This helps us identify (and skip) our own overlay Views if they re-render
const renderedOverlayTags = new Set<number>();

/**
 * Check if a nativeTag belongs to our overlay (was rendered by us previously)
 */
function isOurOverlayTag(nativeTag: number | null): boolean {
  if (nativeTag == null) return false;
  return renderedOverlayTags.has(nativeTag);
}

// ============================================================================
// OPTIMIZED DEV TOOLS DETECTION
// ============================================================================
// Performance optimizations applied:
// 1. Result caching by nativeTag (same tag = same result)
// 2. Set-based O(1) lookups instead of multiple string comparisons
// 3. Component name check FIRST (appears early in tree, ~depth 5-8)
// 4. Early exit on first match
// 5. Cached property access to avoid repeated traversal
// ============================================================================

// O(1) lookup sets for fast detection
const DEV_TOOLS_COMPONENT_NAMES = new Set([
  // React Buoy devtools components
  "JsModalComponent",
  "JsModal",
  "HighlightUpdatesModal",
  "HighlightFilterView",
  "RenderDetailView",
  "RenderListItem",
  "RenderListItemInner",
  "TypePicker",
  "PatternInput",
  "PatternChip",
  "DetectedItemsSection",
  "DetectedCategoryBadge",
  "IdentifierBadge",
  "CategoryBadge",
  "AppRenderer",
  "AppOverlay",
  "FloatingTools",
  "DialDevTools",
  "HighlightUpdatesOverlay",
  "DevToolsVisibilityProvider",
  "AppHostProvider",
  "MinimizedToolsProvider",
  // Shared UI components used in modals
  "ModalHeader",
  "TabSelector",
  "SectionHeader",
  "DraggableHeader",
  "WindowControls",
  // React Native LogBox components (shown on reload/errors)
  "LogBox",
  "LogBoxLog",
  "LogBoxLogNotification",
  "LogBoxNotificationContainer",
  "_LogBoxNotificationContainer",
  "LogBoxInspector",
  "LogBoxInspectorContainer",
  "LogBoxInspectorHeader",
  "LogBoxInspectorBody",
  "LogBoxInspectorFooter",
  "LogBoxInspectorMessageHeader",
  "LogBoxInspectorStackFrame",
  "LogBoxInspectorSection",
  "LogBoxButton",
  "LogBoxMessage",
]);

// Component name prefixes to check (for dynamically named components)
const DEV_TOOLS_COMPONENT_PREFIXES = ["JsModal", "HighlightUpdates", "RenderList", "RenderDetail"];

const DEV_TOOLS_NATIVE_IDS = new Set([
  "highlight-updates-overlay",
  "jsmodal-root",
  "__rn_buoy__highlight-modal",
  // LogBox native IDs
  "logbox_inspector",
  "logbox",
]);

// Cache: nativeTag -> isDevTools (avoid re-walking tree for same node)
const devToolsNodeCache = new Map<number, boolean>();
const CACHE_MAX_SIZE = 500;

/**
 * Check if a nativeID belongs to our dev tools or RN internal tools (O(1) with Set + prefix check)
 */
function isDevToolsNativeID(nativeID: string | null | undefined): boolean {
  if (!nativeID) return false;
  // Direct Set lookup first (O(1))
  if (DEV_TOOLS_NATIVE_IDS.has(nativeID)) return true;
  // Prefix checks for devtools nativeIDs
  const firstChar = nativeID.charCodeAt(0);
  if (firstChar === 95) { // '_' = 95
    if (nativeID.startsWith("__highlight_") || nativeID.startsWith("__rn_buoy__")) {
      return true;
    }
  }
  // Check for LogBox nativeIDs (start with 'l')
  if (firstChar === 108 && nativeID.startsWith("logbox")) { // 'l' = 108
    return true;
  }
  return false;
}

/**
 * Get component name from fiber (cached property access pattern)
 * For host components (RCTView, RCTText), returns the native type.
 * Use getOwningComponentName to get the React component that rendered it.
 */
function getComponentName(fiber: any): string | null {
  if (!fiber) return null;
  // Most common: type.name
  const type = fiber.type;
  if (type) {
    if (typeof type === 'string') return type;
    if (type.name) return type.name;
    if (type.displayName) return type.displayName;
  }
  // Fallback: elementType
  const elementType = fiber.elementType;
  if (elementType) {
    if (elementType.name) return elementType.name;
    if (elementType.displayName) return elementType.displayName;
  }
  return null;
}

// Common React Native internal component names to skip when finding user components
const INTERNAL_COMPONENT_NAMES = new Set([
  // React Native core
  'View', 'Text', 'TextImpl', 'Image', 'ScrollView', 'FlatList', 'SectionList',
  'TouchableOpacity', 'TouchableHighlight', 'TouchableWithoutFeedback', 'Pressable',
  'TextInput', 'Switch', 'ActivityIndicator', 'Modal', 'StatusBar', 'KeyboardAvoidingView',
  // Animated components
  'AnimatedComponent', 'AnimatedComponentWrapper',
  // React Navigation / Screens
  'ScreenContainer', 'ScreenStack', 'Screen', 'ScreenContentWrapper',
  // SVG components
  'Svg', 'G', 'Path', 'Rect', 'Circle', 'Line', 'Polygon', 'Polyline', 'Ellipse',
  'Text as SVGText', 'TSpan', 'TextPath', 'Use', 'Symbol', 'Defs', 'ClipPath',
  'LinearGradient', 'RadialGradient', 'Stop', 'Mask', 'Pattern', 'Image as SVGImage',
  // SafeArea
  'SafeAreaProvider', 'SafeAreaView', 'SafeAreaListener',
  // Gesture Handler
  'GestureHandlerRootView', 'GestureDetector',
  // Reanimated
  'ReanimatedView', 'ReanimatedText', 'ReanimatedImage', 'ReanimatedScrollView',
  // Common wrapper names
  'Fragment', 'Suspense', 'Provider', 'Consumer', 'Context', 'ForwardRef',
]);

/**
 * Check if a component name is an internal/wrapper component that should be skipped
 */
function isInternalComponent(name: string | null): boolean {
  if (!name) return true;
  if (INTERNAL_COMPONENT_NAMES.has(name)) return true;
  // Skip anonymous components and common patterns
  if (name === 'Unknown' || name === 'Component') return true;
  // Skip Animated.* wrappers
  if (name.startsWith('Animated')) return true;
  return false;
}

/**
 * Get the owning React component name for a host fiber.
 * Walks up the fiber tree to find the first user-defined component,
 * skipping React Native internal components.
 */
function getOwningComponentName(fiber: any): string | null {
  if (!fiber) return null;

  // Walk up the fiber tree looking for a user-defined component
  let current = fiber._debugOwner || fiber.return;
  let depth = 0;
  let firstNonHostName: string | null = null;

  while (current && depth < 30) {
    const name = getComponentName(current);

    // Skip host components (their type is a string like "RCTView")
    if (name && typeof current.type !== 'string') {
      // Remember the first non-host component as fallback
      if (!firstNonHostName) {
        firstNonHostName = name;
      }
      // Return this component if it's not an internal wrapper
      if (!isInternalComponent(name)) {
        return name;
      }
    }

    current = current.return;
    depth++;
  }

  // Fallback to first non-host component found (even if internal)
  return firstNonHostName;
}

/**
 * Check if a stateNode belongs to our dev tools.
 *
 * OPTIMIZED: Uses caching, O(1) Set lookups, and early exit patterns.
 * Walks up fiber tree checking component names (fast) before nativeIDs.
 */
function isOurOverlayNode(stateNode: unknown): boolean {
  const node = stateNode as any;
  const fiber = node?.canonical?.internalInstanceHandle;

  // Get nativeTag for caching
  const nativeTag = getNativeTag(stateNode) || getNativeTag(node?.canonical?.publicInstance);

  // Check cache first (O(1))
  if (nativeTag != null) {
    const cached = devToolsNodeCache.get(nativeTag);
    if (cached !== undefined) {
      return cached;
    }
  }

  let result = false;

  // Fast path: check direct nativeID
  const directNativeID =
    fiber?.pendingProps?.nativeID ||
    fiber?.memoizedProps?.nativeID ||
    node?.canonical?.currentProps?.nativeID ||
    null;

  if (isDevToolsNativeID(directNativeID)) {
    result = true;
  } else if (fiber) {
    // Walk up fiber tree - check component names FIRST (they appear early)
    let current = fiber;
    let depth = 0;

    // Reduced max depth - component names appear by depth 15 typically
    while (current && depth < 30) {
      // Component name check FIRST (faster, appears earlier in tree)
      const name = getComponentName(current);
      if (name) {
        // Direct set lookup (O(1))
        if (DEV_TOOLS_COMPONENT_NAMES.has(name)) {
          result = true;
          break;
        }
        // Check prefixes for dynamically named components
        for (const prefix of DEV_TOOLS_COMPONENT_PREFIXES) {
          if (name.startsWith(prefix)) {
            result = true;
            break;
          }
        }
        if (result) break;
      }

      // NativeID check (only if component name didn't match)
      const nativeID = current.pendingProps?.nativeID || current.memoizedProps?.nativeID;
      if (isDevToolsNativeID(nativeID)) {
        result = true;
        break;
      }

      current = current.return;
      depth++;
    }
  }

  // Only cache positive results (is devtools = true)
  // Don't cache false results because the fiber tree parent can change
  // (e.g., a component might not have the devtools parent on first render
  // but will have it on subsequent renders)
  if (result && nativeTag != null) {
    if (devToolsNodeCache.size >= CACHE_MAX_SIZE) {
      // Clear oldest entries (simple strategy - clear half)
      const entries = Array.from(devToolsNodeCache.keys());
      for (let i = 0; i < CACHE_MAX_SIZE / 2; i++) {
        devToolsNodeCache.delete(entries[i]);
      }
    }
    devToolsNodeCache.set(nativeTag, result);
  }

  return result;
}

/**
 * Get color based on render count (same algorithm as DevTools)
 * More renders = warmer color (cyan → yellow)
 */
function getColorForRenderCount(count: number): string {
  // Clamp to color array bounds
  const index = Math.min(count - 1, COLORS.length - 1);
  return COLORS[Math.max(0, index)];
}

// TEMPORARY: Set to true to disable rendering and only log
const DEBUG_LOG_ONLY = false;

/**
 * Handle traceUpdates event from DevTools backend
 * This is called with a Set of stateNodes that should be highlighted
 *
 * Strategy to prevent infinite loops:
 * 1. Use a rendering lock while rendering highlights
 * 2. Use an isProcessing flag to prevent concurrent processing
 * 3. If Chrome DevTools agent is available, use native overlay (faster, no React)
 * 4. Otherwise, use our React overlay with locks to prevent cascading renders
 */
function handleTraceUpdates(nodes: Set<unknown>): void {
  if (nodes.size === 0) {
    return;
  }

  if (!globalEnabled) {
    return;
  }

  // Skip processing when paused - don't count renders or show highlights
  const trackerState = RenderTracker.getState();
  if (trackerState.isPaused) {
    return;
  }

  // Mark event received for end-to-end timing
  if (PerformanceLogger.isEnabled()) {
    markEventReceived();
  }

  // Start performance timing
  const batchSize = RenderTracker.getBatchSize();
  const perfTimer = PerformanceLogger.startBatch(nodes.size, batchSize);

  // TEMPORARY: Log only mode - skip all processing and just log extensive info
  if (DEBUG_LOG_ONLY) {
    // First, test our filter on all nodes
    const filtered: unknown[] = [];
    const passed: unknown[] = [];

    for (const node of nodes) {
      if (isOurOverlayNode(node)) {
        filtered.push(node);
      } else {
        passed.push(node);
      }
    }

    console.log(`\n========== [HighlightUpdates] ==========`);
    console.log(`  Total: ${nodes.size} | FILTERED: ${filtered.length} | PASSED: ${passed.length}`);

    // Log ALL passed nodes with detailed info
    if (passed.length > 0) {
      console.log(`\n--- PASSED NODES (would render highlights) ---`);
      passed.forEach((node, index) => {
        const n = node as any;
        const fiber = n?.canonical?.internalInstanceHandle;
        const viewType = n?.canonical?.viewConfig?.uiViewClassName || "Unknown";
        const directNativeID =
          fiber?.pendingProps?.nativeID ||
          fiber?.memoizedProps?.nativeID ||
          null;
        const testID =
          fiber?.pendingProps?.testID ||
          fiber?.memoizedProps?.testID ||
          null;
        // Get the owning React component name (not the native type)
        const ownerName = getOwningComponentName(fiber);
        const nativeTag = getNativeTag(n) || getNativeTag(n?.canonical?.publicInstance);

        console.log(`  [${index}] ${viewType} | tag=${nativeTag} | owner=${ownerName || 'unknown'}${testID ? ` | testID=${testID}` : ''}${directNativeID ? ` | nativeID=${directNativeID}` : ''}`);
      });
    }

    // Log a sample filtered node to verify detection
    if (filtered.length > 0 && passed.length === 0) {
      console.log(`  ✓ All ${filtered.length} nodes filtered (dev tools)`);
    }

    console.log(`==========================================\n`);
    return;
  }

  // NOTE: Lock-based skipping disabled - relying on nativeID filtering instead
  // If nativeID filtering doesn't work, re-enable this:
  //
  // if (renderingLock || isProcessing) {
  //   if (DEBUG_LOGGING) {
  //     console.log(`[HighlightUpdates] SKIPPED - lock:${renderingLock} processing:${isProcessing}`);
  //   }
  //   return;
  // }
  // isProcessing = true;

  // Process nodes: track render counts and assign colors
  // Filter out our own overlay nodes to prevent infinite loop
  const nodesToDraw: Array<{ node: unknown; color: string; count: number }> = [];

  let skippedOverlayCount = 0;
  for (const stateNode of nodes) {
    if (stateNode && typeof stateNode === "object") {
      // Skip our own overlay nodes (identified by nativeID)
      if (isOurOverlayNode(stateNode)) {
        skippedOverlayCount++;
        continue;
      }

      // Get nativeTag for tracking render counts
      const publicInstance = getPublicInstance(stateNode);
      const nativeTag = getNativeTag(stateNode) || getNativeTag(publicInstance);

      if (nativeTag == null) {
        continue;
      }

      // Check if render counting is enabled
      const showRenderCount = RenderTracker.getSettings().showRenderCount;

      let newCount: number;
      let color: string;

      if (showRenderCount) {
        // Get current render count and increment (using nativeTag as stable key)
        const currentCount = nodeRenderCounts.get(nativeTag) || 0;
        newCount = currentCount + 1;
        nodeRenderCounts.set(nativeTag, newCount);
        // Assign color based on render count
        color = getColorForRenderCount(newCount);
      } else {
        // Skip counting - use fixed color and count of 0
        newCount = 0;
        color = COLORS[0]; // Use first color (cyan)
      }

      nodesToDraw.push({
        node: stateNode,
        color,
        count: newCount,
      });
    }
  }

  // Mark filtering phase complete
  perfTimer.markFilteringComplete(skippedOverlayCount, nodesToDraw.length);

  // Only log if there are real updates (not just overlay re-renders)
  if (nodesToDraw.length === 0) {
    // All nodes were overlay nodes - silently skip
    perfTimer.finish(); // Still log the batch even if empty
    return;
  }

  // Log actual component updates
  if (DEBUG_LOGGING) {
    console.log(
      `[HighlightUpdates] ${nodesToDraw.length} component(s) re-rendered`
    );
  }

  // NOTE: We prefer our React overlay for standalone operation.
  // The native overlay only works when Chrome DevTools profiler is actively enabled.
  // Uncomment below to use native overlay when available:
  //
  // const agent = hook?.reactDevtoolsAgent;
  // if (agent?.emit) {
  //   if (DEBUG_LOGGING) {
  //     console.log(`[HighlightUpdates] Using native overlay (agent available)`);
  //   }
  //   agent.emit("drawTraceUpdates", nodesToDraw);
  //   isProcessing = false;
  //   return;
  // }

  // Fallback: use our React overlay with lock to prevent infinite loop
  if (!highlightCallback) {
    if (DEBUG_LOGGING) {
      console.log(`[HighlightUpdates] No highlightCallback - skipping render`);
    }
    isProcessing = false;
    return;
  }

  // NOTE: Lock disabled - relying on nativeID filtering instead

  // Measure each node and call the highlight callback
  // Use batch size from RenderTracker settings (default: 150)
  // Note: batchSize already retrieved above for perfTimer
  perfTimer.markMeasurementStart();
  const measurePromises = nodesToDraw.slice(0, batchSize).map(
    ({ node: stateNode, color, count }) =>
      new Promise<{ rect: HighlightRect | null; stateNode: unknown; color: string; count: number }>((resolve) => {
        const publicInstance = getPublicInstance(stateNode);
        if (!publicInstance) {
          resolve({ rect: null, stateNode, color, count });
          return;
        }

        const nativeTag = getNativeTag(stateNode) || getNativeTag(publicInstance);
        if (nativeTag == null) {
          resolve({ rect: null, stateNode, color, count });
          return;
        }

        try {
          publicInstance.measure((x, y, width, height, pageX, pageY) => {
            if (pageX == null || pageY == null || width == null || height == null) {
              resolve({ rect: null, stateNode, color, count });
              return;
            }

            resolve({
              rect: {
                id: nativeTag,
                x: pageX,
                y: pageY,
                width,
                height,
                color,
                count,
              },
              stateNode,
              color,
              count,
            });
          });
        } catch (error) {
          resolve({ rect: null, stateNode, color, count });
        }
      })
  );

  Promise.all(measurePromises)
    .then((results) => {
      const validResults = results.filter((r) => r.rect !== null);
      const rects = validResults.map((r) => r.rect as HighlightRect);

      // Mark measurement phase complete
      perfTimer.markMeasurementComplete(validResults.length, results.length - validResults.length);

      // Track renders in RenderTracker (for modal)
      // Use batch mode to avoid O(n²) listener notifications
      RenderTracker.startBatch();
      for (const { rect, stateNode, color, count } of validResults) {
        if (rect) {
          const componentInfo = extractComponentInfo(stateNode);
          RenderTracker.trackRender({
            nativeTag: rect.id,
            viewType: componentInfo.viewType,
            testID: componentInfo.testID,
            nativeID: componentInfo.nativeID,
            accessibilityLabel: componentInfo.accessibilityLabel,
            componentName: componentInfo.componentName,
            measurements: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
            },
            color,
            count,
          });
        }
      }
      RenderTracker.endBatch();

      // Mark tracking phase complete
      perfTimer.markTrackingComplete();

      if (rects.length > 0 && highlightCallback) {
        highlightCallback(rects);
      }

      // Mark callback phase complete and finish timing
      perfTimer.markCallbackComplete();
      perfTimer.finish();
    })
    .catch((error) => {
      console.error("[HighlightUpdates] Error in measurement pipeline:", error);
      perfTimer.finish(); // Still log timing even on error
    });
}

/**
 * Enable or disable trace updates on all renderer interfaces.
 * This is the key function that makes standalone tracing work!
 *
 * The rendererInterfaces map contains the renderer backend for each React root.
 * Each renderer has a setTraceUpdatesEnabled function that controls whether
 * it emits 'traceUpdates' events when components re-render.
 *
 * See: react-devtools-core/dist/backend.js line 15487-15489
 */
function setTraceUpdatesOnRenderers(enabled: boolean): void {
  if (!hook?.rendererInterfaces) {
    debugLog("No rendererInterfaces available");
    return;
  }

  let count = 0;
  hook.rendererInterfaces.forEach((rendererInterface, rendererId) => {
    if (typeof rendererInterface.setTraceUpdatesEnabled === "function") {
      try {
        rendererInterface.setTraceUpdatesEnabled(enabled);
        count++;
        debugLog(`Renderer ${rendererId}: setTraceUpdatesEnabled(${enabled})`);
      } catch (error) {
        debugLog(`Renderer ${rendererId}: error setting trace updates`, error);
      }
    } else {
      debugLog(`Renderer ${rendererId}: no setTraceUpdatesEnabled method`);
    }
  });

  debugLog(`Set trace updates ${enabled ? "enabled" : "disabled"} on ${count} renderer(s)`);

  // Also try the agent if available (in case DevTools is connected)
  if (hook.reactDevtoolsAgent?.setTraceUpdatesEnabled) {
    try {
      hook.reactDevtoolsAgent.setTraceUpdatesEnabled(enabled);
      debugLog("Also set trace updates on agent");
    } catch (error) {
      debugLog("Error setting trace updates on agent", error);
    }
  }
}

/**
 * Subscribe to the traceUpdates event from the hook
 */
function subscribeToTraceUpdates(): void {
  if (!hook) return;
  if (traceUpdatesUnsubscribe) return; // Already subscribed

  debugLog("Subscribing to traceUpdates event");

  // The hook uses EventEmitter pattern with 'sub' method
  // See: react-devtools-core/dist/backend.js line 17526
  // hook.sub('traceUpdates', agent.onTraceUpdates)
  if (typeof hook.sub === "function") {
    traceUpdatesUnsubscribe = hook.sub("traceUpdates", handleTraceUpdates);
    debugLog("Subscribed using hook.sub()");
  } else {
    debugLog("hook.sub not available, traceUpdates may not work");
  }

  // CRITICAL: Enable trace updates on all renderers
  // Without this, the renderers won't emit traceUpdates events
  setTraceUpdatesOnRenderers(true);
}

/**
 * Unsubscribe from the traceUpdates event
 */
function unsubscribeFromTraceUpdates(): void {
  // Disable trace updates on renderers first
  setTraceUpdatesOnRenderers(false);

  if (traceUpdatesUnsubscribe) {
    traceUpdatesUnsubscribe();
    traceUpdatesUnsubscribe = null;
    debugLog("Unsubscribed from traceUpdates event");
  }
}

/**
 * Set the callback for rendering highlights
 */
function setHighlightCallback(callback: HighlightCallback | null): void {
  highlightCallback = callback;
  debugLog(`Highlight callback ${callback ? "set" : "cleared"}`);
}

function notifyStateListeners(): void {
  stateListeners.forEach((listener) => {
    try {
      listener(globalEnabled);
    } catch (error) {
      console.error("[HighlightUpdates] Error in state listener:", error);
    }
  });
}

function subscribe(listener: (enabled: boolean) => void): () => void {
  stateListeners.add(listener);
  listener(globalEnabled);
  return () => {
    stateListeners.delete(listener);
  };
}

function initialize(): boolean {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    debugLog("Only available in development builds");
    return false;
  }

  if (initialized) {
    return true;
  }

  hook = window?.__REACT_DEVTOOLS_GLOBAL_HOOK__ || null;
  if (!hook) {
    debugLog("React DevTools hook not found");
    return false;
  }

  debugLog("Hook found");
  debugLog(`Hook has sub: ${typeof hook.sub === "function"}`);
  debugLog(`Hook has on: ${typeof hook.on === "function"}`);
  debugLog(`Hook has emit: ${typeof hook.emit === "function"}`);

  // Install profiler interceptor to capture what DevTools detects
  // This allows us to compare profiler data with our detection
  installProfilerInterceptor();

  // Comparison callback available for future use when we re-enable our implementation
  // setComparisonCallback((profilerNodes: Set<unknown>) => {
  //   debugLog(`[COMPARISON] Profiler detected ${profilerNodes.size} nodes`);
  // });

  if (hook.rendererInterfaces && hook.rendererInterfaces.size > 0) {
    initialized = true;
    debugLog(`Initialized with ${hook.rendererInterfaces.size} renderer(s)`);
    exposeGlobally();
    return true;
  }

  // Wait for renderer to be available
  const checkInterval = setInterval(() => {
    if (hook?.rendererInterfaces && hook.rendererInterfaces.size > 0) {
      clearInterval(checkInterval);
      initialized = true;
      debugLog(`Initialized with ${hook.rendererInterfaces.size} renderer(s) (delayed)`);
      exposeGlobally();
    }
  }, 100);

  setTimeout(() => clearInterval(checkInterval), 10000);
  return false;
}

function exposeGlobally(): void {
  if (typeof window !== "undefined") {
    window.__HIGHLIGHT_UPDATES_CONTROLLER__ = {
      enable,
      disable,
      toggle,
      isEnabled,
      setEnabled,
      subscribe,
      initialize,
      destroy,
      isInitialized: () => initialized,
      setHighlightCallback,
    } as HighlightUpdatesControllerAPI;
  }
}

function enable(): void {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return;

  if (!initialized) {
    initialize();
  }

  if (globalEnabled) {
    return;
  }

  debugLog("Enabling highlights");

  // Enable our implementation
  subscribeToTraceUpdates();

  // Start tracking renders
  RenderTracker.start();

  // Note: profiler logging disabled for normal operation
  // enableProfilerLogging();

  globalEnabled = true;
  notifyStateListeners();
}

function disable(): void {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return;

  if (!globalEnabled) {
    return;
  }

  debugLog("Disabling highlights");

  // Clear any pending locks/state
  renderingLock = false;
  isProcessing = false;
  if (renderingLockTimeout) {
    clearTimeout(renderingLockTimeout);
    renderingLockTimeout = null;
  }
  renderedOverlayTags.clear();
  devToolsNodeCache.clear(); // Clear detection cache

  // Disable our implementation
  unsubscribeFromTraceUpdates();

  // Stop tracking renders
  RenderTracker.stop();

  // Note: profiler logging disabled for normal operation
  // disableProfilerLogging();

  globalEnabled = false;
  notifyStateListeners();
}

function toggle(): void {
  if (typeof __DEV__ !== "undefined" && !__DEV__) return;

  if (globalEnabled) {
    disable();
  } else {
    enable();
  }
}

/**
 * Clear all render counts and tracked data
 */
function clearRenderCounts(): void {
  nodeRenderCounts.clear();
  RenderTracker.clear();
  debugLog("Cleared render counts");
}

function isEnabled(): boolean {
  return globalEnabled;
}

function setEnabled(enabled: boolean): void {
  if (enabled) enable();
  else disable();
}

function isInitialized(): boolean {
  return initialized;
}

function destroy(): void {
  if (!initialized) return;

  unsubscribeFromTraceUpdates();

  // Uninstall profiler interceptor
  uninstallProfilerInterceptor();
  setComparisonCallback(null);

  globalEnabled = false;
  hook = null;
  highlightCallback = null;
  initialized = false;

  if (typeof window !== "undefined") {
    delete window.__HIGHLIGHT_UPDATES_CONTROLLER__;
  }

  debugLog("Destroyed");
}

interface HighlightUpdatesControllerAPI {
  subscribe: typeof subscribe;
  enable: typeof enable;
  disable: typeof disable;
  toggle: typeof toggle;
  isEnabled: typeof isEnabled;
  setEnabled: typeof setEnabled;
  initialize: typeof initialize;
  destroy: typeof destroy;
  isInitialized: () => boolean;
  setHighlightCallback: typeof setHighlightCallback;
  clearRenderCounts: typeof clearRenderCounts;
}

const HighlightUpdatesController: HighlightUpdatesControllerAPI = {
  subscribe,
  enable,
  disable,
  toggle,
  isEnabled,
  setEnabled,
  initialize,
  destroy,
  isInitialized,
  setHighlightCallback,
  clearRenderCounts,
};

export default HighlightUpdatesController;
