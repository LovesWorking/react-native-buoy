/**
 * BenchmarkSessionCard
 *
 * Displays a single benchmark report as a card with key metrics.
 * Shows name, duration, batch count, and timing stats.
 * Supports selection for comparison.
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import {
  macOSColors,
  Check,
  Clock,
  Layers,
  Zap,
} from "@react-buoy/shared-ui";
import type { BenchmarkMetadata } from "../benchmarking";

interface BenchmarkSessionCardProps {
  metadata: BenchmarkMetadata;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  selectionMode?: boolean;
}

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format date in compact form
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function BenchmarkSessionCard({
  metadata,
  isSelected = false,
  onPress,
  onLongPress,
  selectionMode = false,
}: BenchmarkSessionCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
      ]}
      activeOpacity={0.7}
    >
      {/* Selection indicator */}
      {selectionMode && (
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={12} color="#fff" />}
        </View>
      )}

      {/* Main content */}
      <View style={styles.content}>
        {/* Header with name and date */}
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>
            {metadata.name}
          </Text>
          <Text style={styles.date}>{formatDate(metadata.createdAt)}</Text>
        </View>

        {/* Description if available */}
        {metadata.description && (
          <Text style={styles.description} numberOfLines={1}>
            {metadata.description}
          </Text>
        )}

        {/* Stats row */}
        <View style={styles.statsRow}>
          {/* Duration */}
          <View style={styles.stat}>
            <Clock size={12} color={macOSColors.text.secondary} />
            <Text style={styles.statValue}>{formatDuration(metadata.duration)}</Text>
          </View>

          {/* Batch count */}
          <View style={styles.stat}>
            <Layers size={12} color={macOSColors.text.secondary} />
            <Text style={styles.statValue}>
              {metadata.batchCount} batch{metadata.batchCount !== 1 ? "es" : ""}
            </Text>
          </View>

          {/* Quick indicator for good/bad performance */}
          <View style={styles.stat}>
            <Zap
              size={12}
              color={
                metadata.duration < 10000
                  ? macOSColors.semantic.success
                  : metadata.duration < 30000
                  ? macOSColors.semantic.warning
                  : macOSColors.semantic.error
              }
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  cardSelected: {
    borderColor: macOSColors.semantic.info,
    backgroundColor: macOSColors.semantic.infoBackground,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: macOSColors.border.hover,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxSelected: {
    backgroundColor: macOSColors.semantic.info,
    borderColor: macOSColors.semantic.info,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
    marginRight: 8,
  },
  date: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
  description: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
});

export default BenchmarkSessionCard;
