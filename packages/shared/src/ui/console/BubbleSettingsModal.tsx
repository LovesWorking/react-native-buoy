import { useCallback } from "react";
import {
  JsModal,
  type ModalMode,
} from "@/rn-better-dev-tools/src/components/modals/jsModal/JsModal";
import {
  BubbleSettingsDetail,
  type BubbleVisibilitySettings,
} from "@/rn-better-dev-tools/src/features/settings";
import { ModalHeader } from "@/rn-better-dev-tools/src/shared/ui/components/ModalHeader";

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
    ? "@dev_tools_console_modal"
    : "@bubble_settings_modal";

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
