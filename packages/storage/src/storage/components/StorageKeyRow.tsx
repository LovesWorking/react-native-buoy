import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { StorageKeyInfo } from "../types";
import { macOSColors, CompactRow, TypeBadge, HardDrive, Square, CheckSquare } from "@react-buoy/shared-ui";
import { getStorageTypeLabel } from "../utils/storageQueryUtils";
import { getValueTypeLabel } from "../utils/valueType";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";

// MMKV Instance color palette - consistent colors per instance
const INSTANCE_COLORS = [
  macOSColors.semantic.info,     // Blue
  macOSColors.semantic.success,  // Green
  macOSColors.semantic.warning,  // Orange
  macOSColors.semantic.debug,    // Purple
  '#FF6B9D',                      // Pink
  '#00D9FF',                      // Cyan
];

/**
 * Get consistent color for an MMKV instance based on its ID
 * Uses simple hash to ensure same instance always gets same color
 */
function getInstanceColor(instanceId: string): string {
  const hash = instanceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return INSTANCE_COLORS[hash % INSTANCE_COLORS.length];
}

interface StorageKeyRowProps {
  storageKey: StorageKeyInfo;
  isExpanded?: boolean;
  onPress?: (storageKey: StorageKeyInfo) => void;
  /** Whether selection mode is active */
  isSelectMode?: boolean;
  /** Whether this item is selected */
  isSelected?: boolean;
  /** Callback when selection changes */
  onSelectionChange?: (storageKey: StorageKeyInfo, selected: boolean) => void;
}

const getStatusConfig = (status: StorageKeyInfo["status"]) => {
  switch (status) {
    case "required_present":
      return {
        label: "Valid",
        color: macOSColors.semantic.success,
        sublabel: "Required",
      };
    case "required_missing":
      return {
        label: "Missing",
        color: macOSColors.semantic.error,
        sublabel: "Required",
      };
    case "required_wrong_value":
      return {
        label: "Wrong",
        color: macOSColors.semantic.warning,
        sublabel: "Invalid value",
      };
    case "required_wrong_type":
      return {
        label: "Type Error",
        color: macOSColors.semantic.info,
        sublabel: "Wrong type",
      };
    case "optional_present":
      return {
        label: "Set",
        color: macOSColors.semantic.debug,
        sublabel: "Optional",
      };
  }
};

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "undefined";
  }
  const str = typeof value === "string" ? value : JSON.stringify(value);
  return str;
};

export function StorageKeyRow({
  storageKey,
  isExpanded,
  onPress,
  isSelectMode = false,
  isSelected = false,
  onSelectionChange,
}: StorageKeyRowProps) {
  const config = getStatusConfig(storageKey.status);
  const hasValue = storageKey.value !== undefined && storageKey.value !== null;

  // Format primary text - show the key
  const primaryText = storageKey.key;

  // Show storage type as secondary text
  const storageTypeLabel = getStorageTypeLabel(storageKey.storageType);

  // Check if value is JSON object/array for DataViewer
  const isJsonData =
    storageKey.value &&
    (typeof storageKey.value === "object" ||
      (typeof storageKey.value === "string" &&
        (storageKey.value.startsWith("{") ||
          storageKey.value.startsWith("["))));

  // Parse JSON string if needed
  let parsedValue = storageKey.value;
  if (typeof storageKey.value === "string" && isJsonData) {
    try {
      parsedValue = JSON.parse(storageKey.value);
    } catch {
      // Keep original if parse fails
    }
  }

  // Create expanded content for value and storage details
  const expandedContent = (
    <View style={styles.expandedContainer}>
      <View style={styles.expandedRow}>
        <Text style={styles.expandedLabel}>Storage:</Text>
        <View
          style={[
            styles.storageBadge,
            {
              backgroundColor:
                getStorageTypeColor(storageKey.storageType) + "12",
              borderColor: getStorageTypeColor(storageKey.storageType) + "25",
            },
          ]}
        >
          <Text
            style={[
              styles.storageBadgeText,
              { color: getStorageTypeColor(storageKey.storageType) },
            ]}
          >
            {storageTypeLabel}
          </Text>
        </View>
      </View>

      {/* MMKV Instance Badge - Color-coded */}
      {storageKey.storageType === 'mmkv' && storageKey.instanceId && (
        <View style={styles.expandedRow}>
          <Text style={styles.expandedLabel}>Instance:</Text>
          <View
            style={[
              styles.instanceBadge,
              {
                backgroundColor: getInstanceColor(storageKey.instanceId) + '20',
                borderColor: getInstanceColor(storageKey.instanceId) + '40',
              }
            ]}
          >
            <HardDrive
              size={9}
              color={getInstanceColor(storageKey.instanceId)}
            />
            <Text
              style={[
                styles.instanceText,
                { color: getInstanceColor(storageKey.instanceId) }
              ]}
            >
              {storageKey.instanceId}
            </Text>
          </View>
        </View>
      )}

      {/* Use DataViewer for JSON data, otherwise show as text */}
      {isJsonData && typeof parsedValue === "object" ? (
        <View style={styles.dataViewerContainer}>
          <DataViewer data={parsedValue} title="Value" />
        </View>
      ) : (
        <View style={styles.expandedRow}>
          <Text style={styles.expandedLabel}>Value:</Text>
          <Text style={styles.expandedValue} numberOfLines={3}>
            {formatValue(storageKey.value) || "undefined"}
          </Text>
        </View>
      )}

      {storageKey.status === "required_wrong_type" &&
        storageKey.expectedType && (
          <>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Type:</Text>
              <TypeBadge type={getValueTypeLabel(storageKey.value)} />
            </View>
            <View style={styles.expandedRow}>
              <Text style={styles.expandedLabel}>Expected:</Text>
              <TypeBadge type={storageKey.expectedType} />
            </View>
          </>
        )}
      {storageKey.status === "required_wrong_value" &&
        storageKey.expectedValue && (
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Expected:</Text>
            <Text style={styles.expandedExpected}>
              {String(storageKey.expectedValue)}
            </Text>
          </View>
        )}
      {storageKey.description && (
        <View style={styles.expandedRow}>
          <Text style={styles.expandedLabel}>Info:</Text>
          <Text style={styles.expandedDescription}>
            {storageKey.description}
          </Text>
        </View>
      )}
    </View>
  );

  // Create storage type badge
  const storageBadge = (
    <View
      style={[
        styles.storageBadge,
        {
          backgroundColor: getStorageTypeColor(storageKey.storageType) + "12",
          borderColor: getStorageTypeColor(storageKey.storageType) + "25",
        },
      ]}
    >
      <Text
        style={[
          styles.storageBadgeText,
          { color: getStorageTypeColor(storageKey.storageType) },
        ]}
      >
        {storageTypeLabel}
      </Text>
    </View>
  );

  // Handle checkbox press in select mode
  const handleCheckboxPress = () => {
    onSelectionChange?.(storageKey, !isSelected);
  };

  // Create checkbox element for select mode
  const selectionCheckbox = isSelectMode ? (
    <TouchableOpacity
      onPress={handleCheckboxPress}
      style={styles.checkboxContainer}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      {isSelected ? (
        <CheckSquare size={18} color={macOSColors.semantic.info} />
      ) : (
        <Square size={18} color={macOSColors.text.muted} />
      )}
    </TouchableOpacity>
  ) : null;

  return (
    <View style={[styles.rowContainer, isSelected && styles.rowContainerSelected]}>
      {selectionCheckbox}
      <View style={styles.compactRowWrapper}>
        <CompactRow
          statusDotColor={config.color}
          statusLabel={config.label}
          statusSublabel={config.sublabel}
          primaryText={primaryText}
          secondaryText={hasValue ? getValueTypeLabel(storageKey.value) : undefined}
          expandedContent={expandedContent}
          isExpanded={isExpanded}
          expandedGlowColor={config.color}
          customBadge={storageBadge}
          showChevron={!isSelectMode}
          onPress={isSelectMode ? handleCheckboxPress : (onPress ? () => onPress(storageKey) : undefined)}
        />
      </View>
    </View>
  );
}

const getStorageTypeColor = (storageType: StorageKeyInfo["storageType"]) => {
  switch (storageType) {
    case "mmkv":
      return macOSColors.semantic.info;
    case "async":
      return macOSColors.semantic.warning;
    case "secure":
      return macOSColors.semantic.success;
    default:
      return macOSColors.text.secondary;
  }
};

const styles = StyleSheet.create({
  expandedContainer: {
    gap: 8,
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expandedLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "600",
    minWidth: 70,
    fontFamily: "monospace",
  },
  expandedValue: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    flex: 1,
  },
  expandedExpected: {
    fontSize: 11,
    color: macOSColors.semantic.warning,
    fontFamily: "monospace",
    flex: 1,
  },
  expandedDescription: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    flex: 1,
  },
  dataViewerContainer: {
    marginTop: 6,
    marginBottom: 6,
    backgroundColor: macOSColors.background.base,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 6,
  },
  storageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  storageBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  instanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  instanceText: {
    fontSize: 10,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rowContainerSelected: {
    backgroundColor: macOSColors.semantic.info + "08",
    borderRadius: 8,
  },
  checkboxContainer: {
    paddingLeft: 4,
    paddingRight: 8,
    paddingTop: 10,
    alignSelf: "flex-start",
  },
  compactRowWrapper: {
    flex: 1,
  },
});
