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
 * Recursively traverses the fiber tree and calls the callback for each node
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

        // Skip if this has the debug overlay nativeID
        if (
          fiber.memoizedProps &&
          fiber.memoizedProps.nativeID === "debug-borders-overlay"
        ) {
          return;
        }

        // Skip if this is part of the debug overlay or floating devtools
        // Check if any ancestor has a specific nativeID marker
        let currentFiber = fiber;
        let isExcluded = false;
        let checkDepth = 0;

        while (currentFiber && checkDepth < 30) {
          // Check for nativeID markers that identify entire trees to exclude
          if (
            currentFiber.memoizedProps &&
            currentFiber.memoizedProps.nativeID
          ) {
            const nativeID = currentFiber.memoizedProps.nativeID;
            if (
              nativeID === "debug-borders-overlay" ||
              nativeID === "floating-devtools-root" ||
              nativeID === "dial-devtools-root" ||
              nativeID === "jsmodal-root"
            ) {
              isExcluded = true;
              break;
            }
          }

          currentFiber = currentFiber.return;
          checkDepth++;
        }

        if (isExcluded) {
          return; // Skip this component
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
  FiberTags,
};
