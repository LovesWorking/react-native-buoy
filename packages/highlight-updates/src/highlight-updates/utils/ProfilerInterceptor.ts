/**
 * ProfilerInterceptor
 *
 * Swizzles React DevTools internals to capture and log exactly what the
 * profiler detects when "Highlight updates when components render" is enabled.
 *
 * This allows us to compare profiler detection with our own implementation
 * to ensure 100% accuracy.
 *
 * Usage:
 *   import { installProfilerInterceptor } from './ProfilerInterceptor';
 *   installProfilerInterceptor();
 */

"use strict";

declare const window: {
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsGlobalHook;
};

declare const __DEV__: boolean;

interface RendererInterface {
  setTraceUpdatesEnabled?: (enabled: boolean) => void;
  [key: string]: unknown;
}

interface ReactDevToolsAgent {
  emit?: (event: string, ...args: unknown[]) => void;
  addListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  [key: string]: unknown;
}

interface ReactDevToolsGlobalHook {
  emit?: (event: string, ...args: unknown[]) => void;
  sub?: (event: string, callback: (...args: unknown[]) => void) => () => void;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  off?: (event: string, callback: (...args: unknown[]) => void) => void;
  rendererInterfaces?: Map<number, RendererInterface>;
  reactDevtoolsAgent?: ReactDevToolsAgent;
  [key: string]: unknown;
}

interface TraceUpdateNode {
  node: unknown;
  color: string;
}

// Store original functions for cleanup
let originalHookEmit: ((event: string, ...args: unknown[]) => void) | null = null;
let originalAgentEmit: ((event: string, ...args: unknown[]) => void) | null = null;
let isInstalled = false;

// Controls whether logging is active (toggled by enable/disable)
let loggingEnabled = false;

// Callback for our comparison function
let comparisonCallback: ((nodes: Set<unknown>) => void) | null = null;

/**
 * Get a readable description of a stateNode for logging
 */
function describeNode(node: unknown): object {
  if (!node) return { type: "null" };

  const n = node as Record<string, unknown>;

  // Try to identify the node type and extract useful info
  const info: Record<string, unknown> = {};

  // Check for Fabric canonical structure
  if (n.canonical) {
    info.type = "Fabric";
    const canonical = n.canonical as Record<string, unknown>;
    if (canonical.publicInstance) {
      const pub = canonical.publicInstance as Record<string, unknown>;
      info.hasMeasure = typeof pub.measure === "function";
      info.nativeTag = pub.__nativeTag ?? pub._nativeTag ?? "unknown";
    }
  }
  // Check for legacy structure with direct measure
  else if (typeof n.measure === "function") {
    info.type = "Legacy";
    info.hasMeasure = true;
    info.nativeTag = n.__nativeTag ?? n._nativeTag ?? n.nativeTag ?? "unknown";
  }
  // Unknown structure
  else {
    info.type = "Unknown";
    info.keys = Object.keys(n).slice(0, 10); // First 10 keys for debugging
  }

  return info;
}

/**
 * Swizzle hook.emit to intercept all events including 'traceUpdates'
 *
 * This captures the raw data from the renderer before any processing.
 * The 'traceUpdates' event contains a Set of stateNodes.
 *
 * Reference: backend.js line 13566
 *   hook.emit('traceUpdates', traceUpdatesForNodes)
 */
function swizzleHookEmit(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook || typeof hook.emit !== "function") {
    // Silent - hook not available is expected in some environments
    return;
  }

  if (originalHookEmit) {
    // Already swizzled - no need to log
    return;
  }

  originalHookEmit = hook.emit.bind(hook);

  hook.emit = function (event: string, ...args: unknown[]) {
    // Intercept traceUpdates events - only log when logging is enabled
    if (event === "traceUpdates" && loggingEnabled) {
      const nodes = args[0] as Set<unknown>;

      // Only log if there are actual nodes (skip 0 node events)
      if (nodes.size > 0) {
        console.log(
          `[PROFILER] traceUpdates: ${nodes.size} nodes`,
          Array.from(nodes).map((node, index) => ({
            index,
            ...describeNode(node),
          }))
        );
      }

      // Call comparison callback if set (even for 0 nodes)
      if (comparisonCallback) {
        comparisonCallback(nodes);
      }
    }

    // Call original emit
    return originalHookEmit!(event, ...args);
  };

  // Swizzled successfully - no need to log in normal operation
}

/**
 * Swizzle agent.emit to intercept 'drawTraceUpdates' events
 *
 * This captures data after the TraceUpdates module has processed it,
 * including color assignments based on render count.
 *
 * Reference: backend.js line 6380
 *   agent.emit('drawTraceUpdates', nodesToDraw)
 */
function swizzleAgentEmit(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  const agent = hook?.reactDevtoolsAgent;

  if (!agent || typeof agent.emit !== "function") {
    // Silent - agent not available is expected when DevTools not connected
    return;
  }

  if (originalAgentEmit) {
    // Already swizzled - no need to log
    return;
  }

  originalAgentEmit = agent.emit.bind(agent);

  agent.emit = function (event: string, ...args: unknown[]) {
    // Only log when logging is enabled and there are actual nodes
    if (loggingEnabled && event === "drawTraceUpdates") {
      const nodesToDraw = args[0] as TraceUpdateNode[];
      if (nodesToDraw.length > 0) {
        console.log(
          `[PROFILER] drawTraceUpdates: ${nodesToDraw.length} nodes`,
          nodesToDraw.map((item, index) => ({
            index,
            color: item.color,
            ...describeNode(item.node),
          }))
        );
      }
    }

    // Call original emit
    return originalAgentEmit!(event, ...args);
  };

  // Swizzled successfully - no need to log in normal operation
}

/**
 * Log information about available renderer interfaces.
 * Only call this manually for debugging - not called during normal operation.
 * @internal
 */
export function logRendererInterfaces(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook?.rendererInterfaces) {
    console.log("[ProfilerInterceptor] No rendererInterfaces available");
    return;
  }

  const info: Array<{
    id: number;
    hasSetTraceUpdatesEnabled: boolean;
    methods: string[];
  }> = [];

  hook.rendererInterfaces.forEach((iface, id) => {
    const methods = Object.keys(iface).filter(
      (key) => typeof (iface as Record<string, unknown>)[key] === "function"
    );
    info.push({
      id,
      hasSetTraceUpdatesEnabled: typeof iface.setTraceUpdatesEnabled === "function",
      methods: methods.slice(0, 20), // First 20 methods
    });
  });

  console.log(
    `[ProfilerInterceptor] Found ${hook.rendererInterfaces.size} renderer interface(s)`,
    info
  );
}

/**
 * Log hook structure for debugging.
 * Only call this manually for debugging - not called during normal operation.
 * @internal
 */
export function logHookStructure(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook) {
    console.log("[ProfilerInterceptor] No hook available");
    return;
  }

  const structure: Record<string, string> = {};
  for (const key in hook) {
    const value = hook[key];
    if (typeof value === "function") {
      structure[key] = "function";
    } else if (value instanceof Map) {
      structure[key] = `Map(${value.size})`;
    } else if (value instanceof Set) {
      structure[key] = `Set(${value.size})`;
    } else if (typeof value === "object" && value !== null) {
      structure[key] = "object";
    } else {
      structure[key] = typeof value;
    }
  }

  console.log("[ProfilerInterceptor] Hook structure:", structure);
}

/**
 * Enable trace updates on all renderer interfaces
 *
 * This is what DevTools does when you check "Highlight updates when components render"
 *
 * Reference: backend.js line 15487-15489
 *   function setTraceUpdatesEnabled(isEnabled) {
 *     traceUpdatesEnabled = isEnabled;
 *   }
 */
function enableTracingOnAllRenderers(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook?.rendererInterfaces) {
    // Silent - no rendererInterfaces available
    return;
  }

  hook.rendererInterfaces.forEach((iface) => {
    if (typeof iface.setTraceUpdatesEnabled === "function") {
      try {
        iface.setTraceUpdatesEnabled(true);
      } catch {
        // Silent - error enabling tracing on this renderer
      }
    }
  });
}

/**
 * Disable trace updates on all renderer interfaces
 */
function disableTracingOnAllRenderers(): void {
  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (!hook?.rendererInterfaces) return;

  hook.rendererInterfaces.forEach((iface) => {
    if (typeof iface.setTraceUpdatesEnabled === "function") {
      try {
        iface.setTraceUpdatesEnabled(false);
      } catch {
        // Silent - error disabling tracing on this renderer
      }
    }
  });
}

/**
 * Set a callback to receive profiler nodes for comparison
 */
export function setComparisonCallback(callback: ((nodes: Set<unknown>) => void) | null): void {
  comparisonCallback = callback;
}

/**
 * Install all profiler interception hooks
 *
 * Call this early in your app initialization to capture all events.
 * Installation is silent - no console logs in normal operation.
 */
export function installProfilerInterceptor(): void {
  if (typeof __DEV__ !== "undefined" && !__DEV__) {
    // Silent in production - nothing to install
    return;
  }

  if (isInstalled) {
    // Already installed - no action needed
    return;
  }

  // Swizzle emit functions to intercept events (silent operation)
  swizzleHookEmit();
  swizzleAgentEmit();

  // NOTE: We don't enable tracing here - it will be enabled when
  // enableProfilerLogging() is called (when user toggles on)

  // Note: We don't need hook.sub since we already intercept via swizzled hook.emit

  isInstalled = true;
}

/**
 * Uninstall profiler interception hooks and restore original functions
 */
export function uninstallProfilerInterceptor(): void {
  if (!isInstalled) return;

  const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  // Restore hook.emit
  if (originalHookEmit && hook) {
    hook.emit = originalHookEmit;
    originalHookEmit = null;
  }

  // Restore agent.emit
  if (originalAgentEmit && hook?.reactDevtoolsAgent) {
    hook.reactDevtoolsAgent.emit = originalAgentEmit;
    originalAgentEmit = null;
  }

  // Disable tracing
  disableTracingOnAllRenderers();

  comparisonCallback = null;
  isInstalled = false;
  // Silent uninstall - no logging in normal operation
}

/**
 * Check if interceptor is currently installed
 */
export function isInterceptorInstalled(): boolean {
  return isInstalled;
}

/**
 * Enable profiler logging - starts logging all profiler events
 *
 * NOTE: This only enables LOGGING of events. It does NOT enable tracing.
 * The profiler must be enabled separately (e.g., via Chrome DevTools checkbox)
 * for events to be emitted. This allows us to compare what the real profiler
 * detects without our code interfering.
 */
export function enableProfilerLogging(): void {
  loggingEnabled = true;
  // Don't enable tracing here - let Chrome DevTools control that
  // enableTracingOnAllRenderers();
  // Silent enable - no logging needed
}

/**
 * Disable profiler logging - stops logging profiler events
 * NOTE: Does NOT disable tracing - the profiler continues to work,
 * we just stop logging its events
 */
export function disableProfilerLogging(): void {
  loggingEnabled = false;
  // Don't disable tracing - let the profiler continue to work
  // disableTracingOnAllRenderers();
  // Silent disable - no logging needed
}

/**
 * Check if logging is currently enabled
 */
export function isLoggingEnabled(): boolean {
  return loggingEnabled;
}

export default {
  install: installProfilerInterceptor,
  uninstall: uninstallProfilerInterceptor,
  isInstalled: isInterceptorInstalled,
  setComparisonCallback,
  enableTracing: enableTracingOnAllRenderers,
  disableTracing: disableTracingOnAllRenderers,
  enableLogging: enableProfilerLogging,
  disableLogging: disableProfilerLogging,
  isLoggingEnabled,
};
