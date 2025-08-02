import React from "react";
import { ScrollView } from "react-native";
import { Settings } from "lucide-react-native";
import { ConsoleSection } from "../ConsoleSection";
import { EnvVarsContent, RequiredEnvVar } from "../../admin/sections/env-vars";

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
    <ConsoleSection
      id="env-vars"
      title="Environment Variables"
      subtitle={envVarsSubtitle}
      icon={Settings}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      onPress={onPress}
    />
  );
}

/**
 * Content component for environment variables detail view.
 * Separates content rendering from section UI.
 */
export function EnvVarsDetailContent({
  requiredEnvVars,
}: {
  requiredEnvVars: RequiredEnvVar[];
}) {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#2A2A2A" }}
      contentContainerStyle={{ padding: 24 }}
    >
      <EnvVarsContent requiredEnvVars={requiredEnvVars} />
    </ScrollView>
  );
}
