import { Mutation } from "@tanstack/react-query";
import {
  JsModal,
  type ModalMode,
  devToolsStorageKeys,
} from "@react-buoy/shared-ui";
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

/**
 * Modal variant dedicated to editing a single mutation entry. Restores persisted positioning and
 * mirrors the behavior of the query editor.
 */
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
    ? devToolsStorageKeys.reactQuery.modal()
    : devToolsStorageKeys.reactQuery.mutationModal();

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
