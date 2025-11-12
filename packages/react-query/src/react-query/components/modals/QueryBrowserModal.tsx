import { Query, QueryKey } from "@tanstack/react-query";
import {
  JsModal,
  type ModalMode,
} from "@react-buoy/shared-ui";
import { useGetQueryByQueryKey } from "../../hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { QueryBrowserMode } from "../QueryBrowserMode";
import { QueryBrowserFooter } from "./QueryBrowserFooter";
import { useState, useCallback } from "react";
import { View } from "react-native";
import { devToolsStorageKeys } from "@react-buoy/shared-ui";

interface QueryBrowserModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
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
  activeFilter: externalActiveFilter,
  onFilterChange: externalOnFilterChange,
  enableSharedModalDimensions = false,
  onTabChange,
  searchText = "",
  onSearchChange,
}: QueryBrowserModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  // Use external filter state if provided (for persistence), otherwise use internal state
  const [internalActiveFilter, setInternalActiveFilter] = useState<
    string | null
  >(null);
  const activeFilter = externalActiveFilter ?? internalActiveFilter;
  const setActiveFilter = externalOnFilterChange ?? setInternalActiveFilter;

  // Track modal mode for conditional styling
  const [modalMode, setModalMode] = useState<ModalMode>("bottomSheet");
  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.reactQuery.modal()
    : devToolsStorageKeys.reactQuery.browserModal();

  const handleModeChange = useCallback((mode: ModalMode) => {
    setModalMode(mode);
  }, []);

  if (!visible) return null;

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedQuery={selectedQuery}
      activeTab="queries"
      onTabChange={onTabChange}
      onBack={() => onQuerySelect(undefined)}
      onClose={onClose}
      searchText={searchText}
      onSearchChange={onSearchChange}
    />
  );

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
      footer={footerNode}
      footerHeight={56}
    >
      <View style={{ flex: 1 }}>
        <QueryBrowserMode
          selectedQuery={selectedQuery}
          onQuerySelect={onQuerySelect}
          activeFilter={activeFilter}
          searchText={searchText}
        />
      </View>
    </JsModal>
  );
}
