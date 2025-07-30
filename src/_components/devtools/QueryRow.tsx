import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../_util/getQueryStatusLabel";
import { displayValue } from "./displayValue";

interface QueryRowProps {
  query: Query<any, any, any, any>;
  isSelected: boolean;
  onSelect: (query: Query<any, any, any, any>) => void;
}

const QueryRow: React.FC<QueryRowProps> = ({ query, isSelected, onSelect }) => {
  // Map status to color names
  const getStatusColor = (
    status: string
  ): "green" | "yellow" | "gray" | "blue" | "purple" | "red" => {
    switch (status) {
      case "fresh":
        return "green";
      case "stale":
      case "inactive":
        return "yellow";
      case "fetching":
        return "blue";
      case "paused":
        return "purple";
      default:
        return "gray";
    }
  };

  // Modern status color mapping
  const getStatusHexColor = (status: string): string => {
    switch (status) {
      case "fresh":
        return "#10B981"; // Green
      case "stale":
      case "inactive":
        return "#F59E0B"; // Orange
      case "fetching":
        return "#3B82F6"; // Blue
      case "paused":
        return "#8B5CF6"; // Purple
      default:
        return "#6B7280"; // Gray
    }
  };

  const status = getQueryStatusLabel(query);
  const statusColor = getStatusColor(status);
  const observerCount = query.getObserversCount();
  const isDisabled = query.isDisabled();
  const queryHash = displayValue(query.queryKey, false);

  // Get modern observer count styles based on status
  const getObserverCountStyles = () => {
    const statusHexColor = getStatusHexColor(status);
    return {
      backgroundColor: `${statusHexColor}20`, // 20% opacity
      borderRightColor: `${statusHexColor}40`, // 40% opacity
    };
  };

  return (
    <TouchableOpacity
      style={[styles.queryRow, isSelected && styles.selectedQueryRow]}
      onPress={() => onSelect(query)}
      activeOpacity={0.7}
      accessibilityLabel={`Query key ${queryHash}`}
    >
      {/* Status indicator and content in one row */}
      <View style={styles.rowContent}>
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusHexColor(status) },
            ]}
          />
          <View style={styles.statusInfo}>
            <Text
              style={[styles.statusLabel, { color: getStatusHexColor(status) }]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
            <Text style={styles.observerText}>
              {observerCount} observer{observerCount !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <View style={styles.querySection}>
          <Text
            style={styles.queryHash}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {queryHash}
          </Text>
          {isDisabled && <Text style={styles.disabledText}>Disabled</Text>}
        </View>

        <View style={styles.badgeSection}>
          <Text
            style={[styles.statusBadge, { color: getStatusHexColor(status) }]}
          >
            {observerCount}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  queryRow: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 8,
    marginVertical: 3,
    padding: 12,
  },
  selectedQueryRow: {
    backgroundColor: "rgba(14, 165, 233, 0.05)",
    borderColor: "rgba(14, 165, 233, 0.2)",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  observerText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  querySection: {
    flex: 2,
    paddingHorizontal: 12,
  },
  queryHash: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 16,
  },
  badgeSection: {
    alignItems: "flex-end",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  disabledText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "500",
    marginTop: 2,
  },
});

export default QueryRow;
