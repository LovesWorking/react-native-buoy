import { RequiredEnvVar } from "../../../_sections/env/types";
import { SentryLogsModal } from "../../../_sections/sentry";
import { EnvVarsModal } from "../../../_sections/env/components/EnvVarsModal";
import { StorageModal } from "../../../_sections/storage/components/StorageModal";
import { BubbleSettingsModal } from "./BubbleSettingsModal";

// Available section types for navigation
export type SectionType =
  | "sentry-logs"
  | "env-vars"
  | "rn-better-dev-tools"
  | "storage"
  | "bubble-settings";

interface DevToolsModalRouterProps {
  selectedSection: SectionType | null;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  _getSentrySubtitle: () => string;
  envVarsSubtitle: string;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
  onSettingsChange?: () => void | Promise<void>;
}

/**
 * Modal router following "Extract Reusable Logic" principle
 * Single responsibility: Route to appropriate specialized modal based on selection
 * No conditional rendering - each modal handles its own visibility
 */
export function DevToolsModalRouter({
  selectedSection,
  onClose,
  requiredEnvVars,
  _getSentrySubtitle,
  envVarsSubtitle,
  onBack,
  enableSharedModalDimensions = false,
  onSettingsChange,
}: DevToolsModalRouterProps) {
  return (
    <>
      <SentryLogsModal
        visible={selectedSection === "sentry-logs"}
        onClose={onClose}
        getSentrySubtitle={_getSentrySubtitle}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
      />

      <EnvVarsModal
        visible={selectedSection === "env-vars"}
        onClose={onClose}
        requiredEnvVars={requiredEnvVars}
        _envVarsSubtitle={envVarsSubtitle}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
      />

      <StorageModal
        visible={selectedSection === "storage"}
        onClose={onClose}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
        requiredStorageKeys={requiredEnvVars}
      />

      <BubbleSettingsModal
        visible={selectedSection === "bubble-settings"}
        onClose={onClose}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
        onSettingsChange={onSettingsChange}
      />
    </>
  );
}
