import { useState, useEffect } from "react";
import { BubbleVisibilitySettings } from "../../../../_sections/settings";

// AsyncStorage will be loaded lazily
type AsyncStorageType = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
} | null;

let AsyncStorageModule: AsyncStorageType = null;
let asyncStorageLoadPromise: Promise<void> | null = null;

const loadAsyncStorage = async () => {
  if (asyncStorageLoadPromise) return asyncStorageLoadPromise;

  asyncStorageLoadPromise = (async () => {
    try {
      const module = await import("@react-native-async-storage/async-storage");
      AsyncStorageModule = module.default;
    } catch {
      console.warn(
        "AsyncStorage not found. Bubble visibility settings will not persist across app restarts."
      );
    }
  })();

  return asyncStorageLoadPromise;
};

const STORAGE_KEY = "@dev_tools_bubble_settings";
const USER_PREFERENCES_KEY = "@dev_tools_user_has_set_preferences";

const DEFAULT_SETTINGS: BubbleVisibilitySettings = {
  showEnvironment: true,
  showQueryButton: true,
  showWifiToggle: true,
  showEnvButton: false,
  showSentryButton: false,
  showStorageButton: false,
};

// Track which settings the user has explicitly changed
type UserPreferences = {
  hasSetEnvironment?: boolean;
  hasSetQueryButton?: boolean;
  hasSetWifiToggle?: boolean;
  hasSetEnvButton?: boolean;
  hasSetSentryButton?: boolean;
  hasSetStorageButton?: boolean;
};

interface UseBubbleVisibilitySettingsProps {
  hideEnvironment?: boolean;
  hideUserStatus?: boolean;
  hideQueryButton?: boolean;
  hideWifiToggle?: boolean;
  hideEnvButton?: boolean;
  hideSentryButton?: boolean;
  hideStorageButton?: boolean;
}

export function useBubbleVisibilitySettings(
  props: UseBubbleVisibilitySettingsProps
) {
  const [settings, setSettings] =
    useState<BubbleVisibilitySettings>(DEFAULT_SETTINGS);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      await loadAsyncStorage();
      if (AsyncStorageModule) {
        const stored = await AsyncStorageModule.getItem(STORAGE_KEY);
        const prefsStored = await AsyncStorageModule.getItem(USER_PREFERENCES_KEY);
        
        if (stored) {
          const parsed = JSON.parse(stored);
          setSettings(parsed);
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
        
        if (prefsStored) {
          const parsedPrefs = JSON.parse(prefsStored);
          setUserPreferences(parsedPrefs);
        }
      }
    } catch (error) {
      console.error("Failed to load bubble visibility settings:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  // Smart Priority System:
  // 1. If user has explicitly set a preference in settings UI, use that
  // 2. Otherwise, use prop from parent (developer's default for environment)
  // 3. If no prop provided, use stored settings or defaults
  
  const effectiveSettings = {
    hideEnvironment:
      userPreferences.hasSetEnvironment
        ? !settings.showEnvironment  // User has explicitly set this
        : props.hideEnvironment !== undefined
        ? props.hideEnvironment      // Use developer's default
        : !settings.showEnvironment, // Use stored or default
        
    hideQueryButton:
      userPreferences.hasSetQueryButton
        ? !settings.showQueryButton  // User has explicitly set this
        : props.hideQueryButton !== undefined
        ? props.hideQueryButton      // Use developer's default
        : !settings.showQueryButton, // Use stored or default
        
    hideWifiToggle:
      userPreferences.hasSetWifiToggle
        ? !settings.showWifiToggle   // User has explicitly set this
        : props.hideWifiToggle !== undefined
        ? props.hideWifiToggle       // Use developer's default
        : !settings.showWifiToggle,  // Use stored or default
        
    hideEnvButton:
      userPreferences.hasSetEnvButton
        ? !settings.showEnvButton    // User has explicitly set this
        : props.hideEnvButton !== undefined
        ? props.hideEnvButton        // Use developer's default
        : !settings.showEnvButton,   // Use stored or default
        
    hideSentryButton:
      userPreferences.hasSetSentryButton
        ? !settings.showSentryButton // User has explicitly set this
        : props.hideSentryButton !== undefined
        ? props.hideSentryButton     // Use developer's default
        : !settings.showSentryButton,// Use stored or default
        
    hideStorageButton:
      userPreferences.hasSetStorageButton
        ? !settings.showStorageButton // User has explicitly set this
        : props.hideStorageButton !== undefined
        ? props.hideStorageButton     // Use developer's default
        : !settings.showStorageButton,// Use stored or default
  };

  // Logging removed to prevent infinite loops

  return {
    settings: effectiveSettings,
    isLoaded,
    reload: loadSettings,
  };
}
