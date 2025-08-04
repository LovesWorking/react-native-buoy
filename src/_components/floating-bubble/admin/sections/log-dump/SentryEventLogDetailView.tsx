import { useMemo, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";

import { ConsoleTransportEntry } from "../../logger/types";

import { DetailHeader } from "./components/DetailHeader";
import { DataViewer } from "../../../../_shared/components/DataViewer";

// Stable constants to prevent re-creation [[memory:4875251]] [[memory:4875251]]
const MAX_EXPLORER_DEPTH = 15; // Reduced for better performance with large datasets

// Tab types for the toggle
type TabType = "message" | "eventData" | "rawData" | "debugInfo";

export const SentryEventLogDetailView = ({
  entry,
  onBack,
}: {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("message");

  // Filter out Sentry-specific metadata for the general event data
  const { _sentryRawData, ...eventData } = entry.metadata;

  // Removed debug console.log for performance [[memory:4875251]]

  // Prepare data for tabs
  const debugInfo = useMemo(
    () => ({
      id: entry.id,
      level: entry.level,
      timestamp: entry.timestamp,
      logType: entry.type,
    }),
    [entry.id, entry.level, entry.timestamp, entry.type]
  );

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "message":
        return (
          <View style={styles.compactMessage}>
            <Text style={styles.messageText} selectable>
              {String(entry.message)}
            </Text>
          </View>
        );
      case "eventData":
        return (
          <DataViewer
            title="Event Data"
            data={eventData}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
            showTypeFilter={true}
          />
        );
      case "rawData":
        return (
          <DataViewer
            title="Raw Sentry Data"
            data={_sentryRawData}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
            showTypeFilter={true}
          />
        );
      case "debugInfo":
        return (
          <DataViewer
            title="Debug Info"
            data={debugInfo}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
            showTypeFilter={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <DetailHeader entry={entry} onBack={onBack} />

      {/* Tab navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("message")}
          style={[
            styles.tab,
            activeTab === "message" ? styles.activeTab : styles.inactiveTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "message"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("eventData")}
          style={[
            styles.tab,
            activeTab === "eventData" ? styles.activeTab : styles.inactiveTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "eventData"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Event Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("rawData")}
          style={[
            styles.tab,
            activeTab === "rawData" ? styles.activeTab : styles.inactiveTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rawData"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Raw Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("debugInfo")}
          style={[
            styles.tab,
            activeTab === "debugInfo" ? styles.activeTab : styles.inactiveTab,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "debugInfo"
                ? styles.activeTabText
                : styles.inactiveTabText,
            ]}
          >
            Debug
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Tab navigation styles (based on React Query dev tools)
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: "rgba(139, 92, 246, 0.1)", // purple-400 with opacity
    borderBottomWidth: 2,
    borderBottomColor: "#8B5CF6", // purple-400
  },
  inactiveTab: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  activeTabText: {
    color: "#8B5CF6", // purple-400
  },
  inactiveTabText: {
    color: "#9CA3AF", // gray-400
  },
  // Tab content
  tabContent: {
    flex: 1,
  },
  // Compact message style
  compactMessage: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    margin: 16,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  // Type legend styles
  typeLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    gap: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  typeBadgeActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 2,
  },
  typeColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  typeName: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
  },
  // Filtered results styles
  filteredResults: {
    flex: 1,
  },
  filterHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  filterTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderWidth: 1,
    borderColor: "#8B5CF6",
  },
  clearFilterText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "500",
  },
});
