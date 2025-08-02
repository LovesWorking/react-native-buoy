import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface QueryStatusProps {
  label: string;
  color: "green" | "yellow" | "gray" | "blue" | "purple" | "red";
  count: number;
  showLabel?: boolean;
  isActive?: boolean;
  onPress?: () => void;
}

type ColorName = "green" | "yellow" | "gray" | "blue" | "purple" | "red";

const QueryStatus: React.FC<QueryStatusProps> = ({
  label,
  color,
  count,
  showLabel = true,
  isActive = false,
  onPress,
}) => {
  // Modern color mapping for status indicators
  const getStatusColors = (colorName: ColorName) => {
    const colorMap = {
      green: { bg: "rgba(16, 185, 129, 0.1)", dot: "#10B981", text: "#10B981" },
      yellow: {
        bg: "rgba(245, 158, 11, 0.1)",
        dot: "#F59E0B",
        text: "#F59E0B",
      },
      blue: { bg: "rgba(59, 130, 246, 0.1)", dot: "#3B82F6", text: "#3B82F6" },
      purple: {
        bg: "rgba(139, 92, 246, 0.1)",
        dot: "#8B5CF6",
        text: "#8B5CF6",
      },
      red: { bg: "rgba(239, 68, 68, 0.1)", dot: "#EF4444", text: "#EF4444" },
      gray: { bg: "rgba(107, 114, 128, 0.1)", dot: "#6B7280", text: "#6B7280" },
    };

    return colorMap[colorName] || colorMap.gray;
  };

  const statusColors = getStatusColors(color);

  // Create active style based on the status color
  const activeStyle = isActive
    ? {
        backgroundColor: `${statusColors.dot}20`, // 20% opacity of the status color
        borderColor: statusColors.dot,
        transform: [{ scale: 1.05 }],
        borderBottomWidth: 1.5,
        borderBottomColor: statusColors.dot,
      }
    : {
        borderBottomWidth: 1.5,
        borderBottomColor: statusColors.dot,
      };

  return (
    <TouchableOpacity
      style={[
        styles.queryStatusTag,
        !showLabel && styles.clickable,
        activeStyle,
      ]}
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {showLabel && (
        <Text style={[styles.label, { color: statusColors.text }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.countContainer,
          count > 0 && {
            backgroundColor: statusColors.bg,
          },
        ]}
      >
        <Text
          style={[
            styles.count,
            count > 0 && {
              color: getStatusColors(color).text,
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  queryStatusTag: {
    flexDirection: "row",
    gap: 4, // Reduced gap since no dot
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 6,
    padding: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    flexShrink: 1, // Allow badges to shrink if needed
    minWidth: 24, // Reduced minimum width since no dot
  },
  clickable: {
    // cursor: 'pointer', // This doesn't exist in React Native
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  countContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    minWidth: 20,
  },
  count: {
    fontSize: 10,
    color: "#9CA3AF",
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  tooltip: {
    position: "absolute",
    zIndex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    top: "100%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: 8 }],
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tooltipText: {
    fontSize: 11,
    color: "#FFFFFF",
  },
});

export default QueryStatus;
