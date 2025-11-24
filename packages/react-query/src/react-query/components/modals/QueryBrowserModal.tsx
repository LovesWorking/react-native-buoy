import { Query, QueryKey } from "@tanstack/react-query";
import {
  JsModal,
  type ModalMode,
  ModalHeader,
  TabSelector,
} from "@react-buoy/shared-ui";
import { useGetQueryByQueryKey } from "../../hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { QueryBrowserMode } from "../QueryBrowserMode";
import { QueryBrowserFooter } from "./QueryBrowserFooter";
import { QueryFilterViewV3 } from "../QueryFilterViewV3";
import { useState, useCallback, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { devToolsStorageKeys, useSafeAsyncStorage, macOSColors } from "@react-buoy/shared-ui";
import useAllQueries from "../../hooks/useAllQueries";

interface QueryBrowserModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  onMinimize?: (modalState: any) => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  enableSharedModalDimensions?: boolean;
  onTabChange: (tab: "queries" | "mutations") => void;
  searchText?: string;
  onSearchChange?: (text: string) => void;
}

/**
 * Specialized modal for query browsing following "Decompose by Responsibility"
 * Single purpose: Display query browser when no query is selected
 */
export function QueryBrowserModal({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
  onMinimize,
  activeFilter: externalActiveFilter,
  onFilterChange: externalOnFilterChange,
  enableSharedModalDimensions = false,
  onTabChange,
  searchText = "",
  onSearchChange,
}: QueryBrowserModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  const allQueries = useAllQueries();

  // Use external filter state if provided (for persistence), otherwise use internal state
  const [internalActiveFilter, setInternalActiveFilter] = useState<
    string | null
  >(null);
  const activeFilter = externalActiveFilter ?? internalActiveFilter;
  const setActiveFilter = externalOnFilterChange ?? setInternalActiveFilter;

  // Filter modal state
  const [showFilterView, setShowFilterView] = useState(false);
  const [ignoredPatterns, setIgnoredPatterns] = useState<Set<string>>(new Set());

  // AsyncStorage for persisting ignored patterns
  const { getItem: safeGetItem, setItem: safeSetItem } = useSafeAsyncStorage();

  // Load ignored patterns from storage on mount
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const stored = await safeGetItem(
          devToolsStorageKeys.reactQuery.ignoredPatterns()
        );
        if (stored) {
          const patterns = JSON.parse(stored);
          if (Array.isArray(patterns)) {
            setIgnoredPatterns(new Set(patterns));
          }
        }
      } catch (error) {
        console.error("Failed to load ignored patterns:", error);
      }
    };
    loadFilters();
  }, [safeGetItem]);

  // Save ignored patterns to storage when they change
  useEffect(() => {
    const saveFilters = async () => {
      try {
        const patterns = Array.from(ignoredPatterns);
        await safeSetItem(
          devToolsStorageKeys.reactQuery.ignoredPatterns(),
          JSON.stringify(patterns)
        );
      } catch (error) {
        console.error("Failed to save ignored patterns:", error);
      }
    };
    saveFilters();
  }, [ignoredPatterns, safeSetItem]);

  // Toggle pattern in ignored set
  const handlePatternToggle = useCallback((pattern: string) => {
    setIgnoredPatterns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(pattern)) {
        newSet.delete(pattern);
      } else {
        newSet.add(pattern);
      }
      return newSet;
    });
  }, []);

  // Track modal mode for conditional styling
  const [modalMode, setModalMode] = useState<ModalMode>("bottomSheet");
  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.reactQuery.modal()
    : devToolsStorageKeys.reactQuery.browserModal();

  const handleModeChange = useCallback((mode: ModalMode) => {
    setModalMode(mode);
  }, []);

  if (!visible) return null;

  const renderHeaderContent = () => {
    // Filter view header with back button
    if (showFilterView) {
      const tabs = [{ key: "filters" as const, label: "Filters" }];

      return (
        <ModalHeader>
          <ModalHeader.Navigation onBack={() => setShowFilterView(false)} />
          <ModalHeader.Content title="" noMargin>
            <TabSelector
              tabs={tabs}
              activeTab="filters"
              onTabChange={() => {}}
            />
          </ModalHeader.Content>
        </ModalHeader>
      );
    }

    // Normal query browser header
    return (
      <ReactQueryModalHeader
        selectedQuery={selectedQuery}
        activeTab="queries"
        onTabChange={onTabChange}
        onBack={() => onQuerySelect(undefined)}
        searchText={searchText}
        onSearchChange={onSearchChange}
        onFilterPress={() => setShowFilterView(true)}
        hasActiveFilters={activeFilter !== null || ignoredPatterns.size > 0}
      />
    );
  };

  const footerNode = (
    <QueryBrowserFooter
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      isFloatingMode={modalMode === "floating"}
    />
  );

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      onMinimize={onMinimize}
      persistenceKey={storagePrefix}
      header={{
        customContent: renderHeaderContent(),
        showToggleButton: true,
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
      footer={!showFilterView ? footerNode : undefined}
      footerHeight={!showFilterView ? 56 : undefined}
    >
      <View style={styles.container}>
        {showFilterView ? (
          /* Show filter view */
          <QueryFilterViewV3
            queries={allQueries}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            ignoredPatterns={ignoredPatterns}
            onPatternToggle={handlePatternToggle}
          />
        ) : (
          /* Show query browser */
          <QueryBrowserMode
            selectedQuery={selectedQuery}
            onQuerySelect={onQuerySelect}
            activeFilter={activeFilter}
            searchText={searchText}
            ignoredPatterns={ignoredPatterns}
          />
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
});
