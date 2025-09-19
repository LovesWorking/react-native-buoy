import { useState, useRef, useMemo, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import {
  Globe,
  Trash2,
  Power,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  X,
  JsModal,
  ModalHeader,
  devToolsStorageKeys,
  macOSColors,
  useSafeAsyncStorage,
} from "@monorepo/shared";
import type { ModalMode } from "@monorepo/shared";
import { NetworkEventItemCompact } from "./NetworkEventItemCompact";
import { NetworkFilterViewV3 } from "./NetworkFilterViewV3";
import { TickProvider } from "../hooks/useTickEveryMinute";
import { NetworkEventDetailView } from "./NetworkEventDetailView";
import { useNetworkEvents } from "../hooks/useNetworkEvents";
import type { NetworkEvent } from "../types";

interface NetworkModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

// Decompose by Responsibility: Extract empty state component
function EmptyState({ isEnabled }: { isEnabled: boolean }) {
  return (
    <View style={styles.emptyState}>
      <Globe size={32} color={macOSColors.text.muted} />
      <Text style={styles.emptyTitle}>No network events</Text>
      <Text style={styles.emptyText}>
        {isEnabled
          ? "Network requests will appear here"
          : "Enable interception to start capturing"}
      </Text>
    </View>
  );
}

function NetworkModalInner({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
}: NetworkModalProps) {
  const {
    events,
    stats,
    filter,
    setFilter,
    clearEvents,
    isEnabled,
    toggleInterception,
  } = useNetworkEvents();

  const handleModeChange = useCallback((_mode: ModalMode) => {
    // Mode changes handled by JsModal
  }, []);

  const [selectedEvent, setSelectedEvent] = useState<NetworkEvent | null>(null);
  const [showFilterView, setShowFilterView] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const [ignoredPatterns, setIgnoredPatterns] = useState<Set<string>>(
    new Set()
  );
  const flatListRef = useRef<FlatList<NetworkEvent>>(null);
  const hasLoadedFilters = useRef(false);
  const { getItem: safeGetItem, setItem: safeSetItem } = useSafeAsyncStorage();

  // Load persisted filters on mount
  useEffect(() => {
    if (!visible || hasLoadedFilters.current) return;

    const loadFilters = async () => {
      try {
        // Load ignored patterns (using domains key for now)
        const storedPatterns = await safeGetItem(
          devToolsStorageKeys.network.ignoredDomains()
        );
        if (storedPatterns) {
          const patterns = JSON.parse(storedPatterns) as string[];
          setIgnoredPatterns(new Set(patterns));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Silently fail - filters will use defaults
      } finally {
        hasLoadedFilters.current = true;
      }
    };

    loadFilters();
  }, [visible, safeGetItem]);

  // Save filters when they change
  useEffect(() => {
    if (!hasLoadedFilters.current) return; // Don't save on initial load

    const saveFilters = async () => {
      try {
        // Save ignored patterns
        const patterns = Array.from(ignoredPatterns);
        await safeSetItem(
          devToolsStorageKeys.network.ignoredDomains(),
          JSON.stringify(patterns)
        );
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (_error) {
        // Silently fail - filters will remain in memory
      }
    };

    saveFilters();
  }, [ignoredPatterns, safeSetItem]);

  // Simple handlers - no useCallback needed per rule2
  const handleEventPress = (event: NetworkEvent) => {
    setSelectedEvent(event);
  };

  const handleBack = () => {
    setSelectedEvent(null);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    setFilter((prev) => ({ ...prev, searchText: text }));
  };

  useEffect(() => {
    if (isSearchActive) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isSearchActive]);

  // Filter events based on ignored patterns
  const filteredEvents = useMemo(() => {
    if (ignoredPatterns.size === 0) return events;

    return events.filter((event) => {
      const url = event.url.toLowerCase();

      // Check if any pattern matches the URL
      const isFiltered = Array.from(ignoredPatterns).some((pattern) =>
        url.includes(pattern.toLowerCase())
      );

      return !isFiltered;
    });
  }, [events, ignoredPatterns]);

  // FlatList optimization - only keep what's needed for FlatList performance
  const keyExtractor = (item: NetworkEvent) => item.id;

  // Keep renderItem memoized for FlatList performance (justified by FlatList docs)
  const renderItem = useMemo(() => {
    return ({ item }: { item: NetworkEvent }) => (
      <NetworkEventItemCompact event={item} onPress={handleEventPress} />
    );
  }, []); // Empty deps OK - handleEventPress defined inline

  // Compact header with actions (like Sentry/Storage modals)
  const renderHeaderContent = () => {
    // Filter view header - simple, no tabs
    if (showFilterView) {
      return (
        <ModalHeader>
          <ModalHeader.Navigation onBack={() => setShowFilterView(false)} />
          <ModalHeader.Content title="Filters" centered />
          <ModalHeader.Actions onClose={onClose} />
        </ModalHeader>
      );
    }

    // Event detail view header
    if (selectedEvent) {
      return (
        <ModalHeader>
          <ModalHeader.Navigation onBack={handleBack} />
          <ModalHeader.Content title="Request Details" centered />
          <ModalHeader.Actions onClose={onClose} />
        </ModalHeader>
      );
    }

    // Main list view header with search and filters
    return (
      <ModalHeader>
        {onBack && <ModalHeader.Navigation onBack={onBack} />}
        <ModalHeader.Content title="">
          {isSearchActive ? (
            <View style={styles.headerSearchContainer}>
              <Search size={14} color={macOSColors.text.secondary} />
              <TextInput
                ref={searchInputRef}
                style={styles.headerSearchInput}
                placeholder="Search URL, method, error..."
                placeholderTextColor={macOSColors.text.muted}
                value={searchText}
                onChangeText={handleSearch}
                onSubmitEditing={() => setIsSearchActive(false)}
                onBlur={() => setIsSearchActive(false)}
                sentry-label="ignore network search header"
                accessibilityLabel="Search network requests"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchText.length > 0 ? (
                <TouchableOpacity
                  onPress={() => {
                    handleSearch("");
                    setIsSearchActive(false);
                  }}
                  sentry-label="ignore clear search header"
                  style={styles.headerSearchClear}
                >
                  <X size={14} color={macOSColors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.headerChipRow}>
              <TouchableOpacity
                style={[
                  styles.headerChip,
                  filter.status === "success" && styles.headerChipActive,
                ]}
                onPress={() =>
                  setFilter({
                    ...filter,
                    status: filter.status === "success" ? undefined : "success",
                  })
                }
              >
                <CheckCircle size={12} color={macOSColors.semantic.success} />
                <Text
                  style={[
                    styles.headerChipValue,
                    { color: macOSColors.semantic.success },
                  ]}
                >
                  {stats.successfulRequests}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.headerChip,
                  filter.status === "error" && styles.headerChipActive,
                ]}
                onPress={() =>
                  setFilter({
                    ...filter,
                    status: filter.status === "error" ? undefined : "error",
                  })
                }
              >
                <XCircle size={12} color={macOSColors.semantic.error} />
                <Text
                  style={[
                    styles.headerChipValue,
                    { color: macOSColors.semantic.error },
                  ]}
                >
                  {stats.failedRequests}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.headerChip,
                  filter.status === "pending" && styles.headerChipActive,
                ]}
                onPress={() =>
                  setFilter({
                    ...filter,
                    status: filter.status === "pending" ? undefined : "pending",
                  })
                }
              >
                <Clock size={12} color={macOSColors.semantic.warning} />
                <Text
                  style={[
                    styles.headerChipValue,
                    { color: macOSColors.semantic.warning },
                  ]}
                >
                  {stats.pendingRequests}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ModalHeader.Content>
        <ModalHeader.Actions onClose={onClose}>
          <TouchableOpacity
            sentry-label="ignore open search"
            onPress={() => setIsSearchActive(true)}
            style={styles.headerActionButton}
          >
            <Search size={14} color={macOSColors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            sentry-label="ignore filter"
            onPress={() => {
              setShowFilterView(true);
            }}
            style={[
              styles.headerActionButton,
              (filter.status || filter.method || filter.contentType) &&
                styles.activeFilterButton,
            ]}
          >
            <Filter
              size={14}
              color={
                filter.status || filter.method || filter.contentType
                  ? macOSColors.semantic.info
                  : macOSColors.text.muted
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            sentry-label="ignore toggle interception"
            onPress={toggleInterception}
            style={[
              styles.headerActionButton,
              isEnabled ? styles.startButton : styles.stopButton,
            ]}
          >
            <Power
              size={14}
              color={
                isEnabled
                  ? macOSColors.semantic.success
                  : macOSColors.semantic.error
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            sentry-label="ignore clear events"
            onPress={clearEvents}
            style={styles.headerActionButton}
            disabled={events.length === 0}
          >
            <Trash2
              size={14}
              color={
                events.length > 0
                  ? macOSColors.text.muted
                  : macOSColors.background.hover
              }
            />
          </TouchableOpacity>
        </ModalHeader.Actions>
      </ModalHeader>
    );
  };

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.network.modal();

  if (!visible) return null;

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: renderHeaderContent(),
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
    >
      <View style={styles.container}>
        {/* Show detail view if event is selected */}
        {selectedEvent ? (
          <NetworkEventDetailView
            event={selectedEvent}
            ignoredPatterns={ignoredPatterns}
            onTogglePattern={(pattern) => {
              const newPatterns = new Set(ignoredPatterns);
              if (newPatterns.has(pattern)) {
                newPatterns.delete(pattern);
              } else {
                newPatterns.add(pattern);
              }
              setIgnoredPatterns(newPatterns);
            }}
          />
        ) : showFilterView ? (
          <NetworkFilterViewV3
            events={events}
            filter={filter}
            onFilterChange={setFilter}
            ignoredPatterns={ignoredPatterns}
            onTogglePattern={(pattern) => {
              const newPatterns = new Set(ignoredPatterns);
              if (newPatterns.has(pattern)) {
                newPatterns.delete(pattern);
              } else {
                newPatterns.add(pattern);
              }
              setIgnoredPatterns(newPatterns);
            }}
            onAddPattern={(pattern) => {
              const newPatterns = new Set(ignoredPatterns);
              newPatterns.add(pattern);
              setIgnoredPatterns(newPatterns);
            }}
          />
        ) : (
          <>
            {!isEnabled ? (
              <View style={styles.disabledBanner}>
                <Power size={14} color={macOSColors.semantic.warning} />
                <Text style={styles.disabledText}>
                  Network interception is disabled
                </Text>
              </View>
            ) : null}

            {/* Use FlatList for performance */}
            {filteredEvents.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={filteredEvents}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                removeClippedSubviews
                onEndReachedThreshold={0.8}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                scrollEnabled={false}
                sentry-label="ignore network events list"
              />
            ) : (
              <EmptyState isEnabled={isEnabled} />
            )}
          </>
        )}
      </View>
    </JsModal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  // Compact header styles matching Sentry/Storage modals
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    minHeight: 32,
    paddingLeft: 4,
  },
  headerTitle: {
    color: macOSColors.text.primary,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginLeft: 8,
  },
  headerStats: {
    display: "none",
  },
  headerStatsText: {
    fontSize: 12,
    color: macOSColors.text.muted,
    fontWeight: "500",
  },
  headerFilteredText: {
    fontSize: 11,
    color: macOSColors.semantic.warning,
    fontWeight: "500",
    marginLeft: 4,
  },
  headerActions: {
    flexDirection: "row",
    gap: 6,
    marginLeft: "auto",
    marginRight: 4,
  },
  headerCenterArea: {
    flex: 1,
    marginHorizontal: 8,
  },
  headerSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  headerSearchInput: {
    flex: 1,
    color: macOSColors.text.primary,
    fontSize: 13,
    marginLeft: 6,
    paddingVertical: 2,
  },
  headerSearchClear: {
    marginLeft: 6,
    padding: 4,
  },
  headerChipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: macOSColors.background.hover,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  headerChipActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "50",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  headerChipValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  headerActionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  // Shared navbar styles (matching React Query modal)
  tabNavigationContainer: {
    flexDirection: "row",
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    justifyContent: "space-evenly",
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
  },
  tabButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 1,
  },
  tabButtonActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "40",
  },
  tabButtonInactive: {
    backgroundColor: "transparent",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  tabButtonTextActive: {
    color: macOSColors.semantic.info,
  },
  tabButtonTextInactive: {
    color: macOSColors.text.muted,
  },
  startButton: {
    backgroundColor: macOSColors.semantic.successBackground,
    borderColor: macOSColors.semantic.success + "40",
  },
  stopButton: {
    backgroundColor: macOSColors.semantic.errorBackground,
    borderColor: macOSColors.semantic.error + "40",
  },
  activeFilterButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "40",
  },
  activeIgnoreButton: {
    backgroundColor: macOSColors.semantic.warningBackground,
    borderColor: macOSColors.semantic.warning + "33",
  },
  detailHeaderActions: {
    flexDirection: "row",
    gap: 6,
    marginLeft: "auto",
    marginRight: 4,
  },
  // Search bar - minimal design with theme colors
  searchContainer: {
    display: "none",
  },
  searchInput: {},
  // Stats bar - minimal design
  statsBar: {
    display: "none",
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: macOSColors.background.hover,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  statChipActive: {
    backgroundColor: macOSColors.semantic.info + "26",
    borderColor: macOSColors.semantic.info + "66",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  statLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "500",
    textTransform: "uppercase",
  },
  disabledBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: macOSColors.semantic.warningBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.semantic.warning + "20",
  },
  disabledText: {
    color: macOSColors.semantic.warning,
    fontSize: 11,
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    color: macOSColors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: macOSColors.text.muted,
    fontSize: 12,
    textAlign: "center",
  },
});

// Export with TickProvider wrapper
export function NetworkModal(props: NetworkModalProps) {
  return (
    <TickProvider>
      <NetworkModalInner {...props} />
    </TickProvider>
  );
}
