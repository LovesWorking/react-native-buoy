import { safeGetItem, safeSetItem } from '@react-buoy/shared-ui';
import type { StorageAdapter } from './storage.types';

/**
 * React Native storage adapter using AsyncStorage via safeGetItem/safeSetItem
 *
 * Uses the existing safe storage utilities from @react-buoy/shared-ui
 * which handle AsyncStorage operations with proper error handling.
 */
export const rnStorageAdapter: StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await safeGetItem(key);
    } catch (error) {
      console.warn(`[RNStorage] Failed to get item "${key}":`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await safeSetItem(key, value);
    } catch (error) {
      console.warn(`[RNStorage] Failed to set item "${key}":`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    console.warn(`[RNStorage] removeItem not implemented for key "${key}"`);
    // Note: Implement if safeRemoveItem becomes available in @react-buoy/shared-ui
  },
};
