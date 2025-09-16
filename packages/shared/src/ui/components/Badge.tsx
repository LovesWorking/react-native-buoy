import { View, Text, StyleSheet, ViewStyle } from "react-native";
import type { ReactNode } from "react";

// Badge variants
export type BadgeVariant =
  | "default"
  | "status"
  | "count"
  | "type"
  | "method"
  | "outline";
export type BadgeSize = "small" | "medium" | "large";

// Color mapping for common statuses
const STATUS_COLORS: Record<string, string> = {
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  pending: "#8B5CF6",
  active: "#10B981",
  inactive: "#6B7280",
  stale: "#F59E0B",
  fetching: "#3B82F6",
};

// Color mapping for HTTP methods
const METHOD_COLORS: Record<string, string> = {
  GET: "#10B981",
  POST: "#3B82F6",
  PUT: "#F59E0B",
  PATCH: "#8B5CF6",
  DELETE: "#EF4444",
  HEAD: "#6B7280",
  OPTIONS: "#14B8A6",
};

// Base Badge component
interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  color?: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function Badge({
  children,
  variant = "default",
  color = "#E5E7EB",
  size = "medium",
  style,
}: BadgeProps) {
  const badgeStyles = getBadgeStyles(variant, color, size);

  return <View style={[badgeStyles.container, style]}>{children}</View>;
}

// Status Badge for success/error/warning states
interface StatusBadgeProps {
  status: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function StatusBadge({
  status,
  size = "medium",
  style,
}: StatusBadgeProps) {
  const color = STATUS_COLORS[status.toLowerCase()] || "#6B7280";
  const badgeStyles = getBadgeStyles("status", color, size);

  return (
    <View style={[badgeStyles.container, style]}>
      <View style={[styles.statusDot, { backgroundColor: color }]} />
      <Text style={[badgeStyles.text, { color }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

// Count Badge for displaying numbers
interface CountBadgeProps {
  count: number | string;
  color?: string;
  size?: BadgeSize;
  style?: ViewStyle;
  maxCount?: number;
}

export function CountBadge({
  count,
  color = "#3B82F6",
  size = "small",
  style,
  maxCount = 99,
}: CountBadgeProps) {
  const displayCount =
    typeof count === "number" && count > maxCount ? `${maxCount}+` : count;
  const badgeStyles = getBadgeStyles("count", color, size);

  return (
    <View style={[badgeStyles.container, styles.countBadge, style]}>
      <Text style={[badgeStyles.text, { color }]}>{displayCount}</Text>
    </View>
  );
}

// Type Badge for data types
interface TypeBadgeProps {
  type: string;
  color?: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function TypeBadge({
  type,
  color,
  size = "small",
  style,
}: TypeBadgeProps) {
  const typeColor = color || getTypeColor(type);
  const badgeStyles = getBadgeStyles("type", typeColor, size);

  return (
    <View style={[badgeStyles.container, style]}>
      <Text style={[badgeStyles.text, { color: typeColor }]}>{type}</Text>
    </View>
  );
}

// Method Badge for HTTP methods
interface MethodBadgeProps {
  method: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function MethodBadge({
  method,
  size = "medium",
  style,
}: MethodBadgeProps) {
  const color = METHOD_COLORS[method.toUpperCase()] || "#6B7280";
  const badgeStyles = getBadgeStyles("method", color, size);

  return (
    <View style={[badgeStyles.container, styles.methodBadge, style]}>
      <Text style={[badgeStyles.text, styles.methodText, { color }]}>
        {method.toUpperCase()}
      </Text>
    </View>
  );
}

// Helper function to get badge styles
function getBadgeStyles(variant: BadgeVariant, color: string, size: BadgeSize) {
  const isOutline = variant === "outline";
  const backgroundColor = isOutline ? "transparent" : `${color}15`;
  const borderColor = `${color}40`;

  const sizeStyles = {
    small: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      fontSize: 11,
    },
    medium: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      fontSize: 12,
    },
    large: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      fontSize: 14,
    },
  };

  const { paddingHorizontal, paddingVertical, fontSize } = sizeStyles[size];

  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor,
      borderColor,
      borderWidth: 1,
      borderRadius: variant === "count" ? 12 : 4,
      paddingHorizontal,
      paddingVertical,
    },
    text: {
      fontSize,
      fontWeight: "600",
    },
  });
}

// Helper function to get type color
function getTypeColor(type: string): string {
  const typeColors: Record<string, string> = {
    string: "#10B981",
    number: "#3B82F6",
    boolean: "#8B5CF6",
    object: "#F59E0B",
    array: "#14B8A6",
    null: "#6B7280",
    undefined: "#6B7280",
    function: "#EC4899",
  };
  return typeColors[type.toLowerCase()] || "#6B7280";
}

const styles = StyleSheet.create({
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  countBadge: {
    minWidth: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  methodBadge: {
    minWidth: 45,
    alignItems: "center",
  },
  methodText: {
    fontWeight: "700",
  },
});
