import { Mutation } from "@tanstack/react-query";
import {
  JsModal,
  type ModalMode,
} from "@/rn-better-dev-tools/src/components/modals/jsModal/JsModal";
import { useGetMutationById } from "../../hooks/useSelectedMutation";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { MutationEditorMode } from "../MutationEditorMode";
import { useState, useCallback } from "react";

interface MutationEditorModalProps {
  visible: boolean;
  selectedMutationId?: number;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  onClose: () => void;
  onTabChange: (tab: "queries" | "mutations") => void;
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
  const [modalMode, setModalMode] = useState<ModalMode>("bottomSheet");

  const handleModeChange = useCallback((mode: ModalMode) => {
    setModalMode(mode);
  }, []);

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedMutation={selectedMutation}
      activeTab="mutations"
      onTabChange={onTabChange}
      onBack={() => onMutationSelect(undefined)}
      onClose={onClose}
    />
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@react_query_editor_modal";

  if (!visible || !selectedMutation) return null;

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
    >
      <MutationEditorMode
        selectedMutation={selectedMutation}
        isFloatingMode={modalMode === "floating"}
      />
    </JsModal>
  );
}
