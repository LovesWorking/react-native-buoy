import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Settings } from "lucide-react-native";

import { useDynamicEnv } from "../hooks";
import { RequiredEnvVar } from "../types";
import { processEnvVars, calculateStats, getSubtitle } from "../utils";
import { EnvVarStatsSection, EnvVarSection } from "./";
import { ExpandableSection } from "../../../_shared/ui/components/ExpandableSection";

interface EnvVarsSectionProps {
  requiredEnvVars?: RequiredEnvVar[]; // Can be strings or objects with expected values
}

export function EnvVarsSection({ requiredEnvVars }: EnvVarsSectionProps) {
  // ==========================================================
  // Auto-collect environment variables
  // ==========================================================
  const envResults = useDynamicEnv();

  // Convert env results to a simple key-value object
  const autoCollectedEnvVars = useMemo(() => {
    const envVars: Record<string, string> = {};

    envResults.forEach(({ key, data }) => {
      // Include all available env vars
      if (data !== undefined && data !== null) {
        // Convert data to string for transmission
        envVars[key] = typeof data === "string" ? data : JSON.stringify(data);
      }
    });

    return envVars;
  }, [envResults]);

  // Process and categorize environment variables
  const { requiredVars, optionalVars } = useMemo(() => {
    return processEnvVars(autoCollectedEnvVars, requiredEnvVars);
  }, [autoCollectedEnvVars, requiredEnvVars]);

  // Calculate statistics
  const stats = useMemo(() => {
    return calculateStats(requiredVars, optionalVars, autoCollectedEnvVars);
  }, [requiredVars, optionalVars, autoCollectedEnvVars]);

  return (
    <ExpandableSection
      icon={Settings}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      title="Environment Variables"
      subtitle={getSubtitle(stats)}
    >
      <View style={styles.container}>
        {/* Stats Section */}
        <EnvVarStatsSection stats={stats} />

        {/* Required Variables Section */}
        <EnvVarSection
          title="Required Variables"
          count={stats.requiredCount}
          vars={requiredVars}
          emptyMessage="No required variables specified"
        />

        {/* Optional Variables Section */}
        <EnvVarSection
          title="Available Variables"
          count={stats.optionalCount}
          vars={optionalVars}
          emptyMessage="No additional variables found"
        />

        {/* Help Text */}
        <Text style={styles.helpText}>
          Only EXPO_PUBLIC_ prefixed variables are available in React Native
        </Text>
      </View>
    </ExpandableSection>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  helpText: {
    color: "#6B7280",
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 4,
    marginTop: 4,
    lineHeight: 12,
  },
});
