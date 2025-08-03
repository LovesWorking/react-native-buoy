import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import StorageBrowser from "../../../devtools/StorageBrowser";
import { StorageType } from "../../../_util/storageQueryUtils";
import useStorageQueries from "../../../_hooks/useStorageQueries";
import { useStorageQueryCounts } from "../../../_hooks/useStorageQueryCounts";

interface StorageBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  activeStorageTypes: Set<StorageType>;
  onCountsChange?: (counts: any) => void; // To pass counts up to parent
}

/**
 * Storage browser mode component following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Single purpose component for displaying storage queries
 * - Prefer Composition over Configuration: Reuses QueryBrowser with storage-specific props
 * - Extract Reusable Logic: Uses existing QueryBrowser component for consistency
 */
export function StorageBrowserMode({
  selectedQuery,
  onQuerySelect,
  activeStorageTypes,
  onCountsChange,
}: StorageBrowserModeProps) {
  // Use the dedicated storage queries hook with filtering [[memory:4875251]]
  const storageQueries = useStorageQueries(activeStorageTypes);

  // Get stable storage counts using dedicated hook [[rule3]]
  const storageCounts = useStorageQueryCounts();

  // Pass counts to parent with stable reference - only when counts actually change
  useEffect(() => {
    if (onCountsChange) {
      onCountsChange(storageCounts);
    }
  }, [storageCounts, onCountsChange]);

  return (
    <View style={styles.queryListContainer}>
      <StorageBrowser
        queries={storageQueries}
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
        emptyStateMessage="No storage queries are currently active.

To see storage queries here:
• Use storage hooks with #storage query keys
• Ensure MMKV, AsyncStorage, or SecureStorage queries are active
• Check that storage types are enabled in filters"
        contentContainerStyle={styles.queryListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Query list matching main dev tools exactly
  queryListContainer: {
    flex: 1,
    backgroundColor: "#171717", // Match container background to content background
  },
  queryListContent: {
    padding: 8, // Reduced to match main dev tools
    backgroundColor: "#171717",
    flexGrow: 1,
  },
});
