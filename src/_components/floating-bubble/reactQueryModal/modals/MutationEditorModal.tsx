import { Mutation } from "@tanstack/react-query";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { useGetMutationById } from "../../../_hooks/useSelectedMutation";
import { ReactQueryModalHeader } from "../ReactQueryModalHeader";
import { MutationEditorMode } from "../../admin/components/MutationEditorMode";

interface MutationEditorModalProps {
  visible: boolean;
  selectedMutationId?: number;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  onTabChange: (tab: "queries" | "mutations" | "storage") => void;
  enableSharedModalDimensions?: boolean;
}

export function MutationEditorModal({
  visible,
  selectedMutationId,
  onMutationSelect,
  onClose,
  onTabChange,
  enableSharedModalDimensions = false,
}: MutationEditorModalProps) {
  const selectedMutation = useGetMutationById(selectedMutationId);

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedMutation={selectedMutation}
      activeTab="mutations"
      onTabChange={onTabChange}
      onBack={() => onMutationSelect(undefined)}
    />
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@react_query_editor_modal";

  if (!visible || !selectedMutation) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <MutationEditorMode selectedMutation={selectedMutation} />
    </BaseFloatingModal>
  );
}
