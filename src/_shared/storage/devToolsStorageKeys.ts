/**
 * Centralized storage keys for all dev tools
 * This ensures consistency across all dev tool storage operations
 * and allows easy filtering of dev tool keys from the Storage Browser
 * 
 * All dev tool keys start with "@devtools" prefix for easy identification
 */
export const devToolsStorageKeys = {
  /**
   * Base dev tools key - all dev tool storage keys start with this
   */
  base: "@devtools" as const,

  /**
   * Bubble-related storage keys
   */
  bubble: {
    root: () => `${devToolsStorageKeys.base}_bubble` as const,
    settings: () => `${devToolsStorageKeys.bubble.root()}_settings` as const,
    userPreferences: () => `${devToolsStorageKeys.bubble.root()}_user_preferences` as const,
    position: () => `${devToolsStorageKeys.bubble.root()}_position` as const,
  },

  /**
   * Modal-related storage keys
   */
  modal: {
    root: () => `${devToolsStorageKeys.base}_modal` as const,
    state: () => `${devToolsStorageKeys.modal.root()}_state` as const,
    position: () => `${devToolsStorageKeys.modal.root()}_position` as const,
    dimensions: () => `${devToolsStorageKeys.modal.root()}_dimensions` as const,
  },

  /**
   * Settings-related storage keys
   */
  settings: {
    root: () => `${devToolsStorageKeys.base}_settings` as const,
    theme: () => `${devToolsStorageKeys.settings.root()}_theme` as const,
    preferences: () => `${devToolsStorageKeys.settings.root()}_preferences` as const,
  },

  /**
   * Environment-related storage keys
   */
  env: {
    root: () => `${devToolsStorageKeys.base}_env` as const,
    currentEnv: () => `${devToolsStorageKeys.env.root()}_current` as const,
    overrides: () => `${devToolsStorageKeys.env.root()}_overrides` as const,
  },

  /**
   * Sentry-related storage keys
   */
  sentry: {
    root: () => `${devToolsStorageKeys.base}_sentry` as const,
    filters: () => `${devToolsStorageKeys.sentry.root()}_filters` as const,
    preferences: () => `${devToolsStorageKeys.sentry.root()}_preferences` as const,
  },

  /**
   * Storage browser-related keys
   */
  storage: {
    root: () => `${devToolsStorageKeys.base}_storage` as const,
    filters: () => `${devToolsStorageKeys.storage.root()}_filters` as const,
    preferences: () => `${devToolsStorageKeys.storage.root()}_preferences` as const,
  },

  /**
   * React Query-related storage keys
   */
  reactQuery: {
    root: () => `${devToolsStorageKeys.base}_rq` as const,
    filters: () => `${devToolsStorageKeys.reactQuery.root()}_filters` as const,
    preferences: () => `${devToolsStorageKeys.reactQuery.root()}_preferences` as const,
  },
} as const;

/**
 * Check if a storage key belongs to dev tools
 * @param key - The storage key to check
 * @returns true if the key belongs to dev tools
 */
export function isDevToolsStorageKey(key: string): boolean {
  if (!key) return false;
  
  // Check if it starts with our base prefix
  return key.startsWith(devToolsStorageKeys.base);
}

/**
 * Filter out dev tools storage keys from a list of keys
 * @param keys - Array of storage keys
 * @returns Array of keys that don't belong to dev tools
 */
export function filterOutDevToolsKeys(keys: string[]): string[] {
  return keys.filter(key => !isDevToolsStorageKey(key));
}

/**
 * Get all dev tools storage keys
 * Useful for cleanup operations
 */
export function getAllDevToolsStorageKeys(): string[] {
  const keys: string[] = [];

  // Add all current keys
  keys.push(devToolsStorageKeys.bubble.settings());
  keys.push(devToolsStorageKeys.bubble.userPreferences());
  keys.push(devToolsStorageKeys.bubble.position());
  keys.push(devToolsStorageKeys.modal.state());
  keys.push(devToolsStorageKeys.modal.position());
  keys.push(devToolsStorageKeys.modal.dimensions());
  keys.push(devToolsStorageKeys.settings.theme());
  keys.push(devToolsStorageKeys.settings.preferences());
  keys.push(devToolsStorageKeys.env.currentEnv());
  keys.push(devToolsStorageKeys.env.overrides());
  keys.push(devToolsStorageKeys.sentry.filters());
  keys.push(devToolsStorageKeys.sentry.preferences());
  keys.push(devToolsStorageKeys.storage.filters());
  keys.push(devToolsStorageKeys.storage.preferences());
  keys.push(devToolsStorageKeys.reactQuery.filters());
  keys.push(devToolsStorageKeys.reactQuery.preferences());

  return keys;
}