/**
 * MMKV Instance Registry
 *
 * Centralized registry for tracking all MMKV instances in the application.
 * Provides a singleton pattern to manage multiple MMKV instances and their metadata.
 *
 * @module MMKVInstanceRegistry
 * @since 1.0.0
 */

/**
 * Type-safe representation of an MMKV instance.
 * Uses conditional typing to avoid hard dependency on react-native-mmkv.
 *
 * @public
 */
export type MMKV = {
  /**
   * Set a value for the given key
   */
  set(key: string, value: boolean | string | number | ArrayBuffer): void;
  /**
   * Get a string value for the given key
   */
  getString(key: string): string | undefined;
  /**
   * Get a number value for the given key
   */
  getNumber(key: string): number | undefined;
  /**
   * Get a boolean value for the given key
   */
  getBoolean(key: string): boolean | undefined;
  /**
   * Get a buffer value for the given key
   */
  getBuffer(key: string): ArrayBuffer | undefined;
  /**
   * Check if a key exists
   */
  contains(key: string): boolean;
  /**
   * Delete a key
   */
  delete(key: string): boolean;
  /**
   * Get all keys
   */
  getAllKeys(): string[];
  /**
   * Clear all data
   */
  clearAll(): void;
  /**
   * Whether this instance is read-only
   */
  readonly isReadOnly: boolean;
  /**
   * Current storage size in bytes
   */
  readonly size: number;
};

/**
 * Metadata about a registered MMKV instance
 *
 * @public
 */
export interface MMKVInstanceInfo {
  /**
   * Unique identifier for this MMKV instance
   * @example "mmkv.default", "user-preferences", "secure-storage"
   */
  id: string;
  /**
   * The MMKV instance object
   */
  instance: MMKV;
  /**
   * Whether this instance uses encryption
   * @default false
   */
  encrypted: boolean;
  /**
   * Whether this instance is read-only
   * @default false
   */
  readOnly: boolean;
}

/**
 * Configuration options for registering an MMKV instance
 *
 * @public
 */
export interface MMKVRegistrationConfig {
  /**
   * Whether this instance uses encryption
   * Set to true if you provided an encryptionKey when creating the instance
   * @default false
   */
  encrypted?: boolean;
}

class MMKVInstanceRegistry {
  private instances = new Map<string, MMKVInstanceInfo>();

  /**
   * Register an MMKV instance for monitoring
   *
   * @param id - Unique identifier for this instance
   * @param instance - The MMKV instance to register
   * @param config - Optional configuration (e.g., encrypted flag)
   */
  register(id: string, instance: MMKV, config?: MMKVRegistrationConfig): void {
    const instanceInfo = {
      id,
      instance,
      encrypted: config?.encrypted ?? false,
      readOnly: instance.isReadOnly ?? false,
    };
    this.instances.set(id, instanceInfo);
  }

  /**
   * Unregister an MMKV instance
   */
  unregister(id: string): void {
    this.instances.delete(id);
  }

  /**
   * Get a specific instance by ID
   */
  get(id: string): MMKVInstanceInfo | undefined {
    return this.instances.get(id);
  }

  /**
   * Get all registered instances
   */
  getAll(): MMKVInstanceInfo[] {
    return Array.from(this.instances.values());
  }

  /**
   * Check if an instance is registered
   */
  has(id: string): boolean {
    return this.instances.has(id);
  }

  /**
   * Get count of registered instances
   */
  count(): number {
    return this.instances.size;
  }
}

// Singleton instance
export const mmkvInstanceRegistry = new MMKVInstanceRegistry();

/**
 * Register an MMKV instance with React Buoy DevTools for monitoring and debugging.
 *
 * **⚠️ REQUIRED**: Manual registration is required for `react-native-mmkv` v4.
 * Auto-detection is not possible due to Metro bundler and ES6 module limitations.
 *
 * Call this function immediately after creating each MMKV instance you want to monitor.
 * The DevTools will then be able to:
 * - Display all keys and values
 * - Show real-time updates when data changes
 * - Allow editing values directly from the DevTools
 * - Track storage size and performance
 *
 * @param id - Unique identifier for this MMKV instance. Should match the `id` you used when creating the instance.
 * @param instance - The MMKV instance returned from `createMMKV()`
 * @param config - Optional configuration
 * @param config.encrypted - Set to `true` if this instance uses encryption (has an `encryptionKey`)
 *
 * @example
 * **Basic usage:**
 * ```typescript
 * import { createMMKV } from 'react-native-mmkv';
 * import { registerMMKVInstance } from '@react-buoy/storage';
 *
 * // Create and register default instance
 * export const storage = createMMKV({ id: 'mmkv.default' });
 * registerMMKVInstance('mmkv.default', storage);
 * ```
 *
 * @example
 * **With encryption:**
 * ```typescript
 * import { createMMKV } from 'react-native-mmkv';
 * import { registerMMKVInstance } from '@react-buoy/storage';
 *
 * // Create encrypted instance
 * export const secureStorage = createMMKV({
 *   id: 'secure-storage',
 *   encryptionKey: 'my-encryption-key'
 * });
 *
 * // Register with encrypted flag
 * registerMMKVInstance('secure-storage', secureStorage, { encrypted: true });
 * ```
 *
 * @example
 * **Multiple instances:**
 * ```typescript
 * import { createMMKV } from 'react-native-mmkv';
 * import { registerMMKVInstance } from '@react-buoy/storage';
 *
 * // User preferences
 * export const userPrefs = createMMKV({ id: 'user-prefs' });
 * registerMMKVInstance('user-prefs', userPrefs);
 *
 * // Cache
 * export const cache = createMMKV({ id: 'cache' });
 * registerMMKVInstance('cache', cache);
 *
 * // Auth (encrypted)
 * export const auth = createMMKV({ id: 'auth', encryptionKey: 'key' });
 * registerMMKVInstance('auth', auth, { encrypted: true });
 * ```
 *
 * @public
 * @since 1.0.0
 */
export function registerMMKVInstance(
  id: string,
  instance: MMKV,
  config?: MMKVRegistrationConfig
): void {
  // Register in registry
  mmkvInstanceRegistry.register(id, instance, config);

  // DISABLED: Method wrapping doesn't work with react-native-mmkv v4 read-only instances
  // The instances returned by createMMKV() have frozen/read-only methods
  // We would need to use Proxy or other techniques, but for now we skip monitoring
  // TODO: Implement Proxy-based monitoring for v4 if needed
  /*
  // Add listener for real-time monitoring (CRITICAL: enables event emission)
  // Import mmkvListener dynamically to avoid circular dependency
  const { mmkvListener } = require('./MMKVListener');
  mmkvListener.addInstance(instance, id);
  */

  if (__DEV__) {
    console.log(
      `[React Buoy] Registered MMKV instance: ${id}`,
      config?.encrypted ? '(encrypted)' : ''
    );
  }
}

/**
 * Unregister an MMKV instance from DevTools monitoring.
 *
 * This stops the DevTools from tracking changes to this instance.
 * Typically not needed unless you're dynamically creating/destroying instances.
 *
 * @param id - The instance ID to unregister
 *
 * @example
 * ```typescript
 * unregisterMMKVInstance('cache');
 * ```
 *
 * @public
 * @since 1.0.0
 */
export function unregisterMMKVInstance(id: string): void {
  // Remove listener first
  const { mmkvListener } = require('./MMKVListener');
  mmkvListener.removeInstance(id);

  // Then remove from registry
  mmkvInstanceRegistry.unregister(id);

  if (__DEV__) {
    console.log(`[React Buoy] Unregistered MMKV instance: ${id}`);
  }
}
