import { useCallback } from "react";
import { ModalHeader } from "../components/ModalHeader";
import { JsModal, ModalMode } from "../../JsModal";
import { BubbleVisibilitySettings, BubbleSettingsDetail } from "../../settings";
import { devToolsStorageKeys } from "../../storage/devToolsStorageKeys";

interface BubbleSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
  onSettingsChange?: (
    settings: BubbleVisibilitySettings
  ) => void | Promise<void>;
}

export function BubbleSettingsModal({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
  onSettingsChange,
}: BubbleSettingsModalProps) {
  const handleModeChange = useCallback((_mode: ModalMode) => {
    // Mode changes handled by JsModal
  }, []);

  if (!visible) return null;

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.bubble.settings();

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: (
          <ModalHeader>
            <ModalHeader.Navigation onBack={onBack} />
            <ModalHeader.Content
              title="Bubble Settings"
              subtitle="Configure visibility"
              centered
            />
            <ModalHeader.Actions onClose={onClose} />
          </ModalHeader>
        ),
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
    >
      <BubbleSettingsDetail onSettingsChange={onSettingsChange} />
    </JsModal>
  );
}
