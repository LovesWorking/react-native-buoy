import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  JsModal,
  type ModalMode,
  ModalHeader,
  TabSelector,
  formatRelativeTime,
  devToolsStorageKeys,
  macOSColors,
  Navigation,
  Pause,
  Play,
  Trash2,
  Filter,
} from "@react-buoy/shared-ui";
import { RouteObserver, type RouteChangeEvent } from "../RouteObserver";
import {
  RouteEventDetailContent,
  RouteEventDetailFooter,
} from "./RouteEventDetailContent";
import { RouteFilterViewV2 } from "./RouteFilterViewV2";
import { RoutesSitemap } from "./RoutesSitemap";
import { NavigationStack } from "./NavigationStack";

interface RouteEventsModalWithTabsProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
  routeObserver: RouteObserver;
}

interface RouteConversation {
  pathname: string;
  lastEvent: RouteChangeEvent;
  events: RouteChangeEvent[];
  totalNavigations: number;
}

type TabType = "routes" | "events" | "stack";

export function RouteEventsModalWithTabs({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
  routeObserver,
}: RouteEventsModalWithTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("events");

  // Event Listener state
  const [events, setEvents] = useState<RouteChangeEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedConversationKey, setSelectedConversationKey] = useState<
    string | null
  >(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [ignoredPatterns, setIgnoredPatterns] = useState<Set<string>>(
    new Set(["/_sitemap", "/api", "/__dev"])
  );
  const lastEventRef = useRef<RouteChangeEvent | null>(null);
  const hasLoadedFilters = useRef(false);
  const hasLoadedTabState = useRef(false);
  const hasLoadedMonitoringState = useRef(false);

  const handleModeChange = useCallback((_mode: ModalMode) => {
    // Mode changes handled by JsModal
  }, []);

  // Load persisted tab state on mount
  useEffect(() => {
    if (!visible || hasLoadedTabState.current) return;

    const loadTabState = async () => {
      try {
        const storedTab = await AsyncStorage.getItem(
          devToolsStorageKeys.routeEvents.activeTab()
        );
        if (storedTab && (storedTab === "routes" || storedTab === "events")) {
          setActiveTab(storedTab as TabType);
        }
        hasLoadedTabState.current = true;
      } catch (error) {
        console.warn("Failed to load route events tab state:", error);
      }
    };

    loadTabState();
  }, [visible]);

  // Load persisted monitoring state on mount
  useEffect(() => {
    if (!visible || hasLoadedMonitoringState.current) return;

    const loadMonitoringState = async () => {
      try {
        const storedMonitoring = await AsyncStorage.getItem(
          devToolsStorageKeys.routeEvents.isMonitoring()
        );
        if (storedMonitoring !== null) {
          const shouldMonitor = storedMonitoring === "true";
          setIsListening(shouldMonitor);
        }
        hasLoadedMonitoringState.current = true;
      } catch (error) {
        console.warn("Failed to load monitoring state:", error);
      }
    };

    loadMonitoringState();
  }, [visible]);

  // Save tab state when it changes
  useEffect(() => {
    if (!hasLoadedTabState.current) return;

    const saveTabState = async () => {
      try {
        await AsyncStorage.setItem(
          devToolsStorageKeys.routeEvents.activeTab(),
          activeTab
        );
      } catch (error) {
        console.warn("Failed to save tab state:", error);
      }
    };

    saveTabState();
  }, [activeTab]);

  // Save monitoring state when it changes
  useEffect(() => {
    if (!hasLoadedMonitoringState.current) return;

    const saveMonitoringState = async () => {
      try {
        await AsyncStorage.setItem(
          devToolsStorageKeys.routeEvents.isMonitoring(),
          isListening.toString()
        );
      } catch (error) {
        console.warn("Failed to save monitoring state:", error);
      }
    };

    saveMonitoringState();
  }, [isListening]);

  // Load persisted filters on mount
  useEffect(() => {
    if (!visible || hasLoadedFilters.current) return;

    const loadFilters = async () => {
      try {
        const storedFilters = await AsyncStorage.getItem(
          devToolsStorageKeys.routeEvents.eventFilters()
        );
        if (storedFilters) {
          const filters = JSON.parse(storedFilters) as string[];
          setIgnoredPatterns(new Set(filters));
        }
        hasLoadedFilters.current = true;
      } catch (error) {
        console.warn("Failed to load route event filters:", error);
      }
    };

    loadFilters();
  }, [visible]);

  // Save filters when they change
  useEffect(() => {
    if (!hasLoadedFilters.current) return;

    const saveFilters = async () => {
      try {
        const filters = Array.from(ignoredPatterns);
        await AsyncStorage.setItem(
          devToolsStorageKeys.routeEvents.eventFilters(),
          JSON.stringify(filters)
        );
      } catch (error) {
        console.warn("Failed to save route event filters:", error);
      }
    };

    saveFilters();
  }, [ignoredPatterns]);

  // Event listener setup
  useEffect(() => {
    if (!visible || !isListening) return;

    // Set up event listener
    const unsubscribe = routeObserver.addListener((event) => {
      lastEventRef.current = event;
      setEvents((prev) => {
        const updated = [event, ...prev];
        return updated.slice(0, 500);
      });
    });

    return () => {
      unsubscribe();
    };
  }, [visible, isListening, routeObserver]);

  const handleToggleListening = useCallback(() => {
    setIsListening((prev) => !prev);
  }, []);

  const handleClearEvents = useCallback(() => {
    setEvents([]);
    setSelectedConversationKey(null);
  }, []);

  const handleConversationPress = useCallback(
    (conversation: RouteConversation) => {
      setSelectedConversationKey(conversation.pathname);
      setSelectedEventIndex(0);
    },
    []
  );

  const handleTogglePattern = useCallback((pattern: string) => {
    setIgnoredPatterns((prev) => {
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
    setIgnoredPatterns((prev) => new Set([...prev, pattern]));
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  // Get all unique pathnames from events
  const allEventPathnames = useMemo(() => {
    const pathnames = new Set<string>();
    events.forEach((event) => {
      if (event.pathname) {
        pathnames.add(event.pathname);
      }
    });
    return Array.from(pathnames).sort();
  }, [events]);

  // Group events by pathname and create conversations
  const conversations = useMemo(() => {
    const pathnameMap = new Map<string, RouteConversation>();

    events.forEach((event) => {
      if (!event.pathname) return;

      const pathname = event.pathname;

      // Filter out pathnames that match ignored patterns
      const shouldIgnore = Array.from(ignoredPatterns).some((pattern) =>
        pathname.includes(pattern)
      );

      if (shouldIgnore) return;

      const existing = pathnameMap.get(pathname);

      if (!existing) {
        pathnameMap.set(pathname, {
          pathname,
          lastEvent: event,
          events: [event],
          totalNavigations: 1,
        });
      } else {
        existing.events.push(event);
        existing.totalNavigations++;

        // Update last event if this one is newer
        if (event.timestamp > existing.lastEvent.timestamp) {
          existing.lastEvent = event;
        }
      }
    });

    // Convert to array and sort by last updated
    return Array.from(pathnameMap.values()).sort(
      (a, b) =>
        b.lastEvent.timestamp - a.lastEvent.timestamp
    );
  }, [events, ignoredPatterns]);

  // Get the live selected conversation from the current conversations array
  const selectedConversation = useMemo(() => {
    if (!selectedConversationKey) return null;
    return conversations.find((c) => c.pathname === selectedConversationKey) || null;
  }, [selectedConversationKey, conversations]);

  // FlatList optimization constants
  const END_REACHED_THRESHOLD = 0.8;

  // Stable keyExtractor for FlatList
  const keyExtractor = useCallback((item: RouteConversation) => {
    return item.pathname;
  }, []);

  // Create stable ref for event handler
  const selectConversationRef = useRef<
    ((conversation: RouteConversation) => void) | undefined
  >(undefined);
  selectConversationRef.current = handleConversationPress;

  // Stable renderItem with ref pattern
  const renderConversationItem = useCallback(
    ({ item }: { item: RouteConversation }) => {
      return (
        <TouchableOpacity
          onPress={() => selectConversationRef.current?.(item)}
          style={styles.conversationItem}
        >
          <View style={styles.conversationHeader}>
            <Text style={styles.pathnameText} numberOfLines={1}>
              {item.pathname}
            </Text>
          </View>
          <View style={styles.conversationDetails}>
            <Text style={styles.operationCount}>
              {item.totalNavigations} navigation
              {item.totalNavigations !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.timestamp}>
              {formatRelativeTime(new Date(item.lastEvent.timestamp))}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    []
  );

  if (!visible) return null;

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.routeEvents.modal();

  const footerNode = selectedConversation ? (
    <RouteEventDetailFooter
      conversation={selectedConversation}
      selectedEventIndex={selectedEventIndex}
      onEventIndexChange={setSelectedEventIndex}
    />
  ) : null;

  const renderContent = () => {
    if (activeTab === "routes") {
      return <RoutesSitemap style={styles.contentWrapper} />;
    }

    if (activeTab === "stack") {
      return <NavigationStack style={styles.contentWrapper} />;
    }

    // Events tab content
    if (selectedConversation) {
      return (
        <View style={styles.contentWrapper}>
          <RouteEventDetailContent
            conversation={selectedConversation}
            selectedEventIndex={selectedEventIndex}
            onEventIndexChange={setSelectedEventIndex}
            disableInternalFooter={true}
          />
        </View>
      );
    }

    if (showFilters) {
      return (
        <RouteFilterViewV2
          ignoredPatterns={ignoredPatterns}
          onTogglePattern={handleTogglePattern}
          onAddPattern={handleAddPattern}
          availablePathnames={allEventPathnames}
        />
      );
    }

    if (conversations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Navigation size={48} color={macOSColors.text.muted} />
          <Text style={styles.emptyTitle}>
            {isListening ? "No route events yet" : "Event listener is paused"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isListening
              ? "Navigation events will appear here"
              : "Press play to start monitoring"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        scrollEnabled={false}
      />
    );
  };

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: showFilters ? (
          <ModalHeader>
            <ModalHeader.Navigation
              onBack={() => setShowFilters(false)}
              onClose={onClose}
            />
            <ModalHeader.Content title="Filters" />
          </ModalHeader>
        ) : selectedConversation ? (
          <ModalHeader>
            <ModalHeader.Navigation
              onBack={() => {
                setSelectedConversationKey(null);
                setSelectedEventIndex(0);
              }}
              onClose={onClose}
            />
            <ModalHeader.Content title={selectedConversation.pathname} />
          </ModalHeader>
        ) : (
          <ModalHeader>
            {onBack && <ModalHeader.Navigation onBack={onBack} />}
            <ModalHeader.Content title="" noMargin>
              <TabSelector
                tabs={[
                  {
                    key: "routes",
                    label: "Routes",
                  },
                  {
                    key: "events",
                    label: `Events${
                      events.length > 0 && activeTab !== "events"
                        ? ` (${events.length})`
                        : ""
                    }`,
                  },
                  {
                    key: "stack",
                    label: "Stack",
                  },
                ]}
                activeTab={activeTab}
                onTabChange={(tab: string) => setActiveTab(tab as TabType)}
              />
            </ModalHeader.Content>
            <ModalHeader.Actions onClose={onClose}>
              {activeTab === "events" && (
                <>
                  <TouchableOpacity
                    onPress={handleToggleFilters}
                    style={[
                      styles.iconButton,
                      ignoredPatterns.size > 0 && styles.activeFilterButton,
                    ]}
                  >
                    <Filter
                      size={14}
                      color={
                        ignoredPatterns.size > 0
                          ? macOSColors.semantic.debug
                          : macOSColors.text.secondary
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleToggleListening}
                    style={[
                      styles.iconButton,
                      isListening && styles.activeButton,
                    ]}
                  >
                    {isListening ? (
                      <Pause size={14} color={macOSColors.semantic.success} />
                    ) : (
                      <Play size={14} color={macOSColors.semantic.success} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleClearEvents}
                    style={styles.iconButton}
                  >
                    <Trash2 size={14} color={macOSColors.semantic.error} />
                  </TouchableOpacity>
                </>
              )}
            </ModalHeader.Actions>
          </ModalHeader>
        ),
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
      footer={footerNode}
      footerHeight={footerNode ? 68 : 0}
    >
      {renderContent()}
    </JsModal>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: macOSColors.background.input,
  },

  activeButton: {
    backgroundColor: macOSColors.semantic.successBackground,
  },

  activeFilterButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
  },

  conversationItem: {
    padding: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    marginHorizontal: 16,
  },

  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  pathnameText: {
    color: macOSColors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
    fontFamily: "monospace",
  },

  conversationDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  operationCount: {
    color: macOSColors.text.secondary,
    fontSize: 11,
    flex: 1,
    fontFamily: "monospace",
  },

  timestamp: {
    color: macOSColors.text.muted,
    fontSize: 11,
    fontFamily: "monospace",
  },

  separator: {
    height: 8,
  },

  listContent: {
    paddingVertical: 16,
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

  contentWrapper: {
    flex: 1,
  },
});
