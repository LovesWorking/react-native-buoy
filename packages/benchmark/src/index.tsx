/**
 * @react-buoy/benchmark
 *
 * Performance benchmarking system for measuring and comparing
 * highlight updates performance. Uses the W3C Performance API
 * for accurate timing measurements.
 *
 * @example
 * ```tsx
 * // Use the preset in FloatingDevTools
 * import { benchmarkPreset } from '@react-buoy/benchmark';
 *
 * <FloatingDevTools apps={[benchmarkPreset]} />
 *
 * // Or use the recorder programmatically
 * import { benchmarkRecorder, BenchmarkStorage } from '@react-buoy/benchmark';
 *
 * benchmarkRecorder.startSession({ name: 'MyBenchmark' });
 * // ... perform operations ...
 * const report = benchmarkRecorder.stopSession();
 * ```
 */

// Preset exports for FloatingDevTools integration
export { benchmarkPreset, createBenchmarkTool } from "./preset";

// Core benchmarking module
export {
  // Classes
  BenchmarkRecorder,
  benchmarkRecorder,
  BenchmarkStorage,
  BenchmarkComparator,
  // Storage adapters
  createAsyncStorageAdapter,
  createMemoryStorageAdapter,
} from "./benchmarking";

// Types
export type {
  BenchmarkReport,
  BenchmarkComparison,
  BenchmarkSessionOptions,
  BenchmarkMetadata,
  AggregatedStats,
  OverlayRenderMetrics,
  BatchMetrics,
  DOMHighResTimeStamp,
  MemorySnapshot,
  BenchmarkMark,
  BenchmarkMeasure,
  BenchmarkContext,
  BenchmarkSessionState,
  BenchmarkEventListener,
} from "./benchmarking";

export type { StorageAdapter } from "./benchmarking";

// UI Components for custom integrations
export { BenchmarkModal } from "./components/BenchmarkModal";
