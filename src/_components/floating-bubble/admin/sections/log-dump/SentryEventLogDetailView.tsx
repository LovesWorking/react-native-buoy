import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";

import { ConsoleTransportEntry } from "../../logger/types";

import { DetailHeader } from "./components/DetailHeader";
import { MessageSection } from "./components/MessageSection";
import { SentryInfoCard } from "./components/SentryInfoCard";
import { VirtualizedDataExplorer } from "../../../../_shared/VirtualizedDataExplorer";

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

  // Create sections data for FlatList
  const sections = [
    { id: "info", type: "info", data: entry.metadata },
    { id: "message", type: "message", data: entry.message },
    { id: "eventData", type: "explorer", title: "EVENT DATA", data: eventData },
    {
      id: "rawData",
      type: "explorer",
      title: "RAW SENTRY DATA",
      data: _sentryRawData,
    },
    {
      id: "debugInfo",
      type: "explorer",
      title: "DEBUG INFO",
      data: {
        id: entry.id,
        level: entry.level,
        timestamp: entry.timestamp,
        logType: entry.type,
      },
    },
  ];

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
      <DetailHeader entry={entry} onBack={onBack} />

      <View style={styles.flashListContainer}>
        <FlashList
          data={sections}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          estimatedItemSize={200}
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
