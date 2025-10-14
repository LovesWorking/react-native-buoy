import type { StorageAdapter } from './storage.types';

/**
 * Web storage adapter using localStorage
 *
 * Provides persistent storage across browser sessions.
 * Falls back gracefully if localStorage is unavailable.
 */
export const webStorageAdapter: StorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn(`[WebStorage] Failed to get item "${key}":`, error);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[WebStorage] Failed to set item "${key}":`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[WebStorage] Failed to remove item "${key}":`, error);
    }
  },
};
