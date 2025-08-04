import { useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";

import { ConsoleTransportEntry } from "../../admin/logger/types";
import { DataViewer } from "../../../_shared/components/DataViewer";
import {
  formatTimestamp,
  getLevelDotStyle,
  getLevelTextColor,
  getTypeColor,
  getTypeIcon,
} from "../../admin/sections/log-dump/utils";

// Stable constants [[memory:4875251]]
const MAX_EXPLORER_DEPTH = 15;

// Tab types for the toggle
type TabType = "message" | "eventData" | "rawData" | "debugInfo";

interface SentryEventDetailViewProps {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}

/**
 * Detail view for individual Sentry events following composition principles.
 * Single responsibility: Display event details without modal chrome.
 */
export function SentryEventDetailView({
  entry,
  onBack,
}: SentryEventDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("message");

  // Filter out Sentry-specific metadata
  const { _sentryRawData, ...eventData } = entry.metadata;

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

  const IconComponent = getTypeIcon(entry.type);
  const typeColor = getTypeColor(entry.type);

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
      {/* Event Meta Information */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          {/* Type and Level indicators */}
          <View style={styles.metaLeft}>
            <View
              style={[
                styles.typeIndicator,
                { backgroundColor: `${typeColor}20` },
              ]}
            >
              {IconComponent && <IconComponent size={14} color={typeColor} />}
              <Text style={[styles.typeText, { color: typeColor }]}>
                {entry.type}
              </Text>
            </View>

            <View style={styles.levelContainer}>
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
          </View>

          {/* Timestamp on the right */}
          <Text style={styles.timestamp}>
            {formatTimestamp(entry.timestamp)}
          </Text>
        </View>
      </View>

      {/* Tab navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab("message")}
          style={[styles.tab, activeTab === "message" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "message" && styles.activeTabText,
            ]}
          >
            Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("eventData")}
          style={[styles.tab, activeTab === "eventData" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "eventData" && styles.activeTabText,
            ]}
          >
            Event Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("rawData")}
          style={[styles.tab, activeTab === "rawData" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rawData" && styles.activeTabText,
            ]}
          >
            Raw Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("debugInfo")}
          style={[styles.tab, activeTab === "debugInfo" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "debugInfo" && styles.activeTabText,
            ]}
          >
            Debug
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1F1F",
  },
  metaSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#2A2A2A",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  typeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
  },
  typeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  levelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelText: {
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  timestamp: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "monospace",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#8B5CF6",
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  compactMessage: {
    backgroundColor: "#2A2A2A",
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
  },
});
