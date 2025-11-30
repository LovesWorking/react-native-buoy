/**
 * PerformanceLogger
 *
 * Dedicated performance measurement utility for the Highlight Updates feature.
 * Tracks timing metrics across the render detection pipeline to identify bottlenecks
 * and measure optimization improvements.
 *
 * This logger integrates with the benchmarking system - when a benchmark session
 * is active, batch metrics are automatically forwarded to the BenchmarkRecorder.
 *
 * Usage:
 *   PerformanceLogger.setEnabled(true);  // Enable logging
 *   const batch = PerformanceLogger.startBatch(nodesReceived);
 *   batch.markFilteringComplete(nodesFiltered, nodesToProcess);
 *   batch.markMeasurementComplete(successCount, failCount);
 *   batch.markTrackingComplete();
 *   batch.markCallbackComplete();
 *   batch.finish();  // Logs the complete metrics
 *
 * For benchmark recording:
 *   import { benchmarkRecorder } from '../../benchmarking';
 *   benchmarkRecorder.startSession({ name: 'MyBenchmark' });
 *   // ... perform operations (batches are auto-forwarded) ...
 *   const report = benchmarkRecorder.stopSession();
 */

"use strict";

import { benchmarkRecorder } from "@react-buoy/benchmark";

// Declare performance API available in React Native's JavaScript environment
declare const performance: { now: () => number };

export interface BatchMetrics {
  batchId: string;
  timestamp: number;

  // Input metrics
  nodesReceived: number;
  nodesFiltered: number;
  nodesToProcess: number;
  batchSize: number;
  nodesInBatch: number;

  // Timing metrics (ms)
  filteringTime: number;
  measurementTime: number;
  trackingTime: number;
  callbackTime: number;
  totalTime: number;

  // Measurement stats
  measurementSuccessCount: number;
  measurementFailCount: number;

  // Overlay render timing (set externally)
  overlayRenderTime?: number;
}

// Track the last event timestamp to measure end-to-end latency
let lastEventTimestamp: number = 0;
let pendingBatchId: string | null = null;

/**
 * Call this when a traceUpdates event is received to track end-to-end latency
 */
export function markEventReceived(): number {
  lastEventTimestamp = performance.now();
  return lastEventTimestamp;
}

/**
 * Call this from the overlay when highlights are actually rendered
 */
export function markOverlayRendered(highlightCount: number, renderTime?: number): void {
  if (lastEventTimestamp > 0 && highlightCount > 0) {
    const endToEndTime = performance.now() - lastEventTimestamp;
    if (endToEndTime > 50) { // Only log significant delays
      console.log(
        `[HighlightPerf] 🎯 END-TO-END: ${endToEndTime.toFixed(0)}ms from event to ${highlightCount} highlights visible`
      );
    }
    // Reset to avoid double-counting
    lastEventTimestamp = 0;
  }

  // Forward overlay render metrics to benchmark recorder if session is active
  if (renderTime !== undefined && benchmarkRecorder.isRecording()) {
    benchmarkRecorder.recordOverlayRender(highlightCount, renderTime);
  }
}

export interface BatchTimer {
  markFilteringComplete: (nodesFiltered: number, nodesToProcess: number) => void;
  markMeasurementStart: () => void;
  markMeasurementComplete: (successCount: number, failCount: number) => void;
  markTrackingComplete: () => void;
  markCallbackComplete: () => void;
  setOverlayRenderTime: (timeMs: number) => void;
  finish: () => BatchMetrics;
  getBatchId: () => string;
}

type MetricsListener = (metrics: BatchMetrics) => void;

// Rolling statistics for summary logging
interface RollingStats {
  batchCount: number;
  totalNodes: number;
  totalFiltered: number;
  totalProcessed: number;
  totalTime: number;
  maxTime: number;
  minTime: number;
  avgMeasurementTime: number;
}

class PerformanceLoggerSingleton {
  private enabled: boolean = false;
  private batchCounter: number = 0;
  private listeners: Set<MetricsListener> = new Set();

  // Rolling stats for periodic summaries
  private rollingStats: RollingStats = {
    batchCount: 0,
    totalNodes: 0,
    totalFiltered: 0,
    totalProcessed: 0,
    totalTime: 0,
    maxTime: 0,
    minTime: Infinity,
    avgMeasurementTime: 0,
  };

  // Recent batch history for analysis
  private recentBatches: BatchMetrics[] = [];
  private readonly MAX_HISTORY = 100;

  // Summary logging interval
  private summaryInterval: ReturnType<typeof setInterval> | null = null;
  private readonly SUMMARY_INTERVAL_MS = 10000; // Log summary every 10s

  /**
   * Enable or disable performance logging
   */
  setEnabled(enabled: boolean): void {
    const wasEnabled = this.enabled;
    this.enabled = enabled;

    if (enabled && !wasEnabled) {
      this.resetStats();
      this.startSummaryInterval();
      console.log("[HighlightPerf] Performance logging ENABLED");
    } else if (!enabled && wasEnabled) {
      this.stopSummaryInterval();
      console.log("[HighlightPerf] Performance logging DISABLED");
    }
  }

  /**
   * Check if logging is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start timing a new batch of render updates
   */
  startBatch(nodesReceived: number, batchSize: number): BatchTimer {
    const batchId = `batch_${++this.batchCounter}`;
    const startTime = performance.now();

    let filteringEndTime: number | null = null;
    let measurementStartTime: number | null = null;
    let measurementEndTime: number | null = null;
    let trackingEndTime: number | null = null;
    let callbackEndTime: number | null = null;

    let nodesFiltered = 0;
    let nodesToProcess = 0;
    let measurementSuccessCount = 0;
    let measurementFailCount = 0;
    let overlayRenderTime: number | undefined;

    const timer: BatchTimer = {
      markFilteringComplete: (filtered: number, toProcess: number) => {
        filteringEndTime = performance.now();
        nodesFiltered = filtered;
        nodesToProcess = toProcess;
      },

      markMeasurementStart: () => {
        measurementStartTime = performance.now();
      },

      markMeasurementComplete: (success: number, fail: number) => {
        measurementEndTime = performance.now();
        measurementSuccessCount = success;
        measurementFailCount = fail;
      },

      markTrackingComplete: () => {
        trackingEndTime = performance.now();
      },

      markCallbackComplete: () => {
        callbackEndTime = performance.now();
      },

      setOverlayRenderTime: (timeMs: number) => {
        overlayRenderTime = timeMs;
      },

      getBatchId: () => batchId,

      finish: () => {
        const endTime = performance.now();

        const metrics: BatchMetrics = {
          batchId,
          timestamp: Date.now(),
          nodesReceived,
          nodesFiltered,
          nodesToProcess,
          batchSize,
          nodesInBatch: Math.min(nodesToProcess, batchSize),
          filteringTime: filteringEndTime ? filteringEndTime - startTime : 0,
          measurementTime:
            measurementStartTime && measurementEndTime
              ? measurementEndTime - measurementStartTime
              : 0,
          trackingTime:
            measurementEndTime && trackingEndTime
              ? trackingEndTime - measurementEndTime
              : 0,
          callbackTime:
            trackingEndTime && callbackEndTime
              ? callbackEndTime - trackingEndTime
              : 0,
          totalTime: endTime - startTime,
          measurementSuccessCount,
          measurementFailCount,
          overlayRenderTime,
        };

        if (this.enabled) {
          this.recordMetrics(metrics);
        }

        return metrics;
      },
    };

    return timer;
  }

  /**
   * Record metrics and log them
   */
  private recordMetrics(metrics: BatchMetrics): void {
    // Update rolling stats
    this.rollingStats.batchCount++;
    this.rollingStats.totalNodes += metrics.nodesReceived;
    this.rollingStats.totalFiltered += metrics.nodesFiltered;
    this.rollingStats.totalProcessed += metrics.nodesInBatch;
    this.rollingStats.totalTime += metrics.totalTime;
    this.rollingStats.maxTime = Math.max(this.rollingStats.maxTime, metrics.totalTime);
    this.rollingStats.minTime = Math.min(this.rollingStats.minTime, metrics.totalTime);

    // Update rolling average for measurement time
    const prevAvg = this.rollingStats.avgMeasurementTime;
    const n = this.rollingStats.batchCount;
    this.rollingStats.avgMeasurementTime =
      prevAvg + (metrics.measurementTime - prevAvg) / n;

    // Store in history
    this.recentBatches.push(metrics);
    if (this.recentBatches.length > this.MAX_HISTORY) {
      this.recentBatches.shift();
    }

    // Forward to benchmark recorder if a session is active
    if (benchmarkRecorder.isRecording()) {
      benchmarkRecorder.recordBatch(metrics);
    }

    // Notify listeners
    this.notifyListeners(metrics);

    // Log individual batch
    this.logBatch(metrics);
  }

  /**
   * Log a single batch's metrics
   */
  private logBatch(metrics: BatchMetrics): void {
    const {
      batchId,
      nodesReceived,
      nodesFiltered,
      nodesInBatch,
      batchSize,
      filteringTime,
      measurementTime,
      trackingTime,
      callbackTime,
      totalTime,
      measurementSuccessCount,
      measurementFailCount,
      overlayRenderTime,
    } = metrics;

    // Compact single-line log for quick scanning
    console.log(
      `[HighlightPerf] ${batchId} | ` +
        `In:${nodesReceived} Filt:${nodesFiltered} Proc:${nodesInBatch}/${batchSize} | ` +
        `Filter:${filteringTime.toFixed(1)}ms Measure:${measurementTime.toFixed(1)}ms ` +
        `Track:${trackingTime.toFixed(1)}ms Callback:${callbackTime.toFixed(1)}ms | ` +
        `Total:${totalTime.toFixed(1)}ms` +
        (overlayRenderTime ? ` Render:${overlayRenderTime.toFixed(1)}ms` : "") +
        ` | Success:${measurementSuccessCount} Fail:${measurementFailCount}`
    );

    // Flag slow batches
    if (totalTime > 100) {
      console.warn(
        `[HighlightPerf] ⚠️ SLOW BATCH: ${totalTime.toFixed(1)}ms - ` +
          `Measurement phase: ${measurementTime.toFixed(1)}ms (${((measurementTime / totalTime) * 100).toFixed(0)}%)`
      );
    }
  }

  /**
   * Log periodic summary stats
   */
  private logSummary(): void {
    if (this.rollingStats.batchCount === 0) return;

    const stats = this.rollingStats;
    const avgTime = stats.totalTime / stats.batchCount;
    const avgNodes = stats.totalNodes / stats.batchCount;

    console.log(
      `\n[HighlightPerf] ════════ SUMMARY (last ${this.SUMMARY_INTERVAL_MS / 1000}s) ════════\n` +
        `  Batches: ${stats.batchCount}\n` +
        `  Avg nodes/batch: ${avgNodes.toFixed(1)} (filtered: ${(stats.totalFiltered / stats.batchCount).toFixed(1)})\n` +
        `  Avg total time: ${avgTime.toFixed(1)}ms\n` +
        `  Avg measurement time: ${stats.avgMeasurementTime.toFixed(1)}ms\n` +
        `  Min/Max time: ${stats.minTime.toFixed(1)}ms / ${stats.maxTime.toFixed(1)}ms\n` +
        `══════════════════════════════════════════════\n`
    );

    // Reset rolling stats for next interval
    this.resetStats();
  }

  /**
   * Reset rolling statistics
   */
  private resetStats(): void {
    this.rollingStats = {
      batchCount: 0,
      totalNodes: 0,
      totalFiltered: 0,
      totalProcessed: 0,
      totalTime: 0,
      maxTime: 0,
      minTime: Infinity,
      avgMeasurementTime: 0,
    };
  }

  /**
   * Start the summary logging interval
   */
  private startSummaryInterval(): void {
    this.stopSummaryInterval();
    this.summaryInterval = setInterval(() => {
      this.logSummary();
    }, this.SUMMARY_INTERVAL_MS);
  }

  /**
   * Stop the summary logging interval
   */
  private stopSummaryInterval(): void {
    if (this.summaryInterval) {
      clearInterval(this.summaryInterval);
      this.summaryInterval = null;
    }
  }

  /**
   * Subscribe to metrics updates
   */
  subscribe(listener: MetricsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of new metrics
   */
  private notifyListeners(metrics: BatchMetrics): void {
    for (const listener of this.listeners) {
      try {
        listener(metrics);
      } catch (error) {
        console.error("[HighlightPerf] Error in metrics listener:", error);
      }
    }
  }

  /**
   * Get recent batch history
   */
  getRecentBatches(): BatchMetrics[] {
    return [...this.recentBatches];
  }

  /**
   * Get current rolling stats
   */
  getRollingStats(): RollingStats {
    return { ...this.rollingStats };
  }

  /**
   * Clear all history and stats
   */
  clear(): void {
    this.recentBatches = [];
    this.resetStats();
    this.batchCounter = 0;
  }

  /**
   * Generate a detailed report of recent performance
   */
  generateReport(): string {
    const batches = this.recentBatches;
    if (batches.length === 0) {
      return "No performance data collected yet.";
    }

    const totalTime = batches.reduce((sum, b) => sum + b.totalTime, 0);
    const avgTime = totalTime / batches.length;
    const totalMeasureTime = batches.reduce((sum, b) => sum + b.measurementTime, 0);
    const avgMeasureTime = totalMeasureTime / batches.length;

    const slowBatches = batches.filter((b) => b.totalTime > 100);
    const fastBatches = batches.filter((b) => b.totalTime < 20);

    const report = `
╔══════════════════════════════════════════════════════════════╗
║              HIGHLIGHT UPDATES PERFORMANCE REPORT            ║
╠══════════════════════════════════════════════════════════════╣
║ Total batches analyzed: ${batches.length.toString().padStart(5)}                              ║
║ Average total time:     ${avgTime.toFixed(1).padStart(5)}ms                             ║
║ Average measure time:   ${avgMeasureTime.toFixed(1).padStart(5)}ms (${((avgMeasureTime / avgTime) * 100).toFixed(0)}% of total)           ║
╠══════════════════════════════════════════════════════════════╣
║ Fast batches (<20ms):   ${fastBatches.length.toString().padStart(5)} (${((fastBatches.length / batches.length) * 100).toFixed(0)}%)                          ║
║ Slow batches (>100ms):  ${slowBatches.length.toString().padStart(5)} (${((slowBatches.length / batches.length) * 100).toFixed(0)}%)                          ║
╠══════════════════════════════════════════════════════════════╣
║ Time breakdown (avg):                                        ║
║   Filtering:    ${batches.reduce((s, b) => s + b.filteringTime, 0 / batches.length).toFixed(1).padStart(6)}ms                                    ║
║   Measurement:  ${avgMeasureTime.toFixed(1).padStart(6)}ms  ← Primary bottleneck              ║
║   Tracking:     ${(batches.reduce((s, b) => s + b.trackingTime, 0) / batches.length).toFixed(1).padStart(6)}ms                                    ║
║   Callback:     ${(batches.reduce((s, b) => s + b.callbackTime, 0) / batches.length).toFixed(1).padStart(6)}ms                                    ║
╚══════════════════════════════════════════════════════════════╝
`;

    return report;
  }
}

// Export singleton instance
export const PerformanceLogger = new PerformanceLoggerSingleton();

export default PerformanceLogger;
