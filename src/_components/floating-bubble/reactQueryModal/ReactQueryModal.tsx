import { Mutation, QueryKey, Query } from "@tanstack/react-query";
import { useGetMutationById } from "../../_hooks/useSelectedMutation";
import { MutationBrowserMode } from "../admin/components/MutationBrowserMode";
import { MutationEditorMode } from "../admin/components/MutationEditorMode";
import { DataEditorMode } from "../admin/components/DataEditorMode";
import { useGetQueryByQueryKey } from "../../_hooks/useSelectedQuery";
import { QueryBrowserModal } from "./modals/QueryBrowserModal";
import { DataEditorModal } from "./modals/DataEditorModal";
import { BaseFloatingModal } from "../floatingModal/BaseFloatingModal";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { View } from "react-native";
import { QueryBrowserMode } from "../admin/components/QueryBrowserMode";
import { MutationBrowserModal } from "./modals/MutationBrowserModal";
import { MutationEditorModal } from "./modals/MutationEditorModal";

interface ReactQueryModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  selectedMutationId?: number;
  onQuerySelect: (query: Query | undefined) => void;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  activeTab: "queries" | "mutations";
  onTabChange: (tab: "queries" | "mutations") => void;
  enableSharedModalDimensions?: boolean;
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
  selectedMutationId,
  onQuerySelect,
  onMutationSelect,
  onClose,
  activeFilter,
  onFilterChange,
  activeTab,
  onTabChange,
  enableSharedModalDimensions = false,
}: ReactQueryModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  const selectedMutation = useGetMutationById(selectedMutationId);

  const inDetail = !!selectedQuery || !!selectedMutation;
  const isQueryMode = activeTab === "queries";

  const commonProps = {
    onClose,
    activeFilter,
    onFilterChange,
    enableSharedModalDimensions,
  };

  return (
    <>
      <QueryBrowserModal
        visible={visible && !inDetail && isQueryMode}
        selectedQueryKey={selectedQueryKey}
        onQuerySelect={onQuerySelect}
        onTabChange={onTabChange}
        {...commonProps}
      />
      <MutationBrowserModal
        visible={visible && !inDetail && !isQueryMode}
        selectedMutationId={selectedMutationId}
        onMutationSelect={onMutationSelect}
        onTabChange={onTabChange}
        {...commonProps}
      />
      <DataEditorModal
        visible={visible && inDetail && !!selectedQuery}
        selectedQueryKey={selectedQueryKey}
        onQuerySelect={onQuerySelect}
        onTabChange={onTabChange}
        {...commonProps}
      />
      <MutationEditorModal
        visible={visible && inDetail && !!selectedMutation}
        selectedMutationId={selectedMutationId}
        onMutationSelect={onMutationSelect}
        onTabChange={onTabChange}
        {...commonProps}
      />
    </>
  );
}
