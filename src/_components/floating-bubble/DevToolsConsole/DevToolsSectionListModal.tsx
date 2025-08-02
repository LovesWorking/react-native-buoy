import { BaseFloatingModal } from "../floatingModal/BaseFloatingModal";
import { RequiredEnvVar } from "../admin/sections/env-vars/types";
import { ConsoleSectionList } from "./ConsoleSectionList";
import {
  SentryLogsSection,
  EnvVarsSection,
  ReactQuerySection,
} from "./sections";
import { SectionType } from "./DevToolsModalRouter";

interface DevToolsSectionListModalProps {
  visible: boolean;
  onClose: () => void;
  onSectionSelect: (sectionType: SectionType) => void;
  requiredEnvVars: RequiredEnvVar[];
  getSentrySubtitle: () => string;
  getRnBetterDevToolsSubtitle: () => string;
  envVarsSubtitle: string;
}

/**
 * Specialized modal for section list following "Decompose by Responsibility"
 * Single purpose: Display and handle section selection
 */
export function DevToolsSectionListModal({
  visible,
  onClose,
  onSectionSelect,
  requiredEnvVars,
  getSentrySubtitle,
  getRnBetterDevToolsSubtitle,
  envVarsSubtitle,
}: DevToolsSectionListModalProps) {
  if (!visible) return null;

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@devtools_section_list"
      showToggleButton={true}
      customHeaderContent={null}
      headerSubtitle="Developer Tools Console"
    >
      <ConsoleSectionList>
        <SentryLogsSection
          onPress={() => onSectionSelect("sentry-logs")}
          getSentrySubtitle={getSentrySubtitle}
        />
        <EnvVarsSection
          onPress={() => onSectionSelect("env-vars")}
          envVarsSubtitle={envVarsSubtitle}
          requiredEnvVars={requiredEnvVars}
        />
        <ReactQuerySection
          onPress={() => onSectionSelect("rn-better-dev-tools")}
          getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
        />
      </ConsoleSectionList>
    </BaseFloatingModal>
  );
}
