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
export type { TrackedRender, FilterConfig, RenderTrackerSettings } from "./highlight-updates/utils/RenderTracker";

// PerformanceLogger for performance measurement and debugging
export { PerformanceLogger } from "./highlight-updates/utils/PerformanceLogger";
export type { BatchMetrics, BatchTimer } from "./highlight-updates/utils/PerformanceLogger";

// ViewTypeMapper for translating native view names to component names
export {
  VIEW_TYPE_MAP,
  getComponentDisplayName,
  getNativeViewType,
  isKnownViewType,
  getAllNativeViewTypes,
  getAllComponentNames,
} from "./highlight-updates/utils/ViewTypeMapper";

// Modal components for custom integrations
export { HighlightUpdatesModal } from "./highlight-updates/components/HighlightUpdatesModal";
export { RenderListItem } from "./highlight-updates/components/RenderListItem";
export { RenderDetailView } from "./highlight-updates/components/RenderDetailView";
export { HighlightFilterView } from "./highlight-updates/components/HighlightFilterView";

// Re-export benchmarking module from @react-buoy/benchmark
// This provides backward compatibility for code that imports from highlight-updates
export {
  // Classes
  BenchmarkRecorder,
  benchmarkRecorder,
  BenchmarkStorage,
  BenchmarkComparator,
  // Storage adapters
  createAsyncStorageAdapter,
  createMemoryStorageAdapter,
} from "@react-buoy/benchmark";

// Re-export benchmarking types
export type {
  BenchmarkReport,
  BenchmarkComparison,
  BenchmarkSessionOptions,
  BenchmarkMetadata,
  AggregatedStats,
  OverlayRenderMetrics,
  BatchMetrics as BenchmarkBatchMetrics,
} from "@react-buoy/benchmark";
