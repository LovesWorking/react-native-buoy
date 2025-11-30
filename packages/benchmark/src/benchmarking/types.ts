/**
 * Benchmarking Types
 *
 * Core type definitions for the performance benchmarking system.
 *
 * @packageDocumentation
 */

"use strict";

/**
 * High-resolution timestamp in milliseconds
 */
export type DOMHighResTimeStamp = number;

/**
 * Memory information from the JavaScript heap (Hermes engine)
 */
export interface MemorySnapshot {
  /** Maximum heap size available (bytes) */
  jsHeapSizeLimit: number | null;
  /** Total allocated heap (bytes) */
  totalJSHeapSize: number | null;
  /** Currently used heap (bytes) */
  usedJSHeapSize: number | null;
  /** Timestamp when snapshot was taken */
  timestamp: DOMHighResTimeStamp;
}

/**
 * A single performance mark created during benchmarking
 */
export interface BenchmarkMark {
  /** Name of the mark */
  name: string;
  /** When the mark was created (relative to session start) */
  startTime: DOMHighResTimeStamp;
  /** Optional custom data attached to the mark */
  detail?: Record<string, unknown>;
}

/**
 * A performance measure (duration between two points)
 */
export interface BenchmarkMeasure {
  /** Name of the measure */
  name: string;
  /** When the measure started */
  startTime: DOMHighResTimeStamp;
  /** Duration of the measure in ms */
  duration: DOMHighResTimeStamp;
  /** Optional custom data attached to the measure */
  detail?: Record<string, unknown>;
}

/**
 * Metrics for a single batch of highlight updates
 */
export interface BatchMetrics {
  /** Unique batch identifier */
  batchId: string;
  /** When this batch was processed */
  timestamp: DOMHighResTimeStamp;

  // Input metrics
  /** Total nodes received in the traceUpdates event */
  nodesReceived: number;
  /** Nodes filtered out (overlay nodes) */
  nodesFiltered: number;
  /** Nodes remaining after filtering */
  nodesToProcess: number;
  /** Configured batch size limit */
  batchSize: number;
  /** Actual nodes processed (min of nodesToProcess, batchSize) */
  nodesInBatch: number;

  // Timing metrics (ms)
  /** Time spent filtering nodes */
  filteringTime: DOMHighResTimeStamp;
  /** Time spent measuring node positions (native bridge) */
  measurementTime: DOMHighResTimeStamp;
  /** Time spent updating RenderTracker */
  trackingTime: DOMHighResTimeStamp;
  /** Time spent calling highlight callback */
  callbackTime: DOMHighResTimeStamp;
  /** Total pipeline time for this batch */
  totalTime: DOMHighResTimeStamp;

  // Measurement stats
  /** Number of successful measurements */
  measurementSuccessCount: number;
  /** Number of failed measurements */
  measurementFailCount: number;
}

/**
 * Metrics for overlay render performance
 */
export interface OverlayRenderMetrics {
  /** Number of highlights rendered */
  highlightCount: number;
  /** Time to render the overlay (ms) */
  renderTime: DOMHighResTimeStamp;
  /** Timestamp of render */
  timestamp: DOMHighResTimeStamp;
}

/**
 * Device and configuration context for the benchmark
 */
export interface BenchmarkContext {
  /** Platform (ios/android) */
  platform: "ios" | "android" | "web" | "unknown";
  /** OS version string */
  osVersion?: string;
  /** App version string */
  appVersion?: string;
  /** Device model (if available) */
  deviceModel?: string;
  /** Whether running in development mode */
  isDev: boolean;
  /** Configured batch size */
  batchSize: number;
  /** Whether render count tracking is enabled */
  showRenderCount: boolean;
}

/**
 * Aggregated statistics computed from batch metrics
 */
export interface AggregatedStats {
  // Counts
  /** Total number of batches processed */
  batchCount: number;
  /** Total nodes received across all batches */
  totalNodesReceived: number;
  /** Total nodes filtered across all batches */
  totalNodesFiltered: number;
  /** Total nodes processed across all batches */
  totalNodesProcessed: number;

  // Timing averages (ms)
  /** Average filtering time per batch */
  avgFilterTime: DOMHighResTimeStamp;
  /** Average measurement time per batch */
  avgMeasureTime: DOMHighResTimeStamp;
  /** Average tracking time per batch */
  avgTrackTime: DOMHighResTimeStamp;
  /** Average callback time per batch */
  avgCallbackTime: DOMHighResTimeStamp;
  /** Average total pipeline time per batch */
  avgTotalTime: DOMHighResTimeStamp;

  // Timing extremes
  /** Minimum total time across batches */
  minTotalTime: DOMHighResTimeStamp;
  /** Maximum total time across batches */
  maxTotalTime: DOMHighResTimeStamp;

  // Percentiles (useful for understanding distribution)
  /** 50th percentile (median) total time */
  p50TotalTime: DOMHighResTimeStamp;
  /** 95th percentile total time */
  p95TotalTime: DOMHighResTimeStamp;
  /** 99th percentile total time */
  p99TotalTime: DOMHighResTimeStamp;

  // Overlay render stats
  /** Average overlay render time */
  avgOverlayRenderTime: DOMHighResTimeStamp;
  /** Average highlights per render */
  avgHighlightsPerRender: number;
}

/**
 * A complete benchmark report that can be saved and compared
 */
export interface BenchmarkReport {
  /** Schema version for forward compatibility */
  version: "1.0";

  /** Unique identifier for this benchmark */
  id: string;

  /** Human-readable name for this benchmark */
  name: string;

  /** Optional description of what this benchmark measures */
  description?: string;

  /** When the benchmark was created (Unix timestamp) */
  createdAt: number;

  /** Total duration of the benchmark session (ms) */
  duration: DOMHighResTimeStamp;

  // Context
  /** Device and configuration context */
  context: BenchmarkContext;

  // Raw data
  /** All batch metrics recorded during the session */
  batches: BatchMetrics[];

  /** All overlay render metrics recorded during the session */
  overlayRenders: OverlayRenderMetrics[];

  /** Custom marks created during the session */
  marks: BenchmarkMark[];

  /** Custom measures created during the session */
  measures: BenchmarkMeasure[];

  // Aggregated stats
  /** Computed statistics from the raw data */
  stats: AggregatedStats;

  // Memory
  /** Memory snapshot at session start */
  memoryStart: MemorySnapshot | null;

  /** Memory snapshot at session end */
  memoryEnd: MemorySnapshot | null;

  /** Memory delta (end - start) in bytes */
  memoryDelta: number | null;
}

/**
 * Result of comparing two benchmark reports
 */
export interface BenchmarkComparison {
  /** The baseline (before) benchmark */
  baselineId: string;
  baselineName: string;

  /** The comparison (after) benchmark */
  comparisonId: string;
  comparisonName: string;

  /** When this comparison was made */
  comparedAt: number;

  // Duration changes
  /** Change in total duration (negative = faster) */
  durationDelta: DOMHighResTimeStamp;
  /** Percentage improvement in duration (positive = better) */
  durationImprovement: number;

  // Pipeline timing changes
  /** Improvement in average filter time (%) */
  filterTimeImprovement: number;
  /** Improvement in average measurement time (%) */
  measureTimeImprovement: number;
  /** Improvement in average tracking time (%) */
  trackTimeImprovement: number;
  /** Improvement in average total pipeline time (%) */
  pipelineTimeImprovement: number;

  // Overlay changes
  /** Improvement in average overlay render time (%) */
  overlayRenderImprovement: number;

  // Memory changes
  /** Change in memory delta (negative = less memory used) */
  memoryDeltaChange: number | null;

  // Summary
  /** Overall improvement percentage (weighted average) */
  overallImprovement: number;
  /** Whether the comparison benchmark is faster */
  isImproved: boolean;
  /** Human-readable summary of the comparison */
  summary: string;
}

/**
 * Options for creating a new benchmark session
 */
export interface BenchmarkSessionOptions {
  /** Name for this benchmark session */
  name: string;
  /** Optional description */
  description?: string;
  /** Whether to capture memory snapshots */
  captureMemory?: boolean;
  /** Whether to log to console during recording */
  verbose?: boolean;
}

/**
 * State of a benchmark session
 */
export type BenchmarkSessionState = "idle" | "recording" | "stopped";

/**
 * Listener callback for benchmark events
 */
export type BenchmarkEventListener = (
  event: "start" | "stop" | "batch" | "overlay",
  data?: BatchMetrics | OverlayRenderMetrics
) => void;
