/**
 * RenderCauseBadge
 *
 * Displays a colored badge indicating why a component rendered.
 * Used in RenderListItem and RenderDetailView.
 *
 * TWO-LEVEL CAUSATION:
 * Shows both the native-level cause (what props changed on the native view)
 * and the component-level cause (why the React component re-rendered).
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";
import type { RenderCause, RenderCauseType, ComponentCauseType } from "../utils/RenderTracker";

// Badge configuration for each cause type
interface CauseConfig {
  label: string;
  color: string;
  tip: string;
}

export const CAUSE_CONFIG: Record<RenderCauseType, CauseConfig> = {
  mount: {
    label: "MOUNT",
    color: macOSColors.semantic.success,
    tip: "First render of this component.",
  },
  props: {
    label: "PROPS",
    color: macOSColors.semantic.warning,
    tip: "Native props changed. Consider React.memo() or useCallback for handlers.",
  },
  state: {
    label: "STATE",
    color: "#a855f7", // purple
    tip: "Component state changed via setState.",
  },
  hooks: {
    label: "HOOKS",
    color: "#ec4899", // pink
    tip: "Hook values changed (useState, useReducer, useMemo, etc.).",
  },
  context: {
    label: "CONTEXT",
    color: "#06b6d4", // cyan
    tip: "React context value changed.",
  },
  parent: {
    label: "PARENT",
    color: macOSColors.text.secondary,
    tip: "Parent component re-rendered. Consider wrapping with React.memo().",
  },
  unknown: {
    label: "?",
    color: macOSColors.text.muted,
    tip: "Could not determine render cause.",
  },
};

// Component-level cause configuration
export const COMPONENT_CAUSE_CONFIG: Record<ComponentCauseType, CauseConfig> = {
  mount: {
    label: "mount",
    color: macOSColors.semantic.success,
    tip: "First render of this component.",
  },
  props: {
    label: "props",
    color: macOSColors.semantic.warning,
    tip: "Component received different props from parent.",
  },
  state: {
    label: "state",
    color: "#a855f7", // purple
    tip: "Component's own state changed (useState/useReducer).",
  },
  parent: {
    label: "parent",
    color: macOSColors.text.secondary,
    tip: "Parent re-rendered but this component's props/state didn't change. Consider React.memo().",
  },
  unknown: {
    label: "?",
    color: macOSColors.text.muted,
    tip: "Could not determine component render cause.",
  },
};

interface RenderCauseBadgeProps {
  cause: RenderCause;
  compact?: boolean;
  showKeys?: boolean; // Show changed keys inline
  showTwoLevel?: boolean; // Show two-level causation (component → native)
}

export function RenderCauseBadge({
  cause,
  compact = false,
  showKeys = false,
  showTwoLevel = false,
}: RenderCauseBadgeProps) {
  const config = CAUSE_CONFIG[cause.type];
  const componentConfig = cause.componentCause
    ? COMPONENT_CAUSE_CONFIG[cause.componentCause]
    : null;

  // For two-level display: "Component (parent) → Native (PROPS)"
  const showComponentCause = showTwoLevel && componentConfig && cause.componentCause !== cause.type;

  return (
    <View
      nativeID="__rn_buoy__cause-badge"
      style={[styles.container, compact && styles.containerCompact]}
    >
      {/* Component-level cause (if two-level enabled) */}
      {showComponentCause && (
        <>
          <View
            style={[
              styles.badge,
              compact && styles.badgeCompact,
              styles.componentBadge,
              { backgroundColor: componentConfig.color + "15" },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                compact && styles.badgeTextCompact,
                styles.componentBadgeText,
                { color: componentConfig.color },
              ]}
            >
              {componentConfig.label}
            </Text>
          </View>
          <Text style={[styles.arrowText, compact && styles.arrowTextCompact]}>→</Text>
        </>
      )}

      {/* Native-level cause (always shown) */}
      <View
        style={[
          styles.badge,
          compact && styles.badgeCompact,
          { backgroundColor: config.color + "20" },
        ]}
      >
        <Text
          style={[
            styles.badgeText,
            compact && styles.badgeTextCompact,
            { color: config.color },
          ]}
        >
          {config.label}
        </Text>
      </View>

      {showKeys && cause.changedKeys && cause.changedKeys.length > 0 && (
        <Text
          style={[styles.keysText, compact && styles.keysTextCompact]}
          numberOfLines={1}
        >
          {cause.changedKeys.join(", ")}
        </Text>
      )}

      {showKeys && cause.hookIndices && cause.hookIndices.length > 0 && (
        <Text
          style={[styles.keysText, compact && styles.keysTextCompact]}
          numberOfLines={1}
        >
          Hook {cause.hookIndices.join(", ")}
        </Text>
      )}
    </View>
  );
}

/**
 * TwoLevelCauseBadge - A more detailed badge for detail views
 * Shows: "ComponentName re-rendered due to PARENT → native PROPS [style]"
 */
export function TwoLevelCauseBadge({
  cause,
}: {
  cause: RenderCause;
}) {
  const nativeConfig = CAUSE_CONFIG[cause.type];
  const componentConfig = cause.componentCause
    ? COMPONENT_CAUSE_CONFIG[cause.componentCause]
    : null;

  const componentName = cause.componentName || "Component";

  return (
    <View nativeID="__rn_buoy__two-level-cause" style={styles.twoLevelContainer}>
      {/* Component level explanation */}
      {componentConfig && (
        <View style={styles.twoLevelRow}>
          <Text style={styles.twoLevelLabel}>Component:</Text>
          <Text style={styles.twoLevelName}>{componentName}</Text>
          <Text style={styles.twoLevelText}>re-rendered due to</Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: componentConfig.color + "20" },
            ]}
          >
            <Text style={[styles.badgeText, { color: componentConfig.color }]}>
              {componentConfig.label.toUpperCase()}
            </Text>
          </View>
        </View>
      )}

      {/* Native level explanation */}
      <View style={styles.twoLevelRow}>
        <Text style={styles.twoLevelLabel}>Native:</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: nativeConfig.color + "20" },
          ]}
        >
          <Text style={[styles.badgeText, { color: nativeConfig.color }]}>
            {nativeConfig.label}
          </Text>
        </View>
        {cause.changedKeys && cause.changedKeys.length > 0 && (
          <Text style={styles.twoLevelKeys}>
            [{cause.changedKeys.join(", ")}]
          </Text>
        )}
      </View>

    </View>
  );
}

/**
 * EnhancedCauseDisplay - Phase 5: Comprehensive cause display
 * Shows detailed breakdown of why a component rendered with clear sections
 */
export function EnhancedCauseDisplay({
  cause,
  nativeType,
}: {
  cause: RenderCause;
  nativeType?: string;
}) {
  const nativeConfig = CAUSE_CONFIG[cause.type];
  const componentConfig = cause.componentCause
    ? COMPONENT_CAUSE_CONFIG[cause.componentCause]
    : null;

  const componentName = cause.componentName || "Unknown";
  const hasHookChanges = cause.hookChanges && cause.hookChanges.length > 0;
  const hasChangedKeys = cause.changedKeys && cause.changedKeys.length > 0;

  // Separate ref-only changes from actual value changes
  const refOnlyChanges = cause.changedKeys?.filter(k => k.includes("(ref only)") || k.includes("(fn ref)")) || [];
  const valueChanges = cause.changedKeys?.filter(k => !k.includes("(ref only)") && !k.includes("(fn ref)")) || [];

  return (
    <View nativeID="__rn_buoy__enhanced-cause" style={styles.enhancedContainer}>
      {/* Header with component name and flow */}
      <View style={styles.enhancedHeader}>
        <Text style={styles.enhancedComponentName}>{componentName}</Text>
        {nativeType && (
          <View style={styles.enhancedNativeTag}>
            <Text style={styles.enhancedNativeTagText}>{nativeType}</Text>
          </View>
        )}
      </View>

      {/* Cause Flow: STATE → PROPS */}
      <View style={styles.enhancedFlowContainer}>
        <Text style={styles.enhancedFlowLabel}>Cause:</Text>
        {componentConfig && (
          <View
            style={[
              styles.enhancedFlowBadge,
              { backgroundColor: componentConfig.color + "20" },
            ]}
          >
            <Text style={[styles.enhancedFlowBadgeText, { color: componentConfig.color }]}>
              {componentConfig.label.toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.enhancedFlowArrow}>→</Text>
        <View
          style={[
            styles.enhancedFlowBadge,
            { backgroundColor: nativeConfig.color + "20" },
          ]}
        >
          <Text style={[styles.enhancedFlowBadgeText, { color: nativeConfig.color }]}>
            {nativeConfig.label}
          </Text>
        </View>
      </View>

      {/* Component State Changes (Hook changes) */}
      {hasHookChanges && (
        <View style={styles.enhancedSection}>
          <Text style={styles.enhancedSectionTitle}>Component State Changed:</Text>
          {cause.hookChanges!.map((hook) => (
            <View key={hook.index} style={styles.enhancedChangeRow}>
              <Text style={styles.enhancedChangeIcon}>⚡</Text>
              <Text style={styles.enhancedChangeText}>
                Hook[{hook.index}] ({hook.type}): {hook.description}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Native Props Changed - Value changes */}
      {valueChanges.length > 0 && (
        <View style={styles.enhancedSection}>
          <Text style={styles.enhancedSectionTitle}>Native Props Changed:</Text>
          {valueChanges.map((key, index) => (
            <View key={index} style={styles.enhancedChangeRow}>
              <Text style={styles.enhancedChangeIcon}>~</Text>
              <Text style={styles.enhancedChangeText}>{key}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reference-only changes (optimization hints) */}
      {refOnlyChanges.length > 0 && (
        <View style={styles.enhancedSection}>
          <Text style={[styles.enhancedSectionTitle, { color: macOSColors.text.muted }]}>
            Reference Changes (optimization opportunity):
          </Text>
          {refOnlyChanges.map((key, index) => (
            <View key={index} style={styles.enhancedChangeRow}>
              <Text style={[styles.enhancedChangeIcon, { color: macOSColors.text.muted }]}>○</Text>
              <Text style={[styles.enhancedChangeText, { color: macOSColors.text.muted }]}>{key}</Text>
            </View>
          ))}
        </View>
      )}

      {/* No changes detected */}
      {!hasHookChanges && !hasChangedKeys && cause.type !== "mount" && (
        <View style={styles.enhancedSection}>
          <Text style={styles.enhancedNoChanges}>
            {cause.type === "parent"
              ? "Parent re-rendered (consider React.memo)"
              : "No specific changes detected"}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  containerCompact: {
    gap: 4,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeCompact: {
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  componentBadge: {
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  badgeTextCompact: {
    fontSize: 9,
  },
  componentBadgeText: {
    fontWeight: "500",
    textTransform: "lowercase",
  },
  arrowText: {
    fontSize: 10,
    color: macOSColors.text.muted,
  },
  arrowTextCompact: {
    fontSize: 9,
  },
  keysText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    flex: 1,
  },
  keysTextCompact: {
    fontSize: 10,
  },
  // Two-level badge styles
  twoLevelContainer: {
    gap: 8,
  },
  twoLevelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  twoLevelLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    minWidth: 70,
  },
  twoLevelName: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  twoLevelText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
  },
  twoLevelKeys: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  // Enhanced cause display styles (Phase 5)
  enhancedContainer: {
    gap: 12,
  },
  enhancedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  enhancedComponentName: {
    fontSize: 14,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  enhancedNativeTag: {
    backgroundColor: macOSColors.background.input,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  enhancedNativeTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
  enhancedFlowContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: macOSColors.background.input,
    borderRadius: 6,
  },
  enhancedFlowLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
  },
  enhancedFlowBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  enhancedFlowBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  enhancedFlowArrow: {
    fontSize: 14,
    color: macOSColors.text.muted,
    fontWeight: "300",
  },
  enhancedSection: {
    gap: 6,
  },
  enhancedSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    letterSpacing: 0.3,
  },
  enhancedChangeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingLeft: 4,
  },
  enhancedChangeIcon: {
    fontSize: 12,
    color: macOSColors.semantic.warning,
    fontFamily: "monospace",
    width: 16,
  },
  enhancedChangeText: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },
  enhancedNoChanges: {
    fontSize: 12,
    color: macOSColors.text.muted,
    fontStyle: "italic",
    paddingLeft: 4,
  },
});

export default RenderCauseBadge;
