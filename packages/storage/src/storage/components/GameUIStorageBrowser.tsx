import { useMemo, useCallback, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Database, Trash2, Search } from "@react-buoy/shared-ui";
import { StorageKeyInfo, RequiredStorageKey, StorageKeyStats } from "../types";
import { isDevToolsStorageKey } from "@react-buoy/shared-ui";
import { clearAllAppStorage } from "../utils/clearAllStorage";
import { StorageKeySection } from "./StorageKeySection";
import {
  StorageFilterCards,
  type StorageFilterType,
  type StorageTypeFilter,
} from "./StorageFilterCards";
import { useAsyncStorageKeys } from "../hooks/useAsyncStorageKeys";
import { addListener } from "../utils/AsyncStorageListener";

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
  const [activeFilter, setActiveFilter] = useState<StorageFilterType>("all");
  const [activeStorageType, setActiveStorageType] =
    useState<StorageTypeFilter>("all");

  // Use new direct AsyncStorage hook
  const { storageKeys: allStorageKeys, isLoading, error, refresh } = useAsyncStorageKeys(
    requiredStorageKeys
  );

  // Auto-refresh on storage events
  useEffect(() => {
    // Debounce to avoid multiple rapid refreshes
    let timeoutId: ReturnType<typeof setTimeout>;

    const unsubscribe = addListener((event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refresh(); // Auto-refresh when storage changes
      }, 100); // 100ms debounce
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [refresh]);

  // Calculate stats from keys (filter out dev tool keys in the calculation)
  const stats = useMemo(() => {
    const allKeys = allStorageKeys;
    const appKeys = allKeys.filter((k) => !isDevToolsStorageKey(k.key));
    const devKeys = allKeys.filter((k) => isDevToolsStorageKey(k.key));

    const storageStats: StorageKeyStats & { devToolsCount: number } = {
      totalCount: allKeys.length,
      requiredCount: appKeys.filter((k) => k.category === "required").length,
      missingCount: appKeys.filter((k) => k.status === "required_missing").length,
      wrongValueCount: appKeys.filter((k) => k.status === "required_wrong_value")
        .length,
      wrongTypeCount: appKeys.filter((k) => k.status === "required_wrong_type")
        .length,
      presentRequiredCount: appKeys.filter((k) => k.status === "required_present")
        .length,
      optionalCount: appKeys.filter((k) => k.category === "optional").length,
      mmkvCount: 0, // Will be populated when MMKV is added
      asyncCount: appKeys.length,
      secureCount: 0, // Will be populated when SecureStore is added
      devToolsCount: devKeys.length,
    };

    return storageStats;
  }, [allStorageKeys]);

  // Sort all keys by priority (issues first)
  const sortedKeys = useMemo(() => {
    // Sort by status priority: errors first, then warnings, then valid
    return [...allStorageKeys].sort((a, b) => {
      const priorityMap: Record<string, number> = {
        required_missing: 1,
        required_wrong_type: 2,
        required_wrong_value: 3,
        required_present: 4,
        optional_present: 5,
      };
      return (priorityMap[a.status] || 999) - (priorityMap[b.status] || 999);
    });
  }, [allStorageKeys]);

  // Filter keys based on active filter and storage type
  const filteredKeys = useMemo(() => {
    let keys = sortedKeys;

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
  }, [sortedKeys, activeFilter, activeStorageType]);

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
              await refresh(); // Auto-refresh after clearing
            } catch (error) {
              console.error("Failed to clear storage:", error);
              Alert.alert("Error", "Failed to clear storage");
            }
          },
        },
      ]
    );
  }, [refresh]);

  // Handle export
  const handleExport = useCallback(async () => {
    const exportData = allStorageKeys.reduce((acc, keyInfo) => {
      acc[keyInfo.key] = keyInfo.value;
      return acc;
    }, {} as Record<string, unknown>);

    const serialized = JSON.stringify(exportData, null, 2);
    await copyToClipboard(serialized);
  }, [allStorageKeys]);

  // Loading state
  if (isLoading && allStorageKeys.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Database size={48} color={macOSColors.text.muted} />
        <Text style={styles.emptyTitle}>Loading storage keys...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.emptyState}>
        <Database size={48} color={gameUIColors.error} />
        <Text style={[styles.emptyTitle, { color: gameUIColors.error }]}>
          Error loading storage
        </Text>
        <Text style={styles.emptySubtitle}>{error.message}</Text>
      </View>
    );
  }

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
