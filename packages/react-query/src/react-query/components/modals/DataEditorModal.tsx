import { QueryKey } from "@tanstack/react-query";
import { JsModal, devToolsStorageKeys } from "@react-buoy/shared-ui";
import type { ModalMode } from "@react-buoy/shared-ui";
import { useGetQueryByQueryKey } from "../../hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { DataEditorMode, DataEditorActionsFooter } from "../DataEditorMode";
import { useState, useCallback } from "react";

interface DataEditorModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: any) => void;
  onClose: () => void;
  onMinimize?: (modalState: any) => void;
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
  onMinimize,
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
    />
  );

  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.reactQuery.modal()
    : `${devToolsStorageKeys.reactQuery.modal()}_data_editor`;

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
      onMinimize={onMinimize}
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
