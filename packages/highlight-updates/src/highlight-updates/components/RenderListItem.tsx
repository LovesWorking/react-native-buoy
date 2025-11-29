/**
 * RenderListItem
 *
 * Compact list item showing a tracked component render.
 * Displays viewType, identifier (testID/nativeID/component), render count, and timing.
 */

import React, { memo, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight, macOSColors } from "@react-buoy/shared-ui";
import type { TrackedRender } from "../utils/RenderTracker";

interface RenderListItemProps {
  render: TrackedRender;
  onPress: (render: TrackedRender) => void;
}

function RenderListItemInner({ render, onPress }: RenderListItemProps) {
  // Get best identifier to show
  const identifier = useMemo(() => {
    if (render.testID) return { label: "testID", value: render.testID };
    if (render.nativeID) return { label: "nativeID", value: render.nativeID };
    if (render.componentName) return { label: "component", value: render.componentName };
    if (render.accessibilityLabel) return { label: "a11y", value: render.accessibilityLabel };
    return { label: "tag", value: String(render.nativeTag) };
  }, [render.testID, render.nativeID, render.componentName, render.accessibilityLabel, render.nativeTag]);

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
        {/* Top row: viewType and render count */}
        <View style={styles.topRow}>
          <View style={styles.viewTypeContainer}>
            <Text style={styles.viewType} numberOfLines={1}>
              {render.viewType}
            </Text>
          </View>
          <View style={[styles.renderCountBadge, { backgroundColor: render.color + "30" }]}>
            <Text style={[styles.renderCount, { color: render.color }]}>
              {render.renderCount}x
            </Text>
          </View>
        </View>

        {/* Bottom row: identifier and timing */}
        <View style={styles.bottomRow}>
          <Text style={styles.identifierLabel}>{identifier.label}:</Text>
          <Text style={styles.identifierValue} numberOfLines={1}>
            {identifier.value}
          </Text>
          <Text style={styles.timing}>{timeSinceRender}</Text>
        </View>
      </View>

      <ChevronRight size={16} color={macOSColors.text.muted} />
    </TouchableOpacity>
  );
}

export const RenderListItem = memo(RenderListItemInner);

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
    fontFamily: "monospace",
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
  },
  identifierLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "500",
    marginRight: 4,
  },
  identifierValue: {
    flex: 1,
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  timing: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "500",
  },
});

export default RenderListItem;
