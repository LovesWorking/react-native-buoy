import { ScrollView } from "react-native";
import { Settings } from "rn-better-dev-tools/icons";
import { CyberpunkSectionButton } from "@/rn-better-dev-tools/src/shared/ui/console/CyberpunkSectionButton";
import { RequiredEnvVar } from "../types";
import { GameUIEnvContent } from "./GameUIEnvContent";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";

interface EnvVarsSectionProps {
  onPress: () => void;
  envVarsSubtitle: string;
  requiredEnvVars: RequiredEnvVar[];
}

/**
 * Environment variables section component following composition principles.
 * Encapsulates env vars specific business logic and UI.
 */
export function EnvVarsSection({
  onPress,
  envVarsSubtitle,
}: EnvVarsSectionProps) {
  return (
    <CyberpunkSectionButton
      id="env-vars"
      title="ENV"
      subtitle={envVarsSubtitle}
      icon={Settings}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      onPress={onPress}
      index={0}
    />
  );
}

/**
 * Content component for environment variables detail view.
 * Separates content rendering from section UI.
 */
export function EnvVarsDetailContent({
  requiredEnvVars,
  activeTab,
  searchQuery = "",
}: {
  requiredEnvVars: RequiredEnvVar[];
  activeTab?: string;
  searchQuery?: string;
}) {
  return (
    <ScrollView
      sentry-label="ignore devtools env vars section scroll"
      style={{ flex: 1, backgroundColor: gameUIColors.background }}
      contentContainerStyle={{ flexGrow: 1, backgroundColor: gameUIColors.background }}
    >
      <GameUIEnvContent 
        requiredEnvVars={requiredEnvVars} 
        activeTab={activeTab}
        searchQuery={searchQuery}
      />
    </ScrollView>
  );
}
