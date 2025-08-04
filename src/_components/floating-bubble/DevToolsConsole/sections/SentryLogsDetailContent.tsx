import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { FlaskConical, Trash, Pause, Play, Filter } from "lucide-react-native";

import {
  ConsoleTransportEntry,
  LogLevel,
  LogType,
} from "../../admin/logger/types";
import {
  EmptyFilterState,
  EmptyState,
} from "../../admin/sections/log-dump/EmptyStates";
import { SentryEventLogEntryItem } from "../../admin/sections/log-dump/SentryEventLogEntryItemCompact";
import { SentryFilterView } from "./SentryFilterView";
import {
  clearSentryEvents,
  generateTestSentryEvents,
} from "../../sentry/sentryEventListeners";
import { useSentryEvents } from "../../admin/hooks/useSentryEvents";
import { SentryEventDetailView } from "./SentryEventDetailView";

// Stable constants to prevent re-creation on every render [[memory:4875251]]
const ESTIMATED_ITEM_SIZE = 44; // Reduced for compact cards
const END_REACHED_THRESHOLD = 0.8;
const MAINTAIN_VISIBLE_CONTENT_POSITION = {
  minIndexForVisible: 0,
  autoscrollToTopThreshold: 1,
};

// Stable module-scope functions [[memory:4875251]]
const keyExtractor = (item: ConsoleTransportEntry, index: number) => {
  return `${item.id}-${index}-${item.timestamp}`;
};

const getItemType = (item: ConsoleTransportEntry) => {
  return `${item.type}-${item.level}`;
};

// Stable renderItem function using ref pattern [[memory:4875251]]
const createRenderSentryEventItem = (
  selectEntryRef: React.MutableRefObject<
    ((entry: ConsoleTransportEntry) => void) | undefined
  >
) => {
  return ({ item }: { item: ConsoleTransportEntry }) => (
    <SentryEventLogEntryItem
      entry={item}
      onSelectEntry={(entry) => selectEntryRef.current?.(entry)}
    />
  );
};

interface SentryLogsDetailContentProps {
  selectedEntry: ConsoleTransportEntry | null;
  onSelectEntry: (entry: ConsoleTransportEntry | null) => void;
  showFilterView: boolean;
  onShowFilterView: (show: boolean) => void;
}

/**
 * Sentry logs detail content following component composition principles.
 * Single responsibility: Display and manage sentry event logs without modal chrome.
 */
export function SentryLogsDetailContent({
  selectedEntry: externalSelectedEntry,
  onSelectEntry,
  showFilterView,
  onShowFilterView,
}: SentryLogsDetailContentProps) {
  const panGesture = Gesture.Pan().runOnJS(true);
  const [selectedTypes, setSelectedTypes] = useState<Set<LogType>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(
    new Set()
  );
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(true);
  const flatListRef = useRef<FlashList<ConsoleTransportEntry>>(null);
  const insets = useSafeAreaInsets();

  // Use reactive hook for automatic updates [[memory:4875074]]
  const { entries: filteredEntries, totalCount } = useSentryEvents({
    selectedTypes,
    selectedLevels,
  });

  // Use "Latest Ref" pattern [[memory:4875251]]
  const selectEntryRef = useRef<(entry: ConsoleTransportEntry) => void>(
    (entry: ConsoleTransportEntry) => {
      onSelectEntry(entry);
    }
  );
  selectEntryRef.current = (entry: ConsoleTransportEntry) => {
    onSelectEntry(entry);
  };

  // Create stable renderItem once [[memory:4875251]]
  const renderSentryEventItem = useMemo(
    () => createRenderSentryEventItem(selectEntryRef),
    []
  );

  const goBackToList = () => {
    onSelectEntry(null);
  };

  const toggleTypeFilter = (type: LogType) => {
    setSelectedTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      return newSet;
    });
  };

  const toggleLevelFilter = (level: LogLevel) => {
    setSelectedLevels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }
      return newSet;
    });
  };

  const generateTestLogs = () => {
    clearSentryEvents();
    // Small delay to ensure clear completes
    setTimeout(() => {
      generateTestSentryEvents();
    }, 50);
  };

  const clearLogs = () => {
    clearSentryEvents();
  };

  // Show detail view with composition pattern
  if (externalSelectedEntry) {
    return (
      <SentryEventDetailView
        entry={externalSelectedEntry}
        _onBack={goBackToList}
      />
    );
  }

  // Show filter view if selected
  if (showFilterView) {
    return (
      <SentryFilterView
        _entries={filteredEntries}
        selectedTypes={selectedTypes}
        selectedLevels={selectedLevels}
        onToggleTypeFilter={toggleTypeFilter}
        onToggleLevelFilter={toggleLevelFilter}
        _onBack={() => onShowFilterView(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Minimal Stats Section */}
      <View style={styles.statsSection}>
        <View style={styles.statsLeft}>
          <Text style={styles.statText}>
            {filteredEntries.length} of {totalCount} events
            {(selectedTypes.size > 0 || selectedLevels.size > 0) &&
              " (filtered)"}
          </Text>
        </View>
        <View style={styles.statsRight}>
          <TouchableOpacity
            onPress={() => onShowFilterView(true)}
            style={[
              styles.iconButton,
              (selectedTypes.size > 0 || selectedLevels.size > 0) &&
                styles.activeFilterButton,
            ]}
            accessibilityLabel="Open filters"
          >
            <Filter
              size={16}
              color={
                selectedTypes.size > 0 || selectedLevels.size > 0
                  ? "#8B5CF6"
                  : "#9CA3AF"
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setIsLoggingEnabled(!isLoggingEnabled)}
            style={[styles.iconButton, isLoggingEnabled && styles.activeButton]}
            accessibilityLabel={
              isLoggingEnabled ? "Pause logging" : "Resume logging"
            }
          >
            {isLoggingEnabled ? (
              <Pause size={16} color="#10B981" />
            ) : (
              <Play size={16} color="#10B981" />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={generateTestLogs}
            style={styles.iconButton}
            accessibilityLabel="Generate test Sentry events"
          >
            <FlaskConical size={16} color="#818CF8" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={clearLogs}
            style={styles.iconButton}
            accessibilityLabel="Clear Sentry events"
          >
            <Trash size={16} color="#F87171" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Event Entries */}
      {filteredEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          {totalCount === 0 ? <EmptyState /> : <EmptyFilterState />}
        </View>
      ) : (
        <View style={styles.listContainer}>
          <GestureDetector gesture={panGesture}>
            <FlashList
              ref={flatListRef}
              data={filteredEntries}
              renderItem={renderSentryEventItem}
              keyExtractor={keyExtractor}
              getItemType={getItemType}
              estimatedItemSize={ESTIMATED_ITEM_SIZE}
              inverted
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              removeClippedSubviews
              onEndReachedThreshold={END_REACHED_THRESHOLD}
              maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
              renderScrollComponent={ScrollView}
            />
          </GestureDetector>
          <View style={[styles.bottomInset, { height: insets.bottom }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1F1F",
  },
  statsSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#2A2A2A",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  statsLeft: {
    flex: 1,
  },
  statsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  activeButton: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
  },
  activeFilterButton: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
  },
  emptyContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  bottomInset: {
    // Empty style for safe area bottom spacing
  },
});
