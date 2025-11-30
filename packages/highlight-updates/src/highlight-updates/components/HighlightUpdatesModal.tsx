/**
 * HighlightUpdatesModal
 *
 * Main modal interface for the Highlight Updates dev tool.
 * Shows a list of tracked component renders with controls for
 * start/stop, clear, and filtering.
 *
 * PERFORMANCE OPTIMIZED:
 * - Uses isolated components to prevent parent re-renders
 * - Stats display is isolated (StatsDisplay)
 * - Render list is isolated (IsolatedRenderList)
 * - Header components are memoized
 * - Uses refs for values not displayed in UI
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
} from "react-native";
import {
  Power,
  JsModal,
  devToolsStorageKeys,
  macOSColors,
  safeGetItem,
  safeSetItem,
} from "@react-buoy/shared-ui";
import HighlightUpdatesController from "../utils/HighlightUpdatesController";
import { RenderTracker, type TrackedRender, type FilterConfig, type RenderTrackerSettings } from "../utils/RenderTracker";
import { RenderDetailView } from "./RenderDetailView";
import { HighlightFilterView } from "./HighlightFilterView";
import { IsolatedRenderList } from "./IsolatedRenderList";
import {
  MainListHeader,
  FilterViewHeader,
  DetailViewHeader,
} from "./ModalHeaderContent";

interface HighlightUpdatesModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  onMinimize?: (modalState: any) => void;
  enableSharedModalDimensions?: boolean;
}

// Disabled banner - memoized since props rarely change
const DisabledBanner = React.memo(function DisabledBanner() {
  return (
    <View style={styles.disabledBanner}>
      <Power size={14} color={macOSColors.semantic.warning} />
      <Text style={styles.disabledText}>
        Render tracking is disabled
      </Text>
    </View>
  );
});

export function HighlightUpdatesModal({
  visible,
  onClose,
  onBack,
  onMinimize,
  enableSharedModalDimensions = false,
}: HighlightUpdatesModalProps) {
  // ============================================================================
  // TRACKING STATE - subscribed via isolated component
  // ============================================================================
  const [isTracking, setIsTracking] = useState(false);

  // Track if there are renders for header clear button state
  const [hasRenders, setHasRenders] = useState(() => RenderTracker.getStats().totalComponents > 0);

  // ============================================================================
  // UI STATE - kept in parent for view switching
  // ============================================================================
  const [selectedRender, setSelectedRender] = useState<TrackedRender | null>(null);
  const [showFilterView, setShowFilterView] = useState(false);
  const [activeTab, setActiveTab] = useState<"filters">("filters");
  const [searchText, setSearchText] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // ============================================================================
  // FILTER STATE - use ref for filter config, state for display count only
  // ============================================================================
  const filtersRef = useRef<FilterConfig>(RenderTracker.getFilters());
  const [activeFilterCount, setActiveFilterCount] = useState(() => {
    const filters = RenderTracker.getFilters();
    return filters.includePatterns.length + filters.excludePatterns.length;
  });

  // Expose filters via state for HighlightFilterView (it needs to display them)
  const [filters, setFilters] = useState<FilterConfig>(() => RenderTracker.getFilters());

  // ============================================================================
  // SETTINGS STATE
  // ============================================================================
  const [settings, setSettings] = useState<RenderTrackerSettings>(() => RenderTracker.getSettings());

  // ============================================================================
  // PERSISTENCE REFS - prevent saving on initial load
  // ============================================================================
  const hasLoadedTrackingState = useRef(false);
  const hasLoadedFilters = useRef(false);
  const hasLoadedSettings = useRef(false);

  // ============================================================================
  // LOAD PERSISTED STATE
  // ============================================================================

  // Load persisted tracking state on mount
  useEffect(() => {
    if (!visible || hasLoadedTrackingState.current) return;

    const loadTrackingState = async () => {
      try {
        const storedTracking = await safeGetItem(
          devToolsStorageKeys.highlightUpdates.isTracking()
        );
        if (storedTracking !== null) {
          const shouldTrack = storedTracking === "true";
          if (shouldTrack && !HighlightUpdatesController.isEnabled()) {
            if (!HighlightUpdatesController.isInitialized()) {
              HighlightUpdatesController.initialize();
            }
            HighlightUpdatesController.enable();
          }
        }
        hasLoadedTrackingState.current = true;
      } catch (error) {
        // Failed to load tracking state
      }
    };

    loadTrackingState();
  }, [visible]);

  // Save tracking state when it changes
  useEffect(() => {
    if (!hasLoadedTrackingState.current) return;

    const saveTrackingState = async () => {
      try {
        await safeSetItem(
          devToolsStorageKeys.highlightUpdates.isTracking(),
          isTracking.toString()
        );
      } catch (error) {
        // Failed to save tracking state
      }
    };

    saveTrackingState();
  }, [isTracking]);

  // Load persisted filters on mount
  useEffect(() => {
    if (!visible || hasLoadedFilters.current) return;

    const loadFilters = async () => {
      try {
        const storedFilters = await safeGetItem(
          devToolsStorageKeys.highlightUpdates.filters()
        );
        if (storedFilters) {
          const parsedFilters = JSON.parse(storedFilters);
          const restoredFilters: Partial<FilterConfig> = {
            includeTestID: new Set(parsedFilters.includeTestID || []),
            includeNativeID: new Set(parsedFilters.includeNativeID || []),
            includeViewType: new Set(parsedFilters.includeViewType || []),
            includeComponent: new Set(parsedFilters.includeComponent || []),
            excludeTestID: new Set(parsedFilters.excludeTestID || []),
            excludeNativeID: new Set(parsedFilters.excludeNativeID || []),
            excludeViewType: new Set(parsedFilters.excludeViewType || []),
            excludeComponent: new Set(parsedFilters.excludeComponent || []),
            includePatterns: parsedFilters.includePatterns || [],
            excludePatterns: parsedFilters.excludePatterns || [],
          };
          RenderTracker.setFilters(restoredFilters);
          const newFilters = RenderTracker.getFilters();
          filtersRef.current = newFilters;
          setFilters(newFilters);
          setActiveFilterCount(newFilters.includePatterns.length + newFilters.excludePatterns.length);
        }
        hasLoadedFilters.current = true;
      } catch (error) {
        // Failed to load filters
      }
    };

    loadFilters();
  }, [visible]);

  // Save filters when they change
  useEffect(() => {
    if (!hasLoadedFilters.current) return;

    const saveFilters = async () => {
      try {
        const filtersToSave = {
          includeTestID: Array.from(filters.includeTestID),
          includeNativeID: Array.from(filters.includeNativeID),
          includeViewType: Array.from(filters.includeViewType),
          includeComponent: Array.from(filters.includeComponent),
          excludeTestID: Array.from(filters.excludeTestID),
          excludeNativeID: Array.from(filters.excludeNativeID),
          excludeViewType: Array.from(filters.excludeViewType),
          excludeComponent: Array.from(filters.excludeComponent),
          includePatterns: filters.includePatterns,
          excludePatterns: filters.excludePatterns,
        };
        await safeSetItem(
          devToolsStorageKeys.highlightUpdates.filters(),
          JSON.stringify(filtersToSave)
        );
      } catch (error) {
        // Failed to save filters
      }
    };

    saveFilters();
  }, [filters]);

  // Load persisted settings on mount
  useEffect(() => {
    if (!visible || hasLoadedSettings.current) return;

    const loadSettings = async () => {
      try {
        const storedSettings = await safeGetItem(
          devToolsStorageKeys.highlightUpdates.settings()
        );
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          const { performanceLogging: _ignored, ...settingsToRestore } = parsedSettings;
          RenderTracker.setSettings(settingsToRestore);
          setSettings(RenderTracker.getSettings());
        }
        hasLoadedSettings.current = true;
      } catch (error) {
        hasLoadedSettings.current = true;
      }
    };

    loadSettings();
  }, [visible]);

  // Save settings when they change
  useEffect(() => {
    if (!hasLoadedSettings.current) return;

    const saveSettings = async () => {
      try {
        const { performanceLogging: _ignored, ...settingsToSave } = settings;
        await safeSetItem(
          devToolsStorageKeys.highlightUpdates.settings(),
          JSON.stringify(settingsToSave)
        );
      } catch (error) {
        // Failed to save settings
      }
    };

    saveSettings();
  }, [settings]);

  // ============================================================================
  // SUBSCRIPTIONS - only for tracking state, not renders
  // ============================================================================

  // Subscribe to tracking state changes only
  useEffect(() => {
    const unsubscribeState = RenderTracker.subscribeToState((state) => {
      setIsTracking(state.isTracking);
    });

    return () => {
      unsubscribeState();
    };
  }, []);

  // Focus search input when activated
  useEffect(() => {
    if (isSearchActive) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isSearchActive]);

  // ============================================================================
  // CALLBACKS - stable references for child components
  // ============================================================================

  const handleToggleTracking = useCallback(() => {
    if (!HighlightUpdatesController.isInitialized()) {
      HighlightUpdatesController.initialize();
    }
    HighlightUpdatesController.toggle();
  }, []);

  const handleClear = useCallback(() => {
    HighlightUpdatesController.clearRenderCounts();
    setHasRenders(false);
  }, []);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleRenderPress = useCallback((render: TrackedRender) => {
    setSelectedRender(render);
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedRender(null);
  }, []);

  const handleBackFromFilter = useCallback(() => {
    setShowFilterView(false);
  }, []);

  const handleFilterToggle = useCallback(() => {
    setShowFilterView(true);
  }, []);

  const handleSearchToggle = useCallback(() => {
    setIsSearchActive(true);
  }, []);

  const handleSearchClose = useCallback(() => {
    setIsSearchActive(false);
  }, []);

  const handleFilterChange = useCallback((newFilters: Partial<FilterConfig>) => {
    RenderTracker.setFilters(newFilters);
    const updatedFilters = RenderTracker.getFilters();
    filtersRef.current = updatedFilters;
    setFilters(updatedFilters);
    setActiveFilterCount(updatedFilters.includePatterns.length + updatedFilters.excludePatterns.length);
  }, []);

  const handleSettingsChange = useCallback((newSettings: Partial<RenderTrackerSettings>) => {
    RenderTracker.setSettings(newSettings);
    setSettings(RenderTracker.getSettings());
  }, []);

  // Callback for IsolatedRenderList to update hasRenders (for header clear button)
  const handleStatsChange = useCallback((stats: { totalComponents: number; totalRenders: number }) => {
    setHasRenders(stats.totalComponents > 0);
  }, []);

  // ============================================================================
  // HEADER RENDERING - using memoized components
  // ============================================================================

  const renderHeaderContent = useCallback(() => {
    if (showFilterView) {
      return (
        <FilterViewHeader
          onBack={handleBackFromFilter}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      );
    }

    if (selectedRender) {
      return <DetailViewHeader onBack={handleBackFromDetail} />;
    }

    return (
      <MainListHeader
        onBack={onBack}
        isSearchActive={isSearchActive}
        searchText={searchText}
        onSearchChange={handleSearch}
        onSearchToggle={handleSearchToggle}
        onSearchClose={handleSearchClose}
        onFilterToggle={handleFilterToggle}
        onToggleTracking={handleToggleTracking}
        onClear={handleClear}
        isTracking={isTracking}
        activeFilterCount={activeFilterCount}
        hasRenders={hasRenders}
        searchInputRef={searchInputRef}
      />
    );
  }, [
    showFilterView,
    selectedRender,
    onBack,
    isSearchActive,
    searchText,
    isTracking,
    activeFilterCount,
    hasRenders,
    activeTab,
    handleBackFromFilter,
    handleBackFromDetail,
    handleSearch,
    handleSearchToggle,
    handleSearchClose,
    handleFilterToggle,
    handleToggleTracking,
    handleClear,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.highlightUpdates.modal();

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
      <View nativeID="__rn_buoy__highlight-modal" style={styles.container}>
        {selectedRender ? (
          <RenderDetailView render={selectedRender} />
        ) : showFilterView ? (
          <HighlightFilterView
            filters={filters}
            onFilterChange={handleFilterChange}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            availableProps={RenderTracker.getAvailableProps()}
          />
        ) : (
          <>
            {!isTracking && <DisabledBanner />}

            <IsolatedRenderList
              searchText={searchText}
              filters={filters}
              onSelectRender={handleRenderPress}
              onStatsChange={handleStatsChange}
              isTracking={isTracking}
            />
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
});

export default HighlightUpdatesModal;
