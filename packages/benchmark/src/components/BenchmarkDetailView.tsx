/**
 * BenchmarkDetailView
 *
 * Displays detailed information about a single benchmark report.
 * Shows all metrics, timing breakdowns, percentiles, and memory info.
 */

import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";
import type { BenchmarkReport } from "../benchmarking";

interface BenchmarkDetailViewProps {
  report: BenchmarkReport;
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
 * Format bytes as human-readable
 */
function formatBytes(bytes: number | null): string {
  if (bytes === null) return "N/A";
  if (Math.abs(bytes) < 1024) return `${bytes}B`;
  if (Math.abs(bytes) < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
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
 * Stat row component
 */
function StatRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>
        {value}
      </Text>
    </View>
  );
}

export function BenchmarkDetailView({ report }: BenchmarkDetailViewProps) {
  const { stats, context, memoryStart, memoryEnd, memoryDelta } = report;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Overview Section */}
      <SectionHeader title="OVERVIEW" />
      <View style={styles.section}>
        <StatRow label="Name" value={report.name} />
        <StatRow label="Duration" value={formatDuration(report.duration)} />
        <StatRow
          label="Created"
          value={new Date(report.createdAt).toLocaleString()}
        />
        {report.description && (
          <StatRow label="Description" value={report.description} />
        )}
      </View>

      {/* Context Section */}
      <SectionHeader title="CONTEXT" />
      <View style={styles.section}>
        <StatRow label="Platform" value={context.platform.toUpperCase()} />
        {context.osVersion && (
          <StatRow label="OS Version" value={context.osVersion} />
        )}
        <StatRow label="Dev Mode" value={context.isDev ? "Yes" : "No"} />
        <StatRow label="Batch Size" value={context.batchSize.toString()} />
        <StatRow
          label="Render Count"
          value={context.showRenderCount ? "Enabled" : "Disabled"}
        />
      </View>

      {/* Batch Statistics */}
      <SectionHeader title="BATCH STATISTICS" />
      <View style={styles.section}>
        <StatRow label="Total Batches" value={stats.batchCount.toString()} />
        <StatRow
          label="Nodes Received"
          value={stats.totalNodesReceived.toLocaleString()}
        />
        <StatRow
          label="Nodes Filtered"
          value={stats.totalNodesFiltered.toLocaleString()}
        />
        <StatRow
          label="Nodes Processed"
          value={stats.totalNodesProcessed.toLocaleString()}
        />
      </View>

      {/* Timing Breakdown */}
      <SectionHeader title="TIMING (avg per batch)" />
      <View style={styles.section}>
        <StatRow label="Filter Time" value={formatMs(stats.avgFilterTime)} />
        <StatRow
          label="Measure Time"
          value={formatMs(stats.avgMeasureTime)}
          highlight
        />
        <StatRow label="Track Time" value={formatMs(stats.avgTrackTime)} />
        <StatRow label="Callback Time" value={formatMs(stats.avgCallbackTime)} />
        <View style={styles.divider} />
        <StatRow
          label="Total Pipeline"
          value={formatMs(stats.avgTotalTime)}
          highlight
        />
      </View>

      {/* Timing Distribution */}
      <SectionHeader title="TIMING DISTRIBUTION" />
      <View style={styles.section}>
        <StatRow label="Min" value={formatMs(stats.minTotalTime)} />
        <StatRow label="P50 (Median)" value={formatMs(stats.p50TotalTime)} />
        <StatRow label="P95" value={formatMs(stats.p95TotalTime)} highlight />
        <StatRow label="P99" value={formatMs(stats.p99TotalTime)} />
        <StatRow label="Max" value={formatMs(stats.maxTotalTime)} />
      </View>

      {/* Overlay Rendering */}
      <SectionHeader title="OVERLAY RENDERING" />
      <View style={styles.section}>
        <StatRow
          label="Avg Render Time"
          value={formatMs(stats.avgOverlayRenderTime)}
        />
        <StatRow
          label="Avg Highlights"
          value={stats.avgHighlightsPerRender.toFixed(1)}
        />
        <StatRow
          label="Total Renders"
          value={report.overlayRenders.length.toString()}
        />
      </View>

      {/* Memory Section */}
      {(memoryStart || memoryEnd) && (
        <>
          <SectionHeader title="MEMORY" />
          <View style={styles.section}>
            {memoryStart?.usedJSHeapSize != null && (
              <StatRow
                label="Start Used"
                value={formatBytes(memoryStart.usedJSHeapSize)}
              />
            )}
            {memoryEnd?.usedJSHeapSize != null && (
              <StatRow
                label="End Used"
                value={formatBytes(memoryEnd.usedJSHeapSize)}
              />
            )}
            {memoryDelta != null && (
              <StatRow
                label="Delta"
                value={`${memoryDelta >= 0 ? "+" : ""}${formatBytes(memoryDelta)}`}
                highlight={Math.abs(memoryDelta) > 1024 * 1024}
              />
            )}
          </View>
        </>
      )}

      {/* Custom Marks */}
      {report.marks.length > 0 && (
        <>
          <SectionHeader title={`CUSTOM MARKS (${report.marks.length})`} />
          <View style={styles.section}>
            {report.marks.slice(0, 10).map((mark, index) => (
              <StatRow
                key={index}
                label={mark.name}
                value={formatMs(mark.startTime)}
              />
            ))}
            {report.marks.length > 10 && (
              <Text style={styles.moreText}>
                +{report.marks.length - 10} more marks
              </Text>
            )}
          </View>
        </>
      )}

      {/* Custom Measures */}
      {report.measures.length > 0 && (
        <>
          <SectionHeader title={`CUSTOM MEASURES (${report.measures.length})`} />
          <View style={styles.section}>
            {report.measures.slice(0, 10).map((measure, index) => (
              <StatRow
                key={index}
                label={measure.name}
                value={formatMs(measure.duration)}
              />
            ))}
            {report.measures.length > 10 && (
              <Text style={styles.moreText}>
                +{report.measures.length - 10} more measures
              </Text>
            )}
          </View>
        </>
      )}

      {/* Report ID */}
      <View style={styles.reportId}>
        <Text style={styles.reportIdLabel}>Report ID</Text>
        <Text style={styles.reportIdValue}>{report.id}</Text>
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
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  statLabel: {
    fontSize: 13,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  statValue: {
    fontSize: 13,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  statValueHighlight: {
    color: macOSColors.semantic.info,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: macOSColors.border.default,
    marginVertical: 8,
  },
  moreText: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    fontStyle: "italic",
    textAlign: "center",
    paddingTop: 8,
  },
  reportId: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderColor: macOSColors.border.default,
    marginTop: 16,
  },
  reportIdLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  reportIdValue: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
});

export default BenchmarkDetailView;
