import { useState, useEffect, useCallback, useRef } from "react";
import { BaseFloatingModal } from "../../../_components/floating-bubble/modal";
import { BackButton } from "../../../_shared/ui/components/BackButton";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Database, Play, Pause, Trash2 } from "lucide-react-native";
import { devToolsStorageKeys } from "../../../_shared/storage/devToolsStorageKeys";
import {
  startListening,
  stopListening,
  addListener,
  AsyncStorageEvent,
  isListening as checkIsListening,
} from "../utils/AsyncStorageListener";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { DataViewer } from "../../react-query/components/shared/DataViewer";

interface StorageEventsModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

export function StorageEventsModal({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
}: StorageEventsModalProps) {
  const [events, setEvents] = useState<AsyncStorageEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [expandedEventIndex, setExpandedEventIndex] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Force re-render every 10 seconds to update relative times
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    if (visible && events.length > 0) {
      intervalRef.current = setInterval(() => {
        forceUpdate({});
      }, 10000); // Update every 10 seconds
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [visible, events.length]);

  useEffect(() => {
    if (!visible) return;

    // Add listener for AsyncStorage events
    const unsubscribe = addListener((event: AsyncStorageEvent) => {
      console.log('[StorageEventsModal] Received event:', event.action, event.data);
      setEvents(prev => [event, ...prev.slice(0, 499)]); // Keep last 500 events
    });

    // Check initial listening state
    const initialState = checkIsListening();
    setIsListening(initialState);

    return () => {
      unsubscribe();
    };
  }, [visible]);

  const handleToggleListening = useCallback(async () => {
    if (isListening) {
      console.log('[StorageEventsModal] Stopping listener');
      stopListening();
      setIsListening(false);
    } else {
      console.log('[StorageEventsModal] Starting listener');
      await startListening();
      setIsListening(true);
    }
  }, [isListening]);

  const handleClearEvents = useCallback(() => {
    setEvents([]);
    setExpandedEventIndex(null);
  }, []);

  const handleEventPress = useCallback((index: number) => {
    setExpandedEventIndex(expandedEventIndex === index ? null : index);
  }, [expandedEventIndex]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'setItem':
      case 'multiSet':
        return '#10B981'; // Green for write
      case 'removeItem':
      case 'multiRemove':
      case 'clear':
        return '#EF4444'; // Red for delete
      case 'mergeItem':
      case 'multiMerge':
        return '#3B82F6'; // Blue for merge
      default:
        return '#6B7280';
    }
  };

  const formatEventSummary = (event: AsyncStorageEvent) => {
    if (!event.data) return event.action;
    
    if (event.action === 'setItem' || event.action === 'removeItem' || event.action === 'mergeItem') {
      return event.data.key || event.action;
    }
    
    if (event.action === 'multiSet' || event.action === 'multiMerge') {
      return `${event.data.pairs?.length || 0} keys`;
    }
    
    if (event.action === 'multiRemove') {
      return `${event.data.keys?.length || 0} keys`;
    }
    
    if (event.action === 'clear') {
      return 'All storage cleared';
    }
    
    return event.action;
  };

  const parseValue = (value: any) => {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.storage.eventsModal();

  const renderHeaderContent = () => (
    <View style={styles.headerContainer}>
      {onBack && <BackButton onPress={onBack} />}
      <View style={styles.headerStats}>
        <Text style={styles.headerStatsText}>{events.length}</Text>
        {isListening && <View style={styles.listeningIndicator} />}
      </View>
      
      {/* Action buttons in header */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          sentry-label="ignore toggle listening"
          onPress={handleToggleListening}
          style={[
            styles.headerActionButton,
            isListening ? styles.stopButton : styles.startButton
          ]}
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
          style={styles.headerActionButton}
          disabled={events.length === 0}
        >
          <Trash2 size={14} color={events.length > 0 ? "#6B7280" : "#374151"} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <View style={styles.container}>
        {/* Events List */}
        <ScrollView 
          style={styles.eventsList}
          showsVerticalScrollIndicator={false}
          sentry-label="ignore events scroll"
        >
          {events.length === 0 ? (
            <View style={styles.emptyState}>
              <Database size={32} color="#374151" />
              <Text style={styles.emptyTitle}>No storage events</Text>
              <Text style={styles.emptyText}>
                {isListening 
                  ? 'Waiting for AsyncStorage operations...' 
                  : 'Start listening to capture storage events'
                }
              </Text>
            </View>
          ) : (
            events.map((event, index) => (
              <TouchableOpacity
                key={`${event.timestamp.getTime()}-${index}`}
                style={styles.eventItem}
                onPress={() => handleEventPress(index)}
                activeOpacity={0.7}
                sentry-label="ignore storage event item"
              >
                <View style={styles.eventHeader}>
                  <View style={styles.eventLeft}>
                    <View style={[styles.actionBadge, { backgroundColor: `${getActionColor(event.action)}20` }]}>
                      <Text style={[styles.actionText, { color: getActionColor(event.action) }]}>
                        {event.action}
                      </Text>
                    </View>
                    <Text style={styles.eventSummary} numberOfLines={1}>
                      {formatEventSummary(event)}
                    </Text>
                  </View>
                  <Text style={styles.eventTime}>
                    {formatRelativeTime(event.timestamp)}
                  </Text>
                </View>
                
                {expandedEventIndex === index && event.data && (
                  <View style={styles.eventDetails}>
                    {event.data.key && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Key</Text>
                        <Text style={styles.keyText}>{event.data.key}</Text>
                      </View>
                    )}
                    {event.data.value !== undefined && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Value</Text>
                        {(() => {
                          const rawValue = event.data.value;
                          const parsed = parseValue(rawValue);
                          
                          // Debug log to see what we're getting
                          console.log('[StorageEventsModal] Raw value:', rawValue, 'Parsed:', parsed, 'Type:', typeof parsed);
                          
                          const isPrimitive = typeof parsed === 'string' || 
                                            typeof parsed === 'number' || 
                                            typeof parsed === 'boolean' ||
                                            parsed === null ||
                                            parsed === undefined;
                          
                          if (isPrimitive) {
                            // Handle edge cases for display
                            let displayValue = '';
                            if (parsed === null) displayValue = 'null';
                            else if (parsed === undefined) displayValue = 'undefined';
                            else if (parsed === '') displayValue = '(empty string)';
                            else displayValue = String(parsed);
                            
                            return (
                              <View style={styles.primitiveValueContainer}>
                                <Text style={styles.primitiveValue}>
                                  {displayValue}
                                </Text>
                                <Text style={styles.primitiveType}>
                                  ({parsed === null ? 'null' : parsed === undefined ? 'undefined' : typeof parsed})
                                </Text>
                              </View>
                            );
                          }
                          
                          return (
                            <DataViewer
                              title="Value"
                              data={parsed}
                              showTypeFilter={false}
                            />
                          );
                        })()}
                      </View>
                    )}
                    {event.data.pairs && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Pairs ({event.data.pairs.length})</Text>
                        <DataViewer
                          title="Pairs"
                          data={Object.fromEntries(event.data.pairs.map(([k, v]) => [k, parseValue(v)]))}
                          showTypeFilter={false}
                        />
                      </View>
                    )}
                    {event.data.keys && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>Keys ({event.data.keys.length})</Text>
                        <View style={styles.keysContainer}>
                          {event.data.keys.map((key, i) => (
                            <Text key={i} style={styles.keyItem}>{key}</Text>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    minHeight: 32,
    paddingLeft: 4,
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerStatsText: {
    fontSize: 12,
    color: "#9CA3AF",
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
    gap: 6,
    marginLeft: 8,
  },
  headerActionButton: {
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
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
  },
  eventItem: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  eventLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  actionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  actionText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  eventSummary: {
    fontSize: 12,
    color: "#E5E7EB",
    flex: 1,
  },
  eventTime: {
    fontSize: 11,
    color: "#6B7280",
  },
  eventDetails: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 12,
    gap: 12,
  },
  detailSection: {
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  keyText: {
    fontSize: 12,
    color: "#3B82F6",
    fontFamily: "monospace",
  },
  keysContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
    padding: 8,
    gap: 4,
  },
  keyItem: {
    fontSize: 11,
    color: "#3B82F6",
    fontFamily: "monospace",
  },
  primitiveValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 6,
    padding: 8,
  },
  primitiveValue: {
    fontSize: 13,
    color: "#3B82F6",
    fontFamily: "monospace",
    fontWeight: "500",
  },
  primitiveType: {
    fontSize: 11,
    color: "#6B7280",
    fontStyle: "italic",
  },
});