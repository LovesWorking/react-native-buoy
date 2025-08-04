import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AlertCircle, CheckCircle2, Eye, XCircle } from "lucide-react-native";
import { EnvVarInfo } from "../types";
import { getEnvVarType } from "../envTypeDetector";

// Stable constants moved to module scope to prevent re-renders
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

interface EnvVarCardProps {
  envVar: EnvVarInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

const getStatusConfig = (status: EnvVarInfo["status"]) => {
  switch (status) {
    case "required_present":
      return {
        icon: CheckCircle2,
        color: "#10B981",
        bgColor: "rgba(16, 185, 129, 0.1)",
        borderColor: "rgba(16, 185, 129, 0.2)",
        label: "✓ VALID",
        labelColor: "#10B981",
      };
    case "required_missing":
      return {
        icon: AlertCircle,
        color: "#EF4444",
        bgColor: "rgba(239, 68, 68, 0.1)",
        borderColor: "rgba(239, 68, 68, 0.3)",
        label: "⚠ MISSING",
        labelColor: "#EF4444",
      };
    case "required_wrong_value":
      return {
        icon: XCircle,
        color: "#F97316",
        bgColor: "rgba(249, 115, 22, 0.1)",
        borderColor: "rgba(249, 115, 22, 0.3)",
        label: "⚠ WRONG VALUE",
        labelColor: "#F97316",
      };
    case "required_wrong_type":
      return {
        icon: XCircle,
        color: "#0891B2",
        bgColor: "rgba(8, 145, 178, 0.1)",
        borderColor: "rgba(8, 145, 178, 0.3)",
        label: "⚠ WRONG TYPE",
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

export function EnvVarCard({ envVar, isExpanded, onToggle }: EnvVarCardProps) {
  const config = getStatusConfig(envVar.status);
  const StatusIcon = config.icon;
  const hasValue = envVar.value !== undefined && envVar.value !== null;
  const hasExpectedValue = envVar.expectedValue !== undefined;
  const hasExpectedType = envVar.expectedType !== undefined;
  const hasDescription = envVar.description !== undefined;

  return (
    <View style={[styles.envVarCard, { borderColor: config.borderColor }]}>
      <TouchableOpacity
        accessibilityLabel="Env var card"
        accessibilityHint="View env var card"
        sentry-label={`ignore env var card ${envVar.key}`}
        accessibilityRole="button"
        style={styles.cardHeader}
        onPress={onToggle}
      >
        <View style={styles.cardHeaderLeft}>
          <View
            style={[styles.iconContainer, { backgroundColor: config.bgColor }]}
          >
            <StatusIcon size={14} color={config.color} />
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.envVarKey}>{envVar.key}</Text>
            {hasDescription && (
              <Text style={styles.envVarDescription}>{envVar.description}</Text>
            )}
            <View style={styles.cardHeaderMeta}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: config.bgColor },
                ]}
              >
                <Text style={[styles.statusText, { color: config.labelColor }]}>
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
            accessibilityLabel="Expand"
            accessibilityHint="Expand env var card"
            sentry-label={`ignore env var card ${envVar.key} expand`}
            accessibilityRole="button"
            style={styles.actionButton}
            onPress={onToggle}
            hitSlop={HIT_SLOP}
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
}

const styles = StyleSheet.create({
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
  envVarDescription: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
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
  typeHelperText: {
    color: "#9CA3AF",
    fontSize: 9,
    marginTop: 4,
    textAlign: "center",
  },
});
