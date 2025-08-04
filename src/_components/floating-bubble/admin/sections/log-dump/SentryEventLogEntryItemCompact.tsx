import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { ConsoleTransportEntry } from "../../logger/types";
import {
  formatTimestamp,
  getLevelBorderColor,
  getTypeIcon,
  getTypeColor,
} from "./utils";

interface SentryEventLogEntryItemProps {
  entry: ConsoleTransportEntry;
  onSelectEntry: (entry: ConsoleTransportEntry) => void;
}

// Compact version of the event card - single line layout [[memory:4875251]]
export const SentryEventLogEntryItem = React.memo<SentryEventLogEntryItemProps>(
  ({ entry, onSelectEntry }) => {
    const IconComponent = getTypeIcon(entry.type);
    const typeColor = getTypeColor(entry.type);
    const levelColor = getLevelBorderColor(entry.level);

    return (
      <TouchableOpacity
        sentry-label={`ignore sentry log entry ${entry.message}`}
        accessibilityLabel={`Sentry log entry: ${entry.message}`}
        accessibilityHint="View full sentry log entry details"
        accessibilityRole="button"
        onPress={() => onSelectEntry(entry)}
        style={[styles.container, { borderLeftColor: levelColor }]}
      >
        {/* Left section: Type icon only */}
        <View style={styles.leftSection}>
          <View
            style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}
          >
            {IconComponent && <IconComponent size={14} color={typeColor} />}
          </View>
        </View>

        {/* Middle section: Message and badge */}
        <View style={styles.middleSection}>
          <View style={styles.messageRow}>
            {entry.metadata.sentryEventType ? (
              <Text style={styles.badge}>
                {String(entry.metadata.sentryEventType)}
              </Text>
            ) : null}
            <Text style={styles.message} numberOfLines={1}>
              {String(entry.message)}
            </Text>
          </View>
        </View>

        {/* Right section: Timestamp and chevron */}
        <View style={styles.rightSection}>
          <Text style={styles.timestamp}>
            {formatTimestamp(entry.timestamp)}
          </Text>
          <ChevronRight size={14} color="#6B7280" />
        </View>
      </TouchableOpacity>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    paddingLeft: 8,
    marginBottom: 4,
    marginHorizontal: 16,
    minHeight: 36,
    borderLeftWidth: 3,
    borderLeftColor: "transparent", // Will be overridden by inline style
  },
  leftSection: {
    alignItems: "center",
    marginRight: 10,
  },
  typeIcon: {
    padding: 4,
    borderRadius: 4,
  },

  middleSection: {
    flex: 1,
    justifyContent: "center",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badge: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "600",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: "hidden",
  },
  message: {
    color: "#E5E7EB",
    fontSize: 13,
    flex: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 10,
  },
  timestamp: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "monospace",
  },
});
