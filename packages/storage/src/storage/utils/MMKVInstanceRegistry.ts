/**
 * MMKV Instance Registry
 *
 * Centralized registry for tracking all MMKV instances in the application.
 * Provides a singleton pattern to manage multiple MMKV instances and their metadata.
 */

// Use 'any' type for MMKV to avoid hard dependency on react-native-mmkv
type MMKV = any;

export interface MMKVInstanceInfo {
  id: string;
  instance: MMKV;
  encrypted: boolean;
  readOnly: boolean;
}

class MMKVInstanceRegistry {
  private instances = new Map<string, MMKVInstanceInfo>();

  /**
   * Register an MMKV instance for monitoring
   */
  register(id: string, instance: MMKV, config?: { encrypted?: boolean }): void {
    this.instances.set(id, {
      id,
      instance,
      encrypted: config?.encrypted ?? false,
      readOnly: instance.isReadOnly,
    });
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
 * Public API: Register an MMKV instance for dev tools monitoring
 *
 * @example
 * ```typescript
 * import { createMMKV } from 'react-native-mmkv';
 * import { registerMMKVInstance } from '@react-buoy/storage';
 *
 * const storage = createMMKV();
 * registerMMKVInstance('mmkv.default', storage);
 *
 * const secureStorage = createMMKV({ id: 'secure', encryptionKey: 'key' });
 * registerMMKVInstance('secure', secureStorage, { encrypted: true });
 * ```
 */
export function registerMMKVInstance(
  id: string,
  instance: MMKV,
  config?: { encrypted?: boolean }
): void {
  mmkvInstanceRegistry.register(id, instance, config);
}

/**
 * Public API: Unregister an MMKV instance
 */
export function unregisterMMKVInstance(id: string): void {
  mmkvInstanceRegistry.unregister(id);
}
