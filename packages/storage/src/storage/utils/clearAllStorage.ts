import { isDevToolsStorageKey } from "@monorepo/shared";

// AsyncStorage will be loaded lazily
let AsyncStorageModule: {
  getAllKeys: () => Promise<readonly string[]>;
  multiRemove: (keys: readonly string[]) => Promise<void>;
  clear: () => Promise<void>;
} | null = null;
let asyncStorageLoadPromise: Promise<void> | null = null;

const loadAsyncStorage = async () => {
  if (asyncStorageLoadPromise) return asyncStorageLoadPromise;

  asyncStorageLoadPromise = (async () => {
    try {
      const module = await import("@react-native-async-storage/async-storage");
      AsyncStorageModule = module.default;
    } catch {
      console.warn("AsyncStorage not found. Cannot clear storage.");
    }
  })();

  return asyncStorageLoadPromise;
};

/**
 * Clear all storage data except dev tools keys
 * This preserves dev tool settings while clearing app data
 */
export async function clearAllAppStorage(): Promise<void> {
  try {
    await loadAsyncStorage();

    if (!AsyncStorageModule) {
      throw new Error("AsyncStorage not available");
    }

    // Get all keys
    const allKeys = await AsyncStorageModule.getAllKeys();

    if (!allKeys || allKeys.length === 0) {
      // No keys to clear
      return;
    }

    // Filter out dev tool keys - we don't want to clear those
    const keysToRemove = allKeys.filter(
      (key: string) => !isDevToolsStorageKey(key),
    );

    if (keysToRemove.length === 0) {
      // No app keys to clear (only dev tool keys found)
      return;
    }

    // Clearing ${keysToRemove.length} app storage keys

    // Remove all non-dev-tool keys
    await AsyncStorageModule.multiRemove(keysToRemove);

    // Successfully cleared app storage
  } catch (error) {
    console.error("[Storage] Failed to clear storage:", error);
    throw error;
  }
}

/**
 * Clear absolutely all storage data including dev tools
 * Use with caution - this will reset all dev tool settings
 */
export async function clearAllStorageIncludingDevTools(): Promise<void> {
  try {
    await loadAsyncStorage();

    if (!AsyncStorageModule) {
      throw new Error("AsyncStorage not available");
    }

    // Clear everything
    await AsyncStorageModule.clear();

    // Successfully cleared all storage including dev tools
  } catch (error) {
    console.error("[Storage] Failed to clear all storage:", error);
    throw error;
  }
}
