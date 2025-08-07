import { useMemo, useCallback } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Query, useQueryClient } from "@tanstack/react-query";
import {
  StorageType,
  getCleanStorageKey,
  getStorageType,
  isStorageQuery,
} from "../../react-query/utils/storageQueryUtils";
import { StorageKeyStatsSection } from "./StorageKeyStats";
import { StorageKeySection } from "./StorageKeySection";
import { StorageActions } from "./StorageActions";
import { StorageKeyInfo, RequiredStorageKey, StorageKeyStats } from "../types";
import { isDevToolsStorageKey } from "../../../_shared/storage/devToolsStorageKeys";
import { clearAllAppStorage } from "../utils/clearAllStorage";

interface StorageBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  requiredStorageKeys?: RequiredStorageKey[]; // Configuration for required keys
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
  requiredStorageKeys = [],
}: StorageBrowserModeProps) {
  const queryClient = useQueryClient();

  // Get all storage queries from cache
  const allQueries = queryClient.getQueryCache().getAll();
  const storageQueriesData = allQueries.filter((query) =>
    isStorageQuery(query.queryKey)
  );

  // Process storage keys into StorageKeyInfo format
  const { storageKeys, devToolKeys, stats } = useMemo(() => {
    const keyInfoMap = new Map<string, StorageKeyInfo>();
    const devToolKeyInfoMap = new Map<string, StorageKeyInfo>();

    // Process all storage queries (no filtering by storage type)
    storageQueriesData.forEach((query) => {
      const storageType = getStorageType(query.queryKey);
      if (!storageType) return;

      const cleanKey = getCleanStorageKey(query.queryKey);
      const value = query.state.data;

      // Check if this is a dev tool key
      if (isDevToolsStorageKey(cleanKey)) {
        // Add to dev tool keys map instead
        const devKeyInfo: StorageKeyInfo = {
          key: cleanKey,
          value,
          storageType,
          status: "optional_present",
          category: "optional",
          description: "Dev Tools internal storage key",
        };
        devToolKeyInfoMap.set(cleanKey, devKeyInfo);
        return; // Skip adding to regular storage keys
      }

      // Check if this is a required key
      const requiredConfig = requiredStorageKeys.find((req) => {
        if (typeof req === "string") return req === cleanKey;
        return req.key === cleanKey;
      });

      let status: StorageKeyInfo["status"] = "optional_present";

      if (requiredConfig) {
        if (value === undefined || value === null) {
          status = "required_missing";
        } else if (
          typeof requiredConfig === "object" &&
          "expectedValue" in requiredConfig
        ) {
          status =
            value === requiredConfig.expectedValue
              ? "required_present"
              : "required_wrong_value";
        } else if (
          typeof requiredConfig === "object" &&
          "expectedType" in requiredConfig
        ) {
          // Simple type detection for storage values
          const actualType = value === null ? "null" : typeof value;
          status =
            actualType.toLowerCase() ===
            requiredConfig.expectedType.toLowerCase()
              ? "required_present"
              : "required_wrong_type";
        } else {
          status = "required_present";
        }
      }

      const keyInfo: StorageKeyInfo = {
        key: cleanKey,
        value,
        storageType,
        status,
        category: requiredConfig ? "required" : "optional",
        ...(typeof requiredConfig === "object" &&
          "expectedValue" in requiredConfig && {
            expectedValue: requiredConfig.expectedValue,
          }),
        ...(typeof requiredConfig === "object" &&
          "expectedType" in requiredConfig && {
            expectedType: requiredConfig.expectedType,
          }),
        ...(typeof requiredConfig === "object" &&
          "description" in requiredConfig && {
            description: requiredConfig.description,
          }),
      };

      keyInfoMap.set(cleanKey, keyInfo);
    });

    // Process required storage keys that weren't found in actual storage
    // NOTE: We only track storage keys here, not environment variables
    requiredStorageKeys.forEach((req) => {
      const key = typeof req === "string" ? req : req.key;

      // If not already in map, it means the required key is missing from storage
      if (!keyInfoMap.has(key)) {
        let storageType: StorageType = "async"; // Default

        if (typeof req === "object" && "storageType" in req) {
          storageType = req.storageType;
        }

        // Mark as missing since it's not in storage
        const keyInfo: StorageKeyInfo = {
          key,
          value: undefined, // Not in storage
          storageType,
          status: "required_missing",
          category: "required",
          ...(typeof req === "object" &&
            "expectedValue" in req && {
              expectedValue: req.expectedValue,
            }),
          ...(typeof req === "object" &&
            "expectedType" in req && {
              expectedType: req.expectedType,
            }),
          ...(typeof req === "object" &&
            "description" in req && {
              description: req.description,
            }),
        };

        keyInfoMap.set(key, keyInfo);
      }
    });

    // Calculate stats
    const keys = Array.from(keyInfoMap.values());
    const storageStats: StorageKeyStats = {
      totalCount: keys.length,
      requiredCount: keys.filter((k) => k.category === "required").length,
      missingCount: keys.filter((k) => k.status === "required_missing").length,
      wrongValueCount: keys.filter((k) => k.status === "required_wrong_value")
        .length,
      wrongTypeCount: keys.filter((k) => k.status === "required_wrong_type")
        .length,
      presentRequiredCount: keys.filter((k) => k.status === "required_present")
        .length,
      optionalCount: keys.filter((k) => k.category === "optional").length,
      mmkvCount: keys.filter((k) => k.storageType === "mmkv").length,
      asyncCount: keys.filter((k) => k.storageType === "async").length,
      secureCount: keys.filter((k) => k.storageType === "secure").length,
    };

    // Get dev tool keys array
    const devKeys = Array.from(devToolKeyInfoMap.values());

    return { storageKeys: keys, devToolKeys: devKeys, stats: storageStats };
  }, [storageQueriesData, requiredStorageKeys]);

  // Group storage keys by status
  const requiredKeys = storageKeys.filter((k) => k.category === "required");
  const optionalKeys = storageKeys.filter((k) => k.category === "optional");

  // Handle clear all storage
  const handleClearAll = useCallback(async () => {
    try {
      await clearAllAppStorage();
      // Invalidate all storage queries to refresh the UI
      queryClient.invalidateQueries({
        predicate: (query) => isStorageQuery(query.queryKey),
      });
    } catch (error) {
      console.error("Failed to clear storage:", error);
      throw error;
    }
  }, [queryClient]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    // Invalidate all storage queries to force refetch
    await queryClient.invalidateQueries({
      predicate: (query) => isStorageQuery(query.queryKey),
    });
    // Also refetch to ensure immediate update
    await queryClient.refetchQueries({
      predicate: (query) => isStorageQuery(query.queryKey),
    });
  }, [queryClient]);

  return (
    <ScrollView
      accessibilityLabel="Storage browser mode"
      accessibilityHint="View storage browser mode"
      sentry-label="ignore storage browser mode"
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <StorageActions
        storageKeys={storageKeys}
        onClearAll={handleClearAll}
        onRefresh={handleRefresh}
        totalCount={storageKeys.length}
      />

      <StorageKeyStatsSection stats={stats} />

      <StorageKeySection
        title="Required Keys"
        count={requiredKeys.length}
        keys={requiredKeys}
        emptyMessage="No required storage keys configured"
      />

      <StorageKeySection
        title="Optional Keys"
        count={optionalKeys.length}
        keys={optionalKeys}
        emptyMessage="No optional storage keys found"
      />

      <StorageKeySection
        title="Dev Tools Keys"
        count={devToolKeys.length}
        keys={devToolKeys}
        emptyMessage="No dev tool keys found"
        headerColor="#8B5CF6"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717", // Match main dev tools background
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 24,
    gap: 12,
  },
});
