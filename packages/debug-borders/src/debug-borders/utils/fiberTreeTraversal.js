/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

"use strict";

/**
 * Fiber Tree Traversal Utilities
 *
 * This module provides utilities to access and traverse the React fiber tree
 * using the React DevTools global hook, similar to how React Native's built-in
 * dev tools (Element Inspector, Trace Updates) work.
 */

/**
 * Gets the React DevTools global hook
 * This hook is injected by React DevTools and provides access to React internals
 */
function getReactDevToolsHook() {
  if (typeof global === "undefined") {
    return null;
  }

  const hook = global.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (!hook) {
    return null;
  }

  return hook;
}

/**
 * Gets all fiber roots from the React DevTools hook
 * Each React root has its own fiber tree
 */
function getFiberRoots() {
  const hook = getReactDevToolsHook();
  if (!hook) {
    return [];
  }

  // The hook maintains a Map of rendererID -> Set of fiber roots
  // For React Native, the rendererID is typically 1
  if (!hook.getFiberRoots) {
    return [];
  }

  try {
    // Try to get roots for renderer ID 1 (React Native)
    const rootsSet = hook.getFiberRoots(1);
    if (!rootsSet) {
      return [];
    }

    return Array.from(rootsSet);
  } catch (error) {
    return [];
  }
}

/**
 * Fiber node tag constants
 * These are used to identify the type of React component
 *
 * Source: packages/react-reconciler/src/ReactWorkTags.js
 */
const FiberTags = {
  FunctionComponent: 0,
  ClassComponent: 1,
  IndeterminateComponent: 2,
  HostRoot: 3,
  HostPortal: 4,
  HostComponent: 5, // Native views (View, Text, etc.)
  HostText: 6, // Text nodes
  Fragment: 7,
  Mode: 8,
  ContextConsumer: 9,
  ContextProvider: 10,
  ForwardRef: 11,
  Profiler: 12,
  SuspenseComponent: 13,
  MemoComponent: 14,
  SimpleMemoComponent: 15,
  LazyComponent: 16,
  IncompleteClassComponent: 17,
  DehydratedFragment: 18,
  SuspenseListComponent: 19,
  ScopeComponent: 21,
  OffscreenComponent: 22,
  LegacyHiddenComponent: 23,
  CacheComponent: 24,
  TracingMarkerComponent: 25,
};

/**
 * =============================================================================
 * DEV TOOLS DETECTION
 * =============================================================================
 * These constants and functions detect React Buoy dev tools components
 * so we can exclude them from debug borders rendering.
 *
 * The detection works by checking:
 * 1. Component names in the fiber tree (fastest, checked first)
 * 2. nativeID props on fibers (checked if component name doesn't match)
 *
 * Results are cached by nativeTag for O(1) subsequent lookups.
 */

/**
 * Set of component names that belong to dev tools
 * Uses Set for O(1) lookup performance
 */
const DEV_TOOLS_COMPONENT_NAMES = new Set([
  // React Buoy core components
  "FloatingTools",
  "FloatingDevTools",
  "FloatingMenu",
  "DialDevTools",
  "DevToolsVisibilityProvider",
  "AppHostProvider",
  "MinimizedToolsProvider",
  "MinimizedToolsStack",
  "GlitchToolButton",
  "DefaultConfigProvider",
  // JsModal components
  "JsModalComponent",
  "JsModal",
  "ModalHeader",
  "DraggableHeader",
  "DragIndicator",
  "CornerHandle",
  "WindowControls",
  // Highlight Updates components
  "HighlightUpdatesModal",
  "HighlightUpdatesOverlay",
  "HighlightFilterView",
  "RenderDetailView",
  "RenderListItem",
  "RenderListItemInner",
  "RenderHistoryViewer",
  "RenderCauseBadge",
  // Debug Borders components
  "DebugBordersStandaloneOverlay",
  "DebugBordersModal",
  // Storage Browser components
  "StorageBrowser",
  "StorageModal",
  "GameUIStorageBrowser",
  "StorageEventListener",
  "StorageEventFilterView",
  // Network Monitor components
  "NetworkMonitor",
  "NetworkModal",
  "NetworkRequestList",
  "NetworkRequestDetail",
  // Route Events components
  "RouteEventsModal",
  "RouteEventsList",
  // Environment Switcher components
  "EnvSwitcher",
  "EnvSwitcherModal",
  // Shared UI components
  "TabSelector",
  "SectionHeader",
  "TypePicker",
  "PatternInput",
  "PatternChip",
  "DetectedItemsSection",
  "DetectedCategoryBadge",
  "IdentifierBadge",
  "CategoryBadge",
  "AppRenderer",
  "AppOverlay",
  "ExpandablePopover",
  "Divider",
  "UserStatus",
  "GripVerticalIcon",
  // React Native LogBox components
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

/**
 * Prefixes for dynamically named dev tools components
 */
const DEV_TOOLS_COMPONENT_PREFIXES = [
  "JsModal",
  "HighlightUpdates",
  "RenderList",
  "RenderDetail",
  "DebugBorders",
  "Storage",
  "Network",
  "RouteEvents",
  "EnvSwitcher",
  "Floating",
  "Minimized",
  "Expandable",
  "DevTools",
  "GameUI",
];

/**
 * Set of nativeIDs that identify dev tools root containers
 */
const DEV_TOOLS_NATIVE_IDS = new Set([
  "debug-borders-overlay",
  "floating-devtools-root",
  "dial-devtools-root",
  "jsmodal-root",
  "highlight-updates-overlay",
  "__rn_buoy__highlight-modal",
  "logbox_inspector",
  "logbox",
]);

/**
 * Cache for dev tools detection results
 * Maps nativeTag -> isDevTools (boolean)
 * Only caches positive results (true) since fiber parents can change
 */
const devToolsNodeCache = new Map();
const CACHE_MAX_SIZE = 500;

/**
 * Gets the nativeTag from a stateNode for caching purposes
 *
 * @param {any} stateNode - The fiber's stateNode
 * @returns {number | null} - The nativeTag or null
 */
function getNativeTag(stateNode) {
  if (!stateNode) return null;
  // Direct nativeTag
  if (typeof stateNode._nativeTag === "number") return stateNode._nativeTag;
  // Fabric: canonical.nativeTag
  if (typeof stateNode.canonical?._nativeTag === "number") {
    return stateNode.canonical._nativeTag;
  }
  // Alternative: __nativeTag
  if (typeof stateNode.__nativeTag === "number") return stateNode.__nativeTag;
  return null;
}

/**
 * Checks if a nativeID belongs to dev tools
 * Uses Set lookup + prefix pattern matching
 *
 * @param {string | null | undefined} nativeID
 * @returns {boolean}
 */
function isDevToolsNativeID(nativeID) {
  if (!nativeID) return false;

  // Direct Set lookup (O(1))
  if (DEV_TOOLS_NATIVE_IDS.has(nativeID)) return true;

  // Check prefixes for dynamic nativeIDs
  const firstChar = nativeID.charCodeAt(0);

  // Underscore prefixes: __highlight_*, __rn_buoy__*
  if (firstChar === 95) {
    // '_' = 95
    if (
      nativeID.startsWith("__highlight_") ||
      nativeID.startsWith("__rn_buoy__")
    ) {
      return true;
    }
  }

  // LogBox nativeIDs: logbox*
  if (firstChar === 108 && nativeID.startsWith("logbox")) {
    // 'l' = 108
    return true;
  }

  return false;
}

/**
 * Gets the component name from a fiber node
 *
 * @param {Fiber} fiber - The fiber node
 * @returns {string | null} - The component name or null
 */
function getComponentName(fiber) {
  if (!fiber) return null;

  // Function/Class components have type.name or type.displayName
  const type = fiber.type;
  if (type) {
    if (typeof type === "function") {
      return type.displayName || type.name || null;
    }
    if (typeof type === "string") {
      return type; // Host component name like "View", "Text"
    }
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;
  }

  // Try elementType as fallback
  const elementType = fiber.elementType;
  if (elementType) {
    if (typeof elementType === "function") {
      return elementType.displayName || elementType.name || null;
    }
    if (elementType.displayName) return elementType.displayName;
    if (elementType.name) return elementType.name;
  }

  return null;
}

/**
 * Checks if a fiber is part of the dev tools component tree
 * Walks up the fiber tree checking component names and nativeIDs
 *
 * @param {Fiber} fiber - The fiber node to check
 * @param {any} stateNode - The fiber's stateNode (for caching by nativeTag)
 * @returns {boolean} - True if this fiber is part of dev tools
 */
function isDevToolsComponent(fiber, stateNode) {
  // Get nativeTag for caching
  const nativeTag = getNativeTag(stateNode);

  // Check cache first (O(1))
  if (nativeTag != null) {
    const cached = devToolsNodeCache.get(nativeTag);
    if (cached !== undefined) {
      return cached;
    }
  }

  let result = false;

  // Fast path: check direct nativeID on this fiber
  const directNativeID =
    fiber.pendingProps?.nativeID || fiber.memoizedProps?.nativeID;

  if (isDevToolsNativeID(directNativeID)) {
    result = true;
  } else {
    // Walk up fiber tree checking component names and nativeIDs
    let currentFiber = fiber;
    let depth = 0;

    while (currentFiber && depth < 30) {
      // Check component name FIRST (faster, appears earlier in tree)
      const name = getComponentName(currentFiber);
      if (name) {
        // Direct Set lookup (O(1))
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

      // Check nativeID (only if component name didn't match)
      const nativeID =
        currentFiber.pendingProps?.nativeID ||
        currentFiber.memoizedProps?.nativeID;
      if (isDevToolsNativeID(nativeID)) {
        result = true;
        break;
      }

      currentFiber = currentFiber.return;
      depth++;
    }
  }

  // Only cache positive results (isDevTools === true)
  // Don't cache false results because fiber parent relationships can change
  if (result && nativeTag != null) {
    // Clear half the cache if it's full
    if (devToolsNodeCache.size >= CACHE_MAX_SIZE) {
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
 * Clears the dev tools detection cache
 * Call this when the component tree changes significantly
 */
function clearDevToolsCache() {
  devToolsNodeCache.clear();
}

/**
 * Checks if an OffscreenComponent fiber is hidden
 * When memoizedState is not null, the Offscreen content is hidden
 * This is used by React for Suspense, Activity, and navigation transitions
 *
 * @param {Fiber} fiber - The fiber node to check
 * @returns {boolean} - True if the fiber is a hidden OffscreenComponent
 */
function isHiddenOffscreen(fiber) {
  if (fiber.tag !== FiberTags.OffscreenComponent) {
    return false;
  }
  // Per React source: memoizedState !== null means the Offscreen is hidden
  // See: https://jser.dev/react/2022/04/17/offscreen-component
  return fiber.memoizedState !== null;
}

/**
 * Checks if a fiber represents an inactive react-native-screens Screen
 * react-native-screens uses activityState prop: 0 = detached, 1 = transitioning, 2 = active
 *
 * @param {Fiber} fiber - The fiber node to check
 * @returns {boolean} - True if the fiber is an inactive screen
 */
function isInactiveScreen(fiber) {
  const props = fiber.memoizedProps;
  if (!props) {
    return false;
  }
  // activityState === 0 means the screen is detached from the view hierarchy
  // activityState === 1 means transitioning (still visible but not interactive)
  // activityState === 2 means fully active
  // We only skip activityState === 0 (fully detached/inactive)
  return props.activityState === 0;
}

/**
 * Gets the native view class name from a host component's stateNode
 * This is used to identify the type of native component (RCTView, RCTText, RNSVGPath, etc.)
 *
 * @param {any} stateNode - The fiber's stateNode (public instance)
 * @returns {string | null} - The native view class name or null
 */
function getNativeViewClassName(stateNode) {
  if (!stateNode) {
    return null;
  }

  // Fabric: stateNode.canonical.viewConfig.uiViewClassName
  if (stateNode.canonical?.viewConfig?.uiViewClassName) {
    return stateNode.canonical.viewConfig.uiViewClassName;
  }

  // Paper: stateNode.viewConfig.uiViewClassName
  if (stateNode.viewConfig?.uiViewClassName) {
    return stateNode.viewConfig.uiViewClassName;
  }

  return null;
}

/**
 * Checks if a host component is an SVG element (from react-native-svg)
 * SVG components have native names starting with "RNSVG" (e.g., RNSVGPath, RNSVGGroup, RNSVGSvgView)
 *
 * @param {any} stateNode - The fiber's stateNode (public instance)
 * @returns {boolean} - True if this is an SVG component
 */
function isSVGComponent(stateNode) {
  const viewClassName = getNativeViewClassName(stateNode);
  if (!viewClassName) {
    return false;
  }
  // All react-native-svg components start with "RNSVG"
  return viewClassName.startsWith("RNSVG");
}

/**
 * Recursively traverses the fiber tree and calls the callback for each node
 * Automatically skips hidden OffscreenComponent subtrees (used by navigation stacks)
 *
 * @param {Fiber} fiber - The fiber node to start traversing from
 * @param {Function} callback - Called for each fiber node (fiber, depth)
 * @param {number} depth - Current depth in the tree (for color generation)
 * @param {Set} visited - Set of visited fibers to prevent infinite loops
 */
function traverseFiberTree(fiber, callback, depth = 0, visited = new Set()) {
  if (!fiber) {
    return;
  }

  // Prevent infinite loops from circular references
  if (visited.has(fiber)) {
    return;
  }
  visited.add(fiber);

  // Protect against excessive depth (probably indicates a problem)
  if (depth > 500) {
    return;
  }

  // Skip hidden OffscreenComponent subtrees entirely
  // This handles React Navigation stack screens that are not visible
  if (isHiddenOffscreen(fiber)) {
    // Don't traverse children of hidden Offscreen - skip entire subtree
    // Still traverse siblings at the same level
    if (fiber.sibling) {
      traverseFiberTree(fiber.sibling, callback, depth, visited);
    }
    return;
  }

  // Skip inactive react-native-screens Screen components
  // activityState === 0 means the screen is detached
  if (isInactiveScreen(fiber)) {
    // Skip this subtree but continue with siblings
    if (fiber.sibling) {
      traverseFiberTree(fiber.sibling, callback, depth, visited);
    }
    return;
  }

  // Call callback for this fiber
  callback(fiber, depth);

  // Traverse child
  if (fiber.child) {
    traverseFiberTree(fiber.child, callback, depth + 1, visited);
  }

  // Traverse sibling
  if (fiber.sibling) {
    traverseFiberTree(fiber.sibling, callback, depth, visited);
  }
}

/**
 * Gets all host component instances from the fiber tree
 * Host components are native views like View, Text, Image, etc.
 *
 * @returns {Array<{instance: any, fiber: Fiber, depth: number}>}
 */
function getAllHostComponentInstances() {
  const roots = getFiberRoots();

  if (roots.length === 0) {
    return [];
  }

  const instances = [];

  roots.forEach((root, rootIndex) => {
    // Start from root.current (the current fiber tree)
    traverseFiberTree(root.current, (fiber, depth) => {
      // We only care about Host Components (native views)
      if (fiber.tag === FiberTags.HostComponent) {
        const publicInstance = fiber.stateNode;

        // Skip if this is part of dev tools (modals, overlays, floating tools, etc.)
        // Uses cached lookups and walks up fiber tree checking component names and nativeIDs
        if (isDevToolsComponent(fiber, publicInstance)) {
          return;
        }

        // Skip SVG components (react-native-svg)
        // SVG elements have many internal paths/groups that clutter the debug view
        if (isSVGComponent(publicInstance)) {
          return;
        }

        // Fabric: stateNode.node exists
        // Paper: stateNode has measure() method
        if (publicInstance) {
          instances.push({
            instance: publicInstance,
            fiber: fiber,
            depth: depth,
          });
        }
      }
    });
  });

  return instances;
}

/**
 * Checks if the React DevTools hook is available and functional
 *
 * @returns {boolean}
 */
function isReactDevToolsAvailable() {
  const hook = getReactDevToolsHook();

  if (!hook) {
    return false;
  }

  if (!hook.getFiberRoots) {
    return false;
  }

  return true;
}

/**
 * Gets diagnostic information about the React DevTools hook
 * Useful for debugging and understanding what's available
 */
function getReactDevToolsDiagnostics() {
  const hook = getReactDevToolsHook();

  if (!hook) {
    return {
      available: false,
      reason: "Hook not found on global object",
    };
  }

  const diagnostics = {
    available: true,
    hasAgent: !!hook.reactDevtoolsAgent,
    hasFiberRoots: typeof hook.getFiberRoots === "function",
    rendererCount: 0,
    rootCount: 0,
    hookKeys: Object.keys(hook),
  };

  // Try to get renderer and root counts
  if (hook.getFiberRoots) {
    try {
      // React Native typically uses renderer ID 1
      const roots = hook.getFiberRoots(1);
      if (roots) {
        diagnostics.rootCount = roots.size;
      }
    } catch (e) {
      diagnostics.error = e.message;
    }
  }

  return diagnostics;
}

module.exports = {
  getReactDevToolsHook,
  getFiberRoots,
  traverseFiberTree,
  getAllHostComponentInstances,
  isReactDevToolsAvailable,
  getReactDevToolsDiagnostics,
  isHiddenOffscreen,
  isInactiveScreen,
  isSVGComponent,
  getNativeViewClassName,
  isDevToolsComponent,
  isDevToolsNativeID,
  getComponentName,
  clearDevToolsCache,
  FiberTags,
  DEV_TOOLS_COMPONENT_NAMES,
  DEV_TOOLS_NATIVE_IDS,
};
