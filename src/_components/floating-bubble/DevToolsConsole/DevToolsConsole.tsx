import { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { ChevronLeft } from "lucide-react-native";
import { BaseFloatingModal } from "../floatingModal/BaseFloatingModal";
import { RequiredEnvVar } from "../admin/sections/env-vars/types";
import { ConsoleSectionList } from "./ConsoleSectionList";
import { ConsoleSectionDetail } from "./ConsoleSectionDetail";
import {
  SentryLogsSection,
  SentryLogsContent,
  EnvVarsSection,
  EnvVarsDetailContent,
  ReactQuerySection,
  ReactQueryDetailContent,
} from "./sections";

// Stable constants moved to module scope to prevent re-renders [[memory:4875251]]
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

// Available section types for navigation
type SectionType = "sentry-logs" | "env-vars" | "rn-better-dev-tools";

interface DevToolsConsoleProps {
  visible: boolean;
  onClose: () => void;
  requiredEnvVars: RequiredEnvVar[];
  getSentrySubtitle: () => string;
  getRnBetterDevToolsSubtitle: () => string;
  envVarsSubtitle: string;
}

export function DevToolsConsole({
  visible,
  onClose,
  requiredEnvVars,
  getSentrySubtitle,
  getRnBetterDevToolsSubtitle,
  envVarsSubtitle,
}: DevToolsConsoleProps) {
  const [selectedSection, setSelectedSection] = useState<SectionType | null>(
    null
  );

  const handleSectionPress = (sectionType: SectionType) => {
    setSelectedSection(sectionType);
  };

  const handleBackPress = () => {
    setSelectedSection(null);
  };

  const handleCloseModal = () => {
    // setSelectedSection(null);
    onClose();
  };

  // Helper function to get section title
  const getSectionTitle = () => {
    switch (selectedSection) {
      case "sentry-logs":
        return "Sentry Logs";
      case "env-vars":
        return "Environment Variables";
      case "rn-better-dev-tools":
        return "RN Better Dev Tools";
      default:
        return "Dev Tools Console";
    }
  };

  // Helper function to get section subtitle
  const getSectionSubtitle = () => {
    switch (selectedSection) {
      case "sentry-logs":
        return getSentrySubtitle();
      case "env-vars":
        return envVarsSubtitle;
      case "rn-better-dev-tools":
        return getRnBetterDevToolsSubtitle();
      default:
        return undefined;
    }
  };

  // Helper function to render the content-specific header elements
  const renderHeaderContent = () => {
    const title = getSectionTitle();
    return (
      <View style={styles.headerContainer}>
        {selectedSection && (
          <Pressable
            onPress={handleBackPress}
            style={styles.backButton}
            hitSlop={HIT_SLOP}
          >
            <ChevronLeft color="#E5E7EB" size={20} />
          </Pressable>
        )}

        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    );
  };

  // Render section detail content using composition
  const renderSectionContent = () => {
    switch (selectedSection) {
      case "sentry-logs":
        return <SentryLogsContent onClose={handleCloseModal} />;
      case "env-vars":
        return <EnvVarsDetailContent requiredEnvVars={requiredEnvVars} />;
      case "rn-better-dev-tools":
        return <ReactQueryDetailContent onClose={handleCloseModal} />;
      default:
        return null;
    }
  };

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={handleCloseModal}
      storagePrefix="@devtools_console"
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
      headerSubtitle={getSectionSubtitle()}
    >
      {/* Main content */}
      <View style={styles.content}>
        {selectedSection ? (
          // Detail View - Show selected section content using composition
          <ConsoleSectionDetail>{renderSectionContent()}</ConsoleSectionDetail>
        ) : (
          // Section List View - Show all sections using composition
          <ConsoleSectionList>
            <SentryLogsSection
              onPress={() => handleSectionPress("sentry-logs")}
              getSentrySubtitle={getSentrySubtitle}
            />
            <EnvVarsSection
              onPress={() => handleSectionPress("env-vars")}
              envVarsSubtitle={envVarsSubtitle}
              requiredEnvVars={requiredEnvVars}
            />
            <ReactQuerySection
              onPress={() => handleSectionPress("rn-better-dev-tools")}
              getRnBetterDevToolsSubtitle={getRnBetterDevToolsSubtitle}
            />
          </ConsoleSectionList>
        )}
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
  },

  backButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)",
    zIndex: 1002,
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12, // Space after back button
  },

  title: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A",
  },
});
