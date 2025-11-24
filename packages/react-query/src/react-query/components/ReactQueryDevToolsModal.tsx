import { useCallback, useState } from "react";
import type { QueryKey } from "@tanstack/react-query";
import { ReactQueryModal } from "./modals/ReactQueryModal";

/** Configuration options for the high-level React Query dev tools modal wrapper. */
export interface ReactQueryDevToolsModalProps {
  /** Controls whether the modal is rendered. */
  visible: boolean;
  /** Fired when the modal should dismiss (after internal state resets). */
  onClose: () => void;
  /** Callback when minimize is requested - receives current modal state for restoration */
  onMinimize?: (modalState: any) => void;
  /**
   * If true, reuse the shared modal dimension keys so sizing is consistent with other dev tools.
   */
  enableSharedModalDimensions?: boolean;
}

type ReactQueryModalProps = React.ComponentProps<typeof ReactQueryModal>;
type OnQuerySelect = NonNullable<ReactQueryModalProps["onQuerySelect"]>;
type OnMutationSelect = NonNullable<ReactQueryModalProps["onMutationSelect"]>;
type OnFilterChange = NonNullable<ReactQueryModalProps["onFilterChange"]>;
type OnTabChange = NonNullable<ReactQueryModalProps["onTabChange"]>;

/**
 * Opinionated wrapper around `ReactQueryModal` that manages selection state and filters so
 * consumers can drop in the full dev tools experience with a single component.
 */
export function ReactQueryDevToolsModal({
  visible,
  onClose,
  onMinimize,
  enableSharedModalDimensions = true,
}: ReactQueryDevToolsModalProps) {
  const [selectedQueryKey, setSelectedQueryKey] = useState<QueryKey | undefined>(
    undefined,
  );
  const [selectedMutationId, setSelectedMutationId] = useState<
    number | undefined
  >(undefined);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queries" | "mutations">(
    "queries",
  );
  const [searchText, setSearchText] = useState<string>("");

  const resetState = useCallback(() => {
    setSelectedQueryKey(undefined);
    setSelectedMutationId(undefined);
    setActiveFilter(null);
    setActiveTab("queries");
    setSearchText("");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleQuerySelect = useCallback<OnQuerySelect>((query) => {
    setSelectedQueryKey(query?.queryKey);
  }, []);

  const handleMutationSelect = useCallback<OnMutationSelect>((mutation) => {
    setSelectedMutationId(mutation?.mutationId);
  }, []);

  const handleFilterChange = useCallback<OnFilterChange>((filter) => {
    setActiveFilter(filter);
  }, []);

  const handleTabChange = useCallback<OnTabChange>((tab) => {
    setActiveTab(tab);
    setActiveFilter(null);
    setSelectedQueryKey(undefined);
    setSelectedMutationId(undefined);
    setSearchText("");
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <ReactQueryModal
      visible={visible}
      selectedQueryKey={selectedQueryKey}
      selectedMutationId={selectedMutationId}
      onQuerySelect={handleQuerySelect}
      onMutationSelect={handleMutationSelect}
      onClose={handleClose}
      onMinimize={onMinimize}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      searchText={searchText}
      onSearchChange={handleSearchChange}
      enableSharedModalDimensions={enableSharedModalDimensions}
    />
  );
}
