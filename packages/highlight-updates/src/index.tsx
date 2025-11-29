/**
 * @react-buoy/highlight-updates
 *
 * Standalone implementation of React DevTools' "Highlight updates when components
 * render" feature. Works without requiring DevTools to be connected.
 *
 * @example
 * ```tsx
 * // Just use with FloatingDevTools - overlay is auto-rendered!
 * import { highlightUpdatesPreset } from '@react-buoy/highlight-updates';
 *
 * <FloatingDevTools apps={[highlightUpdatesPreset]} />
 *
 * // Or use the standalone controller programmatically
 * import { HighlightUpdatesController } from '@react-buoy/highlight-updates';
 *
 * HighlightUpdatesController.toggle();
 * HighlightUpdatesController.enable();
 * HighlightUpdatesController.disable();
 * ```
 */

// Preset exports for FloatingDevTools integration
export {
  highlightUpdatesPreset,
  createHighlightUpdatesTool,
} from "./preset";

// Controller export for standalone usage
export { default as HighlightUpdatesController } from "./highlight-updates/utils/HighlightUpdatesController";

// Overlay component - auto-rendered by FloatingDevTools, but exported for manual usage
export { HighlightUpdatesOverlay } from "./highlight-updates/HighlightUpdatesOverlay";

// Profiler interceptor for debugging - captures what DevTools detects
export {
  installProfilerInterceptor,
  uninstallProfilerInterceptor,
  setComparisonCallback,
  isInterceptorInstalled,
  enableProfilerLogging,
  disableProfilerLogging,
  isLoggingEnabled,
} from "./highlight-updates/utils/ProfilerInterceptor";
