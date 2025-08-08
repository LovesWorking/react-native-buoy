import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { BaseFloatingModal } from "../../../_components/floating-bubble/modal";
import { BackButton } from "../../../_shared/ui/components/BackButton";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlashList } from "@shopify/flash-list";
import { ScrollView } from "react-native-gesture-handler";
import { Database, Activity, Pause, Play, Trash2, Filter } from "lucide-react-native";
import { devToolsStorageKeys } from "../../../_shared/storage/devToolsStorageKeys";
import {
  startListening,
  stopListening,
  addListener,
  AsyncStorageEvent,
  isListening as checkIsListening,
} from "../utils/AsyncStorageListener";
import { formatRelativeTime } from "../utils/formatRelativeTime";
import { StorageEventDetailModal } from "./StorageEventDetailModal";
import { StorageFilterView } from "./StorageFilterView";
import { ValueTypeBadge } from "../../../_shared/ui/components/ValueTypeBadge";

interface StorageEventsModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

interface StorageKeyConversation {
  key: string;
  lastEvent: AsyncStorageEvent;
  events: AsyncStorageEvent[];
  totalOperations: number;
  currentValue: unknown;
  valueType: 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'object' | 'array';
}

export function StorageEventsModal({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
}: StorageEventsModalProps) {
  const [events, setEvents] = useState<AsyncStorageEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<StorageKeyConversation | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ignoredPatterns, setIgnoredPatterns] = useState<Set<string>>(new Set([devToolsStorageKeys.base]));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Force re-render every 10 seconds to update relative times
  const [tick, setTick] = useState(0);
  
  // Load saved filter patterns
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const saved = await AsyncStorage.getItem(devToolsStorageKeys.storage.filters());
        if (saved) {
          const patterns = JSON.parse(saved);
          setIgnoredPatterns(new Set(patterns));
        }
      } catch (error) {
        console.warn('Failed to load storage filters:', error);
      }
    };
    
    if (visible) {
      loadFilters();
    }
  }, [visible]);
  
  // Save filter patterns when they change
  useEffect(() => {
    const saveFilters = async () => {
      try {
        await AsyncStorage.setItem(
          devToolsStorageKeys.storage.filters(),
          JSON.stringify(Array.from(ignoredPatterns))
        );
      } catch (error) {
        console.warn('Failed to save storage filters:', error);
      }
    };
    
    if (visible && ignoredPatterns.size > 0) {
      saveFilters();
    }
  }, [ignoredPatterns, visible]);
  
  useEffect(() => {
    if (visible && events.length > 0) {
      intervalRef.current = setInterval(() => {
        setTick(prev => prev + 1);
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
      // Add unique ID to each event
      const eventWithId = {
        ...event,
        id: `${event.timestamp.getTime()}-${Math.random()}`
      };
      setEvents(prev => [eventWithId, ...prev.slice(0, 999)]); // Keep last 1000 events
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
    setSelectedConversation(null);
  }, []);

  const handleConversationPress = useCallback((conversation: StorageKeyConversation) => {
    setSelectedConversation(conversation);
  }, []);

  const handleTogglePattern = useCallback((pattern: string) => {
    setIgnoredPatterns(prev => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  }, []);

  const handleAddPattern = useCallback((pattern: string) => {
    setIgnoredPatterns(prev => new Set([...prev, pattern]));
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const parseValue = (value: unknown): unknown => {
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

  const getValueType = (value: unknown): StorageKeyConversation['valueType'] => {
    const parsed = parseValue(value);
    if (parsed === null) return 'null';
    if (parsed === undefined) return 'undefined';
    if (Array.isArray(parsed)) return 'array';
    if (typeof parsed === 'boolean') return 'boolean';
    if (typeof parsed === 'number') return 'number';
    if (typeof parsed === 'string') return 'string';
    if (typeof parsed === 'object') return 'object';
    return 'undefined';
  };

  // Group events by key and create conversations
  const conversations = useMemo(() => {
    const keyMap = new Map<string, StorageKeyConversation>();
    
    events.forEach(event => {
      if (!event.data?.key) return;
      
      const key = event.data.key;
      
      // Filter out keys that match ignored patterns
      const shouldIgnore = Array.from(ignoredPatterns).some(pattern => 
        key.includes(pattern)
      );
      
      if (shouldIgnore) return;
      
      const existing = keyMap.get(key);
      
      if (!existing) {
        keyMap.set(key, {
          key,
          lastEvent: event,
          events: [event],
          totalOperations: 1,
          currentValue: event.data.value,
          valueType: getValueType(event.data.value),
        });
      } else {
        existing.events.push(event);
        existing.totalOperations++;
        
        // Update last event if this one is newer
        if (event.timestamp > existing.lastEvent.timestamp) {
          existing.lastEvent = event;
          existing.currentValue = event.data.value;
          existing.valueType = getValueType(event.data.value);
        }
      }
    });
    
    // Convert to array and sort by last updated
    return Array.from(keyMap.values()).sort((a, b) => 
      b.lastEvent.timestamp.getTime() - a.lastEvent.timestamp.getTime()
    );
  }, [events, tick, ignoredPatterns]); // Include ignoredPatterns in dependencies

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

  // FlashList optimization constants
  const ESTIMATED_ITEM_SIZE = 80;
  const END_REACHED_THRESHOLD = 0.8;
  
  // Stable keyExtractor for FlashList
  const keyExtractor = useCallback((item: StorageKeyConversation) => {
    return item.key;
  }, []);

  // Stable getItemType for FlashList optimization
  const getItemType = useCallback(() => {
    return 'conversation';
  }, []);

  // Create stable ref for event handler
  const selectConversationRef = useRef<((conversation: StorageKeyConversation) => void) | undefined>(undefined);
  selectConversationRef.current = handleConversationPress;

  // Memoized renderItem to prevent re-creation
  const renderItem = useMemo(() => {
    return ({ item }: { item: StorageKeyConversation }) => {
      const parsed = parseValue(item.currentValue);
      
      return (
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => selectConversationRef.current?.(item)}
          activeOpacity={0.7}
          sentry-label="ignore storage conversation item"
        >
          <View style={styles.conversationRow}>
            {/* Key name and metadata row */}
            <View style={styles.conversationMain}>
              <Text style={styles.conversationKey} numberOfLines={1}>
                {item.key}
              </Text>
              
              {/* Metadata row */}
              <View style={styles.conversationMeta}>
                <View style={styles.metaLeft}>
                  <Text style={styles.metaText}>
                    {item.totalOperations} {item.totalOperations === 1 ? 'operation' : 'operations'}
                  </Text>
                  <Text style={styles.metaDot}>•</Text>
                  <ValueTypeBadge 
                    type={item.valueType} 
                    value={parsed}
                    size="small"
                  />
                </View>
                
                <View style={styles.metaRight}>
                  <View style={[styles.actionBadge, { backgroundColor: `${getActionColor(item.lastEvent.action)}20` }]}>
                    <Text style={[styles.actionText, { color: getActionColor(item.lastEvent.action) }]}>
                      {item.lastEvent.action}
                    </Text>
                  </View>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.timeText}>
                    {formatRelativeTime(item.lastEvent.timestamp)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    };
  }, [tick]); // Re-render when tick changes to update relative times

  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.storage.eventsModal();

  const renderHeaderContent = () => (
    <View style={styles.headerContainer}>
      {onBack && <BackButton onPress={onBack} />}
      <View style={styles.headerStats}>
        <Text style={styles.headerStatsText}>{conversations.length} keys</Text>
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
          sentry-label="ignore toggle filters"
          onPress={handleToggleFilters}
          style={[
            styles.headerActionButton,
            showFilters && styles.filterButtonActive
          ]}
        >
          <Filter size={14} color={showFilters ? "#3B82F6" : "#6B7280"} />
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

  // Show detail modal if a conversation is selected
  if (selectedConversation) {
    return (
      <StorageEventDetailModal
        visible={true}
        event={selectedConversation.lastEvent}
        allEvents={selectedConversation.events}
        onClose={onClose}
        onBack={() => setSelectedConversation(null)}
        enableSharedModalDimensions={enableSharedModalDimensions}
      />
    );
  }

  // Show filter view if filters are active
  if (showFilters) {
    return (
      <BaseFloatingModal
        visible={visible}
        onClose={onClose}
        storagePrefix={storagePrefix}
        showToggleButton={true}
        customHeaderContent={
          <View style={styles.headerContainer}>
            <BackButton onPress={() => setShowFilters(false)} />
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Filter Storage Events</Text>
            </View>
          </View>
        }
        headerSubtitle={undefined}
      >
        <StorageFilterView
          ignoredPatterns={ignoredPatterns}
          onTogglePattern={handleTogglePattern}
          onAddPattern={handleAddPattern}
          onBack={() => setShowFilters(false)}
        />
      </BaseFloatingModal>
    );
  }

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
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Database size={32} color="#374151" />
            <Text style={styles.emptyTitle}>No storage activity</Text>
            <Text style={styles.emptyText}>
              {isListening 
                ? 'Waiting for AsyncStorage operations...' 
                : 'Start listening to capture storage events'
              }
            </Text>
          </View>
        ) : (
          <FlashList
            data={conversations}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            getItemType={getItemType}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            inverted
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            removeClippedSubviews
            onEndReachedThreshold={END_REACHED_THRESHOLD}
            renderScrollComponent={ScrollView}
          />
        )}
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
    flex: 1,
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
  filterButtonActive: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
  },
  listContent: {
    paddingTop: 8,
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
  conversationItem: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    overflow: "hidden",
    padding: 10,
  },
  conversationRow: {
    flex: 1,
  },
  conversationMain: {
    flex: 1,
  },
  conversationKey: {
    fontSize: 13,
    fontWeight: "500",
    color: "#E5E7EB",
    marginBottom: 4,
  },
  actionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  actionText: {
    fontSize: 9,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  timeText: {
    fontSize: 10,
    color: "#6B7280",
  },
  conversationMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 10,
    color: "#6B7280",
  },
  metaDot: {
    fontSize: 10,
    color: "#4B5563",
  },
});