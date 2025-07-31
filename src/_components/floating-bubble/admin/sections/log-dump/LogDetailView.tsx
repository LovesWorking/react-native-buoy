import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";

import { ConsoleTransportEntry } from "../../logger/types";
import { VirtualizedDataExplorer } from "../../../../_shared/VirtualizedDataExplorer";

import { formatTimestamp, getTypeColor, getTypeIcon } from "./utils";

export const LogDetailView = ({
  entry,
  onBack,
}: {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();

  // Create sections data for FlashList
  const sections = [
    {
      id: "header",
      type: "header",
      data: {
        type: entry.type,
        level: entry.level,
        timestamp: entry.timestamp,
        message: entry.message,
      },
    },
    ...(entry.metadata && Object.keys(entry.metadata).length > 0
      ? [
          {
            id: "metadata",
            type: "explorer",
            title: "METADATA",
            description:
              "Additional context and data attached to this log entry",
            data: entry.metadata,
          },
        ]
      : []),
    {
      id: "debugInfo",
      type: "explorer",
      title: "DEBUG INFO",
      description: "Internal logging metadata and identifiers",
      data: {
        id: entry.id,
        level: entry.level,
        timestamp: entry.timestamp,
      },
    },
  ];

  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case "header":
        return (
          <View>
            {/* Level and timestamp */}
            <View style={styles.metaRow}>
              <View style={styles.metaLeft}>
                {/* Type indicator */}
                <View style={styles.typeIndicator}>
                  {(() => {
                    const IconComponent = getTypeIcon(item.data.type);
                    return (
                      <IconComponent
                        size={14}
                        color={getTypeColor(item.data.type)}
                      />
                    );
                  })()}
                  <Text
                    style={[
                      styles.typeText,
                      { color: getTypeColor(item.data.type) },
                    ]}
                  >
                    {item.data.type}
                  </Text>
                </View>

                {/* Level indicator */}
                <View
                  style={[styles.levelDot, getLevelDotStyle(item.data.level)]}
                />
                <Text
                  style={[
                    styles.levelText,
                    { color: getLevelTextColor(item.data.level) },
                  ]}
                >
                  {item.data.level.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.timestamp}>
                {formatTimestamp(item.data.timestamp)}
              </Text>
            </View>

            {/* Message */}
            <View style={styles.messageSection}>
              <Text style={styles.sectionLabel}>MESSAGE</Text>
              <View style={styles.messageContainer}>
                <Text style={styles.messageText} selectable>
                  {String(item.data.message)}
                </Text>
              </View>
            </View>
          </View>
        );
      case "explorer":
        return (
          <View style={styles.explorerSection}>
            <VirtualizedDataExplorer
              title={item.title}
              description={item.description}
              data={item.data}
              maxDepth={6}
            />
          </View>
        );
      default:
        return null;
    }
  };

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

      <View style={styles.flashListContainer}>
        <FlashList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={150}
          getItemType={(item) => item.type}
          contentContainerStyle={{
            ...styles.contentContainer,
            paddingBottom: 16 + insets.bottom,
          }}
          showsVerticalScrollIndicator={true}
          sentry-label="ignore log entries list"
          accessibilityLabel="Log entries list"
          accessibilityHint="Scroll through log entries sections"
        />
      </View>
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
  flashListContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  explorerSection: {
    marginVertical: 8,
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
