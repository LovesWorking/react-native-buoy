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
}: DataEditorModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  // Use external filter state if provided (for persistence), otherwise use internal state
  const [internalActiveFilter, setInternalActiveFilter] = useState<
    string | null
  >(null);
  const activeFilter = externalActiveFilter ?? internalActiveFilter;
  const setActiveFilter = externalOnFilterChange ?? setInternalActiveFilter;

  if (!visible || !selectedQuery) return null;

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedQuery={selectedQuery}
      activeFilter={activeFilter}
      onQuerySelect={onQuerySelect}
      onFilterChange={setActiveFilter}
    />
  );

  console.log("📝 [DATA EDITOR MODAL] Render with filter:", {
    visible,
    activeFilter,
    externalActiveFilter,
    willUseExternalFilter: !!externalOnFilterChange,
    hasSelectedQuery: !!selectedQuery,
  });

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@data_editor_modal"
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <DataEditorMode selectedQuery={selectedQuery} />
    </BaseFloatingModal>
  );
}
