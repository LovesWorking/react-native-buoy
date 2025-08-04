import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";

interface QueryStatusProps {
  label: string;
  color: "green" | "yellow" | "gray" | "blue" | "purple" | "red";
  count: number;
  showLabel?: boolean;
  isActive?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onTouchStart?: (event: GestureResponderEvent) => void;
}

type ColorName = "green" | "yellow" | "gray" | "blue" | "purple" | "red";

const QueryStatus: React.FC<QueryStatusProps> = ({
  label,
  color,
  count,
  showLabel = true,
  isActive = false,
  onPress,
  onTouchStart,
}) => {
  // Modern color mapping for status indicators - hybrid approach
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

  // Create active style based on the status color (from old version)
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
      sentry-label="ignore devtools query status"
      style={[
        styles.queryStatusTag,
        !showLabel && styles.clickable,
        activeStyle,
      ]}
      disabled={!onPress}
      onPress={onPress}
      onPressIn={onTouchStart}
      activeOpacity={0.7}
    >
      {showLabel && (
        <Text
          style={[styles.label, { color: statusColors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
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
    gap: 6, // Spacing between label and count
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 8, // Slightly more rounded than old version
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    flexShrink: 0, // Don't shrink below content size
    flexGrow: 0, // Don't grow unless needed
    minHeight: 28, // Ensure adequate height for text
    maxHeight: 28, // Increased height limit for better text display
  },
  clickable: {
    // Placeholder for clickable styles
  },
  label: {
    fontSize: 12, // Slightly larger than old version
    fontWeight: "500",
    color: "#FFFFFF", // Will be overridden by dynamic color
    flexShrink: 1, // Allow label to shrink if needed
    minWidth: 0, // Allow text to shrink below intrinsic width
  },
  countContainer: {
    height: 20,
    paddingHorizontal: 8, // More padding for better balance
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6, // More rounded
    minWidth: 24, // Ensure space for 2+ digits
    flexShrink: 0, // Don't shrink the count container
  },
  count: {
    fontSize: 11, // Slightly larger for better readability
    color: "#9CA3AF", // Will be overridden by dynamic color
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    textAlign: "center",
  },
});

export default QueryStatus;
