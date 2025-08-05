import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

import { ConsoleTransportEntry } from "../../../_shared/logger/types";

import { LogEntryHeader } from "../../log-dump/components/LogEntryHeader";
import { LogEntryMessage } from "../../log-dump/components/LogEntryMessage";
import { LogEntrySentryBadge } from "./LogEntrySentryBadge";

interface SentryEventLogEntryItemProps {
  entry: ConsoleTransportEntry;
  onSelectEntry: (entry: ConsoleTransportEntry) => void;
}

// Memoized leaf component to prevent unnecessary re-renders in FlashList [[memory:4875251]]
export const SentryEventLogEntryItem = React.memo<SentryEventLogEntryItemProps>(
  ({ entry, onSelectEntry }) => {
    return (
      <View style={styles.container} sentry-label="ignore devtools sentry entry item container">
        <TouchableOpacity
          sentry-label={`ignore view sentry log entry ${entry.id} details`}
          accessibilityLabel={`Sentry log entry: ${entry.message}`}
          accessibilityHint="View full sentry log entry details"
          accessibilityRole="button"
          onPress={() => onSelectEntry(entry)}
          style={styles.touchable}
        >
          <LogEntryHeader entry={entry} />
          <LogEntrySentryBadge metadata={entry.metadata} />
          <LogEntryMessage message={entry.message} />
        </TouchableOpacity>
      </View>
    );
  }
);

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
});
