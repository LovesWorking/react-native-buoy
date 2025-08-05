import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ChevronRight } from "lucide-react-native";

import { ConsoleTransportEntry } from "../../_shared/logger/types";

import { formatTimestamp, getTypeColor, getTypeIcon } from "./utils";

interface LogEntryItemProps {
  entry: ConsoleTransportEntry;
  onSelectEntry: (entry: ConsoleTransportEntry) => void;
}

export const LogEntryItem = ({ entry, onSelectEntry }: LogEntryItemProps) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        sentry-label={`ignore view log entry ${entry.id} details`}
        accessibilityLabel={`Log entry: ${entry.message}`}
        accessibilityHint="View full log entry details"
        onPress={() => onSelectEntry(entry)}
        style={styles.touchable}
      >
        {/* Header row with type, level and time */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {/* Type indicator */}
            <View style={styles.typeIndicator}>
              {(() => {
                const IconComponent = getTypeIcon(entry.type);
                return (
                  <IconComponent size={12} color={getTypeColor(entry.type)} />
                );
              })()}
              <Text
                style={[styles.typeText, { color: getTypeColor(entry.type) }]}
              >
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
          <View style={styles.headerRight}>
            <Text style={styles.timestamp}>
              {formatTimestamp(entry.timestamp)}
            </Text>
            <ChevronRight size={12} color="#6B7280" />
          </View>
        </View>

        {/* Message preview */}
        <Text style={styles.message} numberOfLines={3}>
          {String(entry.message)}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
const getLevelDotStyle = (level: string) => {
  switch (level) {
    case "error":
      return { backgroundColor: "#F87171" }; // red-400
    case "warn":
      return { backgroundColor: "#FBBF24" }; // yellow-400
    case "info":
      return { backgroundColor: "#22D3EE" }; // cyan-400
    case "debug":
      return { backgroundColor: "#60A5FA" }; // blue-400
    default:
      return { backgroundColor: "#9CA3AF" }; // gray-400
  }
};

const getLevelTextColor = (level: string) => {
  switch (level) {
    case "error":
      return "#F87171"; // red-400
    case "warn":
      return "#FBBF24"; // yellow-400
    case "info":
      return "#22D3EE"; // cyan-400
    case "debug":
      return "#60A5FA"; // blue-400
    default:
      return "#9CA3AF"; // gray-400
  }
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 8,
    marginHorizontal: 16,
  },
  touchable: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
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
    marginRight: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  timestamp: {
    color: "#6B7280",
    fontSize: 12,
    fontFamily: "monospace",
  },
  message: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
});
