/**
 * Safe AsyncStorage wrapper that handles missing dependencies gracefully.
 *
 * This wrapper allows the storage dev tools to work even when
 * @react-native-async-storage/async-storage is not installed in the host app.
 *
 * When AsyncStorage is not available:
 * - All operations return empty results or no-ops
 * - No errors are thrown
 * - The dev tools can still load (but storage features will be limited)
 */

let AsyncStorage: any = null;
let isAvailable = false;
let checkedAvailability = false;
let checkError: Error | null = null;

/**
 * Check if AsyncStorage is available in the host app
 * This handles three cases:
 * 1. Package not installed (module not found)
 * 2. Package installed but native module not linked (native module null)
 * 3. Package installed and working
 */
function checkAsyncStorageAvailability(): boolean {
  if (checkedAvailability) {
    return isAvailable;
  }

  try {
    // Attempt to require AsyncStorage
    // This might throw if:
    // - Package is not installed (module not found)
    // - Native module is not linked (RCTAsyncStorage is null)
    const AsyncStorageModule = require("@react-native-async-storage/async-storage");
    AsyncStorage = AsyncStorageModule?.default || AsyncStorageModule;

    // Verify it's actually usable (has the methods we need)
    if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
      isAvailable = true;
    } else {
      isAvailable = false;
      AsyncStorage = null;
    }
  } catch (error: any) {
    // Catch ALL errors:
    // - Module not found (package not installed)
    // - Native module errors (package installed but native not linked)
    // - Any other initialization errors
    checkError = error;
    isAvailable = false;
    AsyncStorage = null;
  }

  checkedAvailability = true;
  return isAvailable;
}

/**
 * Returns true if AsyncStorage is available in the host app
 */
export function isAsyncStorageAvailable(): boolean {
  return checkAsyncStorageAvailability();
}

/**
 * No-op AsyncStorage implementation for when the package is not installed
 */
const noOpAsyncStorage = {
  getItem: async (_key: string): Promise<string | null> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
  getAllKeys: async (): Promise<string[]> => [],
  multiGet: async (_keys: string[]): Promise<[string, string | null][]> => [],
  multiSet: async (_keyValuePairs: [string, string][]): Promise<void> => {},
  multiRemove: async (_keys: string[]): Promise<void> => {},
  clear: async (): Promise<void> => {},
  mergeItem: async (_key: string, _value: string): Promise<void> => {},
  multiMerge: async (_keyValuePairs: [string, string][]): Promise<void> => {},
};

/**
 * Safe AsyncStorage wrapper that provides no-op fallbacks when unavailable.
 *
 * Usage:
 * ```ts
 * import { safeAsyncStorage } from './utils/safeAsyncStorage';
 *
 * // This will work even if AsyncStorage is not installed
 * const value = await safeAsyncStorage.getItem('myKey');
 * ```
 */
export const safeAsyncStorage = new Proxy(noOpAsyncStorage, {
  get(_target, prop) {
    // Avoid triggering check for React internal properties or symbols
    if (typeof prop === "symbol" || prop.startsWith("_") || prop.startsWith("$$")) {
      return noOpAsyncStorage[prop as keyof typeof noOpAsyncStorage];
    }

    // Only check availability when actually accessing AsyncStorage methods
    try {
      checkAsyncStorageAvailability();

      if (isAvailable && AsyncStorage) {
        return AsyncStorage[prop];
      }
    } catch (error) {
      // If check throws for any reason, fall back to no-op
    }

    // Return no-op implementation
    return noOpAsyncStorage[prop as keyof typeof noOpAsyncStorage];
  },
});

/**
 * Get the actual AsyncStorage instance if available, or null if not.
 * Use this when you need to check if AsyncStorage is available before using it.
 *
 * @example
 * ```ts
 * const storage = getAsyncStorageInstance();
 * if (storage) {
 *   // AsyncStorage is available
 *   await storage.setItem('key', 'value');
 * } else {
 *   // AsyncStorage is not available, handle gracefully
 *   console.warn('AsyncStorage not available');
 * }
 * ```
 */
export function getAsyncStorageInstance(): any | null {
  checkAsyncStorageAvailability();
  return isAvailable ? AsyncStorage : null;
}
