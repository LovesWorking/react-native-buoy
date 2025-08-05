import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  FileText,
  FlaskConical,
  RefreshCw,
  Trash,
  X,
} from "lucide-react-native";

import { clearEntries, getEntries, testLogger } from "../../_shared/logger";
import { ConsoleTransportEntry, LogLevel, LogType } from "../../_shared/logger/types";

import { EmptyFilterState, EmptyState } from "./EmptyStates";
import { LogDetailView } from "./LogDetailView";
import { LogEntryItem } from "./LogEntryItem";
import { LogFilters } from "./LogFilters";

interface LogDumpModalContentProps {
  onClose: () => void;
}

export function LogDumpModalContent({ onClose }: LogDumpModalContentProps) {
  const [selectedEntry, setSelectedEntry] =
    useState<ConsoleTransportEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<Set<LogType>>(new Set());
  const [selectedLevels, setSelectedLevels] = useState<Set<LogLevel>>(
    new Set()
  );
  const flatListRef = useRef<FlatList<ConsoleTransportEntry>>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const insets = useSafeAreaInsets();

  // Function to calculate entries
  const calculateEntries = () => {
    const rawEntries = getEntries();
    const uniqueEntries = rawEntries.reduce(
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

  const scrollToTop = () => {
    if (flatListRef.current && entries.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
      });
    }
  };

  const refreshEntries = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setEntries(calculateEntries());
      setTimeout(scrollToTop, 100);
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
          flatListRef.current.scrollToIndex({
            index: 0,
            animated: true,
          });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [entries]);

  const generateTestLogs = async () => {
    clearEntries();
    setEntries([]);

    // Add test logs

    testLogger.error(new Error("Test error message"), { category: "error" });
    testLogger.info("Generic information message");
    testLogger.info("GET /api/users/123", {
      category: "xhr",
      method: "GET",
      url: "/api/users/123",
      status: 200,
    });
    testLogger.info("From Inbox To Account Profile", {
      category: "navigation",
      from: "inbox",
      to: "account/index",
    });
    testLogger.info("User authentication successful", {
      category: "auth",
      method: "otp",
      userId: "user_123",
    });
    testLogger.info("User clicked profile button", {
      category: "touch",
      action: "profile_update",
      userId: "123",
    });
    testLogger.info("User focused on input field", {
      category: "ui.input",
      element: "message_input",
      screen: "conversation",
    });
    testLogger.info("Redux state updated", {
      category: "redux.action",
      action: "SET_USER_PROFILE",
      payload: { name: "John Doe" },
    });
    testLogger.info("Session replay mutation detected", {
      category: "replay.mutations",
      mutationType: "childList",
      target: "conversation-list",
    });
    testLogger.warn("Resource usage high", { category: "console" });

    // Custom events
    testLogger.info("Custom payment processing started", {
      category: "payment.processor",
      amount: 29.99,
      paymentMethod: "stripe",
    });
    testLogger.info("Custom analytics event tracked", {
      category: "custom.analytics",
      event: "feature_usage",
      featureName: "dark_mode_toggle",
    });
    testLogger.info("Custom integration webhook received", {
      category: "webhook.integration",
      source: "external_service",
      eventType: "order_completed",
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    refreshEntries();
  };

  const clearLogs = () => {
    clearEntries();
    setEntries([]);
  };

  return (
    <View style={styles.container}>
      {/* Show detail view or list view */}
      {selectedEntry ? (
        <LogDetailView entry={selectedEntry} onBack={goBackToList} />
      ) : (
        <>
          {/* Header */}
          <View style={styles.headerContainer}>
            {/* Main header */}
            <View style={styles.mainHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconContainer}>
                  <FileText size={18} color="#8B5CF6" />
                </View>
                <View>
                  <Text style={styles.title}>Log Dump</Text>
                  <Text style={styles.subtitle}>
                    {getFilteredEntries().length} of {entries.length} entries
                  </Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                {/* Test Logs Button */}
                <TouchableOpacity
                  sentry-label="ignore generate test logs button"
                  accessibilityRole="button"
                  accessibilityLabel="Generate test logs"
                  accessibilityHint="Generates sample logs of different types for testing"
                  onPress={generateTestLogs}
                  style={styles.testButton}
                >
                  <FlaskConical size={16} color="#818CF8" />
                </TouchableOpacity>

                {/* Clear Logs Button */}
                <TouchableOpacity
                  sentry-label="ignore clear logs button"
                  accessibilityRole="button"
                  accessibilityLabel="Clear logs"
                  accessibilityHint="Removes all log entries from memory"
                  onPress={clearLogs}
                  style={styles.clearButton}
                >
                  <Trash size={16} color="#F87171" />
                </TouchableOpacity>

                <TouchableOpacity
                  sentry-label="ignore refresh logs button"
                  accessibilityRole="button"
                  accessibilityLabel="Refresh logs"
                  accessibilityHint="Refreshes the log entries to show latest data"
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
                  sentry-label="ignore close log viewer button"
                  accessibilityRole="button"
                  accessibilityLabel="Close log viewer"
                  accessibilityHint="Closes the log viewer and returns to the admin panel"
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter section */}
            <LogFilters
              entries={entries}
              selectedTypes={selectedTypes}
              selectedLevels={selectedLevels}
              onToggleTypeFilter={toggleTypeFilter}
              onToggleLevelFilter={toggleLevelFilter}
            />
          </View>

          {/* Log Entries */}
          {getFilteredEntries().length === 0 ? (
            <View style={styles.emptyContainer}>
              {entries.length === 0 ? <EmptyState /> : <EmptyFilterState />}
            </View>
          ) : (
            <FlatList
              sentry-label="ignore log entries list"
              ref={flatListRef}
              data={getFilteredEntries()}
              renderItem={({ item }) => (
                <LogEntryItem entry={item} onSelectEntry={selectEntry} />
              )}
              keyExtractor={keyExtractor}
              inverted
              style={styles.flatList}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator
              removeClippedSubviews
              onEndReachedThreshold={0.5}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  flatList: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
  },
});
