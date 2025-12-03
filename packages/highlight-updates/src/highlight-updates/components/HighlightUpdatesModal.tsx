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

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
import { RenderTracker, type TrackedRender, type FilterConfig, type RenderTrackerSettings, type RenderCauseType, type ComponentCauseType, type FilterPattern } from "../utils/RenderTracker";
import { CAUSE_CONFIG, COMPONENT_CAUSE_CONFIG } from "./RenderCauseBadge";
import { RenderDetailView } from "./RenderDetailView";
import { EventStepperFooter } from "@react-buoy/shared-ui";
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
  /**
   * Initial nativeTag to navigate to when modal opens.
   * Used by "Click Overlay Badge → Jump to Detail" feature.
   * When set, the modal will automatically show the detail view for this component.
   */
  initialNativeTag?: number | null;
  /**
   * Callback when the modal finishes handling the initial nativeTag.
   * This allows the parent to clear the navigation state.
   */
  onInitialNativeTagHandled?: () => void;
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

/**
 * Format render data for copying to clipboard
 * Includes comprehensive data for debugging and comparison
 */
function formatRenderDataForClipboard(): string {
  const renders = RenderTracker.getRenders();
  const stats = RenderTracker.getStats();
  const settings = RenderTracker.getSettings();

  const timestamp = new Date().toISOString();
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("RENDER TRACKING DATA EXPORT");
  lines.push("=".repeat(60));
  lines.push(`Timestamp: ${timestamp}`);
  lines.push(`Total Components: ${stats.totalComponents}`);
  lines.push(`Total Renders: ${stats.totalRenders}`);
  lines.push("");
  lines.push("Settings:");
  lines.push(`  - Show Render Count: ${settings.showRenderCount}`);
  lines.push(`  - Track Render Causes: ${settings.trackRenderCauses}`);
  lines.push(`  - Batch Size: ${settings.batchSize}`);
  lines.push("");

  // Sort by render count (descending)
  const sortedRenders: TrackedRender[] = [...renders].sort((a, b) => b.renderCount - a.renderCount);

  lines.push("-".repeat(60));
  lines.push("COMPONENTS BY RENDER COUNT (descending)");
  lines.push("-".repeat(60));
  lines.push("");

  sortedRenders.forEach((render: TrackedRender, index: number) => {
    const causeType = render.lastRenderCause?.type;
    const componentCauseType = render.lastRenderCause?.componentCause;

    // Format native-level cause
    const nativeCauseInfo = render.lastRenderCause && causeType
      ? `${CAUSE_CONFIG[causeType].label}${
          render.lastRenderCause.changedKeys
            ? ` [${render.lastRenderCause.changedKeys.join(", ")}]`
            : ""
        }${
          render.lastRenderCause.hookIndices
            ? ` [Hook ${render.lastRenderCause.hookIndices.join(", ")}]`
            : ""
        }`
      : "N/A";

    // Format component-level cause (TWO-LEVEL CAUSATION)
    const componentCauseInfo = componentCauseType
      ? COMPONENT_CAUSE_CONFIG[componentCauseType].label.toUpperCase()
      : "N/A";

    const componentName = render.lastRenderCause?.componentName || render.componentName;

    lines.push(`${index + 1}. ${render.displayName} (${render.viewType}) - ${render.renderCount} renders`);

    // Two-level causation: Component → Native
    if (componentCauseType && causeType) {
      lines.push(`   Why: ${componentName || "Component"} (${componentCauseInfo}) → Native (${nativeCauseInfo})`);
    } else {
      lines.push(`   Last Cause: ${nativeCauseInfo}`);
    }

    if (render.testID) lines.push(`   testID: ${render.testID}`);
    if (render.nativeID) lines.push(`   nativeID: ${render.nativeID}`);
    if (componentName) lines.push(`   component: ${componentName}`);
    if (render.accessibilityLabel) lines.push(`   accessibilityLabel: ${render.accessibilityLabel}`);
    lines.push(`   nativeTag: ${render.nativeTag}`);

    // Calculate render rate
    const duration = render.lastRenderTime - render.firstRenderTime;
    const renderRate = duration > 0 ? (render.renderCount / (duration / 1000)).toFixed(2) : render.renderCount;
    lines.push(`   Renders/sec: ${renderRate}`);

    lines.push("");
  });

  // Group by viewType
  lines.push("-".repeat(60));
  lines.push("BY VIEW TYPE");
  lines.push("-".repeat(60));

  const byViewType = new Map<string, { count: number; renders: number }>();
  renders.forEach((r: TrackedRender) => {
    const existing = byViewType.get(r.viewType) || { count: 0, renders: 0 };
    existing.count++;
    existing.renders += r.renderCount;
    byViewType.set(r.viewType, existing);
  });

  const sortedViewTypes = [...byViewType.entries()].sort((a, b) => b[1].renders - a[1].renders);
  sortedViewTypes.forEach(([viewType, data]) => {
    lines.push(`${viewType}: ${data.count} components, ${data.renders} total renders`);
  });
  lines.push("");

  // Group by component name
  lines.push("-".repeat(60));
  lines.push("BY COMPONENT NAME");
  lines.push("-".repeat(60));

  const byComponent = new Map<string, { count: number; renders: number }>();
  renders.forEach((r: TrackedRender) => {
    const name = r.componentName || "(unknown)";
    const existing = byComponent.get(name) || { count: 0, renders: 0 };
    existing.count++;
    existing.renders += r.renderCount;
    byComponent.set(name, existing);
  });

  const sortedComponents = [...byComponent.entries()].sort((a, b) => b[1].renders - a[1].renders);
  sortedComponents.forEach(([component, data]) => {
    lines.push(`${component}: ${data.count} instances, ${data.renders} total renders`);
  });
  lines.push("");

  // Group by render cause (if tracking enabled)
  if (settings.trackRenderCauses) {
    lines.push("-".repeat(60));
    lines.push("BY NATIVE CAUSE (what changed on the native view)");
    lines.push("-".repeat(60));

    const byCause = new Map<string, number>();
    renders.forEach((r: TrackedRender) => {
      const cause = r.lastRenderCause?.type || "unknown";
      byCause.set(cause, (byCause.get(cause) || 0) + 1);
    });

    const sortedCauses = [...byCause.entries()].sort((a, b) => b[1] - a[1]);
    sortedCauses.forEach(([cause, count]) => {
      const config = CAUSE_CONFIG[cause as RenderCauseType];
      lines.push(`${config?.label || cause}: ${count} components`);
    });
    lines.push("");

    // TWO-LEVEL CAUSATION: Group by component-level cause
    lines.push("-".repeat(60));
    lines.push("BY COMPONENT CAUSE (why the React component re-rendered)");
    lines.push("-".repeat(60));

    const byComponentCause = new Map<string, number>();
    renders.forEach((r: TrackedRender) => {
      const cause = r.lastRenderCause?.componentCause || "unknown";
      byComponentCause.set(cause, (byComponentCause.get(cause) || 0) + 1);
    });

    const sortedComponentCauses = [...byComponentCause.entries()].sort((a, b) => b[1] - a[1]);
    sortedComponentCauses.forEach(([cause, count]) => {
      const config = COMPONENT_CAUSE_CONFIG[cause as ComponentCauseType];
      lines.push(`${config?.label?.toUpperCase() || cause}: ${count} components`);
    });
    lines.push("");

    // Highlight optimization opportunities (PARENT at component level)
    const parentCausedComponents = renders.filter((r: TrackedRender) =>
      r.lastRenderCause?.componentCause === "parent"
    );
    if (parentCausedComponents.length > 0) {
      lines.push("-".repeat(60));
      lines.push("💡 OPTIMIZATION OPPORTUNITIES");
      lines.push("-".repeat(60));
      lines.push(`${parentCausedComponents.length} component(s) re-rendered due to parent:`);
      parentCausedComponents.forEach((r: TrackedRender) => {
        const name = r.lastRenderCause?.componentName || r.componentName || r.displayName;
        lines.push(`  - ${name}: Consider wrapping with React.memo()`);
      });
      lines.push("");
    }
  }

  lines.push("=".repeat(60));
  lines.push("END OF EXPORT");
  lines.push("=".repeat(60));

  return lines.join("\n");
}

export function HighlightUpdatesModal({
  visible,
  onClose,
  onBack,
  onMinimize,
  enableSharedModalDimensions = false,
  initialNativeTag,
  onInitialNativeTagHandled,
}: HighlightUpdatesModalProps) {
  // ============================================================================
  // TRACKING STATE - subscribed via isolated component
  // ============================================================================
  const [isTracking, setIsTracking] = useState(false);
  const [isFrozen, setIsFrozen] = useState(() => HighlightUpdatesController.getFrozen());

  // Track if there are renders for header clear button state
  const [hasRenders, setHasRenders] = useState(() => RenderTracker.getStats().totalComponents > 0);

  // ============================================================================
  // UI STATE - kept in parent for view switching
  // ============================================================================
  const [selectedRender, setSelectedRender] = useState<TrackedRender | null>(null);
  const [selectedRenderIndex, setSelectedRenderIndex] = useState<number>(0);
  const [showFilterView, setShowFilterView] = useState(false);
  const [filterViewActiveTab, setFilterViewActiveTab] = useState<"filters" | "settings">("filters");
  const [searchText, setSearchText] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // Track the renders list for navigation
  const rendersListRef = useRef<TrackedRender[]>([]);

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

  // Subscribe to freeze state changes
  useEffect(() => {
    const unsubscribeFreeze = HighlightUpdatesController.subscribeToFreeze((frozen) => {
      setIsFrozen(frozen);
    });

    return () => {
      unsubscribeFreeze();
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

  // Clear spotlight when modal is closed
  useEffect(() => {
    if (!visible) {
      HighlightUpdatesController.setSpotlight(null);
    }
  }, [visible]);

  // ============================================================================
  // DEEP LINK NAVIGATION - "Click Overlay Badge → Jump to Detail"
  // ============================================================================

  // Handle initial navigation when a badge is tapped
  useEffect(() => {
    if (visible && initialNativeTag != null) {
      // Look up the render by nativeTag
      const render = RenderTracker.getRender(String(initialNativeTag));
      if (render) {
        // Navigate to detail view for this component
        setSelectedRender(render);
        setSelectedRenderIndex(0);
        setShowFilterView(false);
        // Set spotlight to show which component is being viewed
        HighlightUpdatesController.setSpotlight(render.nativeTag);
      }
      // Notify parent that we've handled the navigation
      onInitialNativeTagHandled?.();
    }
  }, [visible, initialNativeTag, onInitialNativeTagHandled]);

  // ============================================================================
  // CALLBACKS - stable references for child components
  // ============================================================================

  const handleToggleTracking = useCallback(() => {
    if (!HighlightUpdatesController.isInitialized()) {
      HighlightUpdatesController.initialize();
    }
    HighlightUpdatesController.toggle();
  }, []);

  const handleToggleFreeze = useCallback(() => {
    HighlightUpdatesController.toggleFreeze();
  }, []);

  const handleClear = useCallback(() => {
    HighlightUpdatesController.clearRenderCounts();
    setHasRenders(false);
  }, []);

  // Memoize copy data - updates when hasRenders changes
  const copyData = useMemo(() => {
    if (!hasRenders) return "";
    return formatRenderDataForClipboard();
  }, [hasRenders]);

  const handleSearch = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  const handleRenderPress = useCallback((render: TrackedRender, index: number, allRenders: TrackedRender[]) => {
    setSelectedRender(render);
    setSelectedRenderIndex(index);
    rendersListRef.current = allRenders;
    // Set spotlight to show which component is being viewed
    HighlightUpdatesController.setSpotlight(render.nativeTag);
  }, []);

  const handleRendersChange = useCallback((renders: TrackedRender[]) => {
    rendersListRef.current = renders;
  }, []);

  const handleBackFromDetail = useCallback(() => {
    setSelectedRender(null);
    setSelectedRenderIndex(0);
    // Clear the spotlight
    HighlightUpdatesController.setSpotlight(null);
  }, []);

  const handlePreviousRender = useCallback(() => {
    const renders = rendersListRef.current;
    if (selectedRenderIndex > 0) {
      const newIndex = selectedRenderIndex - 1;
      const newRender = renders[newIndex];
      if (newRender) {
        setSelectedRender(newRender);
        setSelectedRenderIndex(newIndex);
        HighlightUpdatesController.setSpotlight(newRender.nativeTag);
      }
    }
  }, [selectedRenderIndex]);

  const handleNextRender = useCallback(() => {
    const renders = rendersListRef.current;
    if (selectedRenderIndex < renders.length - 1) {
      const newIndex = selectedRenderIndex + 1;
      const newRender = renders[newIndex];
      if (newRender) {
        setSelectedRender(newRender);
        setSelectedRenderIndex(newIndex);
        HighlightUpdatesController.setSpotlight(newRender.nativeTag);
      }
    }
  }, [selectedRenderIndex]);

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

  // Handler for adding a filter from the detail view (quick actions)
  const handleAddFilter = useCallback((pattern: FilterPattern, mode: "include" | "exclude") => {
    const currentFilters = RenderTracker.getFilters();
    const newFilters: Partial<FilterConfig> = {};

    if (mode === "include") {
      // Check if pattern already exists
      const exists = currentFilters.includePatterns.some(
        p => p.type === pattern.type && p.value === pattern.value
      );
      if (!exists) {
        newFilters.includePatterns = [...currentFilters.includePatterns, pattern];
      }
    } else {
      // Check if pattern already exists
      const exists = currentFilters.excludePatterns.some(
        p => p.type === pattern.type && p.value === pattern.value
      );
      if (!exists) {
        newFilters.excludePatterns = [...currentFilters.excludePatterns, pattern];
      }
    }

    if (Object.keys(newFilters).length > 0) {
      handleFilterChange(newFilters);
      // Go back to the list view after adding filter
      setSelectedRender(null);
      setSelectedRenderIndex(0);
      // Clear the spotlight
      HighlightUpdatesController.setSpotlight(null);
    }
  }, [handleFilterChange]);

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
          activeTab={filterViewActiveTab}
          onTabChange={setFilterViewActiveTab}
          activeFilterCount={activeFilterCount}
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
        onToggleFreeze={handleToggleFreeze}
        onClear={handleClear}
        copyData={copyData}
        isTracking={isTracking}
        isFrozen={isFrozen}
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
    isFrozen,
    activeFilterCount,
    hasRenders,
    filterViewActiveTab,
    handleBackFromFilter,
    handleBackFromDetail,
    handleSearch,
    handleSearchToggle,
    handleSearchClose,
    handleFilterToggle,
    handleToggleTracking,
    handleToggleFreeze,
    handleClear,
    copyData,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.highlightUpdates.modal();

  if (!visible) return null;

  // Footer for navigating through the renders list
  const totalRenders = rendersListRef.current.length;
  const footerNode = selectedRender ? (
    <EventStepperFooter
      currentIndex={selectedRenderIndex}
      totalItems={totalRenders}
      onPrevious={handlePreviousRender}
      onNext={handleNextRender}
      itemLabel="Component"
      subtitle={selectedRender.componentName || selectedRender.displayName || selectedRender.viewType}
    />
  ) : null;

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
      footer={footerNode}
      footerHeight={footerNode ? 68 : 0}
    >
      <View nativeID="__rn_buoy__highlight-modal" style={styles.container}>
        {selectedRender ? (
          <RenderDetailView
            render={selectedRender}
            disableInternalFooter={true}
            onAddFilter={handleAddFilter}
          />
        ) : showFilterView ? (
          <HighlightFilterView
            filters={filters}
            onFilterChange={handleFilterChange}
            settings={settings}
            onSettingsChange={handleSettingsChange}
            availableProps={RenderTracker.getAvailableProps()}
            activeTab={filterViewActiveTab}
          />
        ) : (
          <>
            {!isTracking && <DisabledBanner />}

            <IsolatedRenderList
              searchText={searchText}
              filters={filters}
              onSelectRender={handleRenderPress}
              onStatsChange={handleStatsChange}
              onRendersChange={handleRendersChange}
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
