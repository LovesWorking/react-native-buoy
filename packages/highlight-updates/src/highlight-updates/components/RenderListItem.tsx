/**
 * RenderListItem
 *
 * Compact list item showing a tracked component render.
 * Displays viewType, identifier (testID/nativeID/component), render count, and timing.
 */

import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight, macOSColors } from "@react-buoy/shared-ui";
import type { TrackedRender } from "../utils/RenderTracker";
import { IdentifierBadge, type IdentifierType } from "./IdentifierBadge";

interface RenderListItemProps {
  render: TrackedRender;
  onPress: (render: TrackedRender) => void;
}

function RenderListItemInner({ render, onPress }: RenderListItemProps) {
  // Get best identifier to show (primary)
  const identifier = useMemo((): { type: IdentifierType; value: string } => {
    if (render.testID) return { type: "testID", value: render.testID };
    if (render.nativeID) return { type: "nativeID", value: render.nativeID };
    if (render.componentName) return { type: "component", value: render.componentName };
    if (render.accessibilityLabel) return { type: "accessibilityLabel", value: render.accessibilityLabel };
    return { type: "nativeTag", value: String(render.nativeTag) };
  }, [render.testID, render.nativeID, render.componentName, render.accessibilityLabel, render.nativeTag]);

  // Get secondary identifier (accessibilityLabel if not already primary)
  const secondaryIdentifier = useMemo((): { type: IdentifierType; value: string } | null => {
    if (render.accessibilityLabel && identifier.type !== "accessibilityLabel") {
      return { type: "accessibilityLabel", value: render.accessibilityLabel };
    }
    return null;
  }, [render.accessibilityLabel, identifier.type]);

  // Format time since last render
  const timeSinceRender = useMemo(() => {
    const diff = Date.now() - render.lastRenderTime;
    if (diff < 1000) return "just now";
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }, [render.lastRenderTime]);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(render)}
      activeOpacity={0.7}
    >
      {/* Color indicator matching highlight color */}
      <View style={[styles.colorIndicator, { backgroundColor: render.color }]} />

      <View style={styles.content}>
        {/* Top row: displayName and render count */}
        <View style={styles.topRow}>
          <View style={styles.viewTypeContainer}>
            <Text style={styles.viewType} numberOfLines={1}>
              {render.displayName}
            </Text>
            {/* Show secondary identifier (accessibilityLabel) if available, otherwise fall back to native type */}
            {secondaryIdentifier ? (
              <IdentifierBadge
                type={secondaryIdentifier.type}
                value={secondaryIdentifier.value}
                compact
                shortLabel
              />
            ) : render.displayName !== render.viewType ? (
              <Text style={styles.nativeType} numberOfLines={1}>
                {render.viewType}
              </Text>
            ) : null}
          </View>
          <View style={[styles.renderCountBadge, { backgroundColor: render.color + "30" }]}>
            <Text style={[styles.renderCount, { color: render.color }]}>
              {render.renderCount}x
            </Text>
          </View>
        </View>

        {/* Bottom row: primary identifier and timing */}
        <View style={styles.bottomRow}>
          <View style={styles.identifierContainer}>
            <IdentifierBadge
              type={identifier.type}
              value={identifier.value}
              compact
              shortLabel
            />
          </View>
          <Text style={styles.timing}>{timeSinceRender}</Text>
        </View>
      </View>

      <ChevronRight size={16} color={macOSColors.text.muted} />
    </TouchableOpacity>
  );
}

// Memoize with custom comparison - only re-render when relevant props change
// This is critical for performance when the modal is open during rapid renders
export const RenderListItem = React.memo(RenderListItemInner, (prevProps, nextProps) => {
  // Return true if props are EQUAL (skip re-render)
  // Return false if props are DIFFERENT (trigger re-render)
  const prevRender = prevProps.render;
  const nextRender = nextProps.render;

  return (
    prevRender.id === nextRender.id &&
    prevRender.renderCount === nextRender.renderCount &&
    prevRender.color === nextRender.color &&
    prevRender.lastRenderTime === nextRender.lastRenderTime &&
    prevProps.onPress === nextProps.onPress
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginBottom: 6,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  colorIndicator: {
    width: 4,
    height: 36,
    borderRadius: 2,
    marginRight: 10,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  viewTypeContainer: {
    flex: 1,
    marginRight: 8,
  },
  viewType: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
  },
  nativeType: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    marginTop: 1,
  },
  accessibilityLabel: {
    fontSize: 10,
    color: macOSColors.semantic.info,
    fontStyle: "italic",
    marginTop: 1,
  },
  renderCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  renderCount: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  identifierContainer: {
    flex: 1,
    flexShrink: 1,
    overflow: "hidden",
  },
  timing: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "500",
    flexShrink: 0,
  },
});

export default RenderListItem;
