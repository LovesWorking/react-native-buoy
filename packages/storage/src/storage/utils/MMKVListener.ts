/**
 * MMKVListener - Hybrid Monitoring Strategy
 *
 * This module provides comprehensive monitoring for MMKV storage instances using
 * a hybrid approach that combines:
 *
 * 1. MMKV's built-in addOnValueChangedListener() - for write operations
 * 2. Method wrapping - for read operations and type detection
 *
 * Why Hybrid Strategy?
 * - MMKV listeners only fire on writes (set/delete), not reads
 * - MMKV listeners don't provide value type information
 * - Method wrapping captures ALL operations with full context
 * - Combining both gives complete observability
 *
 * Key Differences from AsyncStorage:
 * - Synchronous API (no async/await needed)
 * - Multi-instance support (track multiple MMKV instances)
 * - Native types (string, number, boolean, buffer)
 * - Built-in listener support (MMKV.addOnValueChangedListener)
 *
 * @see AsyncStorageListener.ts for AsyncStorage equivalent
 */

// Use 'any' type for MMKV to avoid hard dependency on react-native-mmkv
type MMKV = any;
import { detectMMKVType, MMKVValueType } from "./mmkvTypeDetection";

// MMKV method signatures
type MMKVSetString = (key: string, value: string) => void;
type MMKVSetNumber = (key: string, value: number) => void;
type MMKVSetBoolean = (key: string, value: boolean) => void;
type MMKVSetBuffer = (key: string, value: ArrayBuffer) => void;
type MMKVDelete = (key: string) => void;
type MMKVClearAll = () => void;
type MMKVGetString = (key: string) => string | undefined;
type MMKVGetNumber = (key: string) => number | undefined;
type MMKVGetBoolean = (key: string) => boolean | undefined;
type MMKVGetBuffer = (key: string) => ArrayBuffer | undefined;

/**
 * Event types for MMKV operations
 */
export interface MMKVEvent {
  action:
    | "set.string"
    | "set.number"
    | "set.boolean"
    | "set.buffer"
    | "delete"
    | "clearAll"
    | "get.string"
    | "get.number"
    | "get.boolean"
    | "get.buffer";
  timestamp: Date;
  instanceId: string; // MMKV instance identifier
  data?: {
    key?: string;
    value?: any;
    valueType?: MMKVValueType;
    success?: boolean; // For get operations - did key exist?
  };
}

export type MMKVEventListener = (event: MMKVEvent) => void;

/**
 * Instance tracking for MMKV monitoring
 */
interface MMKVInstanceTracking {
  instance: MMKV;
  instanceId: string;
  // Store original methods before wrapping
  originalMethods: {
    set: MMKVSetString;
    setNumber: MMKVSetNumber;
    setBoolean: MMKVSetBoolean;
    setBuffer: MMKVSetBuffer;
    delete: MMKVDelete;
    clearAll: MMKVClearAll;
    getString: MMKVGetString;
    getNumber: MMKVGetNumber;
    getBoolean: MMKVGetBoolean;
    getBuffer: MMKVGetBuffer;
  };
  // MMKV native listener
  nativeListenerUnsubscribe?: () => void;
}

/**
 * Singleton class for monitoring MMKV operations across multiple instances
 *
 * Uses a hybrid monitoring strategy:
 * 1. MMKV's built-in listener API for write notifications
 * 2. Method wrapping for read operations and type information
 *
 * @example
 * ```typescript
 * import { MMKV } from 'react-native-mmkv';
 * import { mmkvListener } from './MMKVListener';
 *
 * const storage = new MMKV();
 *
 * // Start monitoring this instance
 * mmkvListener.addInstance(storage, 'mmkv.default');
 *
 * // Add listener for all MMKV events
 * const unsubscribe = mmkvListener.addListener((event) => {
 *   console.log(`[${event.instanceId}] ${event.action}:`, event.data);
 * });
 *
 * // Cleanup
 * unsubscribe();
 * mmkvListener.removeInstance('mmkv.default');
 * ```
 */
class MMKVListener {
  private listeners: MMKVEventListener[] = [];
  private instances = new Map<string, MMKVInstanceTracking>();

  // Keys to ignore to prevent dev tools from triggering self-events
  private ignoredKeys = new Set([
    "@react_buoy_storage_event_filters",
    "@react_buoy_storage_key_filters",
    "@react_buoy_storage_is_monitoring",
    "REACT_QUERY_OFFLINE_CACHE",
  ]);

  /**
   * Determines if a storage key should be ignored
   */
  private shouldIgnoreKey(key: string): boolean {
    if (this.ignoredKeys.has(key)) return true;

    for (const ignoredKey of this.ignoredKeys) {
      if (key.startsWith(ignoredKey)) return true;
    }

    return false;
  }

  /**
   * Emit an MMKV event to all registered listeners
   */
  private emit(event: MMKVEvent) {
    if (this.listeners.length === 0) return;

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        // Error in MMKV event listener - continuing with others
      }
    });
  }

  /**
   * Add an MMKV instance for monitoring
   *
   * This method sets up both native MMKV listeners and method wrapping
   * to provide complete observability.
   *
   * @param instance - MMKV instance to monitor
   * @param instanceId - Unique identifier for this instance
   *
   * @example
   * ```typescript
   * const storage = new MMKV();
   * mmkvListener.addInstance(storage, 'mmkv.default');
   *
   * const secureStorage = new MMKV({ id: 'secure', encryptionKey: key });
   * mmkvListener.addInstance(secureStorage, 'secure');
   * ```
   */
  addInstance(instance: MMKV, instanceId: string): void {
    // Check if already monitoring this instance
    if (this.instances.has(instanceId)) {
      return;
    }

    // v4 COMPATIBILITY: Use ONLY native listener (no method wrapping)
    // react-native-mmkv v4 instances have frozen/read-only methods that cannot be wrapped
    // The native listener (addOnValueChangedListener) is sufficient for monitoring writes

    let nativeListenerUnsubscribe: (() => void) | undefined;

    if (typeof instance.addOnValueChangedListener === "function") {
      try {
        nativeListenerUnsubscribe = instance.addOnValueChangedListener(
          (key: string) => {
            // Ignore dev tools keys
            if (this.shouldIgnoreKey(key)) return;

            // Detect the value type
            const { value, type } = detectMMKVType(instance, key);

            // Determine action: if value is undefined/unknown, it was deleted
            const isDelete = type === "unknown" || value === undefined;

            if (isDelete) {
              // Key was deleted
              const event: MMKVEvent = {
                action: "delete",
                timestamp: new Date(),
                instanceId,
                data: {
                  key,
                  success: true,
                },
              };
              this.emit(event);
            } else {
              // Key was set/updated
              const action: MMKVEvent['action'] =
                type === "string"
                  ? "set.string"
                  : type === "number"
                  ? "set.number"
                  : type === "boolean"
                  ? "set.boolean"
                  : type === "buffer"
                  ? "set.buffer"
                  : "set.string"; // fallback

              const event: MMKVEvent = {
                action,
                timestamp: new Date(),
                instanceId,
                data: {
                  key,
                  value,
                  valueType: type,
                  success: true,
                },
              };
              this.emit(event);
            }
          }
        );
      } catch (error) {
        // Could not add native listener
      }
    }

    // Store instance tracking (no originalMethods needed for v4)
    this.instances.set(instanceId, {
      instance,
      instanceId,
      originalMethods: {} as any, // Not used in v4
      nativeListenerUnsubscribe,
    });
  }

  /**
   * Remove an MMKV instance from monitoring
   *
   * Restores original methods and removes native listener.
   *
   * @param instanceId - Identifier of instance to stop monitoring
   */
  removeInstance(instanceId: string): void {
    const tracked = this.instances.get(instanceId);
    if (!tracked) {
      return;
    }

    const { nativeListenerUnsubscribe } = tracked;

    // Remove native listener
    if (nativeListenerUnsubscribe) {
      nativeListenerUnsubscribe();
    }

    // Remove from tracking
    this.instances.delete(instanceId);
  }

  /**
   * Remove all monitored instances
   */
  removeAllInstances(): void {
    const instanceIds = Array.from(this.instances.keys());
    instanceIds.forEach((id) => this.removeInstance(id));
  }

  /**
   * Add a listener for MMKV events across all monitored instances
   *
   * @param listener - Callback function to handle MMKV events
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * ```typescript
   * const unsubscribe = mmkvListener.addListener((event) => {
   *   console.log(`[${event.instanceId}] ${event.action}:`, event.data);
   * });
   *
   * // Later, remove the listener
   * unsubscribe();
   * ```
   */
  addListener(listener: MMKVEventListener): () => void {
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
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Check if an instance is currently being monitored
   */
  hasInstance(instanceId: string): boolean {
    return this.instances.has(instanceId);
  }

  /**
   * Get list of all monitored instance IDs
   */
  getMonitoredInstances(): string[] {
    return Array.from(this.instances.keys());
  }

  /**
   * Get the number of currently monitored instances
   */
  get instanceCount(): number {
    return this.instances.size;
  }

  /**
   * Get the number of currently registered event listeners
   */
  get listenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Check if any instances are being monitored
   */
  get isActive(): boolean {
    return this.instances.size > 0;
  }
}

/**
 * Singleton instance of MMKVListener
 *
 * This ensures only one listener manager exists across the entire application.
 */
export const mmkvListener = new MMKVListener();

/**
 * Add an MMKV instance for monitoring
 *
 * @param instance - MMKV instance to monitor
 * @param instanceId - Unique identifier for this instance
 *
 * @example
 * ```typescript
 * import { MMKV } from 'react-native-mmkv';
 * import { addMMKVInstance } from '@react-buoy/storage';
 *
 * const storage = new MMKV();
 * addMMKVInstance(storage, 'mmkv.default');
 * ```
 */
export const addMMKVInstance = (instance: MMKV, instanceId: string) =>
  mmkvListener.addInstance(instance, instanceId);

/**
 * Remove an MMKV instance from monitoring
 */
export const removeMMKVInstance = (instanceId: string) =>
  mmkvListener.removeInstance(instanceId);

/**
 * Remove all monitored MMKV instances
 */
export const removeAllMMKVInstances = () => mmkvListener.removeAllInstances();

/**
 * Add an event listener for MMKV operations
 *
 * @param listener - Callback function to handle events
 * @returns Unsubscribe function to remove the listener
 */
export const addMMKVListener = (listener: MMKVEventListener) =>
  mmkvListener.addListener(listener);

/**
 * Remove all registered event listeners
 */
export const removeAllMMKVListeners = () => mmkvListener.removeAllListeners();

/**
 * Check if an MMKV instance is currently being monitored
 */
export const isMMKVInstanceMonitored = (instanceId: string) =>
  mmkvListener.hasInstance(instanceId);

/**
 * Get list of all monitored MMKV instance IDs
 */
export const getMonitoredMMKVInstances = () =>
  mmkvListener.getMonitoredInstances();

/**
 * Get the current number of monitored MMKV instances
 */
export const getMMKVInstanceCount = () => mmkvListener.instanceCount;

/**
 * Get the current number of registered event listeners
 */
export const getMMKVListenerCount = () => mmkvListener.listenerCount;

/**
 * Check if any MMKV instances are being monitored
 */
export const isMMKVListening = () => mmkvListener.isActive;

/**
 * Export the singleton instance for advanced usage
 */
export default mmkvListener;
