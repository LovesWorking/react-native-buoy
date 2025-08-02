import { RequiredEnvVar } from "../admin/sections/env-vars/types";
import { SentryLogsModal } from "./modals/SentryLogsModal";
import { EnvVarsModal } from "./modals/EnvVarsModal";
import { ReactQueryModal } from "./modals/ReactQueryModal";

// Available section types for navigation
export type SectionType = "sentry-logs" | "env-vars" | "rn-better-dev-tools";

interface DevToolsModalRouterProps {
  selectedSection: SectionType | null;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  getSentrySubtitle: () => string;
  getRnBetterDevToolsSubtitle: () => string;
  envVarsSubtitle: string;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
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
  getSentrySubtitle,
  getRnBetterDevToolsSubtitle,
  envVarsSubtitle,
  onBack,
  enableSharedModalDimensions = false,
}: DevToolsModalRouterProps) {
  return (
    <>
      <SentryLogsModal
        visible={selectedSection === "sentry-logs"}
        onClose={onClose}
        getSentrySubtitle={getSentrySubtitle}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
      />

      <EnvVarsModal
        visible={selectedSection === "env-vars"}
        onClose={onClose}
        requiredEnvVars={requiredEnvVars}
        envVarsSubtitle={envVarsSubtitle}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
      />

      <ReactQueryModal
        visible={selectedSection === "rn-better-dev-tools"}
        onClose={onClose}
        getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
        onBack={onBack}
        enableSharedModalDimensions={enableSharedModalDimensions}
      />
    </>
  );
}
