import { Query, QueryKey } from "@tanstack/react-query";
import { useGetQueryByQueryKey } from "../../_hooks/useSelectedQuery";
import { QueryBrowserModal } from "./modals/QueryBrowserModal";
import { DataEditorModal } from "./modals/DataEditorModal";

interface ReactQueryModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

/**
 * Refactored ReactQueryModal following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Separated query browser and data editor modals
 * - Prefer Composition over Configuration: Uses specialized modal components
 * - Extract Reusable Logic: Modal routing logic based on query selection
 * - Utilize Render Props: Each modal handles its own rendering responsibility
 */
export function ReactQueryModal({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
  activeFilter,
  onFilterChange,
}: ReactQueryModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);

  // Show query browser when modal is visible but no query selected
  const showQueryBrowser = visible && !selectedQuery;

  // Show data editor when a query is selected
  const showDataEditor = visible && !!selectedQuery;

  return (
    <>
      {/* Query Browser Modal - shown when no query is selected */}
      <QueryBrowserModal
        visible={showQueryBrowser}
        selectedQueryKey={selectedQueryKey}
        onQuerySelect={onQuerySelect}
        onClose={onClose}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />

      {/* Data Editor Modal - shown when a query is selected */}
      <DataEditorModal
        visible={showDataEditor}
        selectedQueryKey={selectedQueryKey}
        onQuerySelect={onQuerySelect}
        onClose={onClose}
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    </>
  );
}
