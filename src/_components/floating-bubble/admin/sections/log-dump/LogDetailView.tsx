import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import JSONTree from "react-native-json-tree";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { ConsoleTransportEntry } from "../../logger/types";

import { jsonTreeTheme } from "./constants";
import { formatTimestamp, getTypeColor, getTypeIcon } from "./utils";

export const LogDetailView = ({
  entry,
  onBack,
}: {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          sentry-label="ignore back to log list"
          accessibilityLabel="Back to log list"
          accessibilityHint="Return to log entries list"
          onPress={onBack}
          style={styles.backButton}
        >
          <ChevronLeft size={16} color="#8B5CF6" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Details</Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        sentry-label="ignore log entries scroll view"
        accessibilityLabel="Log entries scroll view"
        accessibilityHint="Scroll through log entries"
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 16 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={true}
      >
        {/* Level and timestamp */}
        <View style={styles.metaRow}>
          <View style={styles.metaLeft}>
            {/* Type indicator */}
            <View style={styles.typeIndicator}>
              {(() => {
                const IconComponent = getTypeIcon(entry.type);
                return (
                  <IconComponent size={14} color={getTypeColor(entry.type)} />
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
          <Text style={styles.timestamp}>
            {formatTimestamp(entry.timestamp)}
          </Text>
        </View>

        {/* Message */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionLabel}>MESSAGE</Text>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText} selectable>
              {String(entry.message)}
            </Text>
          </View>
        </View>

        {/* Metadata if it exists */}
        {entry.metadata && Object.keys(entry.metadata).length > 0 && (
          <View style={styles.metadataSection}>
            <Text style={styles.sectionLabel}>METADATA</Text>
            <View style={styles.jsonContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                sentry-label="ignore metadata horizontal scroll"
              >
                <View style={styles.jsonContent}>
                  <JSONTree
                    data={entry.metadata}
                    theme={jsonTreeTheme}
                    invertTheme={false}
                    hideRoot
                    shouldExpandNode={() => true}
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Debug info */}
        <View style={styles.debugSection}>
          <Text style={styles.sectionLabel}>DEBUG INFO</Text>
          <View style={styles.jsonContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              sentry-label="ignore debug info horizontal scroll"
            >
              <View style={styles.jsonContent}>
                <JSONTree
                  data={{
                    id: entry.id,
                    level: entry.level,
                    timestamp: entry.timestamp,
                  }}
                  theme={jsonTreeTheme}
                  invertTheme={false}
                  hideRoot
                  shouldExpandNode={() => true}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </ScrollView>
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
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    color: "#A78BFA",
    fontWeight: "500",
  },
  headerTitle: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
    flex: 1,
    textAlign: "center",
    marginRight: 64,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
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
  messageSection: {
    marginBottom: 24,
  },
  metadataSection: {
    marginBottom: 24,
  },
  debugSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 12,
  },
  messageContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  messageText: {
    color: "white",
    fontSize: 16,
    lineHeight: 24,
  },
  jsonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  jsonContent: {
    flex: 1,
  },
});
