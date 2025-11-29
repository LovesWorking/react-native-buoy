/**
 * @react-buoy/highlight-updates
 *
 * Standalone implementation of React DevTools' "Highlight updates when components
 * render" feature. Works without requiring DevTools to be connected.
 *
 * @example
 * ```tsx
 * // Toggle-only preset - tap to enable/disable highlights
 * import { highlightUpdatesPreset } from '@react-buoy/highlight-updates';
 *
 * <FloatingDevTools apps={[highlightUpdatesPreset]} />
 *
 * // Modal preset - full interface with filters and render list
 * import { highlightUpdatesModalPreset } from '@react-buoy/highlight-updates';
 *
 * <FloatingDevTools apps={[highlightUpdatesModalPreset]} />
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
  highlightUpdatesModalPreset,
  createHighlightUpdatesModalTool,
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

// RenderTracker singleton for tracking render history
export { RenderTracker } from "./highlight-updates/utils/RenderTracker";
export type { TrackedRender, FilterConfig } from "./highlight-updates/utils/RenderTracker";

// Modal components for custom integrations
export { HighlightUpdatesModal } from "./highlight-updates/components/HighlightUpdatesModal";
export { RenderListItem } from "./highlight-updates/components/RenderListItem";
export { RenderDetailView } from "./highlight-updates/components/RenderDetailView";
export { HighlightFilterView } from "./highlight-updates/components/HighlightFilterView";
