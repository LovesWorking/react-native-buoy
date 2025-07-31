import React, { useMemo } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";

import { ConsoleTransportEntry } from "../../logger/types";

import { DetailHeader } from "./components/DetailHeader";
import { MessageSection } from "./components/MessageSection";
import { SentryInfoCard } from "./components/SentryInfoCard";
import { VirtualizedDataExplorer } from "../../../../_shared/VirtualizedDataExplorer";

// Stable constants to prevent re-creation [[memory:4875251]]
const ESTIMATED_ITEM_SIZE = 200;
const MAX_EXPLORER_DEPTH = 15; // Reduced for better performance with large datasets

export const SentryEventLogDetailView = ({
  entry,
  onBack,
}: {
  entry: ConsoleTransportEntry;
  onBack: () => void;
}) => {
  const insets = useSafeAreaInsets();

  // Filter out Sentry-specific metadata for the general event data
  const { _sentryRawData, ...eventData } = entry.metadata;

  // Removed debug console.log for performance [[memory:4875251]]

  // Memoize sections to prevent recreation on every render [[memory:4875251]]
  const sections = useMemo(
    () => [
      { id: "info", type: "info", data: entry.metadata },
      { id: "message", type: "message", data: entry.message },
      {
        id: "eventData",
        type: "explorer",
        title: "EVENT DATA",
        description: "Parsed event data from the Sentry event payload",
        data: eventData,
      },
      {
        id: "rawData",
        type: "explorer",
        title: "RAW SENTRY DATA",
        description: "Complete unprocessed Sentry event object",
        data: _sentryRawData,
      },
      {
        id: "debugInfo",
        type: "explorer",
        title: "DEBUG INFO",
        description: "Internal logging metadata and identifiers",
        data: {
          id: entry.id,
          level: entry.level,
          timestamp: entry.timestamp,
          logType: entry.type,
        },
      },
    ],
    [
      entry.metadata,
      entry.message,
      eventData,
      _sentryRawData,
      entry.id,
      entry.level,
      entry.timestamp,
      entry.type,
    ]
  );

  const renderItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case "info":
        return <SentryInfoCard metadata={item.data} />;
      case "message":
        return <MessageSection message={item.data} />;
      case "explorer":
        return (
          <View style={styles.explorerSection}>
            <VirtualizedDataExplorer
              title={item.title}
              description={item.description}
              data={item.data}
              maxDepth={MAX_EXPLORER_DEPTH}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <DetailHeader entry={entry} onBack={onBack} />

      <View style={styles.flashListContainer}>
        <FlashList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={ESTIMATED_ITEM_SIZE}
          getItemType={(item) => item.type}
          contentContainerStyle={{
            ...styles.contentContainer,
            paddingBottom: 16 + insets.bottom,
          }}
          showsVerticalScrollIndicator={true}
          sentry-label="ignore sentry log entries list"
          accessibilityLabel="Sentry log entries list"
          accessibilityHint="Scroll through sentry log entries sections"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
