import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import {
  getStorageType,
  getStorageTypeLabel,
  getStorageTypeHexColor,
  getCleanStorageKey,
} from "../_util/storageQueryUtils";

interface StorageQueryRowProps {
  query: Query<any, any, any, any>;
  isSelected: boolean;
  onSelect: (query: Query<any, any, any, any>) => void;
}

/**
 * Specialized query row for storage queries following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Single purpose component for storage query display
 * - Prefer Composition over Configuration: Specialized row without status complexity
 * - Extract Reusable Logic: Uses storage utility functions for consistent behavior
 */
const StorageQueryRow: React.FC<StorageQueryRowProps> = ({
  query,
  isSelected,
  onSelect,
}) => {
  const storageType = getStorageType(query.queryKey);
  const storageTypeLabel = storageType
    ? getStorageTypeLabel(storageType)
    : "Storage";
  const storageTypeColor = storageType
    ? getStorageTypeHexColor(storageType)
    : "#6B7280";
  const cleanKey = getCleanStorageKey(query.queryKey);

  return (
    <TouchableOpacity
      style={[styles.queryRow, isSelected && styles.selectedQueryRow]}
      onPress={() => onSelect(query)}
      activeOpacity={0.8}
      accessibilityLabel={`Storage key ${cleanKey}`}
      accessibilityState={{ selected: isSelected }}
    >
      {/* Storage indicator and content in one row */}
      <View style={styles.rowContent}>
        <View style={styles.storageSection}>
          <View
            style={[styles.storageDot, { backgroundColor: storageTypeColor }]}
          />
          <View style={styles.storageInfo}>
            <Text style={[styles.storageLabel, { color: storageTypeColor }]}>
              {storageTypeLabel}
            </Text>
            <Text style={styles.storageText}>Storage</Text>
          </View>
        </View>

        <View style={styles.keySection}>
          <Text style={styles.storageKey}>{cleanKey}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  queryRow: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 8,
    marginVertical: 3,
    padding: 12,
    transform: [{ scale: 1 }],
  },
  selectedQueryRow: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderColor: "rgba(14, 165, 233, 0.3)",
    transform: [{ scale: 1.01 }],
    shadowColor: "#0EA5E9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storageSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  storageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  storageInfo: {
    flex: 1,
  },
  storageLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  storageText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  keySection: {
    flex: 2,
    paddingHorizontal: 12,
  },
  storageKey: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 16,
  },
});

export default StorageQueryRow;
