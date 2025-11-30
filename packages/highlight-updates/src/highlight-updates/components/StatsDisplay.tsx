/**
 * StatsDisplay
 *
 * Isolated component for displaying render statistics in the header.
 * Subscribes to RenderTracker updates independently so parent header
 * doesn't re-render when stats change.
 *
 * Following the optimization guide: move subscriptions to child components.
 */

import React, { useState, useEffect, memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Activity, macOSColors } from "@react-buoy/shared-ui";
import { RenderTracker } from "../utils/RenderTracker";

/**
 * Isolated stats display that owns its own subscription.
 * Only this component re-renders when stats change.
 */
function StatsDisplayInner() {
  const [stats, setStats] = useState({ totalComponents: 0, totalRenders: 0 });

  useEffect(() => {
    const unsubscribe = RenderTracker.subscribe(() => {
      setStats(RenderTracker.getStats());
    });

    return unsubscribe;
  }, []);

  return (
    <View nativeID="__rn_buoy__stats-row" style={styles.headerChipRow}>
      <View style={styles.headerChip}>
        <Activity size={12} color={macOSColors.semantic.info} />
        <Text
          style={[
            styles.headerChipValue,
            { color: macOSColors.semantic.info },
          ]}
        >
          {stats.totalComponents}
        </Text>
        <Text style={styles.headerChipLabel}>components</Text>
      </View>

      <View style={styles.headerChip}>
        <Text
          style={[
            styles.headerChipValue,
            { color: macOSColors.semantic.warning },
          ]}
        >
          {stats.totalRenders}
        </Text>
        <Text style={styles.headerChipLabel}>renders</Text>
      </View>
    </View>
  );
}

export const StatsDisplay = memo(StatsDisplayInner);

const styles = StyleSheet.create({
  headerChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: macOSColors.background.hover,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  headerChipValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  headerChipLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "500",
  },
});

export default StatsDisplay;
