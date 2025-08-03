import { Query, QueryKey } from "@tanstack/react-query";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { useGetQueryByQueryKey } from "../../../_hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "../ReactQueryModalHeader";
import { DataEditorMode } from "../../admin/components/DataEditorMode";
import { useState } from "react";

interface DataEditorModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  enableSharedModalDimensions?: boolean;
  onTabChange: (tab: "queries" | "mutations" | "storage") => void;
}

/**
 * Specialized modal for data editing following "Decompose by Responsibility"
 * Single purpose: Display data editor when a query is selected
 */
export function DataEditorModal({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
  activeFilter: externalActiveFilter,
  onFilterChange: externalOnFilterChange,
  enableSharedModalDimensions = false,
  onTabChange,
}: DataEditorModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  // Use external filter state if provided (for persistence), otherwise use internal state
  const [internalActiveFilter, setInternalActiveFilter] = useState<
    string | null
  >(null);
  const activeFilter = externalActiveFilter ?? internalActiveFilter;
  const setActiveFilter = externalOnFilterChange ?? setInternalActiveFilter;

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedQuery={selectedQuery}
      activeTab="queries"
      onTabChange={onTabChange}
      onBack={() => onQuerySelect(undefined)}
    />
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@react_query_editor_modal";

  if (!visible || !selectedQuery) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <DataEditorMode selectedQuery={selectedQuery} />
    </BaseFloatingModal>
  );
}
