import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState, useCallback } from "react";
import { StorageKeyInfo } from "../types";
import { clearAllStorageIncludingDevTools } from "../utils/clearAllStorage";
import { RefreshCw, Trash2, CopyButton } from "@react-buoy/shared-ui";

interface StorageActionsProps {
  storageKeys: StorageKeyInfo[];
  onClearAll: () => Promise<void>;
  onRefresh: () => Promise<void>;
  totalCount: number;
}

export function StorageActions({
  storageKeys,
  onClearAll,
  onRefresh,
  totalCount,
}: StorageActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [onRefresh]);


  const handleClear = () => {
    Alert.alert("Clear Storage", "Choose what to clear:", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Clear App Data",
        onPress: handleClearAppData,
      },
      {
        text: "Clear Everything",
        style: "destructive",
        onPress: handleClearEverything,
      },
    ]);
  };

  const handleClearAppData = async () => {
    try {
      await onClearAll();
      await onRefresh(); // Auto-refresh after clearing
    } catch (error) {
      Alert.alert("Error", `Failed to clear storage: ${error}`);
    }
  };

  const handleClearEverything = async () => {
    // Clear everything directly without extra confirmation
    try {
      await clearAllStorageIncludingDevTools();
      await onRefresh(); // Auto-refresh after clearing

      // Show success message briefly
      Alert.alert(
        "Success",
        "All storage cleared including dev tools settings.",
        [{ text: "OK" }],
        { cancelable: true }
      );
    } catch (error) {
      Alert.alert("Error", `Failed to clear all storage: ${error}`);
    }
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <Text style={styles.keyCount}>
          {totalCount} {totalCount === 1 ? "key" : "keys"} found
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          sentry-label="ignore storage refresh button"
          onPress={handleRefresh}
          style={[styles.iconButton, isRefreshing && styles.activeButton]}
          accessibilityLabel="Refresh storage"
        >
          <RefreshCw size={16} color={isRefreshing ? "#10B981" : "#9CA3AF"} />
        </TouchableOpacity>

        <CopyButton
          value={storageKeys}
          size={16}
          buttonStyle={styles.iconButton}
          colors={{
            idle: "#3B82F6",
            success: "#10B981",
            error: "#F87171",
          }}
        />

        <TouchableOpacity
          sentry-label="ignore storage clear button"
          onPress={handleClear}
          style={styles.iconButton}
          accessibilityLabel="Clear storage"
        >
          <Trash2 size={16} color="#F87171" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header styles matching Sentry pattern
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  keyCount: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  copiedBadge: {
    backgroundColor: "#10B981",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  copiedText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  activeButton: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
});
