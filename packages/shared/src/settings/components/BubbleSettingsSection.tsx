import { View, Text, StyleSheet, Switch, ScrollView } from "react-native";
import { Settings, EyeOff, Database } from "../../icons";
import { useState, useEffect } from "react";
import { CyberpunkSectionButton } from "../../ui/console/CyberpunkSectionButton";

import { devToolsStorageKeys } from "../../storage/devToolsStorageKeys";
import { safeGetItem, safeSetItem } from "../../utils/safeAsyncStorage";

const STORAGE_KEY = devToolsStorageKeys.bubble.settings();
const USER_PREFERENCES_KEY = devToolsStorageKeys.bubble.userPreferences();

export interface BubbleVisibilitySettings {
  showEnvironment: boolean;
  showQueryButton: boolean;
  showWifiToggle: boolean;
  showEnvButton: boolean;
  showSentryButton: boolean;
  showStorageButton: boolean;
}

const DEFAULT_SETTINGS: BubbleVisibilitySettings = {
  showEnvironment: true,
  showQueryButton: true,
  showWifiToggle: true,
  showEnvButton: false,
  showSentryButton: false,
  showStorageButton: false,
};

interface BubbleSettingsSectionProps {
  onPress?: () => void;
}

interface BubbleSettingsDetailProps {
  onSettingsChange?: (settings: BubbleVisibilitySettings) => void;
}

export function BubbleSettingsSection({ onPress }: BubbleSettingsSectionProps) {
  const [settings, setSettings] =
    useState<BubbleVisibilitySettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await safeGetItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load bubble settings:", error);
    }
  };

  const getVisibleCount = () => {
    return Object.values(settings).filter(Boolean).length;
  };

  return (
    <CyberpunkSectionButton
      id="bubble-settings"
      title="SETTINGS"
      subtitle={`${getVisibleCount()}/6 visible`}
      icon={Settings}
      iconColor="#10B981"
      iconBackgroundColor="rgba(16, 185, 129, 0.1)"
      onPress={onPress || (() => {})}
      index={5}
    />
  );
}

export function BubbleSettingsDetail({
  onSettingsChange,
}: BubbleSettingsDetailProps) {
  const [settings, setSettings] =
    useState<BubbleVisibilitySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await safeGetItem(STORAGE_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load bubble settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: BubbleVisibilitySettings) => {
    try {
      await safeSetItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
      // Trigger the callback to reload settings in the parent
      onSettingsChange?.(newSettings);
    } catch (error) {
      console.error("Failed to save bubble settings:", error);
    }
  };

  const handleToggle = async (key: keyof BubbleVisibilitySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };

    // Mark this preference as explicitly set by the user
    try {
      const prefsStored = await safeGetItem(USER_PREFERENCES_KEY);
      const currentPrefs = prefsStored ? JSON.parse(prefsStored) : {};

      const prefKey = key.replace("show", "hasSet");
      const updatedPrefs = {
        ...currentPrefs,
        [prefKey]: true,
      } as Record<string, boolean>;

      await safeSetItem(USER_PREFERENCES_KEY, JSON.stringify(updatedPrefs));
    } catch (error) {
      console.error("Failed to save user preference marker:", error);
    }

    saveSettings(newSettings);
  };

  if (isLoading) {
    return (
      <View style={styles.detailContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const settingsConfig = [
    {
      key: "showEnvironment" as keyof BubbleVisibilitySettings,
      label: "Environment Indicator",
      description: "Shows current environment (dev, staging, prod)",
      icon: <View style={[styles.indicator, { backgroundColor: "#10B981" }]} />,
    },
    {
      key: "showQueryButton" as keyof BubbleVisibilitySettings,
      label: "React Query Button",
      description: "Opens React Query dev tools",
      icon: <View style={[styles.indicator, { backgroundColor: "#F59E0B" }]} />,
    },
    {
      key: "showWifiToggle" as keyof BubbleVisibilitySettings,
      label: "WiFi",
      description: "Toggle WiFi for testing offline scenarios",
      icon: <View style={[styles.indicator, { backgroundColor: "#8B5CF6" }]} />,
    },
    {
      key: "showEnvButton" as keyof BubbleVisibilitySettings,
      label: "Environment Variables",
      description: "View and check environment variables",
      icon: <Settings size={16} color="#10B981" />,
    },
    {
      key: "showSentryButton" as keyof BubbleVisibilitySettings,
      label: "Sentry Events",
      description: "View captured Sentry events and errors",
      icon: <View style={[styles.indicator, { backgroundColor: "#a855f7" }]} />,
    },
    {
      key: "showStorageButton" as keyof BubbleVisibilitySettings,
      label: "Storage Browser",
      description: "Browse and inspect AsyncStorage data",
      icon: <Database size={16} color="#3B82F6" />,
    },
  ];

  return (
    <View style={styles.detailContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        sentry-label="ignore bubble settings scroll"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Developer Tools Settings</Text>
          <Text style={styles.headerDescription}>
            Configure bubble button visibility
          </Text>
        </View>

        <View style={styles.sectionDivider}>
          <Text style={styles.sectionTitle}>Bubble Button Visibility</Text>
        </View>

        <View style={styles.settingsList}>
          {settingsConfig.map((config) => (
            <View key={config.key} style={styles.settingItem}>
              <View style={styles.settingIconContainer}>{config.icon}</View>
              <View style={styles.settingContent}>
                <Text style={styles.settingLabel}>{config.label}</Text>
                <Text style={styles.settingDescription}>
                  {config.description}
                </Text>
              </View>
              <Switch
                sentry-label="ignore bubble settings section"
                value={settings[config.key]}
                onValueChange={() => handleToggle(config.key)}
                trackColor={{ false: "#4B5563", true: "#10B981" }}
                thumbColor={settings[config.key] ? "#fff" : "#9CA3AF"}
              />
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.noteContainer}>
            <EyeOff size={16} color="#9CA3AF" />
            <Text style={styles.noteText}>
              User status indicator is always visible and cannot be disabled
            </Text>
          </View>
          <Text style={styles.restartNote}>
            Changes are saved automatically and will persist across app restarts
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

export async function getBubbleVisibilitySettings(): Promise<BubbleVisibilitySettings> {
  try {
    const stored = await safeGetItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load bubble settings:", error);
  }
  return DEFAULT_SETTINGS;
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  sectionCard: {
    backgroundColor: "#1F2937",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  chevron: {
    color: "#6B7280",
    fontSize: 20,
  },
  detailContainer: {
    flex: 1,
    backgroundColor: "#171717",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTitle: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  headerDescription: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  settingsList: {
    padding: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  settingDescription: {
    color: "#6B7280",
    fontSize: 11,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  noteText: {
    color: "#9CA3AF",
    fontSize: 12,
    flex: 1,
  },
  restartNote: {
    color: "#6B7280",
    fontSize: 11,
    fontStyle: "italic",
  },
  sectionDivider: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  sectionTitle: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
