import { useEffect, useMemo } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Query, useQueryClient } from "@tanstack/react-query";
import {
  StorageType,
  getCleanStorageKey,
  getStorageType,
  isStorageQuery,
} from "../../../_util/storageQueryUtils";
import { useStorageQueryCounts } from "../../../_hooks/useStorageQueryCounts";
import { StorageKeyStatsSection } from "../sections/storage/components/StorageKeyStats";
import { StorageKeySection } from "../sections/storage/components/StorageKeySection";
import {
  StorageKeyInfo,
  RequiredStorageKey,
  StorageKeyStats,
} from "../sections/storage/types";
import { getEnvVarType } from "../sections/env-vars/envTypeDetector";

interface StorageBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  activeStorageTypes: Set<StorageType>;
  onCountsChange?: (counts: any) => void; // To pass counts up to parent
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
  activeStorageTypes,
  onCountsChange,
  requiredStorageKeys = [],
}: StorageBrowserModeProps) {
  const queryClient = useQueryClient();

  // Get all storage queries from cache
  const allQueries = queryClient.getQueryCache().getAll();
  const storageQueriesData = allQueries.filter((query) =>
    isStorageQuery(query.queryKey)
  );

  // Process storage keys into StorageKeyInfo format
  const { storageKeys, stats } = useMemo(() => {
    const keyInfoMap = new Map<string, StorageKeyInfo>();

    // First, process all active storage queries
    storageQueriesData.forEach((query) => {
      const storageType = getStorageType(query.queryKey);
      if (!storageType || !activeStorageTypes.has(storageType)) return;

      const cleanKey = getCleanStorageKey(query.queryKey);
      const value = query.state.data;

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
          const actualType = getEnvVarType(value);
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
      };

      keyInfoMap.set(cleanKey, keyInfo);
    });

    // Add missing required keys
    requiredStorageKeys.forEach((req) => {
      const key = typeof req === "string" ? req : req.key;
      if (!keyInfoMap.has(key)) {
        let storageType: StorageType = "async"; // Default
        if (typeof req === "object" && "storageType" in req) {
          storageType = req.storageType;
        }

        const keyInfo: StorageKeyInfo = {
          key,
          value: undefined,
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
        };

        keyInfoMap.set(key, keyInfo);
      }
    });

    // Calculate stats
    const keys = Array.from(keyInfoMap.values());
    const stats: StorageKeyStats = {
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

    return { storageKeys: keys, stats };
  }, [storageQueriesData, activeStorageTypes, requiredStorageKeys]);

  // Get stable storage counts using dedicated hook [[rule3]]
  const storageCounts = useStorageQueryCounts();

  // Pass counts to parent with stable reference - only when counts actually change
  useEffect(() => {
    if (onCountsChange) {
      onCountsChange(storageCounts);
    }
  }, [storageCounts, onCountsChange]);

  // Group storage keys by status
  const requiredKeys = storageKeys.filter((k) => k.category === "required");
  const optionalKeys = storageKeys.filter((k) => k.category === "optional");

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
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
  },
});
