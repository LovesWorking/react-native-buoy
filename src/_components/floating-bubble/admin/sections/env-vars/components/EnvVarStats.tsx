import { StyleSheet, View, Text } from "react-native";
import { AlertCircle, CheckCircle2, Eye, XCircle } from "lucide-react-native";
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
    missingCount,
    wrongValueCount,
    wrongTypeCount,
    presentRequiredCount,
    optionalCount,
  } = stats;

  // If no variables at all, show minimal stats
  if (totalCount === 0) {
    return (
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>VARIABLE BREAKDOWN</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No environment variables detected
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.statsContainer}>
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

  // Empty state
  emptyState: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
    alignItems: "center",
  },
  emptyStateText: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },
});
