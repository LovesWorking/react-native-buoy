import { useMemo, useState, useCallback } from "react";
import { TouchableOpacity, View, StyleSheet, Text } from "react-native";
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  Eye,
  XCircle,
} from "lucide-react-native";

import { ExpandableSection } from "./ExpandableSection";
import { useDynamicEnv } from "../hooks";
import { getEnvVarType } from "./env-vars";

interface EnvVarInfo {
  key: string;
  value: unknown;
  expectedValue?: string;
  expectedType?: string;
  status:
    | "required_present"
    | "required_missing"
    | "required_wrong_value"
    | "required_wrong_type"
    | "optional_present";
  category: "required" | "optional";
}

type RequiredEnvVar =
  | string
  | { key: string; expectedValue: string }
  | { key: string; expectedType: string };

interface EnvVarsSectionProps {
  requiredEnvVars?: RequiredEnvVar[]; // Can be strings or objects with expected values
}

export function EnvVarsSection({ requiredEnvVars = [] }: EnvVarsSectionProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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
  const { requiredVars, optionalVars, stats } = useMemo(() => {
    const requiredVarInfos: EnvVarInfo[] = [];
    const optionalVarInfos: EnvVarInfo[] = [];
    const processedKeys = new Set<string>();

    // Process required variables
    requiredEnvVars.forEach((envVar) => {
      const key = typeof envVar === "string" ? envVar : envVar.key;
      const expectedValue =
        typeof envVar === "object" && "expectedValue" in envVar
          ? envVar.expectedValue
          : undefined;
      const expectedType =
        typeof envVar === "object" && "expectedType" in envVar
          ? envVar.expectedType
          : undefined;

      processedKeys.add(key);
      const actualValue = autoCollectedEnvVars[key];
      const isPresent = actualValue !== undefined;

      let status: EnvVarInfo["status"];
      if (!isPresent) {
        status = "required_missing";
      } else if (expectedValue && actualValue !== expectedValue) {
        status = "required_wrong_value";
      } else if (
        expectedType &&
        getEnvVarType(actualValue) !== expectedType.toUpperCase()
      ) {
        status = "required_wrong_type";
      } else {
        status = "required_present";
      }

      requiredVarInfos.push({
        key,
        value: actualValue,
        expectedValue,
        expectedType,
        status,
        category: "required",
      });
    });

    // Process optional variables (those that exist but aren't required)
    Object.entries(autoCollectedEnvVars).forEach(([key, value]) => {
      if (!processedKeys.has(key)) {
        optionalVarInfos.push({
          key,
          value,
          status: "optional_present",
          category: "optional",
        });
      }
    });

    // Sort each category
    requiredVarInfos.sort((a, b) => {
      const statusOrder: Record<EnvVarInfo["status"], number> = {
        required_missing: 0,
        required_wrong_value: 1,
        required_wrong_type: 2,
        required_present: 3,
        optional_present: 4,
      };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.key.localeCompare(b.key);
    });

    optionalVarInfos.sort((a, b) => a.key.localeCompare(b.key));

    // Calculate stats
    const totalCount = Object.keys(autoCollectedEnvVars).length;
    const requiredCount = requiredEnvVars.length;
    const missingCount = requiredVarInfos.filter(
      (v) => v.status === "required_missing"
    ).length;
    const wrongValueCount = requiredVarInfos.filter(
      (v) => v.status === "required_wrong_value"
    ).length;
    const wrongTypeCount = requiredVarInfos.filter(
      (v) => v.status === "required_wrong_type"
    ).length;
    const presentRequiredCount = requiredVarInfos.filter(
      (v) => v.status === "required_present"
    ).length;
    const optionalCount = optionalVarInfos.length;

    return {
      requiredVars: requiredVarInfos,
      optionalVars: optionalVarInfos,
      stats: {
        totalCount,
        requiredCount,
        missingCount,
        wrongValueCount,
        wrongTypeCount,
        presentRequiredCount,
        optionalCount,
      },
    };
  }, [autoCollectedEnvVars, requiredEnvVars]);

  const toggleCardExpansion = useCallback((key: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const getSubtitle = () => {
    const {
      requiredCount,
      missingCount,
      wrongValueCount,
      wrongTypeCount,
      optionalCount,
    } = stats;
    const issueCount = missingCount + wrongValueCount + wrongTypeCount;

    if (requiredCount > 0) {
      if (issueCount > 0) {
        return `${issueCount}/${requiredCount} required issues • ${optionalCount} optional`;
      } else {
        return `${requiredCount}/${requiredCount} required valid • ${optionalCount} optional`;
      }
    } else {
      return `${optionalCount} variables found`;
    }
  };

  const getStatusConfig = (status: EnvVarInfo["status"]) => {
    switch (status) {
      case "required_present":
        return {
          icon: CheckCircle2,
          color: "#10B981",
          bgColor: "rgba(16, 185, 129, 0.1)",
          borderColor: "rgba(16, 185, 129, 0.2)",
          label: "REQUIRED",
          labelColor: "#10B981",
        };
      case "required_missing":
        return {
          icon: AlertCircle,
          color: "#EF4444",
          bgColor: "rgba(239, 68, 68, 0.1)",
          borderColor: "rgba(239, 68, 68, 0.3)",
          label: "MISSING",
          labelColor: "#EF4444",
        };
      case "required_wrong_value":
        return {
          icon: XCircle,
          color: "#F97316",
          bgColor: "rgba(249, 115, 22, 0.1)",
          borderColor: "rgba(249, 115, 22, 0.3)",
          label: "WRONG VALUE",
          labelColor: "#F97316",
        };
      case "required_wrong_type":
        return {
          icon: XCircle,
          color: "#0891B2",
          bgColor: "rgba(8, 145, 178, 0.1)",
          borderColor: "rgba(8, 145, 178, 0.3)",
          label: "WRONG TYPE",
          labelColor: "#0891B2",
        };
      case "optional_present":
        return {
          icon: Eye,
          color: "#8B5CF6",
          bgColor: "rgba(139, 92, 246, 0.1)",
          borderColor: "rgba(139, 92, 246, 0.2)",
          label: "OPTIONAL",
          labelColor: "#8B5CF6",
        };
    }
  };

  const formatValue = (value: unknown, isExpanded: boolean = false): string => {
    if (value === undefined || value === null) {
      return "undefined";
    }
    if (typeof value === "string") {
      if (isExpanded) return value;
      return value.length > 40 ? `${value.substring(0, 40)}...` : value;
    }
    const stringified = JSON.stringify(value, null, isExpanded ? 2 : 0);
    if (isExpanded) return stringified;
    return stringified.length > 40
      ? `${stringified.substring(0, 40)}...`
      : stringified;
  };

  const renderEnvVarCard = (envVar: EnvVarInfo) => {
    const config = getStatusConfig(envVar.status);
    const StatusIcon = config.icon;
    const isExpanded = expandedCards.has(envVar.key);
    const hasValue = envVar.value !== undefined && envVar.value !== null;
    const hasExpectedValue = envVar.expectedValue !== undefined;
    const hasExpectedType = envVar.expectedType !== undefined;

    return (
      <View
        key={envVar.key}
        style={[styles.envVarCard, { borderColor: config.borderColor }]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          style={styles.cardHeader}
          onPress={() => toggleCardExpansion(envVar.key)}
        >
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: config.bgColor },
              ]}
            >
              <StatusIcon size={14} color={config.color} />
            </View>
            <View style={styles.cardHeaderInfo}>
              <Text style={styles.envVarKey}>{envVar.key}</Text>
              <View style={styles.cardHeaderMeta}>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: config.bgColor },
                  ]}
                >
                  <Text
                    style={[styles.statusText, { color: config.labelColor }]}
                  >
                    {config.label}
                  </Text>
                </View>
                {hasValue && (
                  <View style={styles.valueBadge}>
                    <Text style={styles.valueText}>
                      {getEnvVarType(envVar.value)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <View style={styles.cardHeaderRight}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => toggleCardExpansion(envVar.key)}
            >
              <Eye size={12} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {isExpanded && hasValue && (
          <View style={styles.cardBody}>
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>Current Value:</Text>
              <View style={styles.valueBox}>
                <Text style={styles.valueContent} selectable>
                  {formatValue(envVar.value, true)}
                </Text>
              </View>
            </View>

            {hasExpectedValue && (
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Expected Value:</Text>
                <View style={styles.expectedValueBox}>
                  <Text style={styles.expectedValueContent} selectable>
                    {envVar.expectedValue}
                  </Text>
                </View>
              </View>
            )}

            {hasExpectedType && envVar.expectedType && (
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Expected Type:</Text>
                <View style={styles.expectedValueBox}>
                  <Text style={styles.expectedValueContent} selectable>
                    {envVar.expectedType.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.typeHelperText}>
                  Current type: {getEnvVarType(envVar.value)}
                </Text>
              </View>
            )}
          </View>
        )}

        {isExpanded && !hasValue && (
          <View style={styles.cardBody}>
            <View style={styles.emptyValueContainer}>
              <AlertCircle size={16} color="#F59E0B" />
              <Text style={styles.emptyValueText}>
                Variable not defined or empty
              </Text>
            </View>

            {hasExpectedValue && (
              <View style={styles.valueContainer}>
                <Text style={styles.valueLabel}>Expected Value:</Text>
                <View style={styles.expectedValueBox}>
                  <Text style={styles.expectedValueContent} selectable>
                    {envVar.expectedValue}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSection = (
    title: string,
    count: number,
    vars: EnvVarInfo[],
    emptyMessage: string
  ) => {
    if (vars.length === 0 && title === "Required Variables") {
      return (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionCount}>0</Text>
          </View>
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>{emptyMessage}</Text>
          </View>
        </View>
      );
    }

    if (vars.length === 0) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>{count}</Text>
        </View>
        <View style={styles.sectionContent}>{vars.map(renderEnvVarCard)}</View>
      </View>
    );
  };

  return (
    <ExpandableSection
      icon={Settings}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      title="Environment Variables"
      subtitle={getSubtitle()}
    >
      <View style={styles.container}>
        {/* Required Variables Section */}
        {renderSection(
          "Required Variables",
          stats.requiredCount,
          requiredVars,
          "No required variables specified"
        )}

        {/* Optional Variables Section */}
        {renderSection(
          "Available Variables",
          stats.optionalCount,
          optionalVars,
          "No additional variables found"
        )}

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
  sectionContainer: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCount: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionContent: {
    gap: 8,
  },
  emptySection: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
    alignItems: "center",
  },
  emptySectionText: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },
  envVarCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    minWidth: 0,
  },
  iconContainer: {
    padding: 6,
    borderRadius: 6,
    marginRight: 10,
  },
  cardHeaderInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  envVarKey: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 12,
  },
  cardHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  valueBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 3,
  },
  valueText: {
    fontSize: 8,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  cardHeaderRight: {
    marginLeft: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    gap: 12,
  },
  valueContainer: {
    gap: 6,
  },
  valueLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  valueContent: {
    color: "#E5E7EB",
    fontSize: 10,
    fontFamily: "monospace",
    lineHeight: 14,
  },
  expectedValueBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  expectedValueContent: {
    color: "#E5E7EB",
    fontSize: 10,
    fontFamily: "monospace",
    lineHeight: 14,
  },
  emptyValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.1)",
  },
  emptyValueText: {
    color: "#F59E0B",
    fontSize: 10,
    fontStyle: "italic",
  },
  helpText: {
    color: "#6B7280",
    fontSize: 9,
    textAlign: "center",
    paddingHorizontal: 4,
    marginTop: 4,
    lineHeight: 12,
  },
  typeHelperText: {
    color: "#9CA3AF",
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
  },
});
