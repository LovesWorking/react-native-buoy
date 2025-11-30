/**
 * @react-buoy/benchmark/benchmarking
 *
 * Performance benchmarking system for measuring and comparing
 * highlight updates performance. Uses the W3C Performance API
 * for accurate timing measurements.
 *
 * @example
 * ```typescript
 * import {
 *   benchmarkRecorder,
 *   BenchmarkStorage,
 *   BenchmarkComparator,
 *   createAsyncStorageAdapter,
 * } from '@react-buoy/benchmark';
 *
 * // Start recording
 * benchmarkRecorder.startSession({ name: 'MyBenchmark' });
 *
 * // ... perform operations ...
 *
 * // Stop and get report
 * const report = benchmarkRecorder.stopSession();
 *
 * // Save report
 * const storage = new BenchmarkStorage(createAsyncStorageAdapter()!);
 * await storage.saveReport(report);
 *
 * // Compare with previous
 * const previous = await storage.getMostRecent();
 * if (previous) {
 *   BenchmarkComparator.quickCompare(previous, report);
 * }
 * ```
 *
 * @packageDocumentation
 */

"use strict";

// Types
export type {
  DOMHighResTimeStamp,
  MemorySnapshot,
  BenchmarkMark,
  BenchmarkMeasure,
  BatchMetrics,
  OverlayRenderMetrics,
  BenchmarkContext,
  AggregatedStats,
  BenchmarkReport,
  BenchmarkComparison,
  BenchmarkSessionOptions,
  BenchmarkSessionState,
  BenchmarkEventListener,
} from "./types";

// BenchmarkRecorder
export { BenchmarkRecorder, benchmarkRecorder } from "./BenchmarkRecorder";

// BenchmarkStorage
export {
  BenchmarkStorage,
  createAsyncStorageAdapter,
  createMemoryStorageAdapter,
} from "./BenchmarkStorage";
export type { StorageAdapter, BenchmarkMetadata } from "./BenchmarkStorage";

// BenchmarkComparator
export { BenchmarkComparator } from "./BenchmarkComparator";
