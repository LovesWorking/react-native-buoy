/**
 * RouteEventsTimeline - Chronological timeline of route navigation events
 *
 * Shows events in the order they happened (most recent first),
 * providing a clear history of navigation actions.
 *
 * Uses two-level expansion pattern matching network/storage components.
 */

import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  macOSColors,
  Navigation,
} from "@react-buoy/shared-ui";
import type { RouteChangeEvent } from "../RouteObserver";
import { RouteEventItemCompact } from "./RouteEventItemCompact";

interface RouteEventsTimelineProps {
  events: RouteChangeEvent[];
  visitCounts: Map<number, number>;
}

export function RouteEventsTimeline({
  events,
  visitCounts,
}: RouteEventsTimelineProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleItemPress = useCallback((index: number) => {
    setExpandedIndex((prev) => (prev === index ? null : index));
  }, []);

  if (events.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Navigation size={48} color={macOSColors.text.muted} />
        <Text style={styles.emptyTitle}>No events yet</Text>
        <Text style={styles.emptySubtitle}>
          Navigation events will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {events.map((event, index) => (
        <RouteEventItemCompact
          key={`event-${index}-${event.timestamp}`}
          event={event}
          visitNumber={visitCounts.get(index) || 1}
          isExpanded={expandedIndex === index}
          onPress={() => handleItemPress(index)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 8,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  emptyTitle: {
    color: macOSColors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  emptySubtitle: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },
});
