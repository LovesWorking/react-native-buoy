/**
 * IdentifierBadge
 *
 * Shared badge component for displaying component identifiers.
 * Used throughout the highlight-updates package for consistent styling.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Box, Hash, Layers, Eye, Search, FileCode } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";

// All possible identifier types
export type IdentifierType =
  | "viewType"
  | "testID"
  | "nativeID"
  | "component"
  | "accessibilityLabel"
  | "nativeTag"
  | "any";

// Badge configuration for each identifier type
export const IDENTIFIER_CONFIG: Record<
  IdentifierType,
  { label: string; shortLabel: string; color: string; icon: typeof Box }
> = {
  viewType: {
    label: "ViewType",
    shortLabel: "View",
    color: macOSColors.semantic.info,
    icon: Box,
  },
  testID: {
    label: "testID",
    shortLabel: "test",
    color: macOSColors.semantic.success,
    icon: Hash,
  },
  nativeID: {
    label: "nativeID",
    shortLabel: "native",
    color: "#f59e0b", // amber
    icon: Hash,
  },
  component: {
    label: "Component",
    shortLabel: "Comp",
    color: "#a855f7", // purple
    icon: FileCode,
  },
  accessibilityLabel: {
    label: "a11y",
    shortLabel: "a11y",
    color: "#ec4899", // pink
    icon: Eye,
  },
  nativeTag: {
    label: "tag",
    shortLabel: "tag",
    color: macOSColors.text.muted,
    icon: Layers,
  },
  any: {
    label: "Any",
    shortLabel: "Any",
    color: macOSColors.semantic.warning,
    icon: Search,
  },
};

interface IdentifierBadgeProps {
  type: IdentifierType;
  value: string;
  /** Use compact mode for list items */
  compact?: boolean;
  /** Show only the badge without value */
  badgeOnly?: boolean;
  /** Show only the value without badge */
  valueOnly?: boolean;
  /** Use short label */
  shortLabel?: boolean;
  /** Show icon in badge */
  showIcon?: boolean;
}

export function IdentifierBadge({
  type,
  value,
  compact = false,
  badgeOnly = false,
  valueOnly = false,
  shortLabel = false,
  showIcon = false,
}: IdentifierBadgeProps) {
  const config = IDENTIFIER_CONFIG[type];
  const IconComponent = config.icon;
  const label = shortLabel ? config.shortLabel : config.label;

  if (valueOnly) {
    return (
      <Text
        style={[
          styles.valueOnly,
          compact && styles.valueOnlyCompact,
          { color: config.color },
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    );
  }

  if (badgeOnly) {
    return (
      <View
        style={[
          styles.badgeOnly,
          compact && styles.badgeOnlyCompact,
          { backgroundColor: config.color + "20", borderColor: config.color + "40" },
        ]}
      >
        {showIcon && <IconComponent size={compact ? 10 : 12} color={config.color} />}
        <Text style={[styles.badgeOnlyText, compact && styles.badgeOnlyTextCompact, { color: config.color }]}>
          {label}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View
        style={[
          styles.badge,
          compact && styles.badgeCompact,
          { backgroundColor: config.color + "20" },
        ]}
      >
        {showIcon && <IconComponent size={compact ? 8 : 10} color={config.color} />}
        <Text style={[styles.badgeText, compact && styles.badgeTextCompact, { color: config.color }]}>
          {label}
        </Text>
      </View>
      <Text
        style={[styles.value, compact && styles.valueCompact]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// Standalone badge (no value) for category selection
interface CategoryBadgeProps {
  type: IdentifierType;
  count?: number;
  isSelected?: boolean;
  showIcon?: boolean;
}

export function CategoryBadge({
  type,
  count,
  isSelected = false,
  showIcon = true,
}: CategoryBadgeProps) {
  const config = IDENTIFIER_CONFIG[type];
  const IconComponent = config.icon;

  return (
    <View
      style={[
        styles.categoryBadge,
        {
          backgroundColor: config.color + "15",
          borderColor: isSelected ? config.color : config.color + "40",
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      {showIcon && <IconComponent size={12} color={config.color} />}
      <Text style={[styles.categoryBadgeText, { color: config.color }]}>
        {config.label}
      </Text>
      {count !== undefined && (
        <View style={[styles.categoryBadgeCount, { backgroundColor: config.color + "25" }]}>
          <Text style={[styles.categoryBadgeCountText, { color: config.color }]}>
            {count}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Full badge with value
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  containerCompact: {
    gap: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
    gap: 4,
  },
  badgeCompact: {
    paddingVertical: 2,
    paddingHorizontal: 5,
    gap: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextCompact: {
    fontSize: 9,
  },
  value: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },
  valueCompact: {
    fontSize: 11,
  },

  // Badge only (no value)
  badgeOnly: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    gap: 5,
  },
  badgeOnlyCompact: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    gap: 4,
  },
  badgeOnlyText: {
    fontSize: 11,
    fontWeight: "600",
  },
  badgeOnlyTextCompact: {
    fontSize: 9,
    fontWeight: "700",
  },

  // Value only
  valueOnly: {
    fontSize: 12,
    fontFamily: "monospace",
  },
  valueOnlyCompact: {
    fontSize: 11,
  },

  // Category badge (for filter selection)
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingLeft: 10,
    paddingRight: 6,
    borderRadius: 8,
    gap: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  categoryBadgeCount: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  categoryBadgeCountText: {
    fontSize: 10,
    fontWeight: "600",
  },
});

export default IdentifierBadge;
