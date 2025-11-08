import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage method signatures - matching the actual AsyncStorage API
type AsyncStorageSetItem = (key: string, value: string) => Promise<void>;
type AsyncStorageRemoveItem = (key: string) => Promise<void>;
type AsyncStorageMergeItem = (key: string, value: string) => Promise<void>;
type AsyncStorageClear = () => Promise<void>;
type AsyncStorageMultiSet = (
  keyValuePairs: readonly (readonly [string, string])[]
) => Promise<void>;
type AsyncStorageMultiRemove = (keys: readonly string[]) => Promise<void>;
type AsyncStorageMultiMerge = (
  keyValuePairs: readonly (readonly [string, string])[]
) => Promise<void>;

// Event types for AsyncStorage operations
export interface AsyncStorageEvent {
  action:
    | "setItem"
    | "removeItem"
    | "mergeItem"
    | "clear"
    | "multiSet"
    | "multiRemove"
    | "multiMerge";
  timestamp: Date;
  data?: {
    key?: string;
    value?: string;
    keys?: string[];
    pairs?: [string, string][];
  };
}

export type AsyncStorageEventListener = (event: AsyncStorageEvent) => void;

/**
 * Singleton class for intercepting and monitoring AsyncStorage operations
 *
 * This class uses method swizzling to intercept all AsyncStorage operations
 * (setItem, removeItem, mergeItem, clear, multiSet, multiRemove, multiMerge)
 * and emits events to registered listeners. It maintains the original functionality
 * while providing observability for debugging and development tools.
 *
 * @example
 * ```typescript
 * // Start listening to all AsyncStorage operations
 * startListening();
 *
 * // Add a listener for storage events
 * const unsubscribe = addListener((event) => {
 *   console.log(`${event.action}:`, event.data);
 * });
 *
 * // Clean up
 * unsubscribe();
 * stopListening();
 * ```
 *
 * @performance Uses method interception rather than polling for zero-overhead when inactive
 * @performance Includes key filtering to prevent dev tools from triggering self-events
 */
class AsyncStorageListener {
  private listeners: AsyncStorageEventListener[] = [];
  private isListening = false;
  private isInitialized = false;

  // Keys to ignore for dev tools to prevent self-triggering
  // Only ignore specific keys that would cause infinite loops in the storage browser
  private ignoredKeys = new Set([
    "@react_buoy_storage_event_filters", // Storage events filter settings
    "@react_buoy_storage_key_filters", // Storage browser key filters
    "@react_buoy_storage_is_monitoring", // Storage monitoring toggle
    "REACT_QUERY_OFFLINE_CACHE", // React Query cache
  ]);

  // Store original methods
  private originalSetItem: AsyncStorageSetItem | null = null;
  private originalRemoveItem: AsyncStorageRemoveItem | null = null;
  private originalMergeItem: AsyncStorageMergeItem | null = null;
  private originalClear: AsyncStorageClear | null = null;
  private originalMultiSet: AsyncStorageMultiSet | null = null;
  private originalMultiRemove: AsyncStorageMultiRemove | null = null;
  private originalMultiMerge: AsyncStorageMultiMerge | null = null;

  /**
   * Determines if a storage key should be ignored to prevent infinite loops
   *
   * Dev tools often store their own state in AsyncStorage, which would trigger
   * events and cause infinite loops or unnecessary noise.
   *
   * @param key - The storage key to check
   * @returns True if the key should be ignored, false otherwise
   */
  private shouldIgnoreKey(key: string): boolean {
    // Check exact matches
    if (this.ignoredKeys.has(key)) return true;

    // Check prefix matches
    for (const ignoredKey of this.ignoredKeys) {
      if (key.startsWith(ignoredKey)) return true;
    }

    return false;
  }

  /**
   * Initialize the listener by loading AsyncStorage and storing original methods
   *
   * This method performs safety checks to ensure we don't double-initialize
   * and verifies that AsyncStorage methods haven't already been swizzled.
   *
   * @returns Promise<boolean> - True if initialization succeeded, false otherwise
   *
   * @throws Will log errors if AsyncStorage is already swizzled by another instance
   */
  private async initialize() {
    if (this.isInitialized) {
      // Already initialized - skipping
      return true;
    }

    // Check if methods are already swizzled by checking the function name
    if (AsyncStorage.setItem.name === "swizzled_setItem") {
      // Don't store swizzled methods as originals
      return false;
    }

    // Store original methods (these should be the real AsyncStorage methods)
    this.originalSetItem = AsyncStorage.setItem.bind(AsyncStorage);
    this.originalRemoveItem = AsyncStorage.removeItem.bind(AsyncStorage);
    this.originalMergeItem = AsyncStorage.mergeItem.bind(AsyncStorage);
    this.originalClear = AsyncStorage.clear.bind(AsyncStorage);
    this.originalMultiSet = AsyncStorage.multiSet.bind(
      AsyncStorage
    ) as AsyncStorageMultiSet;
    this.originalMultiRemove = AsyncStorage.multiRemove.bind(
      AsyncStorage
    ) as AsyncStorageMultiRemove;
    this.originalMultiMerge = AsyncStorage.multiMerge
      ? (AsyncStorage.multiMerge.bind(AsyncStorage) as AsyncStorageMultiMerge)
      : null;

    // Original methods stored successfully
    this.isInitialized = true;

    return true;
  }

  /**
   * Restore original AsyncStorage methods to their unmodified state
   *
   * This method undoes the method swizzling by restoring the original
   * AsyncStorage methods that were saved during initialization.
   */
  private restoreOriginalMethods() {
    if (!AsyncStorage || !this.originalSetItem) {
      return;
    }

    AsyncStorage.setItem = this.originalSetItem;
    if (this.originalRemoveItem) {
      AsyncStorage.removeItem = this.originalRemoveItem;
    }
    if (this.originalMergeItem) {
      AsyncStorage.mergeItem = this.originalMergeItem;
    }
    if (this.originalClear) {
      AsyncStorage.clear = this.originalClear;
    }
    if (this.originalMultiSet) {
      AsyncStorage.multiSet = this.originalMultiSet;
    }
    if (this.originalMultiRemove) {
      AsyncStorage.multiRemove = this.originalMultiRemove;
    }
    if (this.originalMultiMerge) {
      AsyncStorage.multiMerge = this.originalMultiMerge;
    }
  }

  /**
   * Emit an AsyncStorage event to all registered listeners
   *
   * @param event - The AsyncStorage event to emit
   *
   * @performance Skips processing when no listeners are registered
   */
  private emit(event: AsyncStorageEvent) {
    // Skip emitting if there are no listeners
    if (this.listeners.length === 0) {
      return;
    }

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Error in event listener - continuing with others
      }
    });
  }

  /**
   * Start intercepting AsyncStorage operations by swizzling methods
   *
   * This method replaces all AsyncStorage methods with wrapped versions
   * that emit events while preserving the original functionality.
   *
   * @throws Will log errors if initialization fails or methods are already swizzled
   *
   * @performance Uses method swizzling for minimal runtime overhead
   * @performance Includes safety checks to prevent double-initialization
   */
  async startListening() {
    if (this.isListening) {
      return;
    }

    const initialized = await this.initialize();
    if (!initialized) {
      return;
    }

    // Check if methods are already swizzled (this can happen if initialize was called twice somehow)
    if (AsyncStorage && AsyncStorage.setItem.name === "swizzled_setItem") {
      this.restoreOriginalMethods();
    }

    // Starting to listen for AsyncStorage operations

    // Swizzle setItem
    const swizzled_setItem = async (key: string, value: string) => {
      // Only emit event if key is not ignored
      if (!this.shouldIgnoreKey(key)) {
        this.emit({
          action: "setItem",
          timestamp: new Date(),
          data: { key, value },
        });
      }

      return this.originalSetItem
        ? this.originalSetItem(key, value)
        : Promise.resolve();
    };
    Object.defineProperty(swizzled_setItem, "name", {
      value: "swizzled_setItem",
    });
    if (AsyncStorage) {
      AsyncStorage.setItem = swizzled_setItem;
    }

    // Swizzle removeItem
    if (AsyncStorage) {
      AsyncStorage.removeItem = async (key: string) => {
        // Intercepted removeItem

        // Only emit event if key is not ignored
        if (!this.shouldIgnoreKey(key)) {
          this.emit({
            action: "removeItem",
            timestamp: new Date(),
            data: { key },
          });
        } else {
          // Ignoring removeItem for ignored key
        }

        return this.originalRemoveItem
          ? this.originalRemoveItem(key)
          : Promise.resolve();
      };
    }

    // Swizzle mergeItem
    if (AsyncStorage) {
      AsyncStorage.mergeItem = async (key: string, value: string) => {
        // Intercepted mergeItem operation

        // Only emit event if key is not ignored
        if (!this.shouldIgnoreKey(key)) {
          this.emit({
            action: "mergeItem",
            timestamp: new Date(),
            data: { key, value },
          });
        } else {
          // Ignoring mergeItem for ignored key
        }

        return this.originalMergeItem
          ? this.originalMergeItem(key, value)
          : Promise.resolve();
      };
    }

    // Swizzle clear
    if (AsyncStorage) {
      AsyncStorage.clear = async () => {
        // Intercepted clear operation
        this.emit({
          action: "clear",
          timestamp: new Date(),
        });
        return this.originalClear ? this.originalClear() : Promise.resolve();
      };
    }

    // Swizzle multiSet
    if (AsyncStorage) {
      AsyncStorage.multiSet = async (
        keyValuePairs: readonly (readonly [string, string])[]
      ) => {
        // Intercepted multiSet operation with multiple pairs

        // Filter out ignored keys
        const filteredPairs = keyValuePairs.filter(
          ([key]) => !this.shouldIgnoreKey(key)
        );

        if (filteredPairs.length > 0) {
          this.emit({
            action: "multiSet",
            timestamp: new Date(),
            data: { pairs: filteredPairs as [string, string][] },
          });
        } else {
          // All keys in multiSet are ignored
        }

        return this.originalMultiSet
          ? this.originalMultiSet(keyValuePairs as [string, string][])
          : Promise.resolve();
      };
    }

    // Swizzle multiRemove
    if (AsyncStorage) {
      AsyncStorage.multiRemove = async (keys: readonly string[]) => {
        // Intercepted multiRemove operation with multiple keys

        // Filter out ignored keys
        const filteredKeys = keys.filter((key) => !this.shouldIgnoreKey(key));

        if (filteredKeys.length > 0) {
          this.emit({
            action: "multiRemove",
            timestamp: new Date(),
            data: { keys: filteredKeys as string[] },
          });
        } else {
          // All keys in multiRemove are ignored
        }

        return this.originalMultiRemove
          ? this.originalMultiRemove(keys as string[])
          : Promise.resolve();
      };
    }

    // Swizzle multiMerge if available
    if (this.originalMultiMerge && AsyncStorage) {
      AsyncStorage.multiMerge = async (
        keyValuePairs: readonly (readonly [string, string])[]
      ) => {
        // Intercepted multiMerge operation with multiple pairs

        // Filter out ignored keys
        const filteredPairs = keyValuePairs.filter(
          ([key]) => !this.shouldIgnoreKey(key)
        );

        if (filteredPairs.length > 0) {
          this.emit({
            action: "multiMerge",
            timestamp: new Date(),
            data: { pairs: filteredPairs as [string, string][] },
          });
        } else {
          // All keys in multiMerge are ignored
        }

        return this.originalMultiMerge
          ? this.originalMultiMerge(keyValuePairs as [string, string][])
          : Promise.resolve();
      };
    }

    this.isListening = true;
    // Started listening successfully
  }

  /**
   * Stop listening and restore original AsyncStorage methods
   *
   * This method undoes all method swizzling and restores AsyncStorage
   * to its original state.
   */
  stopListening() {
    if (!this.isListening) {
      return;
    }

    if (!AsyncStorage) {
      return;
    }

    // Stopping listener and restoring original methods

    // Restore original methods
    if (this.originalSetItem) {
      AsyncStorage.setItem = this.originalSetItem;
    }
    if (this.originalRemoveItem) {
      AsyncStorage.removeItem = this.originalRemoveItem;
    }
    if (this.originalMergeItem) {
      AsyncStorage.mergeItem = this.originalMergeItem;
    }
    if (this.originalClear) {
      AsyncStorage.clear = this.originalClear;
    }
    if (this.originalMultiSet) {
      AsyncStorage.multiSet = this.originalMultiSet;
    }
    if (this.originalMultiRemove) {
      AsyncStorage.multiRemove = this.originalMultiRemove;
    }
    if (this.originalMultiMerge) {
      AsyncStorage.multiMerge = this.originalMultiMerge;
    }

    this.isListening = false;
    // Stopped listening successfully
  }

  /**
   * Add a listener for AsyncStorage events
   *
   * @param listener - Callback function to handle AsyncStorage events
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * ```typescript
   * const unsubscribe = asyncStorageListener.addListener((event) => {
   *   console.log('Storage operation:', event.action, event.data);
   * });
   *
   * // Later, remove the listener
   * unsubscribe();
   * ```
   */
  addListener(listener: AsyncStorageEventListener) {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Remove all registered event listeners
   *
   * Clears the internal listeners array, stopping all event notifications.
   */
  removeAllListeners() {
    this.listeners = [];
    // Removed all listeners
  }

  /**
   * Check if the listener is currently active and intercepting operations
   *
   * @returns True if currently listening to AsyncStorage operations
   */
  get isActive() {
    return this.isListening;
  }

  /**
   * Get the number of currently registered event listeners
   *
   * @returns Number of active listeners
   */
  get listenerCount() {
    return this.listeners.length;
  }
}

/**
 * Singleton instance of AsyncStorageListener
 *
 * This ensures only one listener instance exists across the entire application,
 * preventing conflicts and duplicate event handling.
 */
const asyncStorageListener = new AsyncStorageListener();

/**
 * Start listening to AsyncStorage operations
 *
 * @returns Promise that resolves when listening starts successfully
 */
export const startListening = () => asyncStorageListener.startListening();

/**
 * Stop listening to AsyncStorage operations
 */
export const stopListening = () => asyncStorageListener.stopListening();

/**
 * Add an event listener for AsyncStorage operations
 *
 * @param listener - Callback function to handle events
 * @returns Unsubscribe function to remove the listener
 */
export const addListener = (listener: AsyncStorageEventListener) =>
  asyncStorageListener.addListener(listener);

/**
 * Remove all registered event listeners
 */
export const removeAllListeners = () =>
  asyncStorageListener.removeAllListeners();

/**
 * Check if currently listening to AsyncStorage operations
 *
 * @returns True if actively intercepting AsyncStorage methods
 */
export const isListening = () => asyncStorageListener.isActive;

/**
 * Get the current number of registered event listeners
 *
 * @returns Number of active listeners
 */
export const getListenerCount = () => asyncStorageListener.listenerCount;

/**
 * Export the singleton instance for advanced usage
 *
 * @example
 * ```typescript
 * import asyncStorageListener from './AsyncStorageListener';
 *
 * // Access advanced methods directly
 * if (asyncStorageListener.isActive) {
 *   console.log(`${asyncStorageListener.listenerCount} listeners active`);
 * }
 * ```
 */
export default asyncStorageListener;
