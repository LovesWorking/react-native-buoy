import { useMemo, useCallback, useState, useEffect, useRef, MutableRefObject } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Database } from "@react-buoy/shared-ui";
import { StorageKeyInfo, RequiredStorageKey, StorageKeyStats } from "../types";
import { isDevToolsStorageKey } from "@react-buoy/shared-ui";
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
} from "@react-buoy/shared-ui";

interface GameUIStorageBrowserProps {
  requiredStorageKeys?: RequiredStorageKey[];
  showFilters?: boolean;
  ignoredPatterns?: Set<string>;
  onTogglePattern?: (pattern: string) => void;
  onAddPattern?: (pattern: string) => void;
  searchQuery?: string;
  storageDataRef?: MutableRefObject<any[]>;
}

export function GameUIStorageBrowser({
  requiredStorageKeys = [],
  showFilters = false,
  ignoredPatterns = new Set(["@react_buoy"]),
  onTogglePattern,
  onAddPattern,
  searchQuery = "",
  storageDataRef,
}: GameUIStorageBrowserProps) {
  const [activeFilter, setActiveFilter] = useState<StorageFilterType>("all");
  const [activeStorageType, setActiveStorageType] =
    useState<StorageTypeFilter>("all");

  // Use new direct AsyncStorage hook
  const { storageKeys: allStorageKeys, isLoading, error, refresh } = useAsyncStorageKeys(
    requiredStorageKeys
  );

  // Update storage data ref for copy functionality
  useEffect(() => {
    if (storageDataRef) {
      storageDataRef.current = allStorageKeys;
    }
  }, [allStorageKeys, storageDataRef]);

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

  // Get all unique keys for filter suggestions
  const allUniqueKeys = useMemo(() => {
    return Array.from(new Set(allStorageKeys.map((k) => k.key))).sort();
  }, [allStorageKeys]);

  // Filter keys based on active filter, storage type, ignored patterns, and search
  const filteredKeys = useMemo(() => {
    let keys = sortedKeys;

    // Apply ignored pattern filter first
    keys = keys.filter((k) => {
      // Check if key matches any ignored pattern
      const shouldIgnore = Array.from(ignoredPatterns).some((pattern) =>
        k.key.includes(pattern)
      );
      return !shouldIgnore;
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      keys = keys.filter((k) => k.key.toLowerCase().includes(query));
    }

    // Apply status filter
    switch (activeFilter) {
      case "all":
        // "All" (Valid) shows only keys without issues
        keys = keys.filter(
          (k) =>
            k.status === "required_present" || k.status === "optional_present"
        );
        break;
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
  }, [sortedKeys, activeFilter, activeStorageType, ignoredPatterns, searchQuery]);

  // Calculate stats from FILTERED keys to show actual visible counts
  const filteredStats = useMemo(() => {
    const appKeys = filteredKeys.filter((k) => !isDevToolsStorageKey(k.key));

    const storageStats: StorageKeyStats & { devToolsCount: number } = {
      totalCount: filteredKeys.length,
      requiredCount: appKeys.filter((k) => k.category === "required").length,
      missingCount: appKeys.filter((k) => k.status === "required_missing").length,
      wrongValueCount: appKeys.filter((k) => k.status === "required_wrong_value")
        .length,
      wrongTypeCount: appKeys.filter((k) => k.status === "required_wrong_type")
        .length,
      presentRequiredCount: appKeys.filter((k) => k.status === "required_present")
        .length,
      optionalCount: appKeys.filter((k) => k.category === "optional").length,
      mmkvCount: filteredKeys.filter((k) => k.storageType === "mmkv").length,
      asyncCount: filteredKeys.filter((k) => k.storageType === "async").length,
      secureCount: filteredKeys.filter((k) => k.storageType === "secure").length,
      devToolsCount: filteredKeys.filter((k) => isDevToolsStorageKey(k.key)).length,
    };

    return storageStats;
  }, [filteredKeys]);

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
        stats={filteredStats}
        healthPercentage={healthPercentage}
        healthStatus={healthStatus}
        healthColor={healthColor}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeStorageType={activeStorageType}
        onStorageTypeChange={setActiveStorageType}
      />

      {/* Filtered Storage Keys */}
      {filteredKeys.length > 0 ? (
        <View style={styles.keysSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeFilter === "all"
                ? "VALID STORAGE KEYS"
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
          <Database size={32} color={macOSColors.text.muted} />
          <Text style={styles.emptyTitle}>
            {searchQuery
              ? "No results found"
              : activeFilter === "all"
              ? "No valid keys found"
              : activeFilter === "missing"
              ? "No missing keys"
              : "No issues found"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No keys matching "${searchQuery}"`
              : activeFilter === "all"
              ? "All keys have issues or are missing"
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
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: macOSColors.background.hover,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  clearSearchText: {
    fontSize: 13,
    color: macOSColors.text.primary,
    fontWeight: "500",
  },
});
