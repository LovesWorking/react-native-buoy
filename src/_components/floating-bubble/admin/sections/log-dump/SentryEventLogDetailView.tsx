import React, { useMemo, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { ChevronLeft } from "lucide-react-native";

import { ConsoleTransportEntry } from "../../logger/types";

import { DetailHeader } from "./components/DetailHeader";
import { MessageSection } from "./components/MessageSection";
import { VirtualizedDataExplorer } from "../../../../_shared/VirtualizedDataExplorer";

// Stable constants to prevent re-creation [[memory:4875251]]
const ESTIMATED_ITEM_SIZE = 200;
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
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("message");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

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

  // Get current tab data for type badges
  const getCurrentTabData = () => {
    switch (activeTab) {
      case "eventData":
        return eventData;
      case "rawData":
        return _sentryRawData;
      case "debugInfo":
        return debugInfo;
      default:
        return null;
    }
  };

  // Calculate visible types for the current tab data
  const getVisibleTypes = (data: any): string[] => {
    if (!data) return [];

    const types: string[] = [];
    const processValue = (value: any, depth = 0) => {
      if (depth > 3) return; // Limit depth for performance

      const type = Array.isArray(value)
        ? "array"
        : value === null
        ? "null"
        : typeof value;

      types.push(type);

      if (type === "object" && value !== null) {
        Object.values(value).forEach((v) => processValue(v, depth + 1));
      } else if (type === "array") {
        value.forEach((v: any) => processValue(v, depth + 1));
      }
    };

    processValue(data);
    return Array.from(new Set(types)).slice(0, 8); // Unique types, limit to 8
  };

  const visibleTypes = useMemo(() => {
    const currentData = getCurrentTabData();
    return getVisibleTypes(currentData);
  }, [activeTab, eventData, _sentryRawData, debugInfo]);

  // O(1) optimized function to create filtered object for JSON viewer [[memory:4875251]]
  const getFilteredData = useMemo(() => {
    if (!activeFilter) return null;

    const currentData = getCurrentTabData();
    if (!currentData) return null;

    const filteredObject: { [key: string]: any } = {};
    let itemCount = 0;

    // Single-pass traversal with early termination for performance [[memory:4875251]]
    const flattenByType = (
      obj: any,
      targetType: string,
      path = "",
      depth = 0
    ) => {
      // Limit depth and items to prevent memory issues [[memory:4875251]]
      if (depth > 10 || itemCount > 100) return;

      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const currentPath = path ? `${path}[${index}]` : `[${index}]`;
          const itemType = item === null ? "null" : typeof item;

          if (itemType === targetType) {
            filteredObject[currentPath] = item;
            itemCount++;
          }

          // Recurse into nested structures
          if ((itemType === "object" && item !== null) || Array.isArray(item)) {
            flattenByType(item, targetType, currentPath, depth + 1);
          }
        });
      } else if (obj && typeof obj === "object") {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          const valueType = Array.isArray(value)
            ? "array"
            : value === null
            ? "null"
            : typeof value;

          if (valueType === targetType) {
            filteredObject[currentPath] = value;
            itemCount++;
          }

          // Recurse into nested structures
          if (
            (valueType === "object" && value !== null) ||
            valueType === "array"
          ) {
            flattenByType(value, targetType, currentPath, depth + 1);
          }
        });
      }
    };

    flattenByType(currentData, activeFilter);
    return { filteredObject, itemCount };
  }, [activeFilter, activeTab, eventData, _sentryRawData, debugInfo]);

  // Type color mapping (same as VirtualizedDataExplorer)
  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      string: "#22D3EE", // Cyan for strings
      number: "#3B82F6", // Blue for numbers
      bigint: "#8B5CF6", // Purple for bigint
      boolean: "#F59E0B", // Orange for booleans
      null: "#6B7280", // Gray for null
      undefined: "#9CA3AF", // Light gray for undefined
      function: "#A855F7", // Magenta for functions
      symbol: "#D946EF", // Hot pink for symbols
      date: "#EC4899", // Pink for dates
      error: "#EF4444", // Red for errors
      array: "#10B981", // Green for arrays
      object: "#F97316", // Orange-red for objects
    };
    return colors[type] || "#9CA3AF";
  };

  // Type legend component with filter functionality
  const TypeLegend = ({ types }: { types: string[] }) => {
    if (types.length === 0) return null;

    const handleTypeFilter = (type: string) => {
      // Toggle filter: if already active, clear it; otherwise set it [[memory:4875251]]
      setActiveFilter(activeFilter === type ? null : type);
    };

    return (
      <View style={styles.typeLegend}>
        {types.map((type) => {
          const color = getTypeColor(type);
          const isActive = activeFilter === type;

          return (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeBadge,
                isActive && styles.typeBadgeActive,
                { borderColor: isActive ? color : "rgba(255, 255, 255, 0.1)" },
              ]}
              onPress={() => handleTypeFilter(type)}
              accessibilityLabel={`Filter by ${type} values`}
            >
              <View style={[styles.typeColor, { backgroundColor: color }]} />
              <Text style={[styles.typeName, isActive && { color: color }]}>
                {type}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  // Render content based on active tab and filter
  const renderTabContent = () => {
    // Show filtered results if filter is active
    if (activeFilter && getFilteredData) {
      return (
        <View style={styles.filteredResults}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>
              {getFilteredData.itemCount} {activeFilter} values found
            </Text>
            <TouchableOpacity
              onPress={() => setActiveFilter(null)}
              style={styles.clearFilterButton}
            >
              <Text style={styles.clearFilterText}>Clear Filter</Text>
            </TouchableOpacity>
          </View>

          <VirtualizedDataExplorer
            title={`Filtered ${activeFilter} values`}
            data={getFilteredData.filteredObject}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
          />
        </View>
      );
    }

    // Default tab content
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
          <VirtualizedDataExplorer
            title="Event Data"
            data={eventData}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
          />
        );
      case "rawData":
        return (
          <VirtualizedDataExplorer
            title="Raw Sentry Data"
            data={_sentryRawData}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
          />
        );
      case "debugInfo":
        return (
          <VirtualizedDataExplorer
            title="Debug Info"
            data={debugInfo}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
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
          onPress={() => {
            setActiveTab("message");
            setActiveFilter(null); // Clear filter when switching tabs
          }}
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
          onPress={() => {
            setActiveTab("eventData");
            setActiveFilter(null); // Clear filter when switching tabs
          }}
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
          onPress={() => {
            setActiveTab("rawData");
            setActiveFilter(null); // Clear filter when switching tabs
          }}
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
          onPress={() => {
            setActiveTab("debugInfo");
            setActiveFilter(null); // Clear filter when switching tabs
          }}
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

      {/* Type legend - only show for data tabs */}
      {activeTab !== "message" && <TypeLegend types={visibleTypes} />}

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
