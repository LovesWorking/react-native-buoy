import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  XCircle,
  HardDrive,
  Database,
  Shield,
} from "lucide-react-native";
import { StorageKeyInfo } from "../types";
import {
  getStorageTypeLabel,
  getStorageTypeHexColor,
} from "../../react-query/utils/storageQueryUtils";
import { getEnvVarType } from "../../env/utils/envTypeDetector";
import { DataViewer } from "../../react-query/components/shared/DataViewer";

// Stable constants moved to module scope to prevent re-renders [[memory:4875251]]
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

interface StorageKeyCardProps {
  storageKey: StorageKeyInfo;
  isExpanded: boolean;
  onToggle: () => void;
}

const getStatusConfig = (status: StorageKeyInfo["status"]) => {
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

const getStorageIcon = (storageType: StorageKeyInfo["storageType"]) => {
  switch (storageType) {
    case "mmkv":
      return HardDrive;
    case "async":
      return Database;
    case "secure":
      return Shield;
    default:
      return Database; // Default fallback
  }
};

/**
 * Storage key card component following composition principles [[rule3]]
 *
 * Applied principles:
 * - Decompose by Responsibility: Single purpose component for storage key display
 * - Prefer Composition over Configuration: Reuses existing patterns from EnvVarCard
 * - Extract Reusable Logic: Shares formatValue and status config patterns
 */
export function StorageKeyCard({
  storageKey,
  isExpanded,
  onToggle,
}: StorageKeyCardProps) {
  const config = getStatusConfig(storageKey.status);
  const StatusIcon = config.icon;
  const StorageIcon = getStorageIcon(storageKey.storageType);
  const hasValue = storageKey.value !== undefined && storageKey.value !== null;
  const hasExpectedValue = storageKey.expectedValue !== undefined;
  const hasExpectedType = storageKey.expectedType !== undefined;
  const storageTypeColor = getStorageTypeHexColor(storageKey.storageType);
  const storageTypeLabel = getStorageTypeLabel(storageKey.storageType);

  return (
    <View style={[styles.storageKeyCard, { borderColor: config.borderColor }]}>
      <TouchableOpacity
        accessibilityLabel="Storage key card"
        accessibilityHint="View storage key card"
        sentry-label={`ignore storage key card ${storageKey.key}`}
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
            <Text style={styles.storageKeyText}>{storageKey.key}</Text>
            {storageKey.description && (
              <Text style={styles.descriptionText}>
                {storageKey.description}
              </Text>
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
              <View
                style={[
                  styles.storageBadge,
                  { backgroundColor: `${storageTypeColor}15` },
                ]}
              >
                <StorageIcon size={10} color={storageTypeColor} />
                <Text style={[styles.storageText, { color: storageTypeColor }]}>
                  {storageTypeLabel}
                </Text>
              </View>
              {hasValue && (
                <View style={styles.valueBadge}>
                  <Text style={styles.valueText}>
                    {getEnvVarType(storageKey.value)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={styles.cardHeaderRight}>
          <TouchableOpacity
            accessibilityLabel="Expand"
            accessibilityHint="Expand storage key card"
            sentry-label={`ignore storage key card ${storageKey.key} expand`}
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
          <View style={styles.dataViewerContainer}>
            {/* Show simple values directly for better visibility */}
            {typeof storageKey.value === "string" ||
            typeof storageKey.value === "number" ||
            typeof storageKey.value === "boolean" ? (
              <View style={styles.simpleValueContainer}>
                <Text style={styles.simpleValueLabel}>Current Value:</Text>
                <View style={styles.simpleValueBox}>
                  <Text style={styles.simpleValueContent} selectable>
                    {String(storageKey.value)}
                  </Text>
                </View>
                <Text style={styles.valueTypeText}>
                  Type: {getEnvVarType(storageKey.value)}
                </Text>
              </View>
            ) : (
              <DataViewer
                title="Current Value"
                data={storageKey.value}
                showTypeFilter={false}
                rawMode={true}
              />
            )}
          </View>

          {hasExpectedValue && (
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>Expected Value:</Text>
              <View style={styles.expectedValueBox}>
                <Text style={styles.expectedValueContent} selectable>
                  {storageKey.expectedValue}
                </Text>
              </View>
            </View>
          )}

          {hasExpectedType && storageKey.expectedType && (
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>Expected Type:</Text>
              <View style={styles.expectedValueBox}>
                <Text style={styles.expectedValueContent} selectable>
                  {storageKey.expectedType.toUpperCase()}
                </Text>
              </View>
              <Text style={styles.typeHelperText}>
                Current type: {getEnvVarType(storageKey.value)}
              </Text>
            </View>
          )}

          {storageKey.lastUpdated && (
            <View style={styles.metaInfo}>
              <Text style={styles.metaLabel}>
                Last updated123: {storageKey.lastUpdated.toLocaleString()}
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
              Storage key not found or empty
            </Text>
          </View>

          {hasExpectedValue && (
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>Expected Value:</Text>
              <View style={styles.expectedValueBox}>
                <Text style={styles.expectedValueContent} selectable>
                  {storageKey.expectedValue}
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
  storageKeyCard: {
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
  storageKeyText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 12,
    flexWrap: "wrap",
    flex: 1,
  },
  descriptionText: {
    color: "#9CA3AF",
    fontSize: 10,
    marginTop: 2,
    flexWrap: "wrap",
  },
  cardHeaderMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
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
  storageBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storageText: {
    fontSize: 9,
    fontWeight: "600",
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
  dataViewerContainer: {
    marginTop: 8,
  },
  simpleValueContainer: {
    gap: 8,
  },
  simpleValueLabel: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  simpleValueBox: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  simpleValueContent: {
    color: "#10B981",
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  valueTypeText: {
    color: "#6B7280",
    fontSize: 9,
    fontStyle: "italic",
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
  metaInfo: {
    marginTop: 8,
  },
  metaLabel: {
    color: "#6B7280",
    fontSize: 9,
    fontStyle: "italic",
  },
});
