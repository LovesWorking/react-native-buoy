import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  Settings,
  XCircle,
  Eye,
  Shield,
} from "lucide-react-native";
import { EnvVarStats } from "../types";

interface EnvVarStatsProps {
  stats: EnvVarStats;
}

// Variable type configurations matching your database stats design
const variableTypeData = [
  {
    key: "valid",
    label: "Valid Variables",
    description: "Correctly configured and accessible",
    icon: CheckCircle2,
    color: "#10B981",
    textColor: "#10B981",
    bgColor: "rgba(16, 185, 129, 0.1)",
  },
  {
    key: "missing",
    label: "Missing Variables",
    description: "Required but not defined",
    icon: AlertCircle,
    color: "#EF4444",
    textColor: "#EF4444",
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
  {
    key: "wrongValue",
    label: "Wrong Values",
    description: "Defined but incorrect value",
    icon: XCircle,
    color: "#F97316",
    textColor: "#F97316",
    bgColor: "rgba(249, 115, 22, 0.1)",
  },
  {
    key: "wrongType",
    label: "Wrong Types",
    description: "Value has incorrect data type",
    icon: XCircle,
    color: "#0891B2",
    textColor: "#0891B2",
    bgColor: "rgba(8, 145, 178, 0.1)",
  },
  {
    key: "optional",
    label: "Optional Variables",
    description: "Available but not required",
    icon: Eye,
    color: "#8B5CF6",
    textColor: "#8B5CF6",
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
];

export function EnvVarStatsSection({ stats }: EnvVarStatsProps) {
  const {
    totalCount,
    requiredCount,
    missingCount,
    wrongValueCount,
    wrongTypeCount,
    presentRequiredCount,
    optionalCount,
  } = stats;

  const totalIssues = missingCount + wrongValueCount + wrongTypeCount;
  const healthScore =
    requiredCount > 0
      ? Math.round((presentRequiredCount / requiredCount) * 100)
      : 100;

  // If no variables at all, show minimal stats
  if (totalCount === 0) {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Settings size={16} color="#0EA5E9" />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Environment Overview</Text>
            <Text style={styles.headerSubtitle}>
              No environment variables detected
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statsContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Settings size={16} color="#0EA5E9" />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Environment Overview</Text>
          <Text style={styles.headerSubtitle}>
            Configuration status and health
          </Text>
        </View>
      </View>

      {/* Overview Metrics */}
      <View style={styles.overviewSection}>
        {/* Health Score */}
        <View style={styles.metricItem}>
          <View style={styles.metricItemRow}>
            <View style={styles.metricItemLeft}>
              <View
                style={[
                  styles.metricIcon,
                  {
                    backgroundColor:
                      healthScore >= 80
                        ? "rgba(16, 185, 129, 0.1)"
                        : healthScore >= 60
                        ? "rgba(249, 115, 22, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                  },
                ]}
              >
                <Shield
                  size={14}
                  color={
                    healthScore >= 80
                      ? "#10B981"
                      : healthScore >= 60
                      ? "#F97316"
                      : "#EF4444"
                  }
                />
              </View>
              <View style={styles.metricItemInfo}>
                <Text style={styles.metricItemLabel}>Health Score</Text>
                <Text style={styles.metricItemDesc}>
                  Configuration compliance rating
                </Text>
              </View>
            </View>
            <View style={styles.metricItemRight}>
              <Text
                style={[
                  styles.metricCount,
                  {
                    color:
                      healthScore >= 80
                        ? "#10B981"
                        : healthScore >= 60
                        ? "#F97316"
                        : "#EF4444",
                  },
                ]}
              >
                {healthScore}%
              </Text>
            </View>
          </View>
        </View>

        {/* Total Variables */}
        <View style={styles.metricItem}>
          <View style={styles.metricItemRow}>
            <View style={styles.metricItemLeft}>
              <View
                style={[
                  styles.metricIcon,
                  { backgroundColor: "rgba(139, 92, 246, 0.1)" },
                ]}
              >
                <Settings size={14} color="#8B5CF6" />
              </View>
              <View style={styles.metricItemInfo}>
                <Text style={styles.metricItemLabel}>Total Variables</Text>
                <Text style={styles.metricItemDesc}>
                  All environment variables detected
                </Text>
              </View>
            </View>
            <View style={styles.metricItemRight}>
              <Text style={[styles.metricCount, { color: "#8B5CF6" }]}>
                {totalCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Required Variables */}
        {requiredCount > 0 && (
          <View style={styles.metricItem}>
            <View style={styles.metricItemRow}>
              <View style={styles.metricItemLeft}>
                <View
                  style={[
                    styles.metricIcon,
                    { backgroundColor: "rgba(8, 145, 178, 0.1)" },
                  ]}
                >
                  <AlertCircle size={14} color="#0891B2" />
                </View>
                <View style={styles.metricItemInfo}>
                  <Text style={styles.metricItemLabel}>Required Variables</Text>
                  <Text style={styles.metricItemDesc}>
                    Variables that must be configured
                  </Text>
                </View>
              </View>
              <View style={styles.metricItemRight}>
                <Text style={[styles.metricCount, { color: "#0891B2" }]}>
                  {requiredCount}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Critical Issues */}
        {requiredCount > 0 && (
          <View style={styles.metricItem}>
            <View style={styles.metricItemRow}>
              <View style={styles.metricItemLeft}>
                <View
                  style={[
                    styles.metricIcon,
                    {
                      backgroundColor:
                        totalIssues === 0
                          ? "rgba(16, 185, 129, 0.1)"
                          : "rgba(239, 68, 68, 0.1)",
                    },
                  ]}
                >
                  <XCircle
                    size={14}
                    color={totalIssues === 0 ? "#10B981" : "#EF4444"}
                  />
                </View>
                <View style={styles.metricItemInfo}>
                  <Text style={styles.metricItemLabel}>Critical Issues</Text>
                  <Text style={styles.metricItemDesc}>
                    Variables with configuration problems
                  </Text>
                </View>
              </View>
              <View style={styles.metricItemRight}>
                <Text
                  style={[
                    styles.metricCount,
                    { color: totalIssues === 0 ? "#10B981" : "#EF4444" },
                  ]}
                >
                  {totalIssues}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Variable Breakdown */}
      <View style={styles.breakdownSection}>
        <Text style={styles.sectionTitle}>VARIABLE BREAKDOWN</Text>
        <View style={styles.breakdownList}>
          {variableTypeData.map((item) => {
            let count = 0;
            let shouldShow = false;

            switch (item.key) {
              case "valid":
                count = presentRequiredCount;
                shouldShow = count > 0;
                break;
              case "missing":
                count = missingCount;
                shouldShow = count > 0;
                break;
              case "wrongValue":
                count = wrongValueCount;
                shouldShow = count > 0;
                break;
              case "wrongType":
                count = wrongTypeCount;
                shouldShow = count > 0;
                break;
              case "optional":
                count = optionalCount;
                shouldShow = count > 0;
                break;
            }

            if (!shouldShow) return null;

            const percentage =
              totalCount > 0 ? ((count / totalCount) * 100).toFixed(1) : "0";
            const IconComponent = item.icon;

            return (
              <View key={item.key} style={styles.breakdownItem}>
                <View style={styles.breakdownItemRow}>
                  <View style={styles.breakdownItemLeft}>
                    <View
                      style={[
                        styles.breakdownIcon,
                        { backgroundColor: item.bgColor },
                      ]}
                    >
                      <IconComponent size={14} color={item.color} />
                    </View>
                    <View style={styles.breakdownItemInfo}>
                      <Text style={styles.breakdownItemLabel}>
                        {item.label}
                      </Text>
                      <Text style={styles.breakdownItemDesc}>
                        {item.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.breakdownItemRight}>
                    <Text
                      style={[styles.breakdownCount, { color: item.textColor }]}
                    >
                      {count}
                    </Text>
                    <Text style={styles.breakdownPercentage}>
                      {percentage}%
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsContainer: {
    marginBottom: 24,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },

  // Header section
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  headerIcon: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    padding: 8,
    borderRadius: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  headerSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },

  // Overview metrics section
  overviewSection: {
    gap: 12,
    marginBottom: 24,
  },
  metricItem: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  metricItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  metricIcon: {
    padding: 8,
    borderRadius: 8,
  },
  metricItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  metricItemLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  metricItemDesc: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  metricItemRight: {
    alignItems: "flex-end",
  },
  metricCount: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Section titles
  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Breakdown section
  breakdownSection: {
    gap: 12,
  },
  breakdownList: {
    gap: 12,
  },
  breakdownItem: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  breakdownItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  breakdownIcon: {
    padding: 8,
    borderRadius: 8,
  },
  breakdownItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  breakdownItemLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  breakdownItemDesc: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  breakdownItemRight: {
    alignItems: "flex-end",
  },
  breakdownCount: {
    fontSize: 16,
    fontWeight: "600",
  },
  breakdownPercentage: {
    color: "#6B7280",
    fontSize: 10,
  },
});
