import { useMemo, useCallback, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Database, RefreshCw, Trash2, Search } from "@react-buoy/shared-ui";
import { useQueryClient } from "@tanstack/react-query";
import {
  StorageType,
  getCleanStorageKey,
  getStorageType,
  isStorageQuery,
} from "../utils/storageQueryUtils";
import { StorageKeyInfo, RequiredStorageKey, StorageKeyStats } from "../types";
import { isDevToolsStorageKey } from "@react-buoy/shared-ui";
import { clearAllAppStorage } from "../utils/clearAllStorage";
import { StorageKeySection } from "./StorageKeySection";
import {
  StorageFilterCards,
  type StorageFilterType,
  type StorageTypeFilter,
} from "./StorageFilterCards";

// Import shared Game UI components
import {
  gameUIColors,
  macOSColors,
  copyToClipboard,
} from "@react-buoy/shared-ui";

interface GameUIStorageBrowserProps {
  requiredStorageKeys?: RequiredStorageKey[];
}

export function GameUIStorageBrowser({
  requiredStorageKeys = [],
}: GameUIStorageBrowserProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<StorageFilterType>("all");
  const [activeStorageType, setActiveStorageType] =
    useState<StorageTypeFilter>("all");

  // Get all storage queries from cache
  const allQueries = queryClient.getQueryCache().getAll();
  const storageQueriesData = allQueries.filter((query) =>
    isStorageQuery(query.queryKey)
  );

  // Process storage keys into StorageKeyInfo format
  const { storageKeys, devToolKeys, stats } = useMemo(() => {
    const keyInfoMap = new Map<string, StorageKeyInfo>();
    const devToolKeyInfoMap = new Map<string, StorageKeyInfo>();

    // Normal processing - use actual storage queries
    storageQueriesData.forEach((query) => {
      const storageType = getStorageType(query.queryKey);
      if (!storageType) return;

      const cleanKey = getCleanStorageKey(query.queryKey);
      const value = query.state.data;

      // Check if this is a dev tool key
      if (isDevToolsStorageKey(cleanKey)) {
        const devKeyInfo: StorageKeyInfo = {
          key: cleanKey,
          value,
          storageType,
          status: "optional_present",
          category: "optional",
          description: "Dev Tools internal storage key",
        };
        devToolKeyInfoMap.set(cleanKey, devKeyInfo);
        return;
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
    requiredStorageKeys.forEach((req) => {
      const key = typeof req === "string" ? req : req.key;

      if (!keyInfoMap.has(key)) {
        let storageType: StorageType = "async";

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
    const devKeys = Array.from(devToolKeyInfoMap.values());

    const storageStats: StorageKeyStats & { devToolsCount: number } = {
      totalCount: keys.length + devKeys.length,
      requiredCount: keys.filter((k) => k.category === "required").length,
      missingCount: keys.filter((k) => k.status === "required_missing").length,
      wrongValueCount: keys.filter((k) => k.status === "required_wrong_value")
        .length,
      wrongTypeCount: keys.filter((k) => k.status === "required_wrong_type")
        .length,
      presentRequiredCount: keys.filter((k) => k.status === "required_present")
        .length,
      optionalCount: keys.filter((k) => k.category === "optional").length,
      mmkvCount: [...keys, ...devKeys].filter((k) => k.storageType === "mmkv")
        .length,
      asyncCount: [...keys, ...devKeys].filter((k) => k.storageType === "async")
        .length,
      secureCount: [...keys, ...devKeys].filter(
        (k) => k.storageType === "secure"
      ).length,
      devToolsCount: devKeys.length,
    };

    return { storageKeys: keys, devToolKeys: devKeys, stats: storageStats };
  }, [storageQueriesData, requiredStorageKeys]);

  // Group storage keys by status
  const requiredKeys = storageKeys.filter((k) => k.category === "required");
  const optionalKeys = storageKeys.filter((k) => k.category === "optional");

  // Combine all keys and sort by priority (issues first)
  const allKeys = useMemo(() => {
    const combined = [...requiredKeys, ...optionalKeys, ...devToolKeys];

    // Sort by status priority: errors first, then warnings, then valid
    return combined.sort((a, b) => {
      const priorityMap: Record<string, number> = {
        required_missing: 1,
        required_wrong_type: 2,
        required_wrong_value: 3,
        required_present: 4,
        optional_present: 5,
      };
      return (priorityMap[a.status] || 999) - (priorityMap[b.status] || 999);
    });
  }, [requiredKeys, optionalKeys, devToolKeys]);

  // Filter keys based on active filter and storage type
  const filteredKeys = useMemo(() => {
    let keys = allKeys;

    // Apply status filter
    switch (activeFilter) {
      case "missing":
        keys = keys.filter((k) => k.status === "required_missing");
        break;
      case "issues":
        keys = keys.filter(
          (k) =>
            k.status === "required_wrong_type" ||
            k.status === "required_wrong_value"
        );
        break;
    }

    // Apply storage type filter
    if (activeStorageType !== "all") {
      keys = keys.filter((k) => k.storageType === activeStorageType);
    }

    return keys;
  }, [allKeys, activeFilter, activeStorageType]);

  // Removed unused issues and statsConfig variables

  // Calculate health percentage
  const healthPercentage =
    stats.requiredCount > 0
      ? Math.round((stats.presentRequiredCount / stats.requiredCount) * 100)
      : stats.totalCount > 0
      ? 100
      : 0;

  const healthStatus =
    healthPercentage >= 90
      ? "OPTIMAL"
      : healthPercentage >= 70
      ? "WARNING"
      : "CRITICAL";

  const healthColor =
    healthPercentage >= 90
      ? gameUIColors.success
      : healthPercentage >= 70
      ? gameUIColors.warning
      : gameUIColors.error;

  // Handle clear all storage
  const handleClearAll = useCallback(async () => {
    Alert.alert(
      "Clear Storage",
      "This will clear all app storage data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllAppStorage();
              await queryClient.invalidateQueries({
                predicate: (query) => isStorageQuery(query.queryKey),
              });
            } catch (error) {
              console.error("Failed to clear storage:", error);
              Alert.alert("Error", "Failed to clear storage");
            }
          },
        },
      ]
    );
  }, [queryClient]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        predicate: (query) => isStorageQuery(query.queryKey),
      });
      await queryClient.refetchQueries({
        predicate: (query) => isStorageQuery(query.queryKey),
      });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [queryClient]);

  // Handle export
  const handleExport = useCallback(async () => {
    const exportData = storageKeys.reduce((acc, keyInfo) => {
      acc[keyInfo.key] = keyInfo.value;
      return acc;
    }, {} as Record<string, unknown>);

    const serialized = JSON.stringify(exportData, null, 2);
    await copyToClipboard(serialized);
  }, [storageKeys]);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.backgroundGrid} />

      {/* Filter Cards Section with integrated status */}
      <StorageFilterCards
        stats={stats}
        healthPercentage={healthPercentage}
        healthStatus={healthStatus}
        healthColor={healthColor}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeStorageType={activeStorageType}
        onStorageTypeChange={setActiveStorageType}
      />

      {/* Streamlined Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionBarLeft}>
          <View style={styles.keyPill}>
            <Text style={styles.keyPillText}>
              {stats.totalCount} {stats.totalCount === 1 ? "key" : "keys"}
            </Text>
          </View>
          <Text style={styles.keyCount}>Stored</Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            onPress={handleRefresh}
            style={[
              styles.actionButton,
              isRefreshing && styles.actionButtonActive,
            ]}
            activeOpacity={0.7}
          >
            <RefreshCw
              size={12}
              color={
                isRefreshing ? gameUIColors.success : macOSColors.text.secondary
              }
            />
            <Text
              style={[
                styles.actionButtonText,
                {
                  color: isRefreshing
                    ? gameUIColors.success
                    : macOSColors.text.secondary,
                },
              ]}
            >
              Scan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleExport}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Database size={12} color={macOSColors.text.secondary} />
            <Text
              style={[
                styles.actionButtonText,
                { color: macOSColors.text.secondary },
              ]}
            >
              Export
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearAll}
            style={[styles.actionButton, styles.dangerButton]}
            activeOpacity={0.7}
          >
            <Trash2 size={12} color={gameUIColors.error} />
            <Text
              style={[styles.actionButtonText, { color: gameUIColors.error }]}
            >
              Purge
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtered Storage Keys */}
      {filteredKeys.length > 0 ? (
        <View style={styles.keysSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeFilter === "all"
                ? "ALL STORAGE KEYS"
                : activeFilter === "missing"
                ? "MISSING KEYS"
                : "ISSUES TO FIX"}
              {activeStorageType !== "all" &&
                ` (${activeStorageType.toUpperCase()})`}
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{filteredKeys.length}</Text>
            </View>
          </View>
          <StorageKeySection
            title=""
            count={-1}
            keys={filteredKeys}
            emptyMessage=""
          />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Search size={32} color={macOSColors.text.muted} />
          <Text style={styles.emptyTitle}>
            {activeFilter === "all"
              ? "No storage keys"
              : activeFilter === "missing"
              ? "No missing keys"
              : "No issues found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeFilter === "all"
              ? "Your app hasn't stored any data yet"
              : activeFilter === "missing"
              ? "All required keys are present"
              : "All storage keys are correctly configured"}
          </Text>
        </View>
      )}

      <Text style={styles.techFooter}>
        ASYNC STORAGE | MMKV | SECURE STORAGE BACKENDS
      </Text>

      {/* Dev Test Mode removed - test component no longer needed */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: gameUIColors.background,
  },
  container: {
    padding: 12,
    paddingBottom: 32,
  },
  backgroundGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.006,
    backgroundColor: gameUIColors.info,
  },

  // Streamlined Action bar (polished styling)
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  actionBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  keyPill: {
    backgroundColor: macOSColors.background.base,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  keyPillText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
    color: macOSColors.text.primary,
    letterSpacing: 0.3,
  },
  keyCount: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: macOSColors.background.base,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  actionButtonActive: {
    backgroundColor: gameUIColors.success + "15",
    borderColor: gameUIColors.success + "40",
  },
  dangerButton: {
    backgroundColor: gameUIColors.error + "08",
    borderColor: gameUIColors.error + "20",
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: "500",
  },

  techFooter: {
    fontSize: 8,
    color: gameUIColors.muted,
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: 20,
    letterSpacing: 1,
    opacity: 0.5,
  },

  // Keys section
  keysSection: {
    marginTop: 8,
    backgroundColor: macOSColors.background.base,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  countBadge: {
    backgroundColor: macOSColors.background.card,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  countText: {
    fontSize: 11,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },

  // Empty state
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: macOSColors.text.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: macOSColors.text.secondary,
    textAlign: "center",
  },
});
