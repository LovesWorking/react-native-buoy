import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Play, Pause, Trash2 } from "@react-buoy/shared-ui";
import {
  startListening,
  stopListening,
  addListener,
  AsyncStorageEvent,
  isListening as checkIsListening,
} from "../utils/AsyncStorageListener";
import { translateStorageAction } from "../utils/storageActionHelpers";
import { isMMKVAvailable } from "../utils/mmkvAvailability";

// Conditionally import MMKV listener
let addMMKVListener: any;

// Define type for MMKV events (imported conditionally at runtime)
type MMKVEvent = {
  action: string;
  timestamp: Date;
  instanceId: string;
  data?: {
    key?: string;
    value?: any;
    valueType?: string;
    success?: boolean;
  };
};

if (isMMKVAvailable()) {
  const mmkvListener = require("../utils/MMKVListener");
  addMMKVListener = mmkvListener.addMMKVListener;
}

// Unified event type that covers both AsyncStorage and MMKV
type StorageEvent = (AsyncStorageEvent & { storageType: 'async' }) | (any & { storageType: 'mmkv' });

/**
 * Storage event listener component for monitoring AsyncStorage and MMKV operations
 * Follows the Sentry component pattern for consistency
 */
export function StorageEventListener() {
  const [events, setEvents] = useState<StorageEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAsyncStorageAvailable, setIsAsyncStorageAvailable] = useState(false);

  useEffect(() => {
    // Component mounted, AsyncStorage is available
    setIsAsyncStorageAvailable(true);

    // Add listener for AsyncStorage events
    const unsubscribeAsync = addListener((event: AsyncStorageEvent) => {
      setEvents((prev) => {
        const newEvents = [{ ...event, storageType: 'async' as const }, ...prev.slice(0, 99)];
        return newEvents;
      });
    });

    // Add listener for MMKV events (only if available)
    let unsubscribeMMKV = () => {};
    if (isMMKVAvailable() && addMMKVListener) {
      unsubscribeMMKV = addMMKVListener((event: any) => {
        setEvents((prev) => {
          const newEvents = [{ ...event, storageType: 'mmkv' as const }, ...prev.slice(0, 99)];
          return newEvents;
        });
      });
    }

    // Check initial listening state
    const initialState = checkIsListening();
    setIsListening(initialState);

    return () => {
      if (checkIsListening()) {
        stopListening();
      }
      unsubscribeAsync();
      unsubscribeMMKV();
    };
  }, []);

  const handleToggleListening = useCallback(async () => {
    if (!isAsyncStorageAvailable) {
      return;
    }

    if (isListening) {
      // Stopping listener
      stopListening();
      setIsListening(false);
    } else {
      // Starting listener
      await startListening();
      setIsListening(true);
    }
  }, [isListening, isAsyncStorageAvailable]);

  const handleClearEvents = useCallback(() => {
    // Clearing all events
    setEvents([]);
  }, []);

  const formatEventData = (event: StorageEvent) => {
    if (!event.data) return "";

    // MMKV events
    if (event.storageType === 'mmkv') {
      const mmkvEvent = event as MMKVEvent & { storageType: 'mmkv' };

      // Show instance ID for MMKV events
      const instancePrefix = `[${mmkvEvent.instanceId}] `;

      if (mmkvEvent.action.startsWith('set.') || mmkvEvent.action.startsWith('get.') || mmkvEvent.action === 'delete') {
        const keyInfo = mmkvEvent.data?.key ? `${mmkvEvent.data.key}` : "";
        const typeInfo = mmkvEvent.data?.valueType ? ` (${mmkvEvent.data.valueType})` : "";
        return instancePrefix + keyInfo + typeInfo;
      }

      if (mmkvEvent.action === 'clearAll') {
        return instancePrefix + "All keys";
      }

      return instancePrefix;
    }

    // AsyncStorage events
    if (
      event.action === "setItem" ||
      event.action === "removeItem" ||
      event.action === "mergeItem"
    ) {
      return event.data.key || "";
    }

    if (event.action === "multiSet" || event.action === "multiMerge") {
      return `${event.data.pairs?.length || 0} pairs`;
    }

    if (event.action === "multiRemove") {
      return `${event.data.keys?.length || 0} keys`;
    }

    if (event.action === "clear") {
      return "All storage";
    }

    return "";
  };

  const getActionColor = (action: string) => {
    // MMKV actions
    if (action.startsWith('set.')) {
      return "#10B981"; // Green for writes
    }
    if (action.startsWith('get.')) {
      return "#F59E0B"; // Orange for reads
    }
    if (action === 'delete' || action === 'clearAll') {
      return "#EF4444"; // Red for deletes
    }

    // AsyncStorage actions
    switch (action) {
      case "setItem":
      case "multiSet":
        return "#10B981"; // Green for write
      case "removeItem":
      case "multiRemove":
      case "clear":
        return "#EF4444"; // Red for delete
      case "mergeItem":
      case "multiMerge":
        return "#3B82F6"; // Blue for merge
      default:
        return "#6B7280";
    }
  };

  if (!isAsyncStorageAvailable) {
    return null; // Don't show component if AsyncStorage isn't available
  }

  return (
    <View style={styles.container}>
      {/* Header with controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Storage Events</Text>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>{events.length}</Text>
            {isListening && <View style={styles.listeningIndicator} />}
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            sentry-label="ignore toggle listening"
            onPress={handleToggleListening}
            style={[
              styles.actionButton,
              isListening ? styles.stopButton : styles.startButton,
            ]}
            accessibilityLabel={
              isListening ? "Stop listening" : "Start listening"
            }
          >
            {isListening ? (
              <Pause size={14} color="#EF4444" />
            ) : (
              <Play size={14} color="#10B981" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            sentry-label="ignore clear events"
            onPress={handleClearEvents}
            style={styles.actionButton}
            accessibilityLabel="Clear events"
            disabled={events.length === 0}
          >
            <Trash2
              size={14}
              color={events.length > 0 ? "#6B7280" : "#374151"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Events list */}
      <ScrollView
        style={styles.eventsList}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        sentry-label="ignore event list scroll"
      >
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isListening
                ? "Waiting for storage operations..."
                : "Start listening to capture events"}
            </Text>
          </View>
        ) : (
          events.map((event, index) => (
            <View
              key={`${event.timestamp.getTime()}-${index}`}
              style={styles.eventItem}
            >
              <View style={styles.eventLeft}>
                <Text
                  style={[
                    styles.eventAction,
                    { color: getActionColor(event.action) },
                  ]}
                >
                  {translateStorageAction(event.action)}
                </Text>
                <Text style={styles.eventData} numberOfLines={1}>
                  {formatEventData(event)}
                </Text>
              </View>
              <Text style={styles.eventTime}>
                {event.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    marginBottom: 12,
    maxHeight: 200,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statsText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  listeningIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  stopButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  eventsList: {
    maxHeight: 150,
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
  },
  eventItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  eventLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  eventAction: {
    fontSize: 11,
    fontWeight: "600",
    minWidth: 60,
  },
  eventData: {
    fontSize: 11,
    color: "#9CA3AF",
    flex: 1,
  },
  eventTime: {
    fontSize: 10,
    color: "#6B7280",
  },
});
