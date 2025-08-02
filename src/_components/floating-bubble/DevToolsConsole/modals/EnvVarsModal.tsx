import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { EnvVarsDetailContent } from "../sections";
import { RequiredEnvVar } from "../../admin/sections/env-vars/types";
import { View, Text } from "react-native";
import { BackButton } from "../../admin/components/BackButton";

interface EnvVarsModalProps {
  visible: boolean;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  envVarsSubtitle: string;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
}

/**
 * Specialized modal for environment variables following "Decompose by Responsibility"
 * Single purpose: Display environment variables in a modal context
 */
export function EnvVarsModal({
  visible,
  onClose,
  requiredEnvVars,
  envVarsSubtitle,
  onBack,
  enableSharedModalDimensions = false,
}: EnvVarsModalProps) {
  if (!visible) return null;

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
        Environment Variables
      </Text>
    </View>
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@dev_tools_console_modal"
    : "@env_vars_modal";

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <EnvVarsDetailContent requiredEnvVars={requiredEnvVars} />
    </BaseFloatingModal>
  );
}
