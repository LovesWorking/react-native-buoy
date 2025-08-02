import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { SentryLogsContent } from "../sections";
import { View, Text } from "react-native";
import { BackButton } from "../../admin/components/BackButton";

interface SentryLogsModalProps {
  visible: boolean;
  onClose: () => void;
  getSentrySubtitle: () => string;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

/**
 * Specialized modal for Sentry logs following "Decompose by Responsibility"
 * Single purpose: Display sentry logs in a modal context
 */
export function SentryLogsModal({
  visible,
  onClose,
  getSentrySubtitle,
  onBack,
  enableSharedModalDimensions = false,
}: SentryLogsModalProps) {
  if (!visible) return null;

  const subtitle = getSentrySubtitle();

  const renderHeaderContent = () => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        gap: 12,
        minHeight: 32,
        paddingLeft: 4,
      }}
    >
      {onBack && <BackButton onPress={onBack} color="#FFFFFF" size={16} />}
      <Text
        style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "500", flex: 1 }}
        numberOfLines={1}
      >
        Sentry Logs
      </Text>
    </View>
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@dev_tools_console_modal"
    : "@sentry_logs_modal";

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <SentryLogsContent onClose={onClose} />
    </BaseFloatingModal>
  );
}
