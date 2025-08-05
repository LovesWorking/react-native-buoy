import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { BackButton } from "../../_shared/ui/components/BackButton";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";

import { ConsoleTransportEntry } from "../../_shared/logger/types";
import { VirtualizedDataExplorer } from "../../_sections/react-query/components/shared/VirtualizedDataExplorer";

import { formatTimestamp, getTypeColor, getTypeIcon } from "./utils";

// Fullscreen data explorer modal
const DataExplorerModal = ({
  title,
  description,
  data,
  onBack,
}: {
  title: string;
  description: string;
  data: unknown;
  onBack: () => void;
}) => {
  return (
    <View style={styles.modalContainer}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <BackButton
          onPress={onBack}
          color="#8B5CF6"
          size={16}
          accessibilityLabel="Back to log details"
        />
        <View style={styles.modalHeaderContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalDescription}>{description}</Text>
        </View>
      </View>

      {/* Raw data display - no header, badges, or containers */}
      <VirtualizedDataExplorer
        title="Data Explorer"
        data={data}
        maxDepth={6}
        rawMode={true}
      />
    </View>
  );
};

export const LogDetailView = ({
  entry,
  onBack,
}: {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Create sections data for FlashList
  const sections: SectionItem[] = [
    {
      id: "header",
      type: "header" as const,
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
            type: "dataCard" as const,
            title: "METADATA",
            description:
              "Additional context and data attached to this log entry",
            data: entry.metadata,
          },
        ]
      : []),
    {
      id: "debugInfo",
      type: "explorer" as const,
      title: "DEBUG INFO",
      description: "Internal logging metadata and identifiers",
      data: {
        id: entry.id,
        level: entry.level,
        timestamp: entry.timestamp,
      },
    },
  ];

  type SectionItem =
    | {
        id: string;
        type: "header";
        data: {
          type: string;
          level: string;
          timestamp: number;
          message: string | Error;
        };
        title?: string;
        description?: string;
      }
    | {
        id: string;
        type: "dataCard";
        title: string;
        description: string;
        data: unknown;
      }
    | {
        id: string;
        type: "explorer";
        title: string;
        description: string;
        data: unknown;
      };

  const renderItem = ({ item }: { item: SectionItem }) => {
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
      case "dataCard":
        return (
          <TouchableOpacity
            accessibilityLabel={`Open ${item.title} in full screen`}
            accessibilityHint="Open data card in full screen"
            sentry-label={`ignore data card ${item.id}`}
            style={styles.dataCard}
            onPress={() => setActiveModal(item.id)}
          >
            <View style={styles.dataCardContent}>
              <Text style={styles.dataCardTitle}>{item.title}</Text>
              <Text style={styles.dataCardDescription}>{item.description}</Text>
              <View style={styles.dataCardFooter}>
                <Text style={styles.dataCardAction}>Tap to explore data</Text>
                <ChevronLeft
                  size={16}
                  color="#8B5CF6"
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  // Get the current modal data
  const currentModalData = sections.find(
    (section) => section.id === activeModal
  );

  // If modal is active, show it instead of the main view
  if (activeModal && currentModalData) {
    return (
      <DataExplorerModal
        title={currentModalData.title || "Data Explorer"}
        description={currentModalData.description || "Explore the data"}
        data={currentModalData.data}
        onBack={() => setActiveModal(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={onBack}
          color="#8B5CF6"
          size={16}
          accessibilityLabel="Back to log list"
          accessibilityHint="Return to log entries list"
        />
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
    paddingHorizontal: 16,
    paddingTop: 16,
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
  // Data card styles
  dataCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)", // bg-white/[0.03]
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", // border-white/[0.08]
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dataCardContent: {
    flex: 1,
  },
  dataCardTitle: {
    color: "#FFFFFF", // text-white
    fontSize: 14,
    fontWeight: "500", // font-medium
    marginBottom: 4,
  },
  dataCardDescription: {
    color: "#9CA3AF", // text-gray-400
    fontSize: 12,
    marginBottom: 12,
  },
  dataCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dataCardAction: {
    color: "#8B5CF6", // text-purple-400
    fontSize: 12,
    fontWeight: "500",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  modalDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 2,
  },
});
