import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  JsModal,
  type ModalMode,
  ModalHeader,
  TabSelector,
  ValueTypeBadge,
  StorageTypeBadge,
  formatRelativeTime,
  parseValue,
  devToolsStorageKeys,
  gameUIColors,
  macOSColors,
  Database,
  Pause,
  Play,
  Trash2,
  Filter,
  Copy,
  Search,
  copyToClipboard,
  X,
  AlertCircle,
} from "@react-buoy/shared-ui";
import { RequiredStorageKey } from "../types";
import { StorageBrowserMode } from "./StorageBrowserMode";
import { clearAllAppStorage, clearAllStorageIncludingDevTools } from "../utils/clearAllStorage";
import {
  startListening,
  stopListening,
  addListener,
  AsyncStorageEvent,
  isListening as checkIsListening,
} from "../utils/AsyncStorageListener";
import {
  StorageEventDetailContent,
  StorageEventDetailFooter,
} from "./StorageEventDetailContent";
import { StorageFilterViewV2 } from "./StorageFilterViewV2";
import { StorageEventFilterView } from "./StorageEventFilterView";
import { translateStorageAction } from "../utils/storageActionHelpers";
import { isMMKVAvailable } from "../utils/mmkvAvailability";

// Conditionally import MMKV listener
let addMMKVListener: any;
type MMKVEvent = {
  action: string;
  timestamp: Date;
  instanceId: string;
  data?: {
    key?: string;
    value?: any;
    valueType?: string;
    success?: boolean;
  };
};

if (isMMKVAvailable()) {
  const mmkvListener = require("../utils/MMKVListener");
  addMMKVListener = mmkvListener.addMMKVListener;
}

// Unified storage event type
type StorageEvent = (AsyncStorageEvent & { storageType: 'async' }) | (MMKVEvent & { storageType: 'mmkv' });

interface StorageModalWithTabsProps {
  visible: boolean;
  onClose: () => void;
  onBack?: () => void;
  enableSharedModalDimensions?: boolean;
  requiredStorageKeys?: RequiredStorageKey[];
}

interface StorageKeyConversation {
  key: string;
  lastEvent: StorageEvent;
  events: StorageEvent[];
  totalOperations: number;
  currentValue: unknown;
  valueType:
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "undefined"
    | "object"
    | "array";
  storageTypes: Set<'async' | 'mmkv'>; // Track which storage types this key appears in
}

type TabType = "browser" | "events";

export function StorageModalWithTabs({
  visible,
  onClose,
  onBack,
  enableSharedModalDimensions = false,
  requiredStorageKeys = [],
}: StorageModalWithTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("browser");

  // Storage Browser state
  const [showStorageFilters, setShowStorageFilters] = useState(false);
  const [storageIgnoredPatterns, setStorageIgnoredPatterns] = useState<
    Set<string>
  >(
    new Set(["@react_buoy"]) // Auto-hide dev tool keys by default
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<TextInput>(null);
  const hasLoadedStorageFilters = useRef(false);

  // Event Listener state
  const [events, setEvents] = useState<StorageEvent[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedConversationKey, setSelectedConversationKey] = useState<
    string | null
  >(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [ignoredPatterns, setIgnoredPatterns] = useState<Set<string>>(
    new Set(["@RNAsyncStorage", "redux-persist", "persist:"]) // Only show @react_buoy events by default
  );
  const [enabledStorageTypes, setEnabledStorageTypes] = useState<Set<'async' | 'mmkv' | 'secure'>>(
    new Set(['async', 'mmkv', 'secure']) // All enabled by default
  );
  const lastEventRef = useRef<StorageEvent | null>(null);
  const hasLoadedFilters = useRef(false);
  const hasLoadedTabState = useRef(false);
  const hasLoadedMonitoringState = useRef(false);

  const handleModeChange = useCallback((_mode: ModalMode) => {
    // Mode changes handled by JsModal
  }, []);

  // Timer removed - using useTickEveryMinute hook instead

  // Load persisted tab state on mount
  useEffect(() => {
    if (!visible || hasLoadedTabState.current) return;

    const loadTabState = async () => {
      try {
        const storedTab = await AsyncStorage.getItem(
          devToolsStorageKeys.storage.activeTab()
        );
        if (storedTab && (storedTab === "browser" || storedTab === "events")) {
          setActiveTab(storedTab as TabType);
        }
        hasLoadedTabState.current = true;
      } catch (error) {
        // Failed to load tab state
      }
    };

    loadTabState();
  }, [visible]);

  // Load persisted monitoring state on mount
  useEffect(() => {
    if (!visible || hasLoadedMonitoringState.current) return;

    const loadMonitoringState = async () => {
      try {
        const storedMonitoring = await AsyncStorage.getItem(
          devToolsStorageKeys.storage.isMonitoring()
        );
        if (storedMonitoring !== null) {
          const shouldMonitor = storedMonitoring === "true";
          if (shouldMonitor && !checkIsListening()) {
            await startListening();
            setIsListening(true);
          }
        }
        hasLoadedMonitoringState.current = true;
      } catch (error) {
        // Failed to load monitoring state
      }
    };

    loadMonitoringState();
  }, [visible]);

  // Note: Conversations will appear when storage events are triggered
  // Click on any conversation to see the unified view with toggle cards

  // Save tab state when it changes
  useEffect(() => {
    if (!hasLoadedTabState.current) return; // Don't save on initial load

    const saveTabState = async () => {
      try {
        await AsyncStorage.setItem(
          devToolsStorageKeys.storage.activeTab(),
          activeTab
        );
      } catch (error) {
        // Failed to save tab state
      }
    };

    saveTabState();
  }, [activeTab]);

  // Save monitoring state when it changes
  useEffect(() => {
    if (!hasLoadedMonitoringState.current) return; // Don't save on initial load

    const saveMonitoringState = async () => {
      try {
        await AsyncStorage.setItem(
          devToolsStorageKeys.storage.isMonitoring(),
          isListening.toString()
        );
      } catch (error) {
        // Failed to save monitoring state
      }
    };

    saveMonitoringState();
  }, [isListening]);

  // Load persisted filters on mount
  useEffect(() => {
    if (!visible || hasLoadedFilters.current) return;

    const loadFilters = async () => {
      try {
        const storedFilters = await AsyncStorage.getItem(
          devToolsStorageKeys.storage.eventFilters()
        );
        if (storedFilters) {
          const filters = JSON.parse(storedFilters) as string[];
          setIgnoredPatterns(new Set(filters));
        }
        hasLoadedFilters.current = true;
      } catch (error) {
        // Failed to load filters
      }
    };

    loadFilters();
  }, [visible]);

  // Save filters when they change
  useEffect(() => {
    if (!hasLoadedFilters.current) return; // Don't save on initial load

    const saveFilters = async () => {
      try {
        const filters = Array.from(ignoredPatterns);
        await AsyncStorage.setItem(
          devToolsStorageKeys.storage.eventFilters(),
          JSON.stringify(filters)
        );
      } catch (error) {
        // Failed to save filters
      }
    };

    saveFilters();
  }, [ignoredPatterns]);

  // Event listener setup
  useEffect(() => {
    if (!visible) return;

    // Check if already listening
    const listening = checkIsListening();
    setIsListening(listening);

    // Set up AsyncStorage event listener
    const unsubscribeAsync = addListener((event: AsyncStorageEvent) => {
      const storageEvent: StorageEvent = { ...event, storageType: 'async' };
      lastEventRef.current = storageEvent;
      setEvents((prev) => {
        const updated = [storageEvent, ...prev];
        return updated.slice(0, 500);
      });
    });

    // Set up MMKV event listener (if available)
    let unsubscribeMMKV = () => {};
    if (isMMKVAvailable() && addMMKVListener) {
      unsubscribeMMKV = addMMKVListener((event: MMKVEvent) => {
        const storageEvent: StorageEvent = { ...event, storageType: 'mmkv' };
        lastEventRef.current = storageEvent;
        setEvents((prev) => {
          const updated = [storageEvent, ...prev];
          return updated.slice(0, 500);
        });
      });
    }

    return () => {
      unsubscribeAsync();
      unsubscribeMMKV();
    };
  }, [visible]);

  const handleToggleListening = useCallback(async () => {
    if (isListening) {
      stopListening();
      setIsListening(false);
    } else {
      await startListening();
      setIsListening(true);
    }
  }, [isListening]);

  const handleClearEvents = useCallback(() => {
    setEvents([]);
    setSelectedConversationKey(null);
  }, []);

  const handleConversationPress = useCallback(
    (conversation: StorageKeyConversation) => {
      setSelectedConversationKey(conversation.key);
      setSelectedEventIndex(0);
    },
    []
  );

  const handleTogglePattern = useCallback((pattern: string) => {
    setIgnoredPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  }, []);

  const handleAddPattern = useCallback((pattern: string) => {
    setIgnoredPatterns((prev) => new Set([...prev, pattern]));
  }, []);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const handleToggleStorageType = useCallback((type: 'async' | 'mmkv' | 'secure') => {
    setEnabledStorageTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Storage Browser handlers
  const storageDataRef = useRef<any[]>([]);

  const handleToggleStorageFilters = useCallback(() => {
    setShowStorageFilters(!showStorageFilters);
  }, [showStorageFilters]);

  const handleToggleStoragePattern = useCallback((pattern: string) => {
    setStorageIgnoredPatterns((prev) => {
      const next = new Set(prev);
      if (next.has(pattern)) {
        next.delete(pattern);
      } else {
        next.add(pattern);
      }
      return next;
    });
  }, []);

  const handleAddStoragePattern = useCallback((pattern: string) => {
    setStorageIgnoredPatterns((prev) => new Set([...prev, pattern]));
  }, []);

  // Auto-focus search input when activated
  useEffect(() => {
    if (isSearchActive) {
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isSearchActive]);

  const handleCopyStorage = useCallback(async () => {
    const allKeys = storageDataRef.current;

    // Calculate stats
    const stats = {
      valid: allKeys.filter(k =>
        k.status === 'required_present' || k.status === 'optional_present'
      ).length,
      missing: allKeys.filter(k => k.status === 'required_missing').length,
      issues: allKeys.filter(k =>
        k.status === 'required_wrong_value' || k.status === 'required_wrong_type'
      ).length,
      total: allKeys.length,
    };

    // Group by storage type
    const asyncKeys = allKeys.filter(k => k.storageType === 'async');
    const mmkvKeys = allKeys.filter(k => k.storageType === 'mmkv');
    const secureKeys = allKeys.filter(k => k.storageType === 'secure');

    // Build structured export
    const exportData = {
      summary: {
        valid: stats.valid,
        missing: stats.missing,
        issues: stats.issues,
        total: stats.total,
        timestamp: new Date().toISOString(),
      },
      asyncStorage: asyncKeys.reduce((acc, k) => {
        acc[k.key] = k.value;
        return acc;
      }, {} as Record<string, unknown>),
      mmkv: mmkvKeys.reduce((acc, k) => {
        // Group by instance
        const instanceId = k.instanceId || 'default';
        if (!acc[instanceId]) acc[instanceId] = {};
        acc[instanceId][k.key] = k.value;
        return acc;
      }, {} as Record<string, Record<string, unknown>>),
      secure: secureKeys.reduce((acc, k) => {
        acc[k.key] = k.value;
        return acc;
      }, {} as Record<string, unknown>),
    };

    const serialized = JSON.stringify(exportData, null, 2);
    await copyToClipboard(serialized);
  }, []);

  const handlePurgeStorage = useCallback(async () => {
    Alert.alert(
      "Clear Storage",
      "Choose what to clear:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear App Storage",
          onPress: async () => {
            try {
              await clearAllAppStorage();
              // Refresh will be handled by GameUIStorageBrowser
            } catch (error) {
              Alert.alert("Error", "Failed to clear app storage");
            }
          },
        },
        {
          text: "Clear All (Including Dev Tools)",
          style: "destructive",
          onPress: async () => {
            try {
              await clearAllStorageIncludingDevTools();
              // Refresh will be handled by GameUIStorageBrowser
            } catch (error) {
              Alert.alert("Error", "Failed to clear all storage");
            }
          },
        },
      ]
    );
  }, []);

  const getValueType = (
    value: unknown
  ): StorageKeyConversation["valueType"] => {
    const parsed = parseValue(value);
    if (parsed === null) return "null";
    if (parsed === undefined) return "undefined";
    if (Array.isArray(parsed)) return "array";
    if (typeof parsed === "boolean") return "boolean";
    if (typeof parsed === "number") return "number";
    if (typeof parsed === "string") return "string";
    if (typeof parsed === "object") return "object";
    return "undefined";
  };

  // Get all unique keys from events AND from AsyncStorage for filter view
  const [allStorageKeys, setAllStorageKeys] = useState<string[]>([]);

  useEffect(() => {
    const fetchAllKeys = async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        setAllStorageKeys([...keys].sort());
      } catch (error) {
        // Failed to fetch keys
      }
    };

    // Fetch all keys for both tabs when visible
    if (visible) {
      fetchAllKeys();
    }
  }, [visible]);

  const allEventKeys = useMemo(() => {
    // Combine storage keys with event keys for comprehensive filter view
    const keys = new Set<string>(allStorageKeys);
    events.forEach((event) => {
      if (event.data?.key) {
        keys.add(event.data.key);
      }
    });
    return Array.from(keys).sort();
  }, [events, allStorageKeys]);

  // Group events by key and create conversations
  const conversations = useMemo(() => {
    const keyMap = new Map<string, StorageKeyConversation>();

    events.forEach((event) => {
      if (!event.data?.key) return;

      const key = event.data.key;

      // Filter by enabled storage types
      if (!enabledStorageTypes.has(event.storageType)) return;

      // Filter out keys that match ignored patterns
      const shouldIgnore = Array.from(ignoredPatterns).some((pattern) =>
        key.includes(pattern)
      );

      if (shouldIgnore) return;

      const existing = keyMap.get(key);

      if (!existing) {
        keyMap.set(key, {
          key,
          lastEvent: event,
          events: [event],
          totalOperations: 1,
          currentValue: event.data.value,
          valueType: getValueType(event.data.value),
          storageTypes: new Set([event.storageType]),
        });
      } else {
        existing.events.push(event);
        existing.totalOperations++;
        existing.storageTypes.add(event.storageType);

        // Update last event if this one is newer
        if (event.timestamp > existing.lastEvent.timestamp) {
          existing.lastEvent = event;
          existing.currentValue = event.data.value;
          existing.valueType = getValueType(event.data.value);
        }
      }
    });

    // Convert to array and sort by last updated
    return Array.from(keyMap.values()).sort(
      (a, b) =>
        b.lastEvent.timestamp.getTime() - a.lastEvent.timestamp.getTime()
    );
  }, [events, ignoredPatterns, enabledStorageTypes]);

  // Get the live selected conversation from the current conversations array
  const selectedConversation = useMemo(() => {
    if (!selectedConversationKey) return null;
    return conversations.find((c) => c.key === selectedConversationKey) || null;
  }, [selectedConversationKey, conversations]);

  const getActionColor = (action: string) => {
    switch (action) {
      // AsyncStorage - Set operations
      case "setItem":
      case "multiSet":
        // MMKV - Set operations
        // falls through
      case "set.string":
      case "set.number":
      case "set.boolean":
      case "set.buffer":
        return macOSColors.semantic.success;

      // AsyncStorage - Remove operations
      case "removeItem":
      case "multiRemove":
      case "clear":
        // MMKV - Delete operations
        // falls through
      case "delete":
      case "clearAll":
        return macOSColors.semantic.error;

      // AsyncStorage - Merge operations
      case "mergeItem":
      case "multiMerge":
        return macOSColors.semantic.info;

      // MMKV - Get operations
      case "get.string":
      case "get.number":
      case "get.boolean":
      case "get.buffer":
        return macOSColors.semantic.warning;

      default:
        return macOSColors.text.muted;
    }
  };

  // FlatList optimization constants
  const END_REACHED_THRESHOLD = 0.8;

  // Stable keyExtractor for FlatList
  const keyExtractor = useCallback((item: StorageKeyConversation) => {
    return item.key;
  }, []);

  // Removed getItemType as it's FlatList-specific

  // Create stable ref for event handler
  const selectConversationRef = useRef<
    ((conversation: StorageKeyConversation) => void) | undefined
  >(undefined);
  selectConversationRef.current = handleConversationPress;

  // Stable renderItem with ref pattern
  const renderConversationItem = useCallback(
    ({ item }: { item: StorageKeyConversation }) => {
      return (
        <TouchableOpacity
          onPress={() => selectConversationRef.current?.(item)}
          style={styles.conversationItem}
        >
          <View style={styles.conversationHeader}>
            <Text style={styles.keyText} numberOfLines={1}>
              {item.key}
            </Text>
            <Text
              style={[
                styles.actionText,
                { color: getActionColor(item.lastEvent.action) },
              ]}
            >
              {translateStorageAction(item.lastEvent.action)}
            </Text>
          </View>
          <View style={styles.conversationDetails}>
            {item.storageTypes && Array.from(item.storageTypes).map((storageType) => (
              <StorageTypeBadge key={storageType} type={storageType} />
            ))}
            <ValueTypeBadge type={item.valueType} />
            <Text style={styles.operationCount}>
              {item.totalOperations} operation
              {item.totalOperations !== 1 ? "s" : ""}
            </Text>
            <Text style={styles.timestamp}>
              {formatRelativeTime(item.lastEvent.timestamp)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    []
  );

  if (!visible) return null;

  const persistenceKey = enableSharedModalDimensions
    ? devToolsStorageKeys.modal.root()
    : devToolsStorageKeys.storage.modal();

  const renderContent = () => {
    if (activeTab === "browser") {
      if (showStorageFilters) {
        return (
          <StorageFilterViewV2
            ignoredPatterns={storageIgnoredPatterns}
            onTogglePattern={handleToggleStoragePattern}
            onAddPattern={handleAddStoragePattern}
            availableKeys={allStorageKeys}
          />
        );
      }
      return (
        <StorageBrowserMode
          requiredStorageKeys={requiredStorageKeys}
          showFilters={showStorageFilters}
          ignoredPatterns={storageIgnoredPatterns}
          onTogglePattern={handleToggleStoragePattern}
          onAddPattern={handleAddStoragePattern}
          searchQuery={searchQuery}
          storageDataRef={storageDataRef}
        />
      );
    }

    // Events tab content
    if (selectedConversation) {
      return (
        <View style={styles.contentWrapper}>
          <StorageEventDetailContent
            conversation={selectedConversation}
            selectedEventIndex={selectedEventIndex}
            onEventIndexChange={setSelectedEventIndex}
            disableInternalFooter={true}
          />
        </View>
      );
    }

    if (showFilters) {
      return (
        <StorageEventFilterView
          ignoredPatterns={ignoredPatterns}
          onTogglePattern={handleTogglePattern}
          onAddPattern={handleAddPattern}
          availableKeys={allEventKeys}
          enabledStorageTypes={enabledStorageTypes}
          onToggleStorageType={handleToggleStorageType}
        />
      );
    }

    if (conversations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Database size={48} color={macOSColors.text.muted} />
          <Text style={styles.emptyTitle}>
            {isListening ? "No storage events yet" : "Event listener is paused"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isListening
              ? "Storage operations will appear here"
              : "Press play to start monitoring"}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={keyExtractor}
        onEndReachedThreshold={END_REACHED_THRESHOLD}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={10}
        scrollEnabled={false}
      />
    );
  };

  const footerNode = selectedConversation ? (
    <StorageEventDetailFooter
      conversation={selectedConversation}
      selectedEventIndex={selectedEventIndex}
      onEventIndexChange={setSelectedEventIndex}
    />
  ) : null;

  // Determine the appropriate back handler based on current view state
  const currentBackHandler = showStorageFilters
    ? () => setShowStorageFilters(false)
    : showFilters
    ? () => setShowFilters(false)
    : selectedConversation
    ? () => {
        setSelectedConversationKey(null);
        setSelectedEventIndex(0);
      }
    : onBack;

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      onBack={currentBackHandler}
      persistenceKey={persistenceKey}
      header={{
        showToggleButton: true,
        customContent: showStorageFilters ? (
          <ModalHeader>
            <ModalHeader.Navigation
              onBack={() => setShowStorageFilters(false)}
              onClose={onClose}
            />
            <ModalHeader.Content title="Filters" />
          </ModalHeader>
        ) : showFilters ? (
          <ModalHeader>
            <ModalHeader.Navigation
              onBack={() => setShowFilters(false)}
              onClose={onClose}
            />
            <ModalHeader.Content title="Event Filters" />
          </ModalHeader>
        ) : selectedConversation ? (
          <ModalHeader>
            <ModalHeader.Navigation
              onBack={() => {
                setSelectedConversationKey(null);
                setSelectedEventIndex(0);
              }}
              onClose={onClose}
            />
            <ModalHeader.Content title={selectedConversation.key} />
          </ModalHeader>
        ) : (
          <ModalHeader>
            {onBack && <ModalHeader.Navigation onBack={onBack} />}
            <ModalHeader.Content title="">
              {isSearchActive ? (
                <View style={styles.headerSearchContainer}>
                  <Search size={14} color={macOSColors.text.secondary} />
                  <TextInput
                    ref={searchInputRef}
                    style={styles.headerSearchInput}
                    placeholder="Search storage keys..."
                    placeholderTextColor={macOSColors.text.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={() => setIsSearchActive(false)}
                    onBlur={() => setIsSearchActive(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                  />
                  {searchQuery.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery("");
                        setIsSearchActive(false);
                      }}
                      style={styles.headerSearchClear}
                    >
                      <X size={14} color={macOSColors.text.secondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <TabSelector
                  tabs={[
                    {
                      key: "browser",
                      label: "Storage",
                    },
                    {
                      key: "events",
                      label: `Events${
                        events.length > 0 && activeTab !== "events"
                          ? ` (${events.length})`
                          : ""
                      }`,
                    },
                  ]}
                  activeTab={activeTab}
                  onTabChange={(tab) => setActiveTab(tab as TabType)}
                />
              )}
            </ModalHeader.Content>
            <ModalHeader.Actions onClose={onClose}>
              {activeTab === "browser" && !isSearchActive && (
                <>
                  <TouchableOpacity
                    onPress={() => setIsSearchActive(true)}
                    style={styles.iconButton}
                  >
                    <Search size={14} color={macOSColors.text.secondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleToggleStorageFilters}
                    style={[
                      styles.iconButton,
                      storageIgnoredPatterns.size > 0 &&
                        styles.activeFilterButton,
                    ]}
                  >
                    <Filter
                      size={14}
                      color={
                        storageIgnoredPatterns.size > 0
                          ? macOSColors.semantic.debug
                          : macOSColors.text.secondary
                      }
                    />
                  </TouchableOpacity>
                  {/* Copy and Delete buttons moved to StorageActionButtons component */}
                </>
              )}
              {activeTab === "events" && (
                <>
                  <TouchableOpacity
                    onPress={handleToggleFilters}
                    style={[
                      styles.iconButton,
                      ignoredPatterns.size > 0 && styles.activeFilterButton,
                    ]}
                  >
                    <Filter
                      size={14}
                      color={
                        ignoredPatterns.size > 0
                          ? macOSColors.semantic.debug
                          : macOSColors.text.secondary
                      }
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleToggleListening}
                    style={[
                      styles.iconButton,
                      isListening && styles.activeButton,
                    ]}
                  >
                    {isListening ? (
                      <Pause size={14} color={macOSColors.semantic.success} />
                    ) : (
                      <Play size={14} color={macOSColors.semantic.success} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleClearEvents}
                    style={styles.iconButton}
                  >
                    <Trash2 size={14} color={macOSColors.semantic.error} />
                  </TouchableOpacity>
                </>
              )}
            </ModalHeader.Actions>
          </ModalHeader>
        ),
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
      footer={footerNode}
      footerHeight={footerNode ? 68 : 0}
    >
      {renderContent()}
    </JsModal>
  );
}

const styles = StyleSheet.create({
  headerSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: macOSColors.background.input,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    maxHeight: 32,
  },
  headerSearchInput: {
    flex: 1,
    color: macOSColors.text.primary,
    fontSize: 13,
    marginLeft: 6,
    paddingVertical: 2,
  },
  headerSearchClear: {
    marginLeft: 6,
    padding: 4,
  },

  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },

  activeButton: {
    backgroundColor: macOSColors.semantic.successBackground,
  },

  activeFilterButton: {
    backgroundColor: macOSColors.semantic.infoBackground,
  },

  conversationItem: {
    padding: 12,
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    marginHorizontal: 16,
  },

  conversationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  keyText: {
    color: macOSColors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
    fontFamily: "monospace",
  },

  actionText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },

  conversationDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  operationCount: {
    color: macOSColors.text.secondary,
    fontSize: 11,
    flex: 1,
    fontFamily: "monospace",
  },

  timestamp: {
    color: macOSColors.text.muted,
    fontSize: 11,
    fontFamily: "monospace",
  },

  separator: {
    height: 8,
  },

  listContent: {
    paddingVertical: 16,
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  emptyTitle: {
    color: macOSColors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  emptySubtitle: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },

  eventNavigation: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },

  navButton: {
    padding: 4,
    borderRadius: 4,
  },

  navButtonDisabled: {
    opacity: 0.3,
  },

  eventCounter: {
    color: macOSColors.text.primary,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "monospace",
    paddingHorizontal: 8,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  keyNameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: macOSColors.background.input,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.input,
    height: 28,
  },

  keyNameText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.semantic.debug,
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },

  contentWrapper: {
    flex: 1,
  },
});
