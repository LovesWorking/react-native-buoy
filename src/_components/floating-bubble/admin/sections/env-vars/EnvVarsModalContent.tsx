import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  X,
  XCircle,
} from "lucide-react-native";

import { useDynamicEnv } from "../../hooks";

interface EnvVarsModalContentProps {
  onClose: () => void;
  requiredEnvVars?: string[]; // Optional list of required environment variables
}

interface EnvVarInfo {
  key: string;
  value: unknown;
  status: "present" | "missing" | "unchecked";
}

export function EnvVarsModalContent({
  onClose,
  requiredEnvVars = [],
}: EnvVarsModalContentProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

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

  // Process environment variables with status
  const processedEnvVars = useMemo(() => {
    const envVarInfos: EnvVarInfo[] = [];
    const processedKeys = new Set<string>();

    // First, add all required variables with their status
    requiredEnvVars.forEach((key) => {
      processedKeys.add(key);
      envVarInfos.push({
        key,
        value: autoCollectedEnvVars[key],
        status: autoCollectedEnvVars[key] !== undefined ? "present" : "missing",
      });
    });

    // Then, add all other environment variables as 'unchecked'
    Object.entries(autoCollectedEnvVars).forEach(([key, value]) => {
      if (!processedKeys.has(key)) {
        envVarInfos.push({
          key,
          value,
          status: "unchecked",
        });
      }
    });

    // Sort by status (missing first, then present, then unchecked) and then by key name
    return envVarInfos.sort((a, b) => {
      const statusOrder = { missing: 0, present: 1, unchecked: 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.key.localeCompare(b.key);
    });
  }, [autoCollectedEnvVars, requiredEnvVars]);

  const refreshEnvVars = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // The hook will automatically refresh when this component re-renders
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusIcon = (status: EnvVarInfo["status"]) => {
    switch (status) {
      case "present":
        return <CheckCircle size={16} color="#10B981" />;
      case "missing":
        return <XCircle size={16} color="#F87171" />;
      case "unchecked":
        return <AlertTriangle size={16} color="#F59E0B" />;
    }
  };

  const getStatusColor = (status: EnvVarInfo["status"]) => {
    switch (status) {
      case "present":
        return "#10B981";
      case "missing":
        return "#F87171";
      case "unchecked":
        return "#F59E0B";
    }
  };

  const getStatusText = (status: EnvVarInfo["status"]) => {
    switch (status) {
      case "present":
        return "Present";
      case "missing":
        return "Missing";
      case "unchecked":
        return "Unchecked";
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === undefined || value === null) {
      return "undefined";
    }
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value, null, 2);
  };

  const missingCount = processedEnvVars.filter(
    (env) => env.status === "missing"
  ).length;
  const presentCount = processedEnvVars.filter(
    (env) => env.status === "present"
  ).length;
  const uncheckedCount = processedEnvVars.filter(
    (env) => env.status === "unchecked"
  ).length;

  return (
    <>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Environment Variables</Text>
              <Text style={styles.subtitle}>
                {processedEnvVars.length} total • {presentCount} present •{" "}
                {missingCount} missing • {uncheckedCount} unchecked
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Refresh environment variables"
              accessibilityHint="Refreshes the environment variables to show latest data"
              sentry-label="ignore user interaction"
              onPress={refreshEnvVars}
              disabled={isRefreshing}
              style={styles.refreshButton}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#8B5CF6" />
              ) : (
                <RefreshCw size={16} color="#8B5CF6" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Close environment variables viewer"
              accessibilityHint="Closes the environment variables viewer and returns to the admin panel"
              sentry-label="ignore user interaction"
              onPress={onClose}
              style={styles.closeButton}
            >
              <X size={16} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Environment Variables List */}
      <ScrollView
        accessibilityLabel="Environment variables"
        accessibilityHint="View environment variables"
        sentry-label="ignore env vars modal content scroll"
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {processedEnvVars.map((envVar, _index) => (
          <View key={envVar.key} style={styles.envVarContainer}>
            <View style={styles.envVarHeader}>
              <View style={styles.envVarTitleContainer}>
                {getStatusIcon(envVar.status)}
                <Text style={styles.envVarKey}>{envVar.key}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: `${getStatusColor(envVar.status)}20` },
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(envVar.status) },
                  ]}
                >
                  {getStatusText(envVar.status)}
                </Text>
              </View>
            </View>
            <View style={styles.envVarValueContainer}>
              <Text style={styles.envVarValue}>
                {formatValue(envVar.value)}
              </Text>
            </View>
          </View>
        ))}

        {processedEnvVars.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No environment variables found</Text>
            <Text style={styles.emptySubtext}>
              Only EXPO_PUBLIC_ prefixed variables are available in React
              Native/Expo apps
            </Text>
          </View>
        )}

        <View style={{ paddingBottom: insets.bottom + 20 }} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#374151",
    backgroundColor: "#0F0F0F",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  titleContainer: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  envVarContainer: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  envVarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  envVarTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  envVarKey: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  envVarValueContainer: {
    backgroundColor: "#111827",
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: "#374151",
  },
  envVarValue: {
    fontSize: 14,
    color: "#D1D5DB",
    fontFamily: "monospace",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 300,
  },
});
