import { useState, useEffect, useCallback, useMemo, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { settingsBus } from "./settingsBus";
import {
  ReactQueryIcon,
  EnvLaptopIcon,
  SentryBugIcon,
  StorageStackIcon,
  WifiCircuitIcon,
  RouteMapIcon,
  StackPulseIcon,
  RenderCountIcon,
  BenchmarkIcon,
  Globe,
  Info,
  Layers,
  ChevronRightIcon,
  ChevronDown,
  SettingsIcon,
  safeGetItem,
  safeSetItem,
  getStorageBackendType,
  persistentStorage,
  Database,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  FileText,
  HardDrive,
  Copy,
  FileCode,
  copyToClipboard,
} from "@react-buoy/shared-ui";
import { useDefaultConfig } from "./DefaultConfigContext";
import type { DefaultFloatingConfig, DefaultDialConfig } from "./defaultConfig";
import { JsModal, type ModalMode, devToolsStorageKeys } from "@react-buoy/shared-ui";
import { gameUIColors } from "@react-buoy/shared-ui";
import { useSafeAreaInsets } from "@react-buoy/shared-ui";
import { ModalHeader } from "@react-buoy/shared-ui";
import { TabSelector } from "@react-buoy/shared-ui";

const STORAGE_KEY = "@react_buoy_dev_tools_settings";
const MAX_DIAL_SLOTS = 6;

const enforceDialLimit = (
  dialTools: Record<string, boolean>
): Record<string, boolean> => {
  let remaining = MAX_DIAL_SLOTS;
  const limited: Record<string, boolean> = {};

  for (const [id, enabled] of Object.entries(dialTools)) {
    if (enabled && remaining > 0) {
      limited[id] = true;
      remaining -= 1;
    } else {
      limited[id] = false;
    }
  }

  return limited;
};

const sanitizeFloating = (
  floating: DevToolsSettings["floatingTools"],
  allowedKeys?: string[]
) => {
  const { userStatus, environment, ...rest } = floating as Record<
    string,
    boolean
  > & {
    userStatus?: boolean;
    environment?: boolean;
  };

  const filteredEntries = allowedKeys
    ? Object.entries(rest).filter(([key]) => allowedKeys.includes(key))
    : Object.entries(rest);

  return {
    ...Object.fromEntries(filteredEntries),
    environment: environment ?? false,
  };
};

const mergeWithDefaults = (
  defaults: DevToolsSettings,
  stored?: Partial<DevToolsSettings> | null,
  options?: {
    allowedDialKeys?: string[];
    allowedFloatingKeys?: string[];
  }
): DevToolsSettings => {
  if (!stored) return defaults;

  const combinedDial = {
    ...defaults.dialTools,
    ...(stored.dialTools ?? {}),
  };
  const dialEntries = options?.allowedDialKeys
    ? Object.entries(combinedDial).filter(([key]) =>
        options.allowedDialKeys?.includes(key)
      )
    : Object.entries(combinedDial);
  const mergedDial = enforceDialLimit(Object.fromEntries(dialEntries));

  return {
    dialTools: mergedDial,
    floatingTools: sanitizeFloating(
      {
        ...defaults.floatingTools,
        ...(stored.floatingTools ?? {}),
      },
      options?.allowedFloatingKeys
    ),
    globalSettings: {
      enableSharedModalDimensions: false, // Default to false
      ...(stored.globalSettings ?? {}),
    },
  };
};

/**
 * Global settings that apply to all dev tools.
 * These settings override individual tool configurations.
 */
export interface GlobalDevToolsSettings {
  /**
   * When true, all modals share the same dimensions/position.
   * When false (default), each modal has its own independent persistence.
   * Priority: Settings UI > Prop override > Default (false)
   */
  enableSharedModalDimensions?: boolean;
}

/**
 * Serialized preferences that power the floating dev tools UI. Values persist across sessions
 * via AsyncStorage so teams can tailor which tools appear in the dial or floating row.
 */
export interface DevToolsSettings {
  /** Map of dial tool ids to enabled state (max slots enforced elsewhere). */
  dialTools: Record<string, boolean>;
  /** Map of floating tool ids to enabled state plus the environment indicator toggle. */
  floatingTools: Record<string, boolean> & {
    environment: boolean; // Special setting for environment indicator
  };
  /** Global settings that apply to all dev tools */
  globalSettings?: GlobalDevToolsSettings;
}

interface DevToolsSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: DevToolsSettings) => void;
  initialSettings?: DevToolsSettings;
  availableApps?: {
    id: string;
    name: string;
    description?: string;
    slot?: "dial" | "row" | "both";
  }[];
}

/**
 * Generate default settings based on available apps and optional team default configuration.
 *
 * @param availableApps - List of available apps from auto-discovery
 * @param defaultFloatingTools - Optional array of tool IDs to enable by default in floating bubble
 * @param defaultDialTools - Optional array of tool IDs to enable by default in dial menu
 */
const generateDefaultSettings = (
  availableApps: {
    id: string;
    name: string;
    description?: string;
    slot?: "dial" | "row" | "both";
  }[] = [],
  defaultFloatingTools?: DefaultFloatingConfig,
  defaultDialTools?: DefaultDialConfig
): DevToolsSettings => {
  const dialDefaults: Record<string, boolean> = {};
  const floatingDefaults: Record<string, boolean> = {};

  // Create sets for quick lookup of default-enabled tools
  // Cast to Set<string> to allow comparison with any tool ID (including custom tools)
  const enabledFloatingSet = new Set<string>(defaultFloatingTools ?? []);
  const enabledDialSet = new Set<string>(defaultDialTools ?? []);

  for (const app of availableApps) {
    const { id, slot = "both" } = app;

    if (slot === "dial" || slot === "both") {
      // Enable if in defaultDialTools, otherwise false
      dialDefaults[id] = enabledDialSet.has(id);
    }

    if (slot === "row" || slot === "both") {
      // Enable if in defaultFloatingTools, otherwise false
      floatingDefaults[id] = enabledFloatingSet.has(id);
    }
  }

  return {
    dialTools: enforceDialLimit(dialDefaults),
    floatingTools: {
      ...floatingDefaults,
      // Special: environment badge - check if 'environment' is in the floating defaults
      environment: enabledFloatingSet.has('environment'),
    },
    globalSettings: {
      enableSharedModalDimensions: false, // Default to false - each modal has its own persistence
    },
  };
};

/**
 * Configurable modal surface that lets engineers pick which dev tools appear in the dial and
 * floating row. Persists preferences and enforces slot limits for a consistent UX.
 */
export const DevToolsSettingsModal: FC<DevToolsSettingsModalProps> = ({
  visible,
  onClose,
  onSettingsChange,
  initialSettings,
  availableApps = [],
}) => {
  // Get team default configuration from context
  const { defaultFloatingTools, defaultDialTools } = useDefaultConfig();

  const defaultSettings = useMemo(
    () => generateDefaultSettings(availableApps, defaultFloatingTools, defaultDialTools),
    [availableApps, defaultFloatingTools, defaultDialTools]
  );
  const allowedDialKeys = useMemo(
    () => Object.keys(defaultSettings.dialTools),
    [defaultSettings]
  );
  const allowedFloatingKeys = useMemo(
    () =>
      Object.keys(defaultSettings.floatingTools).filter(
        (key) => key !== "environment"
      ),
    [defaultSettings]
  );
  const [settings, setSettings] = useState<DevToolsSettings>(
    initialSettings || defaultSettings
  );
  const [activeTab, setActiveTab] = useState<"dial" | "floating" | "settings">("dial");
  const [expandedSettings, setExpandedSettings] = useState<Set<string>>(new Set());
  const [storageBackend, setStorageBackend] = useState<"filesystem" | "asyncstorage" | "memory" | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [isStorageExpanded, setIsStorageExpanded] = useState(false);
  const [savedKeys, setSavedKeys] = useState<string[]>([]);
  const [savedKeysLoading, setSavedKeysLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportExpanded, setIsExportExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const modalHeight = Math.floor(screenHeight * 0.33); // 1/3 of screen height
  const modalWidth = Math.min(screenWidth - 32, 400); // Modal width with padding

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await safeGetItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as DevToolsSettings;
        const merged = mergeWithDefaults(defaultSettings, parsed, {
          allowedDialKeys,
          allowedFloatingKeys,
        });
        setSettings(merged);
        return;
      }
      setSettings(defaultSettings);
    } catch (error) {
      console.error("Failed to load dev tools settings:", error);
      setSettings(defaultSettings);
    }
  }, [defaultSettings, allowedDialKeys, allowedFloatingKeys]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Load storage backend type
  useEffect(() => {
    getStorageBackendType().then(setStorageBackend);
  }, []);

  // Load saved keys when storage card is expanded
  useEffect(() => {
    if (isStorageExpanded) {
      setSavedKeysLoading(true);
      persistentStorage.getAllKeys()
        .then((keys) => {
          setSavedKeys(keys.sort());
        })
        .catch(() => {
          setSavedKeys([]);
        })
        .finally(() => {
          setSavedKeysLoading(false);
        });
    }
  }, [isStorageExpanded]);

  const saveSettings = async (newSettings: DevToolsSettings) => {
    try {
      const limitedSettings: DevToolsSettings = {
        ...newSettings,
        dialTools: enforceDialLimit(newSettings.dialTools),
      };

      await safeSetItem(STORAGE_KEY, JSON.stringify(limitedSettings));
      setSettings(limitedSettings);
      onSettingsChange?.(limitedSettings);
      // Notify listeners (e.g., floating bubble) to refresh immediately
      settingsBus.emit(limitedSettings);
    } catch (error) {
      console.error("Failed to save dev tools settings:", error);
    }
  };

  const toggleDialTool = (tool: keyof DevToolsSettings["dialTools"]) => {
    const currentEnabled = Object.values(settings.dialTools).filter(
      (v) => v
    ).length;
    const isCurrentlyEnabled = settings.dialTools[tool];

    // If trying to enable and already at 6, don't allow
    if (!isCurrentlyEnabled && currentEnabled >= MAX_DIAL_SLOTS) {
      return; // Could also show a toast/alert here
    }

    const newSettings = {
      ...settings,
      dialTools: {
        ...settings.dialTools,
        [tool]: !settings.dialTools[tool],
      },
    };
    saveSettings(newSettings);
  };

  const toggleFloatingTool = (
    tool: keyof DevToolsSettings["floatingTools"]
  ) => {
    const newSettings = {
      ...settings,
      floatingTools: {
        ...settings.floatingTools,
        [tool]: !settings.floatingTools[tool],
      },
    };
    saveSettings(newSettings);
  };

  const toggleGlobalSetting = (
    setting: keyof NonNullable<DevToolsSettings["globalSettings"]>
  ) => {
    const newSettings = {
      ...settings,
      globalSettings: {
        ...settings.globalSettings,
        [setting]: !settings.globalSettings?.[setting],
      },
    };
    saveSettings(newSettings);
  };

  const handleClearStorage = async () => {
    setIsClearing(true);
    setClearSuccess(false);
    try {
      await persistentStorage.clear();
      setClearSuccess(true);
      // Reset settings to defaults after clearing
      setSettings(defaultSettings);
      settingsBus.emit(defaultSettings);
      // Reset success state after 2 seconds
      setTimeout(() => setClearSuccess(false), 2000);
    } catch (error) {
      console.error("Failed to clear storage:", error);
    } finally {
      setIsClearing(false);
    }
  };

  // Get the enabled tools as arrays for display and copy
  const enabledConfig = useMemo(() => {
    const enabledFloating = Object.entries(settings.floatingTools)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id);

    const enabledDial = Object.entries(settings.dialTools)
      .filter(([_, enabled]) => enabled)
      .map(([id]) => id);

    return { floating: enabledFloating, dial: enabledDial };
  }, [settings]);

  // Generate exportable code snippet from current settings
  // Only outputs the defaultFloatingTools and defaultDialTools props
  // so users can add them to their existing FloatingDevTools config
  const generateConfigCode = useCallback(() => {
    const { floating, dial } = enabledConfig;

    // Build only the default config props (not the full component)
    const props: string[] = [];

    if (floating.length > 0) {
      const floatingStr = floating.map(id => `'${id}'`).join(', ');
      props.push(`defaultFloatingTools={[${floatingStr}]}`);
    }

    if (dial.length > 0) {
      const dialStr = dial.map(id => `'${id}'`).join(', ');
      props.push(`defaultDialTools={[${dialStr}]}`);
    }

    if (props.length === 0) {
      return `// No tools enabled`;
    }

    return props.join('\n');
  }, [enabledConfig]);

  const handleCopyConfig = async () => {
    const code = generateConfigCode();
    const success = await copyToClipboard(code);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Modal is fixed to bottom sheet mode
  const handleModeChange = useCallback((_mode: ModalMode) => {
    // Mode changes handled by JsModal
  }, []);

  const getToolColor = (tool: string): string => {
    const colors: Record<string, string> = {
      query: gameUIColors.query,
      env: gameUIColors.env,
      sentry: gameUIColors.debug,
      storage: gameUIColors.storage,
      wifi: gameUIColors.network,
      network: gameUIColors.network,
      environment: gameUIColors.env,
    };
    return colors[tool] || gameUIColors.info;
  };

  const getToolDescription = (tool: string): string => {
    // Get description from availableApps
    const app = availableApps.find((a) => a.id === tool);
    if (app?.description) {
      return app.description;
    }
    if (tool === "environment") {
      return "Environment badge.";
    }
    return "";
  };

  const getToolLabel = (tool: string): string => {
    if (tool === "environment") {
      return "ENV BADGE";
    }
    const app = availableApps.find((a) => a.id === tool);
    return app?.name ?? tool.toUpperCase().replace(/_/g, " ");
  };

  // Glass + Neon Edge card renderer (variant 1 from showcase)
  const renderToolCard = (
    keyName: string,
    value: boolean,
    disabled: boolean,
    onToggle: () => void
  ) => {
    const color = getToolColor(keyName);
    const getToolIcon = (tool: string) => {
      switch (tool) {
        case "query":
          return (
            <ReactQueryIcon
              size={16}
              colorPreset="red"
              noBackground
            />
          );
        case "env":
          return (
            <EnvLaptopIcon
              size={16}
              colorPreset="green"
              noBackground
            />
          );
        case "sentry":
          return (
            <SentryBugIcon
              size={16}
              colorPreset="red"
              noBackground
            />
          );
        case "storage":
          return (
            <StorageStackIcon
              size={16}
              colorPreset="green"
              noBackground
            />
          );
        case "wifi":
        case "query-wifi-toggle": // Support both IDs for wifi toggle
          return (
            <WifiCircuitIcon
              size={16}
              colorPreset="green"
              strength={4}
              noBackground
            />
          );
        case "route-events":
          return (
            <RouteMapIcon
              size={16}
              colorPreset="orange"
              noBackground
            />
          );
        case "network":
          return <Globe size={16} color="#00D4FF" />;
        case "environment":
          return <EnvLaptopIcon size={16} colorPreset="green" noBackground />;
        case "debug-borders":
          return <Layers size={16} color="#10b981" />;
        case "highlight-updates":
          return <StackPulseIcon size={16} color="#10b981" />;
        case "highlight-updates-modal":
          return <RenderCountIcon size={16} color="#10b981" />;
        case "benchmark":
          return <BenchmarkIcon size={16} color="#F59E0B" />;
        default:
          return <Info size={16} color={color} />;
      }
    };

    return (
      <TouchableOpacity
        key={keyName}
        activeOpacity={disabled ? 1 : 0.85}
        onPress={() => !disabled && onToggle()}
        style={{ marginBottom: 10, opacity: disabled ? 0.6 : 1 }}
      >
        <View
          style={[
            styles.glassCard,
            {
              borderColor: `${color}40`,
              shadowColor: color,
              shadowOpacity: 0.2,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 0 },
            },
          ]}
        >
          <View style={styles.glassCardInner}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              {getToolIcon(keyName)}
            </View>

            {/* Title and description */}
            <View style={styles.toolInfo}>
              <Text style={styles.toolName}>
                {getToolLabel(keyName)}
                {disabled ? " (MAX 6)" : ""}
              </Text>
              <Text style={styles.toolDescription} numberOfLines={1}>
                {getToolDescription(keyName)}
              </Text>
            </View>

            {/* Pill toggle button */}
            <TouchableOpacity
              onPress={onToggle}
              disabled={disabled}
              activeOpacity={0.8}
              style={[
                styles.pillToggle,
                {
                  backgroundColor: value ? `${color}33` : "#1b2334",
                  borderColor: value ? `${color}88` : "#2a3550",
                  shadowColor: value ? color : "transparent",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: value ? 0.4 : 0,
                  shadowRadius: value ? 8 : 0,
                },
                disabled && { opacity: 0.5 },
              ]}
            >
              <Text
                style={[
                  styles.pillToggleText,
                  { color: value ? color : "#8CA2C8" },
                ]}
              >
                {value ? "ON" : "OFF"}
              </Text>
            </TouchableOpacity>

            {/* Chevron */}
            <ChevronRightIcon size={18} color="#7F91B2" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Toggle expanded state for a setting card
  const toggleSettingExpanded = (settingKey: string) => {
    setExpandedSettings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(settingKey)) {
        newSet.delete(settingKey);
      } else {
        newSet.add(settingKey);
      }
      return newSet;
    });
  };

  // Render a global setting toggle card with expandable description
  const renderGlobalSettingCard = (
    settingKey: keyof NonNullable<DevToolsSettings["globalSettings"]>,
    label: string,
    category: string,
    shortDescription: string,
    fullDescription: string,
    recommendation: string
  ) => {
    const value = settings.globalSettings?.[settingKey] ?? false;
    const isExpanded = expandedSettings.has(settingKey);
    const color = gameUIColors.info;

    return (
      <View key={settingKey} style={{ marginBottom: 10 }}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => toggleSettingExpanded(settingKey)}
          style={[
            styles.expandableCard,
            isExpanded && {
              borderColor: color,
              borderWidth: 2,
              shadowColor: color,
              shadowOpacity: 0.8,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 0 },
              elevation: 10,
              transform: [{ scale: 1.01 }],
            },
          ]}
        >
          {/* Header Row */}
          <View style={styles.expandableCardHeader}>
            {/* Category badge */}
            <View style={styles.expandableCardCategory}>
              <Text style={styles.expandableCardCategoryText}>{category}</Text>
            </View>

            {/* Title */}
            <View style={styles.expandableCardTitle}>
              <Text style={styles.expandableCardTitleText}>{label}</Text>
              {!isExpanded && (
                <Text style={styles.expandableCardSubtitle} numberOfLines={1}>
                  {shortDescription}
                </Text>
              )}
            </View>

            {/* Toggle and Chevron */}
            <View style={styles.expandableCardActions}>
              <TouchableOpacity
                onPress={() => toggleGlobalSetting(settingKey)}
                activeOpacity={0.8}
                style={[
                  styles.pillToggle,
                  {
                    backgroundColor: value ? `${gameUIColors.success}33` : "#1b2334",
                    borderColor: value ? `${gameUIColors.success}88` : "#2a3550",
                    shadowColor: value ? gameUIColors.success : "transparent",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: value ? 0.4 : 0,
                    shadowRadius: value ? 8 : 0,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillToggleText,
                    { color: value ? gameUIColors.success : "#8CA2C8" },
                  ]}
                >
                  {value ? "ON" : "OFF"}
                </Text>
              </TouchableOpacity>
              {isExpanded ? (
                <ChevronDown size={18} color="#7F91B2" />
              ) : (
                <ChevronRightIcon size={18} color="#7F91B2" />
              )}
            </View>
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <View style={styles.expandableCardBody}>
              <View style={styles.expandableCardSection}>
                <Text style={styles.expandableCardSectionTitle}>DESCRIPTION</Text>
                <Text style={styles.expandableCardSectionText}>{fullDescription}</Text>
              </View>
              <View style={styles.expandableCardSection}>
                <Text style={styles.expandableCardSectionTitle}>RECOMMENDATION</Text>
                <Text style={styles.expandableCardSectionText}>{recommendation}</Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Show only the active tab's content */}
        {activeTab === "dial" && (
          <View style={styles.section}>
            {(() => {
              const enabledCount = Object.values(settings.dialTools).filter(
                (v) => v
              ).length;
              const isAtLimit = enabledCount >= MAX_DIAL_SLOTS;

              return Object.entries(settings.dialTools).map(([key, value]) => {
                const isDisabled = !value && isAtLimit;
                return renderToolCard(key, value, isDisabled, () =>
                  toggleDialTool(key as keyof DevToolsSettings["dialTools"])
                );
              });
            })()}
          </View>
        )}
        {activeTab === "floating" && (
          <View style={styles.section}>
            {Object.entries(settings.floatingTools).map(([key, value]) =>
              renderToolCard(key, value, false, () =>
                toggleFloatingTool(
                  key as keyof DevToolsSettings["floatingTools"]
                )
              )
            )}
          </View>
        )}
        {activeTab === "settings" && (
          <View style={styles.section}>
            {/* Storage Status Card - Expandable */}
            <View style={[
              styles.storageStatusCard,
              isStorageExpanded && {
                borderColor: storageBackend === "filesystem" ? gameUIColors.success + "60" :
                  storageBackend === "asyncstorage" ? gameUIColors.warning + "60" :
                  gameUIColors.error + "60",
              }
            ]}>
              {/* Header - Tappable to expand */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsStorageExpanded(!isStorageExpanded)}
              >
                <View style={styles.storageStatusHeader}>
                  <View style={[
                    styles.storageStatusIcon,
                    {
                      backgroundColor: storageBackend === "filesystem" ? gameUIColors.success + "15" :
                        storageBackend === "asyncstorage" ? gameUIColors.warning + "15" :
                        gameUIColors.error + "15",
                    }
                  ]}>
                    <Database size={18} color={
                      storageBackend === "filesystem" ? gameUIColors.success :
                      storageBackend === "asyncstorage" ? gameUIColors.warning :
                      gameUIColors.error
                    } />
                  </View>
                  <View style={styles.storageStatusInfo}>
                    <Text style={styles.storageStatusLabel}>STORAGE TYPE</Text>
                    <View style={styles.storageStatusBadgeContainer}>
                      <View style={[
                        styles.storageStatusBadge,
                        {
                          backgroundColor: storageBackend === "filesystem" ? gameUIColors.success + "20" :
                            storageBackend === "asyncstorage" ? gameUIColors.warning + "20" :
                            gameUIColors.error + "20",
                          borderColor: storageBackend === "filesystem" ? gameUIColors.success + "60" :
                            storageBackend === "asyncstorage" ? gameUIColors.warning + "60" :
                            gameUIColors.error + "60",
                        }
                      ]}>
                        <Text style={[
                          styles.storageStatusBadgeText,
                          {
                            color: storageBackend === "filesystem" ? gameUIColors.success :
                              storageBackend === "asyncstorage" ? gameUIColors.warning :
                              gameUIColors.error,
                          }
                        ]}>
                          {storageBackend === "filesystem" ? "FILE SYSTEM" :
                           storageBackend === "asyncstorage" ? "ASYNC STORAGE" :
                           storageBackend === "memory" ? "MEMORY" : "LOADING..."}
                        </Text>
                      </View>
                      {storageBackend === "filesystem" && (
                        <CheckCircle2 size={14} color={gameUIColors.success} />
                      )}
                      {storageBackend === "asyncstorage" && (
                        <AlertTriangle size={14} color={gameUIColors.warning} />
                      )}
                      {storageBackend === "memory" && (
                        <AlertTriangle size={14} color={gameUIColors.error} />
                      )}
                    </View>
                  </View>
                  {isStorageExpanded ? (
                    <ChevronDown size={18} color={gameUIColors.muted} />
                  ) : (
                    <ChevronRightIcon size={18} color={gameUIColors.muted} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Status Description */}
              <Text style={styles.storageStatusDescription}>
                {storageBackend === "filesystem"
                  ? "Settings persist independently and survive AsyncStorage.clear() calls during logout."
                  : storageBackend === "asyncstorage"
                  ? "Settings may be lost if AsyncStorage is cleared during logout."
                  : storageBackend === "memory"
                  ? "Settings are stored in memory only and will be lost on app restart."
                  : "Checking storage backend..."}
              </Text>

              {/* Advice Hints */}
              {storageBackend === "asyncstorage" && (
                <View style={styles.adviceHint}>
                  <Zap size={14} color={gameUIColors.warning} />
                  <Text style={styles.adviceHintText}>
                    <Text style={styles.adviceHintBold}>Tip:</Text> Install{" "}
                    <Text style={styles.adviceHintCode}>expo-file-system</Text> to persist settings through logout flows.
                  </Text>
                </View>
              )}

              {storageBackend === "memory" && (
                <View style={styles.adviceHintsContainer}>
                  <View style={[styles.adviceHint, { backgroundColor: gameUIColors.error + "10" }]}>
                    <AlertTriangle size={14} color={gameUIColors.error} />
                    <Text style={[styles.adviceHintText, { color: gameUIColors.error }]}>
                      <Text style={styles.adviceHintBold}>No persistent storage available!</Text> Settings will reset on every app restart.
                    </Text>
                  </View>
                  <View style={styles.adviceHint}>
                    <Zap size={14} color={gameUIColors.info} />
                    <Text style={styles.adviceHintText}>
                      <Text style={styles.adviceHintBold}>Best:</Text> Install{" "}
                      <Text style={styles.adviceHintCode}>expo-file-system</Text> for logout-safe persistence.
                    </Text>
                  </View>
                  <View style={styles.adviceHint}>
                    <HardDrive size={14} color={gameUIColors.muted} />
                    <Text style={styles.adviceHintText}>
                      <Text style={styles.adviceHintBold}>Alternative:</Text> Install{" "}
                      <Text style={styles.adviceHintCode}>@react-native-async-storage/async-storage</Text> for basic persistence.
                    </Text>
                  </View>
                </View>
              )}

              {/* Expanded Content - Saved Settings */}
              {isStorageExpanded && (
                <View style={styles.storageExpandedContent}>
                  <View style={styles.storageExpandedHeader}>
                    <FileText size={14} color={gameUIColors.info} />
                    <Text style={styles.storageExpandedTitle}>SAVED SETTINGS</Text>
                    <Text style={styles.storageExpandedCount}>
                      {savedKeysLoading ? "..." : `${savedKeys.length} keys`}
                    </Text>
                  </View>

                  {savedKeysLoading ? (
                    <Text style={styles.storageKeyItem}>Loading...</Text>
                  ) : savedKeys.length === 0 ? (
                    <Text style={styles.storageKeyItemEmpty}>No settings saved yet</Text>
                  ) : (
                    <View style={styles.storageKeysList}>
                      {savedKeys.map((key) => (
                        <View key={key} style={styles.storageKeyItem}>
                          <Text style={styles.storageKeyText} numberOfLines={1}>
                            {key.replace("@react_buoy_", "")}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Clear Button */}
              <TouchableOpacity
                style={[
                  styles.clearStorageButton,
                  isClearing && styles.clearStorageButtonDisabled,
                  clearSuccess && styles.clearStorageButtonSuccess,
                ]}
                onPress={handleClearStorage}
                disabled={isClearing}
                activeOpacity={0.7}
              >
                {clearSuccess ? (
                  <CheckCircle2 size={14} color={gameUIColors.success} />
                ) : (
                  <Trash2 size={14} color={isClearing ? gameUIColors.muted : gameUIColors.error} />
                )}
                <Text style={[
                  styles.clearStorageButtonText,
                  clearSuccess && { color: gameUIColors.success },
                  isClearing && { color: gameUIColors.muted },
                ]}>
                  {clearSuccess ? "CLEARED" : isClearing ? "CLEARING..." : "CLEAR ALL SETTINGS"}
                </Text>
              </TouchableOpacity>
            </View>

            {renderGlobalSettingCard(
              "enableSharedModalDimensions",
              "SHARED MODAL SIZE",
              "MODAL",
              "Sync dimensions across all tools",
              "When enabled, all tool modals will share the same size and position. Resizing one modal will affect all others. When disabled, each tool remembers its own size and position independently.",
              "Keep OFF for the best experience. This allows you to customize each tool's modal size separately. Enable only if you prefer uniform modal sizes across all dev tools."
            )}

            {/* Export Config Card */}
            <View style={styles.exportConfigCard}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setIsExportExpanded(!isExportExpanded)}
                style={styles.exportConfigHeader}
              >
                <View style={styles.exportConfigIconContainer}>
                  <FileCode size={18} color={gameUIColors.success} />
                </View>
                <View style={styles.exportConfigInfo}>
                  <Text style={styles.exportConfigLabel}>EXPORT CONFIG</Text>
                  <Text style={styles.exportConfigHint}>Save your settings to code</Text>
                </View>
                <View style={styles.exportConfigActions}>
                  {isExportExpanded ? (
                    <ChevronDown size={18} color={gameUIColors.muted} />
                  ) : (
                    <ChevronRightIcon size={18} color={gameUIColors.muted} />
                  )}
                </View>
              </TouchableOpacity>

              {/* Hint Banner */}
              <View style={styles.exportHintBanner}>
                <Zap size={14} color={gameUIColors.warning} />
                <Text style={styles.exportHintText}>
                  <Text style={styles.exportHintBold}>New!</Text> Configure your tools above, then export to set team defaults.
                </Text>
              </View>

              {/* Expanded Code Preview */}
              {isExportExpanded && (
                <View style={styles.exportCodeContainer}>
                  <View style={styles.exportCodeHeader}>
                    <Text style={styles.exportCodeTitle}>PROPS TO ADD</Text>
                  </View>

                  {/* JSON-like viewer for floating tools */}
                  {enabledConfig.floating.length > 0 && (
                    <View style={styles.exportJsonBlock}>
                      <Text style={styles.exportJsonProp}>defaultFloatingTools</Text>
                      <Text style={styles.exportJsonEquals}>=</Text>
                      <Text style={styles.exportJsonBracket}>{"{"}</Text>
                      <Text style={styles.exportJsonArrayBracket}>[</Text>
                      <View style={styles.exportJsonArrayContent}>
                        {enabledConfig.floating.map((id, index) => (
                          <View key={id} style={styles.exportJsonArrayItem}>
                            <Text style={styles.exportJsonString}>'{id}'</Text>
                            {index < enabledConfig.floating.length - 1 && (
                              <Text style={styles.exportJsonComma}>,</Text>
                            )}
                          </View>
                        ))}
                      </View>
                      <Text style={styles.exportJsonArrayBracket}>]</Text>
                      <Text style={styles.exportJsonBracket}>{"}"}</Text>
                    </View>
                  )}

                  {/* JSON-like viewer for dial tools */}
                  {enabledConfig.dial.length > 0 && (
                    <View style={[styles.exportJsonBlock, enabledConfig.floating.length > 0 && { marginTop: 8 }]}>
                      <Text style={styles.exportJsonProp}>defaultDialTools</Text>
                      <Text style={styles.exportJsonEquals}>=</Text>
                      <Text style={styles.exportJsonBracket}>{"{"}</Text>
                      <Text style={styles.exportJsonArrayBracket}>[</Text>
                      <View style={styles.exportJsonArrayContent}>
                        {enabledConfig.dial.map((id, index) => (
                          <View key={id} style={styles.exportJsonArrayItem}>
                            <Text style={styles.exportJsonString}>'{id}'</Text>
                            {index < enabledConfig.dial.length - 1 && (
                              <Text style={styles.exportJsonComma}>,</Text>
                            )}
                          </View>
                        ))}
                      </View>
                      <Text style={styles.exportJsonArrayBracket}>]</Text>
                      <Text style={styles.exportJsonBracket}>{"}"}</Text>
                    </View>
                  )}

                  {/* Empty state */}
                  {enabledConfig.floating.length === 0 && enabledConfig.dial.length === 0 && (
                    <View style={styles.exportJsonBlock}>
                      <Text style={styles.exportJsonComment}>// No tools enabled</Text>
                    </View>
                  )}

                  <Text style={styles.exportCodeDescription}>
                    Add these props to your existing{" "}
                    <Text style={styles.exportCodeInline}>{"<FloatingDevTools />"}</Text>
                    {" "}component to set team defaults.
                  </Text>
                </View>
              )}

              {/* Copy Button */}
              <TouchableOpacity
                style={[
                  styles.exportCopyButton,
                  copySuccess && styles.exportCopyButtonSuccess,
                ]}
                onPress={handleCopyConfig}
                activeOpacity={0.7}
              >
                {copySuccess ? (
                  <CheckCircle2 size={14} color={gameUIColors.success} />
                ) : (
                  <Copy size={14} color={gameUIColors.success} />
                )}
                <Text style={[
                  styles.exportCopyButtonText,
                  copySuccess && { color: gameUIColors.success },
                ]}>
                  {copySuccess ? "COPIED!" : "COPY CONFIG TO CLIPBOARD"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      header={{
        showToggleButton: false,
        customContent: (
          <ModalHeader>
            <ModalHeader.Content title="" noMargin>
              <TabSelector
                tabs={[
                  { key: "dial", label: "DIAL MENU" },
                  { key: "floating", label: "FLOATING" },
                  { key: "settings", label: "SETTINGS" },
                ]}
                activeTab={activeTab}
                onTabChange={(tab: string) =>
                  setActiveTab(tab as "dial" | "floating" | "settings")
                }
              />
            </ModalHeader.Content>
            <ModalHeader.Actions />
          </ModalHeader>
        ),
      }}
      initialMode="bottomSheet"
      onModeChange={handleModeChange}
      persistenceKey={devToolsStorageKeys.settings.root()}
      enablePersistence={false}
      maxHeight={screenHeight - insets.top}
      initialHeight={modalHeight}
      initialFloatingPosition={{
        x: (screenWidth - modalWidth) / 2,
        y: insets.top + 20,
      }}
      enableGlitchEffects={true}
    >
      {renderContent()}
    </JsModal>
  );
};

// Basic default settings for the hook (when apps are not available and no defaults configured)
const basicDefaultSettings: DevToolsSettings = {
  dialTools: {},
  floatingTools: {
    environment: false,
  },
  globalSettings: {
    enableSharedModalDimensions: false,
  },
};

/**
 * Creates default settings from the team configuration arrays.
 * Used by the hook when no stored settings exist.
 */
const createDefaultsFromConfig = (
  defaultFloatingTools?: DefaultFloatingConfig,
  defaultDialTools?: DefaultDialConfig
): DevToolsSettings => {
  const floatingSet = new Set(defaultFloatingTools ?? []);
  const dialSet = new Set(defaultDialTools ?? []);

  // Build dial tools record from defaults
  const dialTools: Record<string, boolean> = {};
  for (const id of dialSet) {
    dialTools[id] = true;
  }

  // Build floating tools record from defaults
  const floatingTools: Record<string, boolean> & { environment: boolean } = {
    environment: floatingSet.has('environment'),
  };
  for (const id of floatingSet) {
    if (id !== 'environment') {
      floatingTools[id] = true;
    }
  }

  return {
    dialTools: enforceDialLimit(dialTools),
    floatingTools,
    globalSettings: {
      enableSharedModalDimensions: false,
    },
  };
};

/**
 * Convenience hook for accessing persisted dev tools settings. Subscribes to the internal
 * event bus so all surfaces stay in sync when the modal saves new preferences.
 *
 * When no saved settings exist, the hook uses the default configuration from
 * the DefaultConfigProvider (if available) to determine initial tool states.
 */
export const useDevToolsSettings = () => {
  // Get team default configuration from context
  const { defaultFloatingTools, defaultDialTools } = useDefaultConfig();

  // Compute the effective defaults based on team configuration
  const effectiveDefaults = useMemo(() => {
    if (!defaultFloatingTools && !defaultDialTools) {
      return basicDefaultSettings;
    }
    return createDefaultsFromConfig(defaultFloatingTools, defaultDialTools);
  }, [defaultFloatingTools, defaultDialTools]);

  const [settings, setSettings] =
    useState<DevToolsSettings>(effectiveDefaults);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await safeGetItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as DevToolsSettings;
        const merged = mergeWithDefaults(effectiveDefaults, parsed);
        setSettings(merged);
        return;
      }
      // No saved settings - use the effective defaults (including team config)
      setSettings(effectiveDefaults);
    } catch (error) {
      console.error("Failed to load dev tools settings:", error);
      setSettings(effectiveDefaults);
    }
  }, [effectiveDefaults]);

  useEffect(() => {
    loadSettings();
    // Subscribe to settings changes
    const unsub = settingsBus.addListener((payload) => {
      try {
        if (payload) {
          setSettings(payload);
        }
      } catch (err) {
        // Listener errors are intentionally swallowed to avoid breaking subscribers
      }
    });
    return () => {
      unsub();
    };
  }, [loadSettings]);

  // Refresh settings when component using this hook becomes visible
  const refreshSettings = useCallback(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, refreshSettings };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameUIColors.background,
  },

  // Header styles matching React Query modal exactly
  headerContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  tabNavigationContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: gameUIColors.panel,
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    justifyContent: "space-evenly",
  },
  tabButton: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginHorizontal: 1,
  },
  tabButtonActive: {
    backgroundColor: gameUIColors.info + "20",
    borderWidth: 1,
    borderColor: gameUIColors.info + "40",
  },
  tabButtonInactive: {
    backgroundColor: "transparent",
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  tabButtonTextActive: {
    color: gameUIColors.info,
  },
  tabButtonTextInactive: {
    color: gameUIColors.muted,
  },

  // Scroll content
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIndicator: {
    width: 3,
    height: 16,
    borderRadius: 2,
    backgroundColor: gameUIColors.primary,
    marginRight: 8,
    shadowColor: gameUIColors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  sectionTitle: {
    flex: 1,
    color: gameUIColors.primary,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  sectionCount: {
    color: gameUIColors.secondary,
    fontSize: 11,
    opacity: 0.7,
  },

  // Tool Cards - Glass + Neon Edge variant
  glassCard: {
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#25324A",
  },
  glassCardInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconContainer: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    color: "#E6EEFF",
    fontWeight: "800",
    fontSize: 13,
  },
  toolDescription: {
    color: "#7F91B2",
    fontSize: 11,
  },
  pillToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillToggleText: {
    fontWeight: "700",
    fontSize: 11,
  },
  closeButton: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: gameUIColors.error + "1A",
    borderWidth: 1,
    borderColor: gameUIColors.error + "33",
  },
  closeButtonText: {
    color: gameUIColors.error,
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Expandable Settings Card styles
  expandableCard: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    padding: 12,
  },
  expandableCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expandableCardCategory: {
    backgroundColor: gameUIColors.info + "20",
    borderWidth: 1,
    borderColor: gameUIColors.info + "40",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandableCardCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.info,
    letterSpacing: 0.5,
  },
  expandableCardTitle: {
    flex: 1,
    paddingHorizontal: 4,
  },
  expandableCardTitleText: {
    fontFamily: "monospace",
    fontSize: 12,
    fontWeight: "700",
    color: gameUIColors.primary,
  },
  expandableCardSubtitle: {
    fontSize: 10,
    color: gameUIColors.muted,
    marginTop: 2,
  },
  expandableCardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandableCardBody: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.border + "30",
  },
  expandableCardSection: {
    marginBottom: 12,
  },
  expandableCardSectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.info,
    letterSpacing: 1,
    marginBottom: 6,
  },
  expandableCardSectionText: {
    fontSize: 12,
    color: gameUIColors.secondary,
    lineHeight: 18,
  },

  // Storage Status Card styles
  storageStatusCard: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    padding: 12,
    marginBottom: 10,
  },
  storageStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  storageStatusIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: gameUIColors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  storageStatusInfo: {
    flex: 1,
  },
  storageStatusLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.muted,
    letterSpacing: 1,
    marginBottom: 4,
  },
  storageStatusBadgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  storageStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  storageStatusBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  storageStatusDescription: {
    fontSize: 11,
    color: gameUIColors.muted,
    lineHeight: 16,
    marginBottom: 12,
  },
  clearStorageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: gameUIColors.error + "15",
    borderWidth: 1,
    borderColor: gameUIColors.error + "40",
  },
  clearStorageButtonDisabled: {
    opacity: 0.5,
  },
  clearStorageButtonSuccess: {
    backgroundColor: gameUIColors.success + "15",
    borderColor: gameUIColors.success + "40",
  },
  clearStorageButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: gameUIColors.error,
    letterSpacing: 0.5,
  },

  // Advice hints
  adviceHintsContainer: {
    gap: 8,
    marginBottom: 12,
  },
  adviceHint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: gameUIColors.warning + "10",
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  adviceHintText: {
    flex: 1,
    fontSize: 11,
    color: gameUIColors.secondary,
    lineHeight: 16,
  },
  adviceHintBold: {
    fontWeight: "700",
    color: gameUIColors.primary,
  },
  adviceHintCode: {
    fontFamily: "monospace",
    fontSize: 10,
    color: gameUIColors.info,
    backgroundColor: gameUIColors.info + "15",
    paddingHorizontal: 4,
    borderRadius: 3,
  },

  // Expanded storage content
  storageExpandedContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.border + "30",
  },
  storageExpandedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  storageExpandedTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.info,
    letterSpacing: 1,
    flex: 1,
  },
  storageExpandedCount: {
    fontSize: 10,
    color: gameUIColors.muted,
  },
  storageKeysList: {
    gap: 4,
    maxHeight: 150,
  },
  storageKeyItem: {
    backgroundColor: gameUIColors.background,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: gameUIColors.border + "30",
  },
  storageKeyItemEmpty: {
    fontSize: 11,
    color: gameUIColors.muted,
    fontStyle: "italic",
    paddingVertical: 8,
  },
  storageKeyText: {
    fontSize: 11,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
  },

  // Export Config Card styles
  exportConfigCard: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.success + "40",
    padding: 12,
    marginTop: 10,
  },
  exportConfigHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  exportConfigIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: gameUIColors.success + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  exportConfigInfo: {
    flex: 1,
  },
  exportConfigLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: gameUIColors.success,
    letterSpacing: 0.5,
  },
  exportConfigHint: {
    fontSize: 10,
    color: gameUIColors.muted,
    marginTop: 2,
  },
  exportConfigActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  exportHintBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: gameUIColors.warning + "10",
    borderRadius: 6,
    padding: 10,
    marginTop: 12,
  },
  exportHintText: {
    flex: 1,
    fontSize: 11,
    color: gameUIColors.secondary,
    lineHeight: 16,
  },
  exportHintBold: {
    fontWeight: "700",
    color: gameUIColors.warning,
  },
  exportCodeContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.border + "30",
  },
  exportCodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  exportCodeTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: gameUIColors.success,
    letterSpacing: 1,
  },
  exportCodeBlock: {
    backgroundColor: gameUIColors.background,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: gameUIColors.border + "30",
  },
  exportCodeText: {
    fontSize: 11,
    color: gameUIColors.primary,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  exportCodeDescription: {
    fontSize: 10,
    color: gameUIColors.muted,
    marginTop: 8,
    lineHeight: 14,
  },
  exportCodeInline: {
    fontFamily: "monospace",
    fontSize: 10,
    color: gameUIColors.info,
    backgroundColor: gameUIColors.info + "15",
    paddingHorizontal: 4,
    borderRadius: 3,
  },
  exportCopyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: gameUIColors.success + "15",
    borderWidth: 1,
    borderColor: gameUIColors.success + "40",
    marginTop: 12,
  },
  exportCopyButtonSuccess: {
    backgroundColor: gameUIColors.success + "25",
    borderColor: gameUIColors.success + "60",
  },
  exportCopyButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: gameUIColors.success,
    letterSpacing: 0.5,
  },

  // JSON-like viewer styles (syntax highlighting)
  exportJsonBlock: {
    backgroundColor: gameUIColors.background,
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: gameUIColors.border + "30",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
  },
  exportJsonProp: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.info, // Cyan for prop names
    fontWeight: "600",
  },
  exportJsonEquals: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.muted,
  },
  exportJsonBracket: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.warning, // Yellow for JSX brackets
  },
  exportJsonArrayBracket: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.primary,
  },
  exportJsonArrayContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 2,
  },
  exportJsonArrayItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  exportJsonString: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.success, // Green for strings
  },
  exportJsonComma: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.muted,
    marginRight: 4,
  },
  exportJsonComment: {
    fontSize: 12,
    fontFamily: "monospace",
    color: gameUIColors.muted,
    fontStyle: "italic",
  },
});
