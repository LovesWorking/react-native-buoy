import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { EnvVarsDetailContent } from "../sections";
import { RequiredEnvVar } from "../../admin/sections/env-vars/types";

interface EnvVarsModalProps {
  visible: boolean;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  envVarsSubtitle: string;
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
}: EnvVarsModalProps) {
  if (!visible) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@env_vars_modal"
      showToggleButton={true}
      customHeaderContent={null}
      headerSubtitle={envVarsSubtitle}
    >
      <EnvVarsDetailContent requiredEnvVars={requiredEnvVars} />
    </BaseFloatingModal>
  );
}
