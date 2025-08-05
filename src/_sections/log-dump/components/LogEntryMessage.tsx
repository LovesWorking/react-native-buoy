import React from "react";
import { StyleSheet, Text } from "react-native";

interface LogEntryMessageProps {
  message: string | Error;
}

// Memoized leaf component for text rendering performance [[memory:4875251]]
export const LogEntryMessage = React.memo<LogEntryMessageProps>(
  ({ message }) => {
    return (
      <Text style={styles.message} numberOfLines={3}>
        {String(message)}
      </Text>
    );
  }
);

const styles = StyleSheet.create({
  message: {
    color: "white",
    fontSize: 14,
    lineHeight: 20,
  },
});
