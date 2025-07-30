import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  ScrollView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import {
  FileText,
  FlaskConical,
  RefreshCw,
  Trash,
  X,
} from "lucide-react-native";

import { ConsoleTransportEntry, LogLevel, LogType } from "../../logger/types";

import { EmptyFilterState, EmptyState } from "./EmptyStates";
import { adaptSentryEventsToConsoleEntries } from "./SentryEventAdapter";
import { SentryEventLogDetailView } from "./SentryEventLogDetailView";
import { SentryEventLogEntryItem } from "./SentryEventLogEntryItem";
import { SentryEventLogFilters } from "./SentryEventLogFilters";
import {
  clearSentryEvents,
  generateTestSentryEvents,
  getSentryEvents,
} from "../../../sentry/sentryEventListeners";

interface SentryEventLogDumpModalContentProps {
  onClose: () => void;
}

export function SentryEventLogDumpModalContent({
  onClose,
}: SentryEventLogDumpModalContentProps) {
  // Create pan gesture using modern Gesture.Pan() API to fix Android FlashList integration with modal
  const panGesture = Gesture.Pan().runOnJS(true);

  const [selectedEntry, setSelectedEntry] =
    useState<ConsoleTransportEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<LogType>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(
    new Set()
  );
  const flatListRef = useRef<FlashList<ConsoleTransportEntry>>(null);
  const insets = useSafeAreaInsets();
  // Function to calculate entries
  const calculateEntries = () => {
    const rawSentryEvents = getSentryEvents();
    const adaptedEntries = adaptSentryEventsToConsoleEntries(rawSentryEvents);

    // Remove duplicates based on ID
    const uniqueEntries = adaptedEntries.reduce(
      (acc: ConsoleTransportEntry[], entry: ConsoleTransportEntry) => {
        if (
          !acc.some(
            (existing: ConsoleTransportEntry) => existing.id === entry.id
          )
        ) {
          acc.push(entry);
        }
        return acc;
      },
      [] as ConsoleTransportEntry[]
    );

    return uniqueEntries.sort(
      (a: ConsoleTransportEntry, b: ConsoleTransportEntry) =>
        b.timestamp - a.timestamp
    );
  };

  // Initialize entries on mount
  useEffect(() => {
    setEntries(calculateEntries());
  }, []);

  const selectEntry = (entry: ConsoleTransportEntry) => {
    setSelectedEntry(entry);
  };

  const goBackToList = () => {
    setSelectedEntry(null);
  };

  const scrollToBottom = () => {
    if (flatListRef.current && entries.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToIndex({
          index: 0,
          animated: true,
        });
      });
    }
  };

  const refreshEntries = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setEntries(calculateEntries());
      setTimeout(scrollToBottom, 100);
    } finally {
      setIsRefreshing(false);
    }
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

  const getFilteredEntries = () => {
    return entries.filter((entry) => {
      const typeMatch =
        selectedTypes.size === 0 || selectedTypes.has(entry.type);
      const levelMatch =
        selectedLevels.size === 0 || selectedLevels.has(entry.level);
      return typeMatch && levelMatch;
    });
  };

  const keyExtractor = (item: ConsoleTransportEntry, index: number) => {
    return `${item.id}-${index}-${item.timestamp}`;
  };

  // Auto-scroll when entries update
  useEffect(() => {
    if (entries.length > 0) {
      const timer = setTimeout(() => {
        if (flatListRef.current && entries.length > 0) {
          requestAnimationFrame(() => {
            flatListRef.current?.scrollToIndex({
              index: 0,
              animated: true,
            });
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [entries]);

  const generateTestLogs = async () => {
    clearSentryEvents();
    setEntries([]);

    // Generate test Sentry events
    generateTestSentryEvents();

    await new Promise((resolve) => setTimeout(resolve, 100));
    refreshEntries();
  };

  const clearLogs = () => {
    clearSentryEvents();
    setEntries([]);
  };

  // Show detail view or list view
  if (selectedEntry) {
    return (
      <SentryEventLogDetailView entry={selectedEntry} onBack={goBackToList} />
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.headerContainer}>
        {/* Main header */}
        <View style={styles.mainHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.iconContainer}>
              <FileText size={18} color="#8B5CF6" />
            </View>
            <View>
              <Text style={styles.title}>Sentry Events</Text>
              <Text style={styles.subtitle}>
                {getFilteredEntries().length} of {entries.length} events
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Test Events Button */}
            <TouchableOpacity
              sentry-label="ignore generate test sentry events button"
              accessibilityRole="button"
              accessibilityLabel="Generate test Sentry events"
              accessibilityHint="Generates sample Sentry events for testing"
              onPress={generateTestLogs}
              style={styles.testButton}
            >
              <FlaskConical size={16} color="#818CF8" />
            </TouchableOpacity>

            {/* Clear Events Button */}
            <TouchableOpacity
              sentry-label="ignore clear sentry events button"
              accessibilityRole="button"
              accessibilityLabel="Clear Sentry events"
              accessibilityHint="Removes all Sentry events from memory"
              onPress={clearLogs}
              style={styles.clearButton}
            >
              <Trash size={16} color="#F87171" />
            </TouchableOpacity>

            <TouchableOpacity
              sentry-label="ignore refresh sentry events button"
              accessibilityRole="button"
              accessibilityLabel="Refresh Sentry events"
              accessibilityHint="Refreshes the Sentry events to show latest data"
              onPress={refreshEntries}
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <RefreshCw size={16} color="#8B5CF6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              sentry-label="ignore close sentry events viewer button"
              accessibilityRole="button"
              accessibilityLabel="Close Sentry events viewer"
              accessibilityHint="Closes the Sentry events viewer and returns to the admin panel"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter section */}
        <SentryEventLogFilters
          entries={entries}
          selectedTypes={selectedTypes}
          selectedLevels={selectedLevels}
          onToggleTypeFilter={toggleTypeFilter}
          onToggleLevelFilter={toggleLevelFilter}
        />
      </View>

      {/* Event Entries */}
      {getFilteredEntries().length === 0 ? (
        <View style={styles.emptyContainer}>
          {entries.length === 0 ? <EmptyState /> : <EmptyFilterState />}
        </View>
      ) : (
        <View style={styles.listContainer}>
          <GestureDetector gesture={panGesture}>
            <FlashList
              sentry-label="ignore sentry events list"
              ref={flatListRef}
              data={getFilteredEntries()}
              renderItem={({ item }: { item: ConsoleTransportEntry }) => (
                <SentryEventLogEntryItem
                  entry={item}
                  onSelectEntry={selectEntry}
                />
              )}
              keyExtractor={keyExtractor}
              estimatedItemSize={120}
              inverted
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              removeClippedSubviews
              onEndReachedThreshold={0.8}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 1,
              }}
              renderScrollComponent={ScrollView}
            />
          </GestureDetector>
          <View style={{ height: insets.bottom }} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Use flex: 1 since it's now in a full-screen modal
    paddingTop: 16,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  mainHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  title: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  testButton: {
    backgroundColor: "rgba(129, 140, 248, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  clearButton: {
    backgroundColor: "rgba(248, 113, 113, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  refreshButton: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: "rgba(107, 114, 128, 0.2)",
    padding: 8,
    borderRadius: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
  },
});
