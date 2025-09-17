import { QueryKey } from "@tanstack/react-query";
import { JsModal } from "@/rn-better-dev-tools/src/components/modals/jsModal/JsModal";
import type { ModalMode } from "@/rn-better-dev-tools/src/components/modals/jsModal/JsModal";
import { useGetQueryByQueryKey } from "../../hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { DataEditorMode, DataEditorActionsFooter } from "../DataEditorMode";
import { useState, useCallback } from "react";

interface DataEditorModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: any) => void;
  onClose: () => void;
  enableSharedModalDimensions?: boolean;
  onTabChange: (tab: "queries" | "mutations") => void;
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
  enableSharedModalDimensions = false,
  onTabChange,
}: DataEditorModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  const [modalMode, setModalMode] = useState<ModalMode>("bottomSheet");

  const handleModeChange = useCallback((mode: ModalMode) => {
    setModalMode(mode);
  }, []);

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedQuery={selectedQuery}
      activeTab="queries"
      onTabChange={onTabChange}
      onBack={() => onQuerySelect(undefined)}
      onClose={onClose}
    />
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@react_query_editor_modal";

  if (!visible || !selectedQuery) return null;

  const footerNode = (
    <DataEditorActionsFooter
      selectedQuery={selectedQuery}
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
      footerHeight={72}
    >
      <DataEditorMode
        selectedQuery={selectedQuery}
        isFloatingMode={modalMode === "floating"}
        disableInternalFooter={true}
      />
    </JsModal>
  );
}
