import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StorageStatusCount from "../../../devtools/StorageStatusCount";
import { StorageType } from "../../../_util/storageQueryUtils";
import { StorageTypeCounts } from "../../../_util/getStorageQueryCounts";

interface StorageBrowserFooterProps {
  activeStorageTypes?: Set<StorageType>;
  onStorageTypesChange?: (storageTypes: Set<StorageType>) => void;
  isFloatingMode?: boolean; // To determine if modal is floating or docked
  counts?: StorageTypeCounts; // Storage counts to display
}

/**
 * Footer component for StorageBrowserModal following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Dedicated footer component for storage type controls
 * - Prefer Composition over Configuration: Specialized footer matching DataEditorMode pattern
 * - Extract Reusable Logic: Consistent footer styling across modal types
 */
export function StorageBrowserFooter({
  activeStorageTypes,
  onStorageTypesChange,
  isFloatingMode = true, // Default to floating mode if not specified
  counts,
}: StorageBrowserFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.filterFooter,
        { paddingBottom: insets.bottom + 8 },
        // Remove border radius when docked to bottom
        !isFloatingMode && styles.dockedFooter,
      ]}
    >
      <View style={styles.filterContainer}>
        <StorageStatusCount
          activeStorageTypes={activeStorageTypes}
          onStorageTypesChange={onStorageTypesChange}
          counts={counts}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Footer matching DataEditorMode action footer exactly
  filterFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)", // Match DevToolsHeader border
    paddingVertical: 8,
    paddingHorizontal: 0, // Remove horizontal padding to maximize space
    backgroundColor: "#171717", // Match main dev tools primary background
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  dockedFooter: {
    borderBottomLeftRadius: 0, // Remove border radius when docked
    borderBottomRightRadius: 0,
  },
  filterContainer: {
    minHeight: 32, // Consistent with StorageStatusCount
    justifyContent: "center",
  },
});
