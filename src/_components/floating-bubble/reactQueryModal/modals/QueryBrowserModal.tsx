import { Query, QueryKey } from "@tanstack/react-query";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { useGetQueryByQueryKey } from "../../../_hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "../ReactQueryModalHeader";
import { QueryBrowserMode } from "../../admin/components/QueryBrowserMode";
import { useState } from "react";

interface QueryBrowserModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
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
}: QueryBrowserModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  // Use external filter state if provided (for persistence), otherwise use internal state
  const [internalActiveFilter, setInternalActiveFilter] = useState<
    string | null
  >(null);
  const activeFilter = externalActiveFilter ?? internalActiveFilter;
  const setActiveFilter = externalOnFilterChange ?? setInternalActiveFilter;

  if (!visible) return null;

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedQuery={selectedQuery}
      activeFilter={activeFilter}
      onQuerySelect={onQuerySelect}
      onFilterChange={setActiveFilter}
    />
  );

  console.log("🔍 [QUERY BROWSER MODAL] Render with filter:", {
    visible,
    activeFilter,
    externalActiveFilter,
    willUseExternalFilter: !!externalOnFilterChange,
  });

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@query_browser_modal"
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <QueryBrowserMode
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
        activeFilter={activeFilter}
      />
    </BaseFloatingModal>
  );
}
