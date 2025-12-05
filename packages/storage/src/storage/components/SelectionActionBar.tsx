import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Trash2, CopyButton, CheckSquare } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";
import { StorageKeyInfo } from "../types";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SelectionActionBarProps {
  /** Selected storage keys */
  selectedKeys: StorageKeyInfo[];
  /** MMKV instances for deletion */
  mmkvInstances: Array<{ id: string; instance: any }>;
  /** Callback when deletion is complete */
  onDeleteComplete?: () => void;
  /** Callback to select all visible keys */
  onSelectAll?: () => void;
  /** Callback to clear selection */
  onClearSelection?: () => void;
  /** Total number of visible keys */
  totalVisibleKeys: number;
}

export function SelectionActionBar({
  selectedKeys,
  mmkvInstances,
  onDeleteComplete,
  onSelectAll,
  onClearSelection,
  totalVisibleKeys,
}: SelectionActionBarProps) {
  const selectedCount = selectedKeys.length;
  const allSelected = selectedCount === totalVisibleKeys && totalVisibleKeys > 0;

  // Generate copy data for selected keys
  const getCopyData = () => {
    const data: Record<string, any> = {};
    selectedKeys.forEach((key) => {
      const prefix = key.instanceId
        ? `[${key.storageType}:${key.instanceId}]`
        : `[${key.storageType}]`;
      data[`${prefix} ${key.key}`] = key.value;
    });
    return {
      selectedCount,
      keys: data,
      timestamp: new Date().toISOString(),
    };
  };

  // Handle delete selected keys
  const handleDeleteSelected = () => {
    if (selectedCount === 0) return;

    Alert.alert(
      "Delete Selected Keys",
      `Delete ${selectedCount} selected key${selectedCount > 1 ? "s" : ""}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Group keys by storage type
              const asyncKeys = selectedKeys.filter((k) => k.storageType === "async");
              const mmkvKeys = selectedKeys.filter((k) => k.storageType === "mmkv");

              // Delete AsyncStorage keys
              if (asyncKeys.length > 0) {
                await AsyncStorage.multiRemove(asyncKeys.map((k) => k.key));
              }

              // Delete MMKV keys
              if (mmkvKeys.length > 0) {
                // Group by instance
                const byInstance: Record<string, string[]> = {};
                mmkvKeys.forEach((k) => {
                  const instanceId = k.instanceId || "default";
                  if (!byInstance[instanceId]) byInstance[instanceId] = [];
                  byInstance[instanceId].push(k.key);
                });

                // Delete from each instance
                Object.entries(byInstance).forEach(([instanceId, keys]) => {
                  const inst = mmkvInstances.find((i) => i.id === instanceId);
                  if (inst) {
                    keys.forEach((key) => inst.instance.delete(key));
                  }
                });
              }

              onDeleteComplete?.();
            } catch (error) {
              Alert.alert("Error", `Failed to delete keys: ${error}`);
            }
          },
        },
      ]
    );
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity
          style={styles.selectAllButton}
          onPress={allSelected ? onClearSelection : onSelectAll}
        >
          <CheckSquare
            size={14}
            color={allSelected ? macOSColors.semantic.info : macOSColors.text.secondary}
          />
          <Text style={styles.selectAllText}>
            {allSelected ? "Deselect All" : "Select All"}
          </Text>
        </TouchableOpacity>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{selectedCount} selected</Text>
        </View>
      </View>

      <View style={styles.actionsSection}>
        {/* Copy Selected Button */}
        <CopyButton
          value={getCopyData()}
          size={14}
          buttonStyle={styles.actionButton}
          colors={{
            idle: macOSColors.semantic.info,
            success: macOSColors.semantic.success,
            error: macOSColors.semantic.error,
          }}
        />

        {/* Delete Selected Button */}
        <TouchableOpacity style={styles.actionButton} onPress={handleDeleteSelected}>
          <Trash2 size={14} color={macOSColors.semantic.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.semantic.info + "15",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "30",
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  selectAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  selectAllText: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.secondary,
  },
  countBadge: {
    backgroundColor: macOSColors.semantic.info + "20",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: "700",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
  },
  actionsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
});
