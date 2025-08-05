import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackButton } from "../../../_shared/ui/components/BackButton";

import { ConsoleTransportEntry } from "../../../_shared/logger/types";
import {
  formatTimestamp,
  getLevelDotStyle,
  getLevelTextColor,
  getTypeColor,
  getTypeIcon,
} from "../utils";

interface DetailHeaderProps {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}

export const DetailHeader = memo(({ entry, onBack }: DetailHeaderProps) => {
  const IconComponent = getTypeIcon(entry.type);
  const typeColor = getTypeColor(entry.type);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={onBack}
          color="#8B5CF6"
          size={16}
          accessibilityLabel="Back to sentry log list"
          accessibilityHint="Return to sentry log entries list"
        />
        <Text style={styles.headerTitle}>Sentry Event Details</Text>
      </View>

      {/* Meta row with type, level and timestamp */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          {/* Type indicator */}
          <View style={styles.typeIndicator}>
            {IconComponent && <IconComponent size={14} color={typeColor} />}
            <Text style={[styles.typeText, { color: typeColor }]}>
              {entry.type}
            </Text>
          </View>

          {/* Level indicator */}
          <View style={[styles.levelDot, getLevelDotStyle(entry.level)]} />
          <Text
            style={[
              styles.levelText,
              { color: getLevelTextColor(entry.level) },
            ]}
          >
            {entry.level.toUpperCase()}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(entry.timestamp)}</Text>
      </View>
    </View>
  );
});

DetailHeader.displayName = "DetailHeader";

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  headerTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
    flex: 1,
    textAlign: "center",
    marginRight: 64,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  levelDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  levelText: {
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  timestamp: {
    color: "#9CA3AF",
    fontSize: 14,
    fontFamily: "monospace",
  },
});
