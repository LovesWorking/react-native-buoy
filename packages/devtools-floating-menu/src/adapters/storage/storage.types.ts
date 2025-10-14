/**
 * Platform-agnostic storage adapter interface
 *
 * Provides a consistent API for storing key-value pairs across platforms.
 * Implementations handle platform-specific storage mechanisms (AsyncStorage, localStorage, etc.)
 */
export interface StorageAdapter {
  /**
   * Retrieve a value from storage
   * @param key - The storage key
   * @returns The stored value or null if not found
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Store a value in storage
   * @param key - The storage key
   * @param value - The value to store (must be a string)
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove a value from storage
   * @param key - The storage key
   */
  removeItem(key: string): Promise<void>;
}
