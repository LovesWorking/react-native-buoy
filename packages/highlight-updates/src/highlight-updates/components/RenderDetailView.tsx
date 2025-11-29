/**
 * RenderDetailView
 *
 * Shows detailed information about a tracked component render.
 * Displays all available props, measurements, timing, and render count.
 */

import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import {
  Hash,
  Box,
  Clock,
  Activity,
  SectionHeader,
  macOSColors
} from "@react-buoy/shared-ui";
import type { TrackedRender } from "../utils/RenderTracker";

interface RenderDetailViewProps {
  render: TrackedRender;
}

interface DetailRowProps {
  label: string;
  value: string | number | undefined;
  color?: string;
  monospace?: boolean;
}

function DetailRow({ label, value, color, monospace = false }: DetailRowProps) {
  if (value === undefined || value === null) return null;

  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          monospace && styles.monospace,
          color && { color },
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

export function RenderDetailView({ render }: RenderDetailViewProps) {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const renderDuration = useMemo(() => {
    return render.lastRenderTime - render.firstRenderTime;
  }, [render.firstRenderTime, render.lastRenderTime]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with color indicator */}
      <View style={styles.header}>
        <View style={[styles.colorBar, { backgroundColor: render.color }]} />
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.displayName}>{render.displayName}</Text>
            {render.displayName !== render.viewType && (
              <Text style={styles.viewType}>{render.viewType}</Text>
            )}
          </View>
          <View style={[styles.renderBadge, { backgroundColor: render.color + "30" }]}>
            <Text style={[styles.renderCount, { color: render.color }]}>
              {render.renderCount} renders
            </Text>
          </View>
        </View>
      </View>

      {/* Identifiers Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Hash} color={macOSColors.semantic.info} size={12} />
          <SectionHeader.Title>IDENTIFIERS</SectionHeader.Title>
        </SectionHeader>
        <View style={styles.sectionContent}>
          <DetailRow label="Native Tag" value={render.nativeTag} monospace />
          <DetailRow label="testID" value={render.testID} monospace />
          <DetailRow label="nativeID" value={render.nativeID} monospace />
          <DetailRow label="Component" value={render.componentName} monospace />
          <DetailRow label="Accessibility Label" value={render.accessibilityLabel} />
        </View>
      </View>

      {/* Measurements Section */}
      {render.measurements && (
        <View style={styles.section}>
          <SectionHeader>
            <SectionHeader.Icon icon={Box} color={macOSColors.semantic.success} size={12} />
            <SectionHeader.Title>MEASUREMENTS</SectionHeader.Title>
          </SectionHeader>
          <View style={styles.sectionContent}>
            <View style={styles.measurementGrid}>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>X</Text>
                <Text style={styles.measurementValue}>
                  {Math.round(render.measurements.x)}
                </Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>Y</Text>
                <Text style={styles.measurementValue}>
                  {Math.round(render.measurements.y)}
                </Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>W</Text>
                <Text style={styles.measurementValue}>
                  {Math.round(render.measurements.width)}
                </Text>
              </View>
              <View style={styles.measurementItem}>
                <Text style={styles.measurementLabel}>H</Text>
                <Text style={styles.measurementValue}>
                  {Math.round(render.measurements.height)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Timing Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Clock} color={macOSColors.semantic.warning} size={12} />
          <SectionHeader.Title>TIMING</SectionHeader.Title>
        </SectionHeader>
        <View style={styles.sectionContent}>
          <DetailRow label="First Render" value={formatTime(render.firstRenderTime)} />
          <DetailRow label="Last Render" value={formatTime(render.lastRenderTime)} />
          <DetailRow
            label="Active Duration"
            value={formatDuration(renderDuration)}
            color={macOSColors.semantic.warning}
          />
        </View>
      </View>

      {/* Stats Section */}
      <View style={styles.section}>
        <SectionHeader>
          <SectionHeader.Icon icon={Activity} color={macOSColors.semantic.error} size={12} />
          <SectionHeader.Title>RENDER STATS</SectionHeader.Title>
        </SectionHeader>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: render.color }]}>
              {render.renderCount}
            </Text>
            <Text style={styles.statLabel}>Total Renders</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {renderDuration > 0
                ? (render.renderCount / (renderDuration / 1000)).toFixed(1)
                : render.renderCount}
            </Text>
            <Text style={styles.statLabel}>Renders/sec</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {renderDuration > 0
                ? Math.round(renderDuration / render.renderCount)
                : 0}
            </Text>
            <Text style={styles.statLabel}>Avg Interval (ms)</Text>
          </View>
        </View>
      </View>

      {/* Color Legend */}
      <View style={styles.colorLegend}>
        <Text style={styles.colorLegendTitle}>Highlight Color</Text>
        <View style={styles.colorInfo}>
          <View style={[styles.colorSwatch, { backgroundColor: render.color }]} />
          <Text style={styles.colorHex}>{render.color}</Text>
          <Text style={styles.colorDescription}>
            (warmer = more renders)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: macOSColors.background.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    overflow: "hidden",
    marginBottom: 16,
  },
  colorBar: {
    width: 6,
  },
  headerContent: {
    flex: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  headerText: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: "700",
    color: macOSColors.text.primary,
  },
  viewType: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    marginTop: 2,
  },
  renderBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  renderCount: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  section: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionContent: {
    padding: 12,
    paddingTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default + "40",
  },
  detailLabel: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontWeight: "500",
    minWidth: 100,
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: macOSColors.text.primary,
    textAlign: "right",
  },
  monospace: {
    fontFamily: "monospace",
  },
  measurementGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  measurementItem: {
    alignItems: "center",
  },
  measurementLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "600",
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 14,
    color: macOSColors.text.primary,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  statsGrid: {
    flexDirection: "row",
    padding: 12,
    paddingTop: 8,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 9,
    color: macOSColors.text.muted,
    fontWeight: "500",
    textAlign: "center",
  },
  colorLegend: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 12,
    marginTop: 4,
  },
  colorLegendTitle: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  colorInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  colorHex: {
    fontSize: 12,
    fontFamily: "monospace",
    color: macOSColors.text.primary,
    fontWeight: "600",
  },
  colorDescription: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontStyle: "italic",
  },
});

export default RenderDetailView;
