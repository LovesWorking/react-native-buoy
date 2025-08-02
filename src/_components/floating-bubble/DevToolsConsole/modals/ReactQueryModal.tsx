import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { ReactQueryDetailContent } from "../sections";
import { View, Text } from "react-native";
import { BackButton } from "../../admin/components/BackButton";

interface ReactQueryModalProps {
  visible: boolean;
  onClose: () => void;
  getRnBetterDevToolsSubtitle: () => string;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

/**
 * Specialized modal for React Query details following "Decompose by Responsibility"
 * Single purpose: Display React Query information in a modal context
 */
export function ReactQueryModal({
  visible,
  onClose,
  getRnBetterDevToolsSubtitle,
  onBack,
  enableSharedModalDimensions = false,
}: ReactQueryModalProps) {
  if (!visible) return null;

  const subtitle = getRnBetterDevToolsSubtitle();

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
        React Query
      </Text>
    </View>
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@dev_tools_console_modal"
    : "@react_query_detail_modal";

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <ReactQueryDetailContent onClose={onClose} />
    </BaseFloatingModal>
  );
}
