import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
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
  SearchBar,
} from "@react-buoy/shared-ui";
import { RouteObserver, type RouteChangeEvent } from "../RouteObserver";
import {
  RouteEventDetailContent,
  RouteEventDetailFooter,
} from "./RouteEventDetailContent";
import { RouteFilterViewV2 } from "./RouteFilterViewV2";
import { RoutesSitemap } from "./RoutesSitemap";
import { NavigationStack } from "./NavigationStack";
import { RouteEventsTimeline } from "./RouteEventsTimeline";

interface RouteEventsModalWithTabsProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
  routeObserver: RouteObserver;
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
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    if (events.length === 0) return;

    Alert.alert(
      "Clear Events",
      `Clear ${events.length} event${events.length !== 1 ? 's' : ''}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => setEvents([]),
        },
      ]
    );
  }, [events.length]);

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

  // Filter events based on ignored patterns and search query
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!event.pathname) return false;

      // Filter out pathnames that match ignored patterns
      const shouldIgnore = Array.from(ignoredPatterns).some((pattern) =>
        event.pathname.includes(pattern)
      );

      if (shouldIgnore) return false;

      // Filter by search query (search in pathname and param values)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const pathnameMatch = event.pathname.toLowerCase().includes(query);
        const paramsMatch = Object.entries(event.params || {}).some(
          ([key, value]) => {
            const valueStr = Array.isArray(value) ? value.join(" ") : value;
            return (
              key.toLowerCase().includes(query) ||
              valueStr.toLowerCase().includes(query)
            );
          }
        );
        return pathnameMatch || paramsMatch;
      }

      return true;
    });
  }, [events, ignoredPatterns, searchQuery]);

  // Calculate visit counts for each route (for duplicate detection)
  const visitCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const eventVisitNumbers = new Map<number, number>();

    // Iterate from oldest to newest to assign visit numbers correctly
    for (let i = events.length - 1; i >= 0; i--) {
      const event = events[i];
      const currentCount = counts.get(event.pathname) || 0;
      const visitNumber = currentCount + 1;
      counts.set(event.pathname, visitNumber);
      eventVisitNumbers.set(i, visitNumber);
    }

    return eventVisitNumbers;
  }, [events]);

  if (!visible) return null;

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.routeEvents.modal();

  // No footer needed since we're showing a timeline
  const footerNode = null;

  const renderContent = () => {
    if (activeTab === "routes") {
      return <RoutesSitemap style={styles.contentWrapper} />;
    }

    if (activeTab === "stack") {
      return <NavigationStack style={styles.contentWrapper} />;
    }

    // Events tab content
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

    if (filteredEvents.length === 0) {
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

    // Show chronological timeline of events
    return (
      <View style={styles.contentWrapper}>
        {/* Search bar */}
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search pathname or params..."
          />
        </View>

        <RouteEventsTimeline events={filteredEvents} visitCounts={visitCounts} />
      </View>
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

  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: macOSColors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },

  statsText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    textAlign: "center",
  },

  statsWarning: {
    color: macOSColors.semantic.warning,
    fontWeight: "600",
  },

  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: macOSColors.background.base,
  },
});
