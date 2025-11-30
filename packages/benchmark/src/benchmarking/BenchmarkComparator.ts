/**
 * BenchmarkComparator
 *
 * Compares two benchmark reports and generates a detailed comparison result.
 * Calculates improvements/regressions across all metrics and provides
 * human-readable summaries.
 *
 * Usage:
 *   const comparison = BenchmarkComparator.compare(baselineReport, comparisonReport);
 *   console.log(comparison.summary);
 *   console.log(`Overall improvement: ${comparison.overallImprovement.toFixed(1)}%`);
 *
 * @packageDocumentation
 */

"use strict";

import type { BenchmarkReport, BenchmarkComparison } from "./types";

/**
 * Calculate percentage improvement (positive = better)
 * @param baseline - The baseline value
 * @param comparison - The comparison value
 * @returns Percentage improvement (positive = faster/better, negative = slower/worse)
 */
function calculateImprovement(baseline: number, comparison: number): number {
  if (baseline === 0) return 0;
  return ((baseline - comparison) / baseline) * 100;
}

/**
 * Format a percentage with sign
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Format milliseconds
 */
function formatMs(value: number): string {
  return `${value.toFixed(1)}ms`;
}

/**
 * Format bytes as MB
 */
function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  const sign = mb >= 0 ? "+" : "";
  return `${sign}${mb.toFixed(2)}MB`;
}

/**
 * Get an emoji indicator for improvement
 */
function getIndicator(improvement: number, threshold: number = 5): string {
  if (improvement > threshold) return "✅";
  if (improvement < -threshold) return "❌";
  return "➖";
}

/**
 * BenchmarkComparator - Compares two benchmark reports
 */
export class BenchmarkComparator {
  /**
   * Compare two benchmark reports
   * @param baseline - The baseline (before) report
   * @param comparison - The comparison (after) report
   * @returns Detailed comparison result
   */
  static compare(baseline: BenchmarkReport, comparison: BenchmarkReport): BenchmarkComparison {
    const baselineStats = baseline.stats;
    const comparisonStats = comparison.stats;

    // Duration changes
    const durationDelta = comparison.duration - baseline.duration;
    const durationImprovement = calculateImprovement(baseline.duration, comparison.duration);

    // Pipeline timing improvements
    const filterTimeImprovement = calculateImprovement(
      baselineStats.avgFilterTime,
      comparisonStats.avgFilterTime
    );
    const measureTimeImprovement = calculateImprovement(
      baselineStats.avgMeasureTime,
      comparisonStats.avgMeasureTime
    );
    const trackTimeImprovement = calculateImprovement(
      baselineStats.avgTrackTime,
      comparisonStats.avgTrackTime
    );
    const pipelineTimeImprovement = calculateImprovement(
      baselineStats.avgTotalTime,
      comparisonStats.avgTotalTime
    );

    // Overlay render improvement
    const overlayRenderImprovement = calculateImprovement(
      baselineStats.avgOverlayRenderTime,
      comparisonStats.avgOverlayRenderTime
    );

    // Memory changes
    let memoryDeltaChange: number | null = null;
    if (baseline.memoryDelta != null && comparison.memoryDelta != null) {
      memoryDeltaChange = comparison.memoryDelta - baseline.memoryDelta;
    }

    // Overall improvement (weighted average of key metrics)
    // Weights: measurement time (40%), pipeline time (30%), overlay render (20%), memory (10%)
    const weights = {
      measure: 0.4,
      pipeline: 0.3,
      overlay: 0.2,
      memory: 0.1,
    };

    let overallImprovement =
      measureTimeImprovement * weights.measure +
      pipelineTimeImprovement * weights.pipeline +
      overlayRenderImprovement * weights.overlay;

    // Add memory improvement if available
    if (baseline.memoryDelta != null && comparison.memoryDelta != null && baseline.memoryDelta !== 0) {
      const memoryImprovement = calculateImprovement(baseline.memoryDelta, comparison.memoryDelta);
      overallImprovement += memoryImprovement * weights.memory;
    }

    const isImproved = overallImprovement > 0;

    // Generate summary
    const summary = this.generateSummary({
      baseline,
      comparison,
      durationDelta,
      durationImprovement,
      measureTimeImprovement,
      pipelineTimeImprovement,
      overlayRenderImprovement,
      memoryDeltaChange,
      overallImprovement,
      isImproved,
    });

    return {
      baselineId: baseline.id,
      baselineName: baseline.name,
      comparisonId: comparison.id,
      comparisonName: comparison.name,
      comparedAt: Date.now(),
      durationDelta,
      durationImprovement,
      filterTimeImprovement,
      measureTimeImprovement,
      trackTimeImprovement,
      pipelineTimeImprovement,
      overlayRenderImprovement,
      memoryDeltaChange,
      overallImprovement,
      isImproved,
      summary,
    };
  }

  /**
   * Generate a human-readable summary
   */
  private static generateSummary(data: {
    baseline: BenchmarkReport;
    comparison: BenchmarkReport;
    durationDelta: number;
    durationImprovement: number;
    measureTimeImprovement: number;
    pipelineTimeImprovement: number;
    overlayRenderImprovement: number;
    memoryDeltaChange: number | null;
    overallImprovement: number;
    isImproved: boolean;
  }): string {
    const {
      baseline,
      comparison,
      measureTimeImprovement,
      pipelineTimeImprovement,
      overlayRenderImprovement,
      memoryDeltaChange,
      overallImprovement,
      isImproved,
    } = data;

    const lines: string[] = [];

    lines.push("╔══════════════════════════════════════════════════════════════╗");
    lines.push("║               BENCHMARK COMPARISON                           ║");
    lines.push("╠══════════════════════════════════════════════════════════════╣");
    lines.push(`║ Baseline: ${baseline.name.substring(0, 50).padEnd(50)} ║`);
    lines.push(`║   ${new Date(baseline.createdAt).toLocaleString().substring(0, 58).padEnd(58)} ║`);
    lines.push(`║ Comparison: ${comparison.name.substring(0, 48).padEnd(48)} ║`);
    lines.push(`║   ${new Date(comparison.createdAt).toLocaleString().substring(0, 58).padEnd(58)} ║`);
    lines.push("╠══════════════════════════════════════════════════════════════╣");
    lines.push("║ TIMING COMPARISON                                            ║");
    lines.push("║                         Baseline    After     Change         ║");
    lines.push(
      `║ Measurement Time:    ${formatMs(baseline.stats.avgMeasureTime).padStart(8)} → ` +
        `${formatMs(comparison.stats.avgMeasureTime).padStart(8)}  ` +
        `${formatPercent(measureTimeImprovement).padStart(7)} ${getIndicator(measureTimeImprovement)}  ║`
    );
    lines.push(
      `║ Pipeline Time:       ${formatMs(baseline.stats.avgTotalTime).padStart(8)} → ` +
        `${formatMs(comparison.stats.avgTotalTime).padStart(8)}  ` +
        `${formatPercent(pipelineTimeImprovement).padStart(7)} ${getIndicator(pipelineTimeImprovement)}  ║`
    );
    lines.push(
      `║ Overlay Render:      ${formatMs(baseline.stats.avgOverlayRenderTime).padStart(8)} → ` +
        `${formatMs(comparison.stats.avgOverlayRenderTime).padStart(8)}  ` +
        `${formatPercent(overlayRenderImprovement).padStart(7)} ${getIndicator(overlayRenderImprovement)}  ║`
    );

    if (memoryDeltaChange != null && baseline.memoryDelta != null && comparison.memoryDelta != null) {
      const memoryImprovement = calculateImprovement(baseline.memoryDelta, comparison.memoryDelta);
      lines.push("╠══════════════════════════════════════════════════════════════╣");
      lines.push("║ MEMORY                                                       ║");
      lines.push(
        `║ Delta:               ${formatBytes(baseline.memoryDelta).padStart(8)} → ` +
          `${formatBytes(comparison.memoryDelta).padStart(8)}  ` +
          `${formatPercent(memoryImprovement).padStart(7)} ${getIndicator(memoryImprovement)}  ║`
      );
    }

    lines.push("╠══════════════════════════════════════════════════════════════╣");
    lines.push("║ PERCENTILES (P95)                                            ║");
    const p95Improvement = calculateImprovement(baseline.stats.p95TotalTime, comparison.stats.p95TotalTime);
    lines.push(
      `║ P95 Pipeline:        ${formatMs(baseline.stats.p95TotalTime).padStart(8)} → ` +
        `${formatMs(comparison.stats.p95TotalTime).padStart(8)}  ` +
        `${formatPercent(p95Improvement).padStart(7)} ${getIndicator(p95Improvement)}  ║`
    );

    lines.push("╠══════════════════════════════════════════════════════════════╣");
    const resultEmoji = isImproved ? "🎉" : "⚠️";
    const resultText = isImproved ? "IMPROVED" : "REGRESSED";
    lines.push(
      `║ ${resultEmoji} OVERALL: ${formatPercent(overallImprovement).padStart(7)} ${resultText.padEnd(40)} ║`
    );
    lines.push("╚══════════════════════════════════════════════════════════════╝");

    return lines.join("\n");
  }

  /**
   * Log a comparison to the console
   */
  static logComparison(comparison: BenchmarkComparison): void {
    console.log("\n" + comparison.summary + "\n");
  }

  /**
   * Quick compare: compare baseline vs comparison and log results
   */
  static quickCompare(baseline: BenchmarkReport, comparison: BenchmarkReport): BenchmarkComparison {
    const result = this.compare(baseline, comparison);
    this.logComparison(result);
    return result;
  }

  /**
   * Generate a brief one-line summary
   */
  static getBriefSummary(comparison: BenchmarkComparison): string {
    const direction = comparison.isImproved ? "faster" : "slower";
    const emoji = comparison.isImproved ? "✅" : "❌";
    return `${emoji} ${Math.abs(comparison.overallImprovement).toFixed(1)}% ${direction} (measurement: ${formatPercent(comparison.measureTimeImprovement)}, pipeline: ${formatPercent(comparison.pipelineTimeImprovement)})`;
  }
}

export default BenchmarkComparator;
