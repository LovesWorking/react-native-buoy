import { useState, useEffect, useCallback, FC } from "react";
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
  Globe,
  Info,
  ChevronRightIcon,
  safeGetItem,
  safeSetItem,
} from "@monorepo/shared";
import { JsModal, type ModalMode } from "@monorepo/shared";
import { gameUIColors } from "@monorepo/shared";
import { useSafeAreaInsets } from "@monorepo/shared/src/hooks/useSafeAreaInsets";
import { ModalHeader } from "@monorepo/shared";
import { TabSelector } from "@monorepo/shared";

const STORAGE_KEY = "@rn_better_dev_tools_settings";

const sanitizeFloating = (
  floating: DevToolsSettings["floatingTools"]
) => {
  const { userStatus, ...rest } = floating as Record<string, boolean> & {
    userStatus?: boolean;
  };
  return {
    ...rest,
    environment:
      floating.environment ??
      (rest.environment as boolean | undefined) ??
      true,
  };
};

const mergeWithDefaults = (
  defaults: DevToolsSettings,
  stored?: Partial<DevToolsSettings> | null
): DevToolsSettings => {
  if (!stored) return defaults;

  return {
    dialTools: {
      ...defaults.dialTools,
      ...(stored.dialTools ?? {}),
    },
    floatingTools: sanitizeFloating({
      ...defaults.floatingTools,
      ...(stored.floatingTools ?? {}),
    }),
  };
};

export interface DevToolsSettings {
  dialTools: Record<string, boolean>;
  floatingTools: Record<string, boolean> & {
    environment: boolean; // Special setting for environment indicator
  };
}

interface DevToolsSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: DevToolsSettings) => void;
  initialSettings?: DevToolsSettings;
  availableApps?: {
    id: string;
    name: string;
    slot?: "dial" | "row" | "both";
  }[];
}

// Generate default settings based on available apps
const generateDefaultSettings = (
  availableApps: {
    id: string;
    name: string;
    slot?: "dial" | "row" | "both";
  }[] = []
): DevToolsSettings => {
  const dialDefaults: Record<string, boolean> = {};
  const floatingDefaults: Record<string, boolean> = {};

  // Default enabled states for known tools
  const knownDefaults = {
    dial: {
      query: true,
      env: true,
      sentry: true,
      storage: true,
      wifi: true,
      network: true,
    },
    floating: {
      query: false,
      env: true,
      sentry: false,
      storage: false,
      wifi: false,
      network: false,
    },
  };

  for (const app of availableApps) {
    const { id, slot = "both" } = app;

    if (slot === "dial" || slot === "both") {
      dialDefaults[id] =
        knownDefaults.dial[id as keyof typeof knownDefaults.dial] ?? true;
    }

    if (slot === "row" || slot === "both") {
      floatingDefaults[id] =
        knownDefaults.floating[id as keyof typeof knownDefaults.floating] ??
        false;
    }
  }

  return {
    dialTools: dialDefaults,
    floatingTools: {
      ...floatingDefaults,
      environment: true, // Special setting for environment indicator
    },
  };
};

export const DevToolsSettingsModal: FC<DevToolsSettingsModalProps> = ({
  visible,
  onClose,
  onSettingsChange,
  initialSettings,
  availableApps = [],
}) => {
  const defaultSettings = generateDefaultSettings(availableApps);
  const [settings, setSettings] = useState<DevToolsSettings>(
    initialSettings || defaultSettings
  );
  const [activeTab, setActiveTab] = useState<"dial" | "floating">("dial");
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get("window").height;
  const screenWidth = Dimensions.get("window").width;
  const modalHeight = Math.floor(screenHeight * 0.33); // 1/3 of screen height
  const modalWidth = Math.min(screenWidth - 32, 400); // Modal width with padding

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await safeGetItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as DevToolsSettings;
        const merged = mergeWithDefaults(defaultSettings, parsed);
        setSettings(merged);
        return;
      }
      setSettings(defaultSettings);
    } catch (error) {
      console.error("Failed to load dev tools settings:", error);
      setSettings(defaultSettings);
    }
  };

  const saveSettings = async (newSettings: DevToolsSettings) => {
    try {
      await safeSetItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      onSettingsChange?.(newSettings);
      // Notify listeners (e.g., floating bubble) to refresh immediately
      settingsBus.emit(newSettings);
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
    if (!isCurrentlyEnabled && currentEnabled >= 6) {
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
    const descriptions: Record<string, string> = {
      query: "React Query inspector",
      env: "Environment variables debugger",
      sentry: "Sentry events viewer",
      storage: "AsyncStorage browser",
      wifi: "RQ online toggle",
      network: "Network request logger",
      environment: "Environment badge indicator",
    };
    return descriptions[tool] || "";
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
              color={color}
              glowColor={color}
              noBackground
            />
          );
        case "env":
          return (
            <EnvLaptopIcon
              size={16}
              color={color}
              glowColor={color}
              noBackground
            />
          );
        case "sentry":
          return (
            <SentryBugIcon
              size={16}
              color={color}
              glowColor={color}
              noBackground
            />
          );
        case "storage":
          return (
            <StorageStackIcon
              size={16}
              color={color}
              glowColor={color}
              noBackground
            />
          );
        case "wifi":
          return (
            <WifiCircuitIcon
              size={16}
              color={color}
              glowColor={color}
              strength={4}
              noBackground
            />
          );
        case "network":
          return <Globe size={16} color={color} />;
        case "environment":
          return <Info size={16} color={color} />;
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
            {/* Icon in colored circle */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: `${color}26`,
                  borderColor: `${color}66`,
                },
              ]}
            >
              {getToolIcon(keyName)}
            </View>

            {/* Title and description */}
            <View style={styles.toolInfo}>
              <Text style={styles.toolName}>
                {keyName.toUpperCase().replace("_", " ")}
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

  const renderContent = () => (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Show only the active tab's content */}
        {activeTab === "dial" ? (
          <View style={styles.section}>
            {(() => {
              const enabledCount = Object.values(settings.dialTools).filter(
                (v) => v
              ).length;
              const isAtLimit = enabledCount >= 6;

              return Object.entries(settings.dialTools).map(([key, value]) => {
                const isDisabled = !value && isAtLimit;
                return renderToolCard(key, value, isDisabled, () =>
                  toggleDialTool(key as keyof DevToolsSettings["dialTools"])
                );
              });
            })()}
          </View>
        ) : (
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
                ]}
                activeTab={activeTab}
                onTabChange={(tab) => setActiveTab(tab as "dial" | "floating")}
              />
            </ModalHeader.Content>
            <ModalHeader.Actions onClose={onClose} />
          </ModalHeader>
        ),
      }}
      initialMode="bottomSheet"
      onModeChange={handleModeChange}
      persistenceKey="devtools_settings"
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

// Basic default settings for the hook (when apps are not available)
const basicDefaultSettings: DevToolsSettings = {
  dialTools: {
    query: true,
    env: true,
    sentry: true,
    storage: true,
    wifi: true,
    network: true,
  },
  floatingTools: {
    query: false,
    env: true,
    sentry: false,
    storage: false,
    wifi: false,
    network: false,
    environment: true,
  },
};

// Hook to use settings
export const useDevToolsSettings = () => {
  const [settings, setSettings] =
    useState<DevToolsSettings>(basicDefaultSettings);

  const loadSettings = useCallback(async () => {
    try {
      const savedSettings = await safeGetItem(STORAGE_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings) as DevToolsSettings;
        const merged = mergeWithDefaults(basicDefaultSettings, parsed);
        setSettings(merged);
        return;
      }
      setSettings(basicDefaultSettings);
    } catch (error) {
      console.error("Failed to load dev tools settings:", error);
      setSettings(basicDefaultSettings);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    // Subscribe to settings changes
    const unsub = settingsBus.addListener((payload) => {
      try {
        if (payload) {
          setSettings(payload);
        }
      } catch {}
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
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
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
});
