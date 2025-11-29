/**
 * HighlightUpdatesModal
 *
 * Main modal interface for the Highlight Updates dev tool.
 * Shows a list of tracked component renders with controls for
 * start/stop, clear, and filtering.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
} from "react-native";
import {
  Activity,
  Trash2,
  Power,
  Search,
  Filter,
  Pause,
  Play,
  X,
  JsModal,
  ModalHeader,
  devToolsStorageKeys,
  macOSColors,
  TabSelector,
} from "@react-buoy/shared-ui";
import type { ViewStyle } from "react-native";
import HighlightUpdatesController from "../utils/HighlightUpdatesController";
import { RenderTracker, type TrackedRender, type FilterConfig } from "../utils/RenderTracker";
import { RenderListItem } from "./RenderListItem";
import { RenderDetailView } from "./RenderDetailView";
import { HighlightFilterView } from "./HighlightFilterView";

interface HighlightUpdatesModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  onMinimize?: (modalState: any) => void;
  enableSharedModalDimensions?: boolean;
}

function EmptyState({ isTracking }: { isTracking: boolean }) {
  return (
    <View style={styles.emptyState}>
      <Activity size={32} color={macOSColors.text.muted} />
      <Text style={styles.emptyTitle}>No renders tracked</Text>
      <Text style={styles.emptyText}>
        {isTracking
          ? "Component renders will appear here"
          : "Enable tracking to start capturing"}
      </Text>
    </View>
  );
}

export function HighlightUpdatesModal({
  visible,
  onClose,
  onBack,
  onMinimize,
  enableSharedModalDimensions = false,
}: HighlightUpdatesModalProps) {
  // Tracking state
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [renders, setRenders] = useState<TrackedRender[]>([]);
  const [stats, setStats] = useState({ totalComponents: 0, totalRenders: 0 });

  // UI state
  const [selectedRender, setSelectedRender] = useState<TrackedRender | null>(null);
  const [showFilterView, setShowFilterView] = useState(false);
  const [activeTab, setActiveTab] = useState<"filters">("filters");
  const [searchText, setSearchText] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const flatListRef = useRef<FlatList<TrackedRender>>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterConfig>(() => RenderTracker.getFilters());

  // Subscribe to RenderTracker updates
  useEffect(() => {
    const unsubscribeRenders = RenderTracker.subscribe((_renders) => {
      setRenders(RenderTracker.getFilteredRenders(searchText));
      setStats(RenderTracker.getStats());
    });

    const unsubscribeState = RenderTracker.subscribeToState((state) => {
      setIsTracking(state.isTracking);
      setIsPaused(state.isPaused);
    });

    return () => {
      unsubscribeRenders();
      unsubscribeState();
    };
  }, [searchText]);

  // Update filtered renders when search changes
  useEffect(() => {
    setRenders(RenderTracker.getFilteredRenders(searchText));
  }, [searchText, filters]);

  // Focus search input when activated
  useEffect(() => {
    if (isSearchActive) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isSearchActive]);

  const handleToggleTracking = useCallback(() => {
    if (!HighlightUpdatesController.isInitialized()) {
      HighlightUpdatesController.initialize();
    }
    HighlightUpdatesController.toggle();
  }, []);

  const handleTogglePause = useCallback(() => {
    RenderTracker.togglePause();
  }, []);

  const handleClear = useCallback(() => {
    HighlightUpdatesController.clearRenderCounts();
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleRenderPress = useCallback((render: TrackedRender) => {
    setSelectedRender(render);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedRender(null);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<FilterConfig>) => {
    RenderTracker.setFilters(newFilters);
    setFilters(RenderTracker.getFilters());
  }, []);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.includeTestID.size > 0) count++;
    if (filters.includeNativeID.size > 0) count++;
    if (filters.includeViewType.size > 0) count++;
    if (filters.includeComponent.size > 0) count++;
    if (filters.excludeTestID.size > 0) count++;
    if (filters.excludeNativeID.size > 0) count++;
    if (filters.excludeViewType.size > 0) count++;
    if (filters.excludeComponent.size > 0) count++;
    return count;
  }, [filters]);

  // FlatList optimization
  const keyExtractor = useCallback((item: TrackedRender) => item.id, []);

  const renderItem = useMemo(() => {
    return ({ item }: { item: TrackedRender }) => (
      <RenderListItem render={item} onPress={handleRenderPress} />
    );
  }, [handleRenderPress]);

  // Header rendering
  const renderHeaderContent = () => {
    // Filter view header
    if (showFilterView) {
      const tabs = [{ key: "filters" as const, label: "Filters" }];

      return (
        <ModalHeader>
          <ModalHeader.Navigation onBack={() => setShowFilterView(false)} />
          <ModalHeader.Content title="" noMargin>
            <TabSelector
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab as "filters")}
            />
          </ModalHeader.Content>
        </ModalHeader>
      );
    }

    // Render detail view header
    if (selectedRender) {
      return (
        <ModalHeader>
          <ModalHeader.Navigation onBack={handleBack} />
          <ModalHeader.Content title="Render Details" centered />
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
                placeholder="Search testID, nativeID, component..."
                placeholderTextColor={macOSColors.text.muted}
                value={searchText}
                onChangeText={handleSearch}
                onSubmitEditing={() => setIsSearchActive(false)}
                onBlur={() => setIsSearchActive(false)}
                accessibilityLabel="Search renders"
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
                  style={styles.headerSearchClear}
                >
                  <X size={14} color={macOSColors.text.secondary} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <View style={styles.headerChipRow}>
              <View style={styles.headerChip}>
                <Activity size={12} color={macOSColors.semantic.info} />
                <Text
                  style={[
                    styles.headerChipValue,
                    { color: macOSColors.semantic.info },
                  ]}
                >
                  {stats.totalComponents}
                </Text>
                <Text style={styles.headerChipLabel}>components</Text>
              </View>

              <View style={styles.headerChip}>
                <Text
                  style={[
                    styles.headerChipValue,
                    { color: macOSColors.semantic.warning },
                  ]}
                >
                  {stats.totalRenders}
                </Text>
                <Text style={styles.headerChipLabel}>renders</Text>
              </View>
            </View>
          )}
        </ModalHeader.Content>
        <ModalHeader.Actions>
          <TouchableOpacity
            onPress={() => setIsSearchActive(true)}
            style={styles.headerActionButton}
          >
            <Search size={14} color={macOSColors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowFilterView(true)}
            style={[
              styles.headerActionButton,
              activeFilterCount > 0 && styles.activeFilterButton,
            ]}
          >
            <Filter
              size={14}
              color={
                activeFilterCount > 0
                  ? macOSColors.semantic.info
                  : macOSColors.text.muted
              }
            />
          </TouchableOpacity>

          {isTracking && (
            <TouchableOpacity
              onPress={handleTogglePause}
              style={[
                styles.headerActionButton,
                isPaused ? styles.pausedButton : styles.playingButton,
              ]}
            >
              {isPaused ? (
                <Play size={14} color={macOSColors.semantic.warning} />
              ) : (
                <Pause size={14} color={macOSColors.semantic.info} />
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleToggleTracking}
            style={[
              styles.headerActionButton,
              isTracking ? styles.startButton : styles.stopButton,
            ]}
          >
            <Power
              size={14}
              color={
                isTracking
                  ? macOSColors.semantic.success
                  : macOSColors.semantic.error
              }
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClear}
            style={[
              styles.headerActionButton,
              renders.length === 0 && styles.headerActionButtonDisabled,
            ]}
            disabled={renders.length === 0}
          >
            <Trash2
              size={14}
              color={
                renders.length > 0
                  ? macOSColors.text.muted
                  : macOSColors.text.disabled
              }
            />
          </TouchableOpacity>
        </ModalHeader.Actions>
      </ModalHeader>
    );
  };

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : "highlight-updates-modal";

  if (!visible) return null;

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      onMinimize={onMinimize}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: renderHeaderContent(),
      }}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
    >
      <View style={styles.container}>
        {selectedRender ? (
          <RenderDetailView render={selectedRender} />
        ) : showFilterView ? (
          <HighlightFilterView
            filters={filters}
            onFilterChange={handleFilterChange}
            availableProps={RenderTracker.getAvailableProps()}
          />
        ) : (
          <>
            {!isTracking && (
              <View style={styles.disabledBanner}>
                <Power size={14} color={macOSColors.semantic.warning} />
                <Text style={styles.disabledText}>
                  Render tracking is disabled
                </Text>
              </View>
            )}

            {isPaused && isTracking && (
              <View style={styles.pausedBanner}>
                <Pause size={14} color={macOSColors.semantic.info} />
                <Text style={styles.pausedText}>
                  Tracking paused
                </Text>
              </View>
            )}

            {renders.length > 0 ? (
              <FlatList
                ref={flatListRef}
                data={renders}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator
                removeClippedSubviews
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={10}
                scrollEnabled={false}
              />
            ) : (
              <EmptyState isTracking={isTracking} />
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
  headerChipValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  headerChipLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "500",
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
  headerActionButtonDisabled: {
    opacity: 0.55,
  },
  startButton: {
    backgroundColor: macOSColors.semantic.successBackground,
    borderColor: macOSColors.semantic.success + "40",
  },
  stopButton: {
    backgroundColor: macOSColors.semantic.errorBackground,
    borderColor: macOSColors.semantic.error + "40",
  },
  pausedButton: {
    backgroundColor: macOSColors.semantic.warningBackground,
    borderColor: macOSColors.semantic.warning + "40",
  },
  playingButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "40",
  },
  activeFilterButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "40",
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
  pausedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: macOSColors.semantic.infoBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "20",
  },
  pausedText: {
    color: macOSColors.semantic.info,
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

export default HighlightUpdatesModal;
