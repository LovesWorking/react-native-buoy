import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useDynamicEnv } from "../hooks";
import { RequiredEnvVar } from "../types";
import { 
  processEnvVars,
  calculateStats,
  getSubtitle,
} from "../utils";
import { EnvVarStatsSection, EnvVarSection } from "./";
import { displayValue } from "../../../_shared/utils/displayValue";

interface EnvVarsContentProps {
  requiredEnvVars?: RequiredEnvVar[];
}

export function EnvVarsContent({ requiredEnvVars }: EnvVarsContentProps) {
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
        envVars[key] = typeof data === "string" ? data : displayValue(data);
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
  );
}

// Custom hook for getting subtitle (for compatibility)
export function useEnvVarsSubtitle(requiredEnvVars?: RequiredEnvVar[]) {
  const envResults = useDynamicEnv();

  const autoCollectedEnvVars = useMemo(() => {
    const envVars: Record<string, string> = {};
    envResults.forEach(({ key, data }) => {
      if (data !== undefined && data !== null) {
        envVars[key] = typeof data === "string" ? data : displayValue(data);
      }
    });
    return envVars;
  }, [envResults]);

  const { requiredVars, optionalVars } = useMemo(() => {
    return processEnvVars(autoCollectedEnvVars, requiredEnvVars);
  }, [autoCollectedEnvVars, requiredEnvVars]);

  const stats = useMemo(() => {
    return calculateStats(requiredVars, optionalVars, autoCollectedEnvVars);
  }, [requiredVars, optionalVars, autoCollectedEnvVars]);

  return getSubtitle(stats);
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
