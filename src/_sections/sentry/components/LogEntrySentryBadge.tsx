import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Metadata } from "../../../_shared/logger/types";

interface LogEntrySentryBadgeProps {
  metadata: Metadata;
}

// Memoized leaf component for badge rendering performance [[memory:4875251]]
export const LogEntrySentryBadge = React.memo<LogEntrySentryBadgeProps>(
  ({ metadata }) => {
    // Only show the sentry event type, not the redundant source
    // This fixes the "Span • span" issue by showing only "Span"
    if (!metadata.sentryEventType) {
      return null;
    }

    return (
      <View style={styles.sentryBadge} sentry-label="ignore devtools sentry badge">
        <Text style={styles.sentryBadgeText} sentry-label="ignore devtools sentry badge text">
          {String(metadata.sentryEventType)}
        </Text>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  sentryBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  sentryBadgeText: {
    color: "#A78BFA",
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "monospace",
  },
});
