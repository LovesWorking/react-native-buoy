import AsyncStorage from "@react-native-async-storage/async-storage";
import { isDevToolsStorageKey } from "@react-buoy/shared-ui";

/**
 * Clear all storage data except dev tools keys
 * This preserves dev tool settings while clearing app data
 */
export async function clearAllAppStorage(): Promise<void> {
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();

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
    await AsyncStorage.multiRemove(keysToRemove);

    // Successfully cleared app storage
  } catch (error) {
    throw error;
  }
}

/**
 * Clear absolutely all storage data including dev tools
 * Use with caution - this will reset all dev tool settings
 */
export async function clearAllStorageIncludingDevTools(): Promise<void> {
  try {
    // Clear everything
    await AsyncStorage.clear();

    // Successfully cleared all storage including dev tools
  } catch (error) {
    throw error;
  }
}
