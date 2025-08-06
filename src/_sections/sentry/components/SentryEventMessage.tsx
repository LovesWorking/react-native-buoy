import React from "react";
import { StyleSheet, Text } from "react-native";
import { ConsoleTransportEntry } from "../../../_shared/logger/types";
import { formatEventMessage } from "../utils/eventParsers";

interface SentryEventMessageProps {
  entry: ConsoleTransportEntry;
}

// Memoized component for Sentry event messages with smart formatting
export const SentryEventMessage = React.memo<SentryEventMessageProps>(
  ({ entry }) => {
    const message = formatEventMessage(entry);
    
    return (
      <Text style={styles.message} numberOfLines={3}>
        {message}
      </Text>
    );
  }
);

const styles = StyleSheet.create({
  message: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
  },
});