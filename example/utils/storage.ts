import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Safe wrapper for AsyncStorage.getItem
 * Returns null if there's an error or the item doesn't exist
 */
export const safeGetItem = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get item from storage for key: ${key}`, error);
    return null;
  }
};

/**
 * Safe wrapper for AsyncStorage.setItem
 * Returns false if there's an error, true on success
 */
export const safeSetItem = async (key: string, value: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set item in storage for key: ${key}`, error);
    return false;
  }
};