import { View, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Trash2, CopyButton } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface StorageActionButtonsProps {
  /** Value to copy to clipboard */
  copyValue: unknown;
  /** @deprecated Use copyValue instead */
  onCopy?: () => void;
  mmkvInstances?: Array<{ id: string; instance: any }>;
  activeStorageType?: "all" | "async" | "mmkv" | "secure";
  onClearComplete?: () => void;
}

export function StorageActionButtons({
  copyValue,
  mmkvInstances = [],
  activeStorageType = "all",
  onClearComplete,
}: StorageActionButtonsProps) {

  const handleClearAsyncStorage = () => {
    Alert.alert(
      "Clear AsyncStorage",
      "Delete all AsyncStorage keys? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              onClearComplete?.();
            } catch (error) {
              Alert.alert("Error", `Failed: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleClearMMKV = (instanceId: string, instanceName: string) => {
    Alert.alert(
      `Clear ${instanceName}`,
      `Delete all keys from ${instanceName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            try {
              const inst = mmkvInstances.find((i) => i.id === instanceId);
              if (inst) {
                inst.instance.clearAll();
                onClearComplete?.();
              }
            } catch (error) {
              Alert.alert("Error", `Failed: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleClearAllMMKV = () => {
    Alert.alert(
      "Clear All MMKV",
      `Delete all keys from ${mmkvInstances.length} instances? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: () => {
            try {
              mmkvInstances.forEach((inst) => inst.instance.clearAll());
              onClearComplete?.();
            } catch (error) {
              Alert.alert("Error", `Failed: ${error}`);
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      "Clear All Storage",
      "Delete all storage data? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              mmkvInstances.forEach((inst) => inst.instance.clearAll());
              onClearComplete?.();
            } catch (error) {
              Alert.alert("Error", `Failed: ${error}`);
            }
          },
        },
      ]
    );
  };

  const showAsyncActions = activeStorageType === "all" || activeStorageType === "async";
  const showMMKVActions = activeStorageType === "all" || activeStorageType === "mmkv";

  // Determine which clear actions to show based on active filter
  const showClearAll = activeStorageType === "all";
  const showClearAsync = showAsyncActions && !showClearAll;
  const showClearMMKVIndividual = showMMKVActions && !showClearAll;
  const showClearAllMMKV = showMMKVActions && mmkvInstances.length > 1 && !showClearAll;

  return (
    <View style={styles.container}>
      {/* Copy Button - Uses shared CopyButton for consistent hint behavior */}
      <CopyButton
        value={copyValue}
        size={16}
        buttonStyle={styles.actionButton}
        colors={{
          idle: macOSColors.text.secondary,
          success: macOSColors.semantic.success,
          error: macOSColors.semantic.error,
        }}
      />

      {/* Clear All - Only show when viewing "all" storage types */}
      {showClearAll && (
        <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
          <Trash2 size={16} color={macOSColors.semantic.error} />
        </TouchableOpacity>
      )}

      {/* Clear AsyncStorage - Only show when filtered to async */}
      {showClearAsync && (
        <TouchableOpacity onPress={handleClearAsyncStorage} style={styles.actionButton}>
          <Trash2 size={16} color={macOSColors.semantic.error} />
        </TouchableOpacity>
      )}

      {/* Clear All MMKV - Only show when filtered to mmkv and multiple instances */}
      {showClearAllMMKV && (
        <TouchableOpacity onPress={handleClearAllMMKV} style={styles.actionButton}>
          <Trash2 size={16} color={macOSColors.semantic.error} />
        </TouchableOpacity>
      )}

      {/* Clear Individual MMKV - Only show when filtered to mmkv and single instance */}
      {showClearMMKVIndividual && mmkvInstances.length === 1 && (
        <TouchableOpacity
          onPress={() => handleClearMMKV(mmkvInstances[0].id, mmkvInstances[0].id)}
          style={styles.actionButton}
        >
          <Trash2 size={16} color={macOSColors.semantic.error} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    backgroundColor: macOSColors.background.input,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
});
