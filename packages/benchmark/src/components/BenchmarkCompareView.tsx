/**
 * BenchmarkCompareView
 *
 * Displays a comparison between two benchmark reports.
 * Shows side-by-side metrics with improvement/regression indicators.
 */

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";
import type { BenchmarkReport, BenchmarkComparison } from "../benchmarking";
import { BenchmarkComparator } from "../benchmarking";

interface BenchmarkCompareViewProps {
  baseline: BenchmarkReport;
  comparison: BenchmarkReport;
}

/**
 * Format milliseconds with appropriate precision
 */
function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 10) return `${ms.toFixed(2)}ms`;
  if (ms < 100) return `${ms.toFixed(1)}ms`;
  return `${ms.toFixed(0)}ms`;
}

/**
 * Format percentage with sign
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/**
 * Get color based on improvement (positive = good)
 */
function getImprovementColor(improvement: number): string {
  if (improvement > 5) return macOSColors.semantic.success;
  if (improvement < -5) return macOSColors.semantic.error;
  return macOSColors.text.secondary;
}

/**
 * Get emoji indicator
 */
function getIndicator(improvement: number): string {
  if (improvement > 5) return "✅";
  if (improvement < -5) return "❌";
  return "➖";
}

/**
 * Section header component
 */
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

/**
 * Comparison row component
 */
function CompareRow({
  label,
  baseline,
  comparison,
  improvement,
  unit = "ms",
}: {
  label: string;
  baseline: string;
  comparison: string;
  improvement: number;
  unit?: string;
}) {
  return (
    <View style={styles.compareRow}>
      <Text style={styles.compareLabel}>{label}</Text>
      <View style={styles.compareValues}>
        <Text style={styles.baselineValue}>{baseline}</Text>
        <Text style={styles.arrow}>→</Text>
        <Text style={styles.comparisonValue}>{comparison}</Text>
        <Text
          style={[
            styles.improvementValue,
            { color: getImprovementColor(improvement) },
          ]}
        >
          {formatPercent(improvement)} {getIndicator(improvement)}
        </Text>
      </View>
    </View>
  );
}

export function BenchmarkCompareView({
  baseline,
  comparison,
}: BenchmarkCompareViewProps) {
  // Generate comparison data
  const result = BenchmarkComparator.compare(baseline, comparison);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overall Result */}
      <View style={styles.overallResult}>
        <Text style={styles.overallEmoji}>
          {result.isImproved ? "🎉" : "⚠️"}
        </Text>
        <Text style={styles.overallText}>
          {result.isImproved ? "IMPROVED" : "REGRESSED"}
        </Text>
        <Text
          style={[
            styles.overallPercent,
            { color: getImprovementColor(result.overallImprovement) },
          ]}
        >
          {formatPercent(result.overallImprovement)}
        </Text>
      </View>

      {/* Reports being compared */}
      <SectionHeader title="COMPARING" />
      <View style={styles.section}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportRole}>BASELINE</Text>
          <Text style={styles.reportName}>{baseline.name}</Text>
          <Text style={styles.reportDate}>
            {new Date(baseline.createdAt).toLocaleString()}
          </Text>
        </View>
        <View style={styles.vsContainer}>
          <Text style={styles.vsText}>vs</Text>
        </View>
        <View style={styles.reportInfo}>
          <Text style={styles.reportRole}>COMPARISON</Text>
          <Text style={styles.reportName}>{comparison.name}</Text>
          <Text style={styles.reportDate}>
            {new Date(comparison.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Timing Comparison */}
      <SectionHeader title="TIMING COMPARISON" />
      <View style={styles.section}>
        <View style={styles.columnHeaders}>
          <Text style={styles.columnLabel}>Metric</Text>
          <View style={styles.columnValues}>
            <Text style={styles.columnHeader}>Base</Text>
            <Text style={styles.columnHeader}></Text>
            <Text style={styles.columnHeader}>After</Text>
            <Text style={styles.columnHeader}>Change</Text>
          </View>
        </View>

        <CompareRow
          label="Measure Time"
          baseline={formatMs(baseline.stats.avgMeasureTime)}
          comparison={formatMs(comparison.stats.avgMeasureTime)}
          improvement={result.measureTimeImprovement}
        />

        <CompareRow
          label="Pipeline Time"
          baseline={formatMs(baseline.stats.avgTotalTime)}
          comparison={formatMs(comparison.stats.avgTotalTime)}
          improvement={result.pipelineTimeImprovement}
        />

        <CompareRow
          label="Filter Time"
          baseline={formatMs(baseline.stats.avgFilterTime)}
          comparison={formatMs(comparison.stats.avgFilterTime)}
          improvement={result.filterTimeImprovement}
        />

        <CompareRow
          label="Track Time"
          baseline={formatMs(baseline.stats.avgTrackTime)}
          comparison={formatMs(comparison.stats.avgTrackTime)}
          improvement={result.trackTimeImprovement}
        />

        <CompareRow
          label="Overlay Render"
          baseline={formatMs(baseline.stats.avgOverlayRenderTime)}
          comparison={formatMs(comparison.stats.avgOverlayRenderTime)}
          improvement={result.overlayRenderImprovement}
        />
      </View>

      {/* Percentiles */}
      <SectionHeader title="PERCENTILES" />
      <View style={styles.section}>
        <CompareRow
          label="P50 (Median)"
          baseline={formatMs(baseline.stats.p50TotalTime)}
          comparison={formatMs(comparison.stats.p50TotalTime)}
          improvement={
            baseline.stats.p50TotalTime > 0
              ? ((baseline.stats.p50TotalTime - comparison.stats.p50TotalTime) /
                  baseline.stats.p50TotalTime) *
                100
              : 0
          }
        />

        <CompareRow
          label="P95"
          baseline={formatMs(baseline.stats.p95TotalTime)}
          comparison={formatMs(comparison.stats.p95TotalTime)}
          improvement={
            baseline.stats.p95TotalTime > 0
              ? ((baseline.stats.p95TotalTime - comparison.stats.p95TotalTime) /
                  baseline.stats.p95TotalTime) *
                100
              : 0
          }
        />

        <CompareRow
          label="P99"
          baseline={formatMs(baseline.stats.p99TotalTime)}
          comparison={formatMs(comparison.stats.p99TotalTime)}
          improvement={
            baseline.stats.p99TotalTime > 0
              ? ((baseline.stats.p99TotalTime - comparison.stats.p99TotalTime) /
                  baseline.stats.p99TotalTime) *
                100
              : 0
          }
        />
      </View>

      {/* Batch Stats */}
      <SectionHeader title="BATCH STATISTICS" />
      <View style={styles.section}>
        <View style={styles.statComparison}>
          <Text style={styles.statLabel}>Total Batches</Text>
          <Text style={styles.statValues}>
            {baseline.stats.batchCount} → {comparison.stats.batchCount}
          </Text>
        </View>
        <View style={styles.statComparison}>
          <Text style={styles.statLabel}>Nodes Processed</Text>
          <Text style={styles.statValues}>
            {baseline.stats.totalNodesProcessed.toLocaleString()} →{" "}
            {comparison.stats.totalNodesProcessed.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Memory (if available) */}
      {baseline.memoryDelta != null && comparison.memoryDelta != null && (
        <>
          <SectionHeader title="MEMORY" />
          <View style={styles.section}>
            <View style={styles.statComparison}>
              <Text style={styles.statLabel}>Memory Delta</Text>
              <Text
                style={[
                  styles.statValues,
                  {
                    color:
                      result.memoryDeltaChange != null && result.memoryDeltaChange < 0
                        ? macOSColors.semantic.success
                        : macOSColors.text.primary,
                  },
                ]}
              >
                {(baseline.memoryDelta / 1024 / 1024).toFixed(2)}MB →{" "}
                {(comparison.memoryDelta / 1024 / 1024).toFixed(2)}MB
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Compared at {new Date(result.comparedAt).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingVertical: 16,
  },
  overallResult: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: macOSColors.background.card,
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    marginBottom: 16,
  },
  overallEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  overallText: {
    fontSize: 14,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    letterSpacing: 2,
    marginBottom: 4,
  },
  overallPercent: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: macOSColors.background.hover,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: macOSColors.border.default,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  reportInfo: {
    flex: 1,
    paddingVertical: 8,
  },
  reportRole: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    letterSpacing: 1,
    marginBottom: 4,
  },
  reportName: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    marginBottom: 2,
  },
  reportDate: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  vsContainer: {
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  vsText: {
    fontSize: 12,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
  columnHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: macOSColors.border.default,
    marginBottom: 8,
  },
  columnLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    width: 80,
  },
  columnValues: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "flex-end",
    gap: 8,
  },
  columnHeader: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    width: 50,
    textAlign: "center",
  },
  compareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  compareLabel: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    width: 80,
  },
  compareValues: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    gap: 4,
  },
  baselineValue: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    width: 50,
    textAlign: "right",
  },
  arrow: {
    fontSize: 11,
    color: macOSColors.text.muted,
    paddingHorizontal: 4,
  },
  comparisonValue: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    fontWeight: "500",
    width: 50,
    textAlign: "right",
  },
  improvementValue: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
    width: 70,
    textAlign: "right",
  },
  statComparison: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  statValues: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderColor: macOSColors.border.default,
  },
  footerText: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    textAlign: "center",
  },
});

export default BenchmarkCompareView;
