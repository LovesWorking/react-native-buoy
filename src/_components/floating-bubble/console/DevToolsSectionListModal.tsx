import { BaseFloatingModal } from "../modal/components/BaseFloatingModal";
import { RequiredEnvVar } from "../../../_sections/env/types";
import { ConsoleSectionList } from "./ConsoleSectionList";
import { SentryLogsSection, ReactQuerySection } from "./sections";
import { EnvVarsSection } from "../../../_sections/env";
import { StorageSection } from "../../../_sections/storage/components/StorageSection";
import { SectionType } from "./DevToolsModalRouter";
import { Text, View } from "react-native";

interface DevToolsSectionListModalProps {
  visible: boolean;
  onClose: () => void;
  onSectionSelect: (sectionType: SectionType) => void;
  requiredEnvVars: RequiredEnvVar[];
  _getSentrySubtitle: () => string;
  getRnBetterDevToolsSubtitle: () => string;
  envVarsSubtitle: string;
  enableSharedModalDimensions?: boolean;
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
  _getSentrySubtitle,
  getRnBetterDevToolsSubtitle,
  envVarsSubtitle,
  enableSharedModalDimensions = false,
}: DevToolsSectionListModalProps) {
  if (!visible) return null;

  const storagePrefix = enableSharedModalDimensions
    ? "@dev_tools_console_modal"
    : "@devtools_section_list";

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
      <Text
        style={{ color: "#E5E7EB", fontSize: 14, fontWeight: "500", flex: 1 }}
        numberOfLines={1}
      >
        Developer Tools Console
      </Text>
    </View>
  );

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={undefined}
    >
      <ConsoleSectionList>
        <SentryLogsSection
          onPress={() => onSectionSelect("sentry-logs")}
          getSentrySubtitle={_getSentrySubtitle}
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
        <StorageSection onPress={() => onSectionSelect("storage")} />
      </ConsoleSectionList>
    </BaseFloatingModal>
  );
}
