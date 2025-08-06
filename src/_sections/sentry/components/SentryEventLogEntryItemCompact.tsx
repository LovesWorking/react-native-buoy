import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { ConsoleTransportEntry } from "../../../_shared/logger/types";
import {
  getLevelBorderColor,
  getTypeIcon,
  getTypeColor,
} from "../../log-dump/utils";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { useTickEveryMinute } from "../hooks/useTickEveryMinute";
import { formatEventMessage } from "../utils/eventParsers";

interface SentryEventLogEntryItemProps {
  entry: ConsoleTransportEntry;
  onSelectEntry: (entry: ConsoleTransportEntry) => void;
}

// Compact version of the event card - single line layout [[memory:4875251]]
export const SentryEventLogEntryItem = React.memo<SentryEventLogEntryItemProps>(
  ({ entry, onSelectEntry }) => {
    const tick = useTickEveryMinute();
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
        <View style={styles.leftSection} sentry-label="ignore devtools sentry entry left section">
          <View
            style={[styles.typeIcon, { backgroundColor: `${typeColor}15` }]}
            sentry-label="ignore devtools sentry entry type icon"
          >
            {IconComponent && <IconComponent size={14} color={typeColor} />}
          </View>
        </View>

        {/* Middle section: Message only */}
        <View style={styles.middleSection} sentry-label="ignore devtools sentry entry middle section">
          <Text style={styles.message} numberOfLines={2} sentry-label="ignore devtools sentry entry message">
            {formatEventMessage(entry)}
          </Text>
        </View>

        {/* Right section: Badge, timestamp and chevron */}
        <View style={styles.rightSection} sentry-label="ignore devtools sentry entry right section">
          <View style={styles.rightContent}>
            {entry.metadata.sentryEventType ? (
              <Text style={styles.badge} sentry-label="ignore devtools sentry entry badge">
                {String(entry.metadata.sentryEventType)}
              </Text>
            ) : null}
            <Text style={styles.timestamp} sentry-label="ignore devtools sentry entry timestamp">
              {formatRelativeTime(entry.timestamp, tick)}
            </Text>
          </View>
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
    paddingVertical: 6,
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
    marginRight: 8,
  },
  typeIcon: {
    padding: 3,
    borderRadius: 4,
  },

  middleSection: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
    paddingVertical: 2,
  },
  badge: {
    color: "#A78BFA",
    fontSize: 9,
    fontWeight: "600",
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 2,
    alignSelf: "flex-end",
  },
  message: {
    color: "#E5E7EB",
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rightContent: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  timestamp: {
    color: "#6B7280",
    fontSize: 10,
    fontFamily: "monospace",
  },
});
