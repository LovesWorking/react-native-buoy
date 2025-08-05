import { useMemo } from "react";
import { StyleSheet, ScrollView } from "react-native";
import { Query, useQueryClient } from "@tanstack/react-query";
import {
  StorageType,
  getCleanStorageKey,
  getStorageType,
  isStorageQuery,
} from "../utils/storageQueryUtils";
import { StorageKeyStatsSection } from "../../../_sections/storage/components/StorageKeyStats";
import { StorageKeySection } from "../../../_sections/storage/components/StorageKeySection";
import {
  StorageKeyInfo,
  RequiredStorageKey,
  StorageKeyStats,
} from "../../../_sections/storage/types";
import { getEnvVarType } from "../../env/utils/envTypeDetector";

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
  const { storageKeys, stats } = useMemo(() => {
    const keyInfoMap = new Map<string, StorageKeyInfo>();

    // Process all storage queries (no filtering by storage type)
    storageQueriesData.forEach((query) => {
      const storageType = getStorageType(query.queryKey);
      if (!storageType) return;

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

    return { storageKeys: keys, stats: storageStats };
  }, [storageQueriesData, requiredStorageKeys]);

  // Note: Storage counts removed as filtering is no longer needed

  // Group storage keys by status
  const requiredKeys = storageKeys.filter((k) => k.category === "required");
  const optionalKeys = storageKeys.filter((k) => k.category === "optional");

  return (
    <ScrollView
      accessibilityLabel="Storage browser mode"
      accessibilityHint="View storage browser mode"
      sentry-label="ignore storage browser mode"
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
    gap: 12,
  },
});
