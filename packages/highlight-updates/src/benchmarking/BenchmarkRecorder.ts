/**
 * BenchmarkRecorder
 *
 * Records performance metrics during a benchmark session using the W3C
 * Performance API (performance.mark, performance.measure). Collects batch
 * metrics, overlay render times, memory snapshots, and custom marks/measures.
 *
 * Usage:
 *   const recorder = new BenchmarkRecorder();
 *   recorder.startSession({ name: 'MyBenchmark' });
 *
 *   // Record batch metrics (called by HighlightUpdatesController)
 *   recorder.recordBatch(batchMetrics);
 *
 *   // Record overlay renders (called by HighlightUpdatesOverlay)
 *   recorder.recordOverlayRender(count, timeMs);
 *
 *   // Add custom marks/measures
 *   recorder.mark('customEvent');
 *   recorder.startMeasure('apiCall');
 *   recorder.endMeasure('apiCall');
 *
 *   // Stop and get report
 *   const report = recorder.stopSession();
 *
 * @packageDocumentation
 */

"use strict";

import { Platform } from "react-native";
import type {
  BatchMetrics,
  BenchmarkContext,
  BenchmarkMark,
  BenchmarkMeasure,
  BenchmarkReport,
  BenchmarkSessionOptions,
  BenchmarkSessionState,
  BenchmarkEventListener,
  MemorySnapshot,
  OverlayRenderMetrics,
  AggregatedStats,
  DOMHighResTimeStamp,
} from "./types";

// Declare performance API (available in React Native)
declare const performance: {
  now: () => number;
  mark: (name: string, options?: { detail?: unknown }) => void;
  measure: (
    name: string,
    startOrOptions?: string | { start?: string; end?: string; detail?: unknown },
    end?: string
  ) => { duration: number; startTime: number };
  getEntriesByType: (type: string) => Array<{ name: string; startTime: number; duration: number; detail?: unknown }>;
  getEntriesByName: (name: string) => Array<{ name: string; startTime: number; duration: number; detail?: unknown }>;
  clearMarks: (name?: string) => void;
  clearMeasures: (name?: string) => void;
  memory?: {
    jsHeapSizeLimit: number | null;
    totalJSHeapSize: number | null;
    usedJSHeapSize: number | null;
  };
};

/**
 * Generate a unique session ID
 */
function generateSessionId(name: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${name}_${timestamp}_${random}`;
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, Math.min(index, sortedArr.length - 1))];
}

/**
 * Capture current memory snapshot
 */
function captureMemorySnapshot(): MemorySnapshot | null {
  const memory = performance.memory;
  if (!memory) return null;

  return {
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    totalJSHeapSize: memory.totalJSHeapSize,
    usedJSHeapSize: memory.usedJSHeapSize,
    timestamp: performance.now(),
  };
}

/**
 * Get current benchmark context
 */
function getBenchmarkContext(batchSize: number, showRenderCount: boolean): BenchmarkContext {
  let platform: BenchmarkContext["platform"] = "unknown";
  if (Platform.OS === "ios") platform = "ios";
  else if (Platform.OS === "android") platform = "android";
  else if (Platform.OS === "web") platform = "web";

  return {
    platform,
    osVersion: Platform.Version?.toString(),
    isDev: __DEV__ ?? false,
    batchSize,
    showRenderCount,
  };
}

/**
 * Compute aggregated statistics from batch and overlay metrics
 */
function computeStats(
  batches: BatchMetrics[],
  overlayRenders: OverlayRenderMetrics[]
): AggregatedStats {
  const batchCount = batches.length;

  if (batchCount === 0) {
    return {
      batchCount: 0,
      totalNodesReceived: 0,
      totalNodesFiltered: 0,
      totalNodesProcessed: 0,
      avgFilterTime: 0,
      avgMeasureTime: 0,
      avgTrackTime: 0,
      avgCallbackTime: 0,
      avgTotalTime: 0,
      minTotalTime: 0,
      maxTotalTime: 0,
      p50TotalTime: 0,
      p95TotalTime: 0,
      p99TotalTime: 0,
      avgOverlayRenderTime: 0,
      avgHighlightsPerRender: 0,
    };
  }

  // Sum up totals
  let totalNodesReceived = 0;
  let totalNodesFiltered = 0;
  let totalNodesProcessed = 0;
  let totalFilterTime = 0;
  let totalMeasureTime = 0;
  let totalTrackTime = 0;
  let totalCallbackTime = 0;
  let totalPipelineTime = 0;

  const totalTimes: number[] = [];

  for (const batch of batches) {
    totalNodesReceived += batch.nodesReceived;
    totalNodesFiltered += batch.nodesFiltered;
    totalNodesProcessed += batch.nodesInBatch;
    totalFilterTime += batch.filteringTime;
    totalMeasureTime += batch.measurementTime;
    totalTrackTime += batch.trackingTime;
    totalCallbackTime += batch.callbackTime;
    totalPipelineTime += batch.totalTime;
    totalTimes.push(batch.totalTime);
  }

  // Sort for percentiles
  totalTimes.sort((a, b) => a - b);

  // Overlay stats
  let totalOverlayTime = 0;
  let totalHighlights = 0;
  for (const render of overlayRenders) {
    totalOverlayTime += render.renderTime;
    totalHighlights += render.highlightCount;
  }

  return {
    batchCount,
    totalNodesReceived,
    totalNodesFiltered,
    totalNodesProcessed,
    avgFilterTime: totalFilterTime / batchCount,
    avgMeasureTime: totalMeasureTime / batchCount,
    avgTrackTime: totalTrackTime / batchCount,
    avgCallbackTime: totalCallbackTime / batchCount,
    avgTotalTime: totalPipelineTime / batchCount,
    minTotalTime: totalTimes[0],
    maxTotalTime: totalTimes[totalTimes.length - 1],
    p50TotalTime: percentile(totalTimes, 50),
    p95TotalTime: percentile(totalTimes, 95),
    p99TotalTime: percentile(totalTimes, 99),
    avgOverlayRenderTime: overlayRenders.length > 0 ? totalOverlayTime / overlayRenders.length : 0,
    avgHighlightsPerRender: overlayRenders.length > 0 ? totalHighlights / overlayRenders.length : 0,
  };
}

/**
 * BenchmarkRecorder - Records performance metrics during a benchmark session
 */
export class BenchmarkRecorder {
  private state: BenchmarkSessionState = "idle";
  private sessionId: string = "";
  private sessionName: string = "";
  private sessionDescription?: string;
  private sessionStartTime: DOMHighResTimeStamp = 0;
  private verbose: boolean = false;
  private captureMemory: boolean = true;

  // Collected data
  private batches: BatchMetrics[] = [];
  private overlayRenders: OverlayRenderMetrics[] = [];
  private memoryStart: MemorySnapshot | null = null;
  private memoryEnd: MemorySnapshot | null = null;

  // Context
  private batchSize: number = 150;
  private showRenderCount: boolean = true;

  // Event listeners
  private listeners: Set<BenchmarkEventListener> = new Set();

  // Active measures (for startMeasure/endMeasure)
  private activeMeasures: Map<string, DOMHighResTimeStamp> = new Map();

  /**
   * Get current session state
   */
  getState(): BenchmarkSessionState {
    return this.state;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.state === "recording";
  }

  /**
   * Set the batch size context (for report metadata)
   */
  setBatchSize(size: number): void {
    this.batchSize = size;
  }

  /**
   * Set the showRenderCount context (for report metadata)
   */
  setShowRenderCount(enabled: boolean): void {
    this.showRenderCount = enabled;
  }

  /**
   * Start a new benchmark session
   */
  startSession(options: BenchmarkSessionOptions): void {
    if (this.state === "recording") {
      console.warn("[BenchmarkRecorder] Session already recording. Stop it first.");
      return;
    }

    // Reset state
    this.sessionId = generateSessionId(options.name);
    this.sessionName = options.name;
    this.sessionDescription = options.description;
    this.verbose = options.verbose ?? false;
    this.captureMemory = options.captureMemory ?? true;

    this.batches = [];
    this.overlayRenders = [];
    this.activeMeasures.clear();

    // Clear previous performance entries for this session
    performance.clearMarks();
    performance.clearMeasures();

    // Capture start memory
    if (this.captureMemory) {
      this.memoryStart = captureMemorySnapshot();
    }

    // Record start time and mark
    this.sessionStartTime = performance.now();
    performance.mark(`${this.sessionId}_start`, {
      detail: { name: this.sessionName },
    });

    this.state = "recording";

    if (this.verbose) {
      console.log(`[BenchmarkRecorder] Session started: ${this.sessionName}`);
      console.log(`  ID: ${this.sessionId}`);
      if (this.memoryStart?.usedJSHeapSize) {
        console.log(`  Memory: ${(this.memoryStart.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    this.notifyListeners("start");
  }

  /**
   * Stop the current session and generate a report
   */
  stopSession(): BenchmarkReport | null {
    if (this.state !== "recording") {
      console.warn("[BenchmarkRecorder] No active session to stop.");
      return null;
    }

    // Mark session end
    performance.mark(`${this.sessionId}_end`);
    performance.measure(
      `${this.sessionId}_total`,
      `${this.sessionId}_start`,
      `${this.sessionId}_end`
    );

    // Capture end memory
    if (this.captureMemory) {
      this.memoryEnd = captureMemorySnapshot();
    }

    const endTime = performance.now();
    const duration = endTime - this.sessionStartTime;

    // Calculate memory delta
    let memoryDelta: number | null = null;
    if (this.memoryStart?.usedJSHeapSize != null && this.memoryEnd?.usedJSHeapSize != null) {
      memoryDelta = this.memoryEnd.usedJSHeapSize - this.memoryStart.usedJSHeapSize;
    }

    // Collect marks and measures from Performance API
    const marks = this.collectMarks();
    const measures = this.collectMeasures();

    // Compute aggregated stats
    const stats = computeStats(this.batches, this.overlayRenders);

    // Build report
    const report: BenchmarkReport = {
      version: "1.0",
      id: this.sessionId,
      name: this.sessionName,
      description: this.sessionDescription,
      createdAt: Date.now(),
      duration,
      context: getBenchmarkContext(this.batchSize, this.showRenderCount),
      batches: [...this.batches],
      overlayRenders: [...this.overlayRenders],
      marks,
      measures,
      stats,
      memoryStart: this.memoryStart,
      memoryEnd: this.memoryEnd,
      memoryDelta,
    };

    this.state = "stopped";

    if (this.verbose) {
      this.logReport(report);
    }

    this.notifyListeners("stop");

    return report;
  }

  /**
   * Record a batch of highlight updates
   */
  recordBatch(metrics: BatchMetrics): void {
    if (this.state !== "recording") return;

    this.batches.push(metrics);

    // Create a performance mark for this batch
    performance.mark(`${this.sessionId}_batch_${metrics.batchId}`, {
      detail: {
        nodesReceived: metrics.nodesReceived,
        nodesProcessed: metrics.nodesInBatch,
        totalTime: metrics.totalTime,
      },
    });

    if (this.verbose) {
      console.log(
        `[BenchmarkRecorder] Batch ${metrics.batchId}: ` +
          `${metrics.nodesInBatch} nodes in ${metrics.totalTime.toFixed(1)}ms`
      );
    }

    this.notifyListeners("batch", metrics);
  }

  /**
   * Record an overlay render
   */
  recordOverlayRender(highlightCount: number, renderTime: DOMHighResTimeStamp): void {
    if (this.state !== "recording") return;

    const metrics: OverlayRenderMetrics = {
      highlightCount,
      renderTime,
      timestamp: performance.now(),
    };

    this.overlayRenders.push(metrics);

    performance.mark(`${this.sessionId}_overlay_render`, {
      detail: { highlightCount, renderTime },
    });

    if (this.verbose) {
      console.log(
        `[BenchmarkRecorder] Overlay render: ${highlightCount} highlights in ${renderTime.toFixed(1)}ms`
      );
    }

    this.notifyListeners("overlay", metrics);
  }

  /**
   * Add a custom mark at the current time
   */
  mark(name: string, detail?: Record<string, unknown>): void {
    if (this.state !== "recording") return;

    const markName = `${this.sessionId}_${name}`;
    performance.mark(markName, { detail });

    if (this.verbose) {
      console.log(`[BenchmarkRecorder] Mark: ${name}`);
    }
  }

  /**
   * Start a custom measure
   */
  startMeasure(name: string): void {
    if (this.state !== "recording") return;

    const markName = `${this.sessionId}_${name}_start`;
    performance.mark(markName);
    this.activeMeasures.set(name, performance.now());

    if (this.verbose) {
      console.log(`[BenchmarkRecorder] Measure started: ${name}`);
    }
  }

  /**
   * End a custom measure
   */
  endMeasure(name: string, detail?: Record<string, unknown>): DOMHighResTimeStamp | null {
    if (this.state !== "recording") return null;

    const startTime = this.activeMeasures.get(name);
    if (startTime === undefined) {
      console.warn(`[BenchmarkRecorder] No active measure: ${name}`);
      return null;
    }

    const endMarkName = `${this.sessionId}_${name}_end`;
    const startMarkName = `${this.sessionId}_${name}_start`;
    const measureName = `${this.sessionId}_${name}`;

    performance.mark(endMarkName);
    const measure = performance.measure(measureName, startMarkName, endMarkName);

    this.activeMeasures.delete(name);

    if (this.verbose) {
      console.log(`[BenchmarkRecorder] Measure ended: ${name} = ${measure.duration.toFixed(1)}ms`);
    }

    return measure.duration;
  }

  /**
   * Subscribe to benchmark events
   */
  subscribe(listener: BenchmarkEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Collect marks from Performance API
   */
  private collectMarks(): BenchmarkMark[] {
    const entries = performance.getEntriesByType("mark");
    const sessionPrefix = `${this.sessionId}_`;

    return entries
      .filter((entry) => entry.name.startsWith(sessionPrefix))
      .map((entry) => ({
        name: entry.name.replace(sessionPrefix, ""),
        startTime: entry.startTime - this.sessionStartTime,
        detail: entry.detail as Record<string, unknown> | undefined,
      }));
  }

  /**
   * Collect measures from Performance API
   */
  private collectMeasures(): BenchmarkMeasure[] {
    const entries = performance.getEntriesByType("measure");
    const sessionPrefix = `${this.sessionId}_`;

    return entries
      .filter((entry) => entry.name.startsWith(sessionPrefix))
      .map((entry) => ({
        name: entry.name.replace(sessionPrefix, ""),
        startTime: entry.startTime - this.sessionStartTime,
        duration: entry.duration,
        detail: entry.detail as Record<string, unknown> | undefined,
      }));
  }

  /**
   * Notify event listeners
   */
  private notifyListeners(
    event: "start" | "stop" | "batch" | "overlay",
    data?: BatchMetrics | OverlayRenderMetrics
  ): void {
    for (const listener of this.listeners) {
      try {
        listener(event, data);
      } catch (error) {
        console.error("[BenchmarkRecorder] Error in event listener:", error);
      }
    }
  }

  /**
   * Log a summary of the report
   */
  private logReport(report: BenchmarkReport): void {
    const { stats, memoryDelta } = report;

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log("║               BENCHMARK REPORT                               ║");
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log(`║ Name: ${report.name.padEnd(55)}║`);
    console.log(`║ ID: ${report.id.substring(0, 57).padEnd(57)}║`);
    console.log(`║ Duration: ${report.duration.toFixed(1).padStart(8)}ms                                       ║`);
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log("║ BATCH STATS                                                  ║");
    console.log(`║   Count: ${stats.batchCount.toString().padStart(6)}                                            ║`);
    console.log(`║   Nodes received: ${stats.totalNodesReceived.toString().padStart(8)}                              ║`);
    console.log(`║   Nodes processed: ${stats.totalNodesProcessed.toString().padStart(7)}                              ║`);
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log("║ TIMING (avg per batch)                                       ║");
    console.log(`║   Filter: ${stats.avgFilterTime.toFixed(1).padStart(8)}ms                                      ║`);
    console.log(`║   Measure: ${stats.avgMeasureTime.toFixed(1).padStart(7)}ms  ← Primary bottleneck               ║`);
    console.log(`║   Track: ${stats.avgTrackTime.toFixed(1).padStart(9)}ms                                      ║`);
    console.log(`║   Callback: ${stats.avgCallbackTime.toFixed(1).padStart(6)}ms                                      ║`);
    console.log(`║   Total: ${stats.avgTotalTime.toFixed(1).padStart(9)}ms                                      ║`);
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log("║ PERCENTILES                                                  ║");
    console.log(`║   P50: ${stats.p50TotalTime.toFixed(1).padStart(8)}ms                                        ║`);
    console.log(`║   P95: ${stats.p95TotalTime.toFixed(1).padStart(8)}ms                                        ║`);
    console.log(`║   P99: ${stats.p99TotalTime.toFixed(1).padStart(8)}ms                                        ║`);
    console.log("╠══════════════════════════════════════════════════════════════╣");
    console.log("║ OVERLAY RENDERS                                              ║");
    console.log(`║   Avg time: ${stats.avgOverlayRenderTime.toFixed(1).padStart(7)}ms                                   ║`);
    console.log(`║   Avg highlights: ${stats.avgHighlightsPerRender.toFixed(0).padStart(5)}                                   ║`);

    if (memoryDelta != null) {
      const deltaMB = (memoryDelta / 1024 / 1024).toFixed(2);
      const sign = memoryDelta >= 0 ? "+" : "";
      console.log("╠══════════════════════════════════════════════════════════════╣");
      console.log("║ MEMORY                                                       ║");
      console.log(`║   Delta: ${sign}${deltaMB.padStart(7)}MB                                       ║`);
    }

    console.log("╚══════════════════════════════════════════════════════════════╝\n");
  }
}

// Export singleton instance for convenience
export const benchmarkRecorder = new BenchmarkRecorder();

export default BenchmarkRecorder;
