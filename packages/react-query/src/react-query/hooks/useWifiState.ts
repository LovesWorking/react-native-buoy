import { useEffect, useState, useRef } from "react";
import { onlineManager } from "@tanstack/react-query";
import { devToolsStorageKeys, safeGetItem, safeSetItem } from "@react-buoy/shared-ui";

/**
 * Synchronizes a local Wi-Fi toggle with React Query’s `onlineManager`, persisting the selection
 * so developers can simulate offline mode across reloads.
 */
export function useWifiState() {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());
  const hasLoadedPersistedState = useRef(false);

  // Load persisted WiFi state on mount
  useEffect(() => {
    if (hasLoadedPersistedState.current) return;

    const loadPersistedState = async () => {
      try {
        const savedState = await safeGetItem(
          devToolsStorageKeys.settings.wifiEnabled(),
        );

        if (savedState !== null) {
          const isEnabled = savedState === "true";
          setIsOnline(isEnabled);
          onlineManager.setOnline(isEnabled);
        }

        hasLoadedPersistedState.current = true;
      } catch (error) {
        console.warn("Failed to load WiFi state:", error);
      }
    };

    loadPersistedState();
  }, []);

  // Save WiFi state when it changes
  const saveWifiState = async (enabled: boolean) => {
    try {
      await safeSetItem(
        devToolsStorageKeys.settings.wifiEnabled(),
        enabled.toString(),
      );
    } catch (error) {
      console.warn("Failed to save WiFi state:", error);
    }
  };

  const handleWifiToggle = () => {
    const newOnlineState = !isOnline;
    setIsOnline(newOnlineState);
    onlineManager.setOnline(newOnlineState);
    saveWifiState(newOnlineState);
  };

  // Listen to online manager changes to keep state in sync
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
      // Only save if we've already loaded the persisted state to avoid overwriting on mount
      if (hasLoadedPersistedState.current) {
        saveWifiState(online);
      }
    });

    return unsubscribe;
  }, []);

  return {
    isOnline,
    handleWifiToggle,
  };
}
