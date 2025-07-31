import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConsoleTransportEntry } from "../../logger/types";

import { DetailHeader } from "./components/DetailHeader";
import { MessageSection } from "./components/MessageSection";
import { SentryInfoCard } from "./components/SentryInfoCard";
import { DataExplorer } from "../../../../_shared/DataExplorer";

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

  return (
    <View style={styles.container}>
      <DetailHeader entry={entry} onBack={onBack} />

      <ScrollView
        sentry-label="ignore sentry log entries scroll view"
        accessibilityLabel="Sentry log entries scroll view"
        accessibilityHint="Scroll through sentry log entries"
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 16 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={true}
        removeClippedSubviews={true}
      >
        <SentryInfoCard metadata={entry.metadata} />
        <MessageSection message={entry.message} />

        <DataExplorer
          title="EVENT DATA"
          data={eventData}
          defaultExpanded={false}
        />

        <DataExplorer
          title="RAW SENTRY DATA"
          data={_sentryRawData}
          defaultExpanded={false}
        />

        <DataExplorer
          title="DEBUG INFO"
          data={{
            id: entry.id,
            level: entry.level,
            timestamp: entry.timestamp,
            logType: entry.type,
          }}
          defaultExpanded={false}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
});
