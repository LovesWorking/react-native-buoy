import {
  useMemo,
  useCallback,
  useState,
  useEffect,
  MutableRefObject,
} from "react";
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
import { useMultiMMKVKeys } from "../hooks/useMMKVKeys";
import { useMMKVInstances } from "../hooks/useMMKVInstances";
import { MMKVInstanceSelector } from "./MMKVInstanceSelector";
import { MMKVInstanceInfoPanel } from "./MMKVInstanceInfoPanel";
import { isMMKVAvailable } from "../utils/mmkvAvailability";
import { StorageActionButtons } from "./StorageActionButtons";
import { SelectionActionBar } from "./SelectionActionBar";

// Conditionally import MMKV listener
let addMMKVListener: any;
if (isMMKVAvailable()) {
  const listener = require("../utils/MMKVListener");
  addMMKVListener = listener.addMMKVListener;
}

// Import shared Game UI components
import { gameUIColors, macOSColors, HardDrive } from "@react-buoy/shared-ui";

// MMKV Instance color palette - consistent colors per instance
const INSTANCE_COLORS = [
  macOSColors.semantic.info,     // Blue
  macOSColors.semantic.success,  // Green
  macOSColors.semantic.warning,  // Orange
  macOSColors.semantic.debug,    // Purple
  '#FF6B9D',                      // Pink
  '#00D9FF',                      // Cyan
];

/**
 * Get consistent color for an MMKV instance based on its ID
 * Uses simple hash to ensure same instance always gets same color
 */
function getInstanceColor(instanceId: string): string {
  const hash = instanceId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return INSTANCE_COLORS[hash % INSTANCE_COLORS.length];
}

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
  const [selectedMMKVInstance, setSelectedMMKVInstance] = useState<
    string | null
  >(null);

  // Selection mode state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedKeyIds, setSelectedKeyIds] = useState<Set<string>>(new Set());

  // Get all MMKV instances
  const { instances: mmkvInstances } = useMMKVInstances(false);


  // REMOVED: Auto-selection is now handled by the instance navbar
  // Users can manually select an instance from the navbar if they want to filter by instance
  // By default, selectedMMKVInstance is null, which shows ALL MMKV keys

  // Use AsyncStorage hook
  const {
    storageKeys: asyncStorageKeys,
    isLoading: isLoadingAsync,
    error: asyncError,
    refresh: refreshAsync,
  } = useAsyncStorageKeys(requiredStorageKeys);

  // Memoize the instances array to prevent infinite re-renders
  const mmkvInstancesForHook = useMemo(
    () => mmkvInstances.map((inst) => ({ instance: inst.instance, id: inst.id })),
    [mmkvInstances]
  );

  // Use MMKV hook - always fetch from ALL instances, then filter by selected instance
  const {
    storageKeys: allMMKVKeys,
    isLoading: isLoadingMMKV,
    error: mmkvError,
    refresh: refreshMMKV,
  } = useMultiMMKVKeys(mmkvInstancesForHook, requiredStorageKeys);

  // Filter MMKV keys by selected instance (if one is selected)
  const mmkvStorageKeys = useMemo(() => {
    if (!selectedMMKVInstance) {
      return allMMKVKeys; // Show all MMKV keys
    }
    return allMMKVKeys.filter((k) => k.instanceId === selectedMMKVInstance);
  }, [allMMKVKeys, selectedMMKVInstance]);

  // Merge storage keys from AsyncStorage and MMKV
  const allStorageKeys = useMemo(() => {
    return [...asyncStorageKeys, ...mmkvStorageKeys];
  }, [asyncStorageKeys, mmkvStorageKeys]);

  // Determine loading and error states
  const isLoading = isLoadingAsync || isLoadingMMKV;
  const error = asyncError || mmkvError;

  // Combined refresh function
  const refresh = useCallback(() => {
    refreshAsync();
    refreshMMKV();
  }, [refreshAsync, refreshMMKV]);

  // Generate unique identifier for a storage key
  const getKeyIdentifier = useCallback((storageKey: StorageKeyInfo): string => {
    return storageKey.instanceId
      ? `${storageKey.storageType}-${storageKey.instanceId}-${storageKey.key}`
      : `${storageKey.storageType}-${storageKey.key}`;
  }, []);

  // Toggle select mode
  const handleToggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      if (prev) {
        // When exiting select mode, clear selection
        setSelectedKeyIds(new Set());
      }
      return !prev;
    });
  }, []);

  // Handle selection change for a single key
  const handleSelectionChange = useCallback(
    (storageKey: StorageKeyInfo, selected: boolean) => {
      const keyId = getKeyIdentifier(storageKey);
      setSelectedKeyIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(keyId);
        } else {
          newSet.delete(keyId);
        }
        return newSet;
      });
    },
    [getKeyIdentifier]
  );

  // Clear selection and exit select mode after deletion
  const handleDeleteComplete = useCallback(() => {
    setSelectedKeyIds(new Set());
    setIsSelectMode(false);
    refresh();
  }, [refresh]);

  // Memoized export data for copy functionality
  const copyExportData = useMemo(() => {
    const allKeys = allStorageKeys;

    // Calculate stats
    const stats = {
      valid: allKeys.filter(k => k.status === 'required_present' || k.status === 'optional_present').length,
      missing: allKeys.filter(k => k.status === 'required_missing').length,
      issues: allKeys.filter(k => k.status === 'required_wrong_value' || k.status === 'required_wrong_type').length,
      total: allKeys.length,
    };

    // Group by storage type
    const asyncKeys = allKeys.filter(k => k.storageType === 'async');
    const mmkvKeys = allKeys.filter(k => k.storageType === 'mmkv');
    const secureKeys = allKeys.filter(k => k.storageType === 'secure');

    // Build structured export
    return {
      summary: {
        valid: stats.valid,
        missing: stats.missing,
        issues: stats.issues,
        total: stats.total,
        timestamp: new Date().toISOString(),
      },
      asyncStorage: asyncKeys.reduce((acc, k) => { acc[k.key] = k.value; return acc; }, {} as Record<string, any>),
      mmkv: mmkvKeys.reduce((acc, k) => {
        const instanceId = k.instanceId || 'default';
        if (!acc[instanceId]) acc[instanceId] = {};
        acc[instanceId][k.key] = k.value;
        return acc;
      }, {} as Record<string, Record<string, any>>),
      secure: secureKeys.reduce((acc, k) => { acc[k.key] = k.value; return acc; }, {} as Record<string, any>),
    };
  }, [allStorageKeys]);

  // Update storage data ref for copy functionality
  useEffect(() => {
    if (storageDataRef) {
      storageDataRef.current = allStorageKeys;
    }
  }, [allStorageKeys, storageDataRef]);

  // Auto-refresh on storage events (AsyncStorage)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const unsubscribe = addListener((event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshAsync(); // Auto-refresh AsyncStorage when it changes
      }, 100); // 100ms debounce
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [refreshAsync]);

  // Auto-refresh on MMKV storage events (only if MMKV is available)
  useEffect(() => {
    if (!isMMKVAvailable() || !addMMKVListener) {
      return; // Skip if MMKV not available
    }

    let timeoutId: ReturnType<typeof setTimeout>;

    const unsubscribe = addMMKVListener((event: any) => {
      // Only refresh if event is for the selected instance
      if (event.instanceId === selectedMMKVInstance) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          refreshMMKV(); // Auto-refresh MMKV when it changes
        }, 100); // 100ms debounce
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [refreshMMKV, selectedMMKVInstance]);

  // Calculate stats from ALL keys (not filtered) - base stats for display
  const stats = useMemo(() => {
    const allKeys = allStorageKeys;
    const appKeys = allKeys.filter((k) => !isDevToolsStorageKey(k.key));
    const devKeys = allKeys.filter((k) => isDevToolsStorageKey(k.key));

    const storageStats: StorageKeyStats & { devToolsCount: number } = {
      totalCount: allKeys.length,
      requiredCount: appKeys.filter((k) => k.category === "required").length,
      missingCount: appKeys.filter((k) => k.status === "required_missing")
        .length,
      wrongValueCount: appKeys.filter(
        (k) => k.status === "required_wrong_value"
      ).length,
      wrongTypeCount: appKeys.filter((k) => k.status === "required_wrong_type")
        .length,
      presentRequiredCount: appKeys.filter(
        (k) => k.status === "required_present"
      ).length,
      optionalCount: appKeys.filter((k) => k.category === "optional").length,
      // Count keys by their actual storageType property
      mmkvCount: allKeys.filter((k) => k.storageType === "mmkv").length,
      asyncCount: allKeys.filter((k) => k.storageType === "async").length,
      secureCount: allKeys.filter((k) => k.storageType === "secure").length,
      devToolsCount: devKeys.length,
    };

    return storageStats;
  }, [allStorageKeys]);

  // Calculate stats for tab badges based on current filters
  const tabStats = useMemo(() => {
    // Start with all keys, excluding devtools keys
    let keysForStats = allStorageKeys.filter((k) => !isDevToolsStorageKey(k.key));

    // If a specific storage type is selected, filter by that type first
    if (activeStorageType !== "all") {
      keysForStats = keysForStats.filter((k) => k.storageType === activeStorageType);
    }

    // Calculate status counts from filtered keys
    const validCount = keysForStats.filter(
      (k) => k.status === "required_present" || k.status === "optional_present"
    ).length;
    const missingCount = keysForStats.filter((k) => k.status === "required_missing").length;
    const issuesCount = keysForStats.filter(
      (k) => k.status === "required_wrong_type" || k.status === "required_wrong_value"
    ).length;

    // Calculate storage type counts based on active status filter
    let asyncCount = 0;
    let mmkvCount = 0;
    let secureCount = 0;
    let totalCount = 0;

    if (activeFilter === "all") {
      // Valid: only keys with valid status
      asyncCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "async" &&
          (k.status === "required_present" || k.status === "optional_present")
      ).length;
      mmkvCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "mmkv" &&
          (k.status === "required_present" || k.status === "optional_present")
      ).length;
      secureCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "secure" &&
          (k.status === "required_present" || k.status === "optional_present")
      ).length;
      totalCount = asyncCount + mmkvCount + secureCount;
    } else if (activeFilter === "missing") {
      // Missing: only keys with missing status
      asyncCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "async" &&
          k.status === "required_missing"
      ).length;
      mmkvCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "mmkv" &&
          k.status === "required_missing"
      ).length;
      secureCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "secure" &&
          k.status === "required_missing"
      ).length;
      totalCount = asyncCount + mmkvCount + secureCount;
    } else if (activeFilter === "issues") {
      // Issues: only keys with issue status
      asyncCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "async" &&
          (k.status === "required_wrong_type" || k.status === "required_wrong_value")
      ).length;
      mmkvCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "mmkv" &&
          (k.status === "required_wrong_type" || k.status === "required_wrong_value")
      ).length;
      secureCount = allStorageKeys.filter(
        (k) =>
          !isDevToolsStorageKey(k.key) &&
          k.storageType === "secure" &&
          (k.status === "required_wrong_type" || k.status === "required_wrong_value")
      ).length;
      totalCount = asyncCount + mmkvCount + secureCount;
    }

    return {
      validCount,
      missingCount,
      issuesCount,
      asyncCount,
      mmkvCount,
      secureCount,
      totalCount,
    };
  }, [allStorageKeys, activeFilter, activeStorageType]);

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

    // NOTE: MMKV instance filtering is now handled in mmkvStorageKeys memo (line 128)
    // No need to filter again here

    return keys;
  }, [
    sortedKeys,
    activeFilter,
    activeStorageType,
    ignoredPatterns,
    searchQuery,
    selectedMMKVInstance,
  ]);

  // Calculate stats from FILTERED keys to show actual visible counts
  const filteredStats = useMemo(() => {
    const appKeys = filteredKeys.filter((k) => !isDevToolsStorageKey(k.key));

    const storageStats: StorageKeyStats & { devToolsCount: number } = {
      totalCount: filteredKeys.length,
      requiredCount: appKeys.filter((k) => k.category === "required").length,
      missingCount: appKeys.filter((k) => k.status === "required_missing")
        .length,
      wrongValueCount: appKeys.filter(
        (k) => k.status === "required_wrong_value"
      ).length,
      wrongTypeCount: appKeys.filter((k) => k.status === "required_wrong_type")
        .length,
      presentRequiredCount: appKeys.filter(
        (k) => k.status === "required_present"
      ).length,
      optionalCount: appKeys.filter((k) => k.category === "optional").length,
      mmkvCount: filteredKeys.filter((k) => k.storageType === "mmkv").length,
      asyncCount: filteredKeys.filter((k) => k.storageType === "async").length,
      secureCount: filteredKeys.filter((k) => k.storageType === "secure")
        .length,
      devToolsCount: filteredKeys.filter((k) => isDevToolsStorageKey(k.key))
        .length,
    };

    return storageStats;
  }, [filteredKeys]);

  // Get selected keys as StorageKeyInfo objects
  const selectedKeysInfo = useMemo(() => {
    return filteredKeys.filter((key) => selectedKeyIds.has(getKeyIdentifier(key)));
  }, [filteredKeys, selectedKeyIds, getKeyIdentifier]);

  // Select all visible keys
  const handleSelectAll = useCallback(() => {
    const allIds = new Set(filteredKeys.map(getKeyIdentifier));
    setSelectedKeyIds(allIds);
  }, [filteredKeys, getKeyIdentifier]);

  // Clear all selections
  const handleClearSelection = useCallback(() => {
    setSelectedKeyIds(new Set());
  }, []);

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
        stats={stats}
        tabStats={tabStats}
        healthPercentage={healthPercentage}
        healthStatus={healthStatus}
        healthColor={healthColor}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        activeStorageType={activeStorageType}
        onStorageTypeChange={setActiveStorageType}
      />

      {/* MMKV Instance Selector - Only show when MMKV-only filter is active and no instances */}
      {activeStorageType === "mmkv" && mmkvInstances.length === 0 && (
        <View style={styles.emptyMMKVState}>
          <Text style={styles.emptyMMKVTitle}>No MMKV Instances Detected</Text>
          <Text style={styles.emptyMMKVSubtitle}>
            MMKV instances must be registered with registerMMKVInstance()
          </Text>
          <Text style={styles.emptyMMKVCode}>
            {`import { registerMMKVInstance } from '@react-buoy/storage';\n\nconst storage = createMMKV();\nregisterMMKVInstance('mmkv.default', storage);`}
          </Text>
        </View>
      )}

      {/* MMKV Instance Filter Navbar - ONLY show in MMKV tab when instances available */}
      {activeStorageType === "mmkv" && mmkvInstances.length > 0 && (
        <View style={styles.instanceNavbar}>
          <Text style={styles.instanceNavbarLabel}>INSTANCES</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.instanceNavbarScroll}
          >
            {/* "All Instances" button */}
            <TouchableOpacity
              onPress={() => setSelectedMMKVInstance(null)}
              style={[
                styles.instanceNavbarButton,
                selectedMMKVInstance === null && styles.instanceNavbarButtonActive,
              ]}
            >
              <HardDrive
                size={12}
                color={
                  selectedMMKVInstance === null
                    ? macOSColors.text.primary
                    : macOSColors.text.secondary
                }
              />
              <Text
                style={[
                  styles.instanceNavbarButtonText,
                  selectedMMKVInstance === null && styles.instanceNavbarButtonTextActive,
                ]}
              >
                All
              </Text>
              <View style={styles.instanceNavbarBadge}>
                <Text style={styles.instanceNavbarBadgeText}>
                  {mmkvInstances.reduce((sum, inst) => sum + inst.keyCount, 0)}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Individual instance buttons */}
            {mmkvInstances.map((inst) => (
              <TouchableOpacity
                key={inst.id}
                onPress={() => setSelectedMMKVInstance(inst.id)}
                style={[
                  styles.instanceNavbarButton,
                  inst.id === selectedMMKVInstance && styles.instanceNavbarButtonActive,
                  {
                    borderColor: getInstanceColor(inst.id) + '40',
                    backgroundColor:
                      inst.id === selectedMMKVInstance
                        ? getInstanceColor(inst.id) + '20'
                        : macOSColors.background.card,
                  },
                ]}
              >
                <HardDrive
                  size={12}
                  color={
                    inst.id === selectedMMKVInstance
                      ? getInstanceColor(inst.id)
                      : macOSColors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.instanceNavbarButtonText,
                    inst.id === selectedMMKVInstance && {
                      color: getInstanceColor(inst.id),
                      fontWeight: '700',
                    },
                  ]}
                >
                  {inst.id}
                </Text>
                <View
                  style={[
                    styles.instanceNavbarBadge,
                    inst.id === selectedMMKVInstance && {
                      backgroundColor: getInstanceColor(inst.id) + '30',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.instanceNavbarBadgeText,
                      inst.id === selectedMMKVInstance && {
                        color: getInstanceColor(inst.id),
                      },
                    ]}
                  >
                    {inst.keyCount}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filtered Storage Keys */}
      {filteredKeys.length > 0 ? (
        <View style={styles.keysSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>
                {activeFilter === "all"
                  ? "KEYS"
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
            {/* Storage Action Buttons in Header */}
            <StorageActionButtons
              copyValue={copyExportData}
              mmkvInstances={mmkvInstances.map(inst => ({ id: inst.id, instance: inst.instance }))}
              activeStorageType={activeStorageType}
              onClearComplete={refresh}
              isSelectMode={isSelectMode}
              onToggleSelectMode={handleToggleSelectMode}
              selectedCount={selectedKeyIds.size}
            />
          </View>

          {/* Selection Action Bar - Only show in select mode with selections */}
          {isSelectMode && (
            <SelectionActionBar
              selectedKeys={selectedKeysInfo}
              mmkvInstances={mmkvInstances.map(inst => ({ id: inst.id, instance: inst.instance }))}
              onDeleteComplete={handleDeleteComplete}
              onSelectAll={handleSelectAll}
              onClearSelection={handleClearSelection}
              totalVisibleKeys={filteredKeys.length}
            />
          )}

          <StorageKeySection
            title=""
            count={-1}
            keys={filteredKeys}
            emptyMessage=""
            isSelectMode={isSelectMode}
            selectedKeys={selectedKeyIds}
            onSelectionChange={handleSelectionChange}
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
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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

  // Empty MMKV state
  emptyMMKVState: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    marginTop: 8,
    alignItems: "center",
  },
  emptyMMKVTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: macOSColors.text.primary,
    marginBottom: 6,
  },
  emptyMMKVSubtitle: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyMMKVCode: {
    fontSize: 10,
    fontFamily: "monospace",
    color: macOSColors.semantic.info,
    backgroundColor: macOSColors.background.input,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignSelf: "stretch",
  },

  // Instance Navbar styles
  instanceNavbar: {
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: macOSColors.background.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  instanceNavbarLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: macOSColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    paddingLeft: 2,
  },
  instanceNavbarScroll: {
    gap: 8,
    paddingRight: 8,
  },
  instanceNavbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    minWidth: 90,
  },
  instanceNavbarButtonActive: {
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  instanceNavbarButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  instanceNavbarButtonTextActive: {
    fontWeight: '700',
    color: macOSColors.text.primary,
  },
  instanceNavbarBadge: {
    backgroundColor: macOSColors.background.input,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    minWidth: 24,
    alignItems: 'center',
  },
  instanceNavbarBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
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
