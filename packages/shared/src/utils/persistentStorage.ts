/**
 * Persistent Storage for React Buoy DevTools
 *
 * This module provides a storage abstraction that persists independently of AsyncStorage.
 * When expo-file-system is available, it uses file-based storage that survives
 * AsyncStorage.clear() calls (e.g., during logout flows).
 *
 * Fallback hierarchy:
 * 1. FileSystem (expo-file-system) - persistent, survives AsyncStorage.clear()
 * 2. AsyncStorage - standard React Native storage
 * 3. Memory - in-memory fallback when nothing else works
 */

import { devToolsStorageKeys } from "../storage/devToolsStorageKeys";

// Types
type FileSystemModule = {
  documentDirectory: string | null;
  getInfoAsync: (
    path: string
  ) => Promise<{ exists: boolean; isDirectory?: boolean }>;
  makeDirectoryAsync: (
    path: string,
    options?: { intermediates?: boolean }
  ) => Promise<void>;
  writeAsStringAsync: (path: string, content: string) => Promise<void>;
  readAsStringAsync: (path: string) => Promise<string>;
  deleteAsync: (path: string, options?: { idempotent?: boolean }) => Promise<void>;
  readDirectoryAsync: (path: string) => Promise<string[]>;
};

type AsyncStorageModule = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<readonly string[]>;
  multiGet(
    keys: readonly string[]
  ): Promise<readonly [string, string | null][]>;
  multiRemove(keys: readonly string[]): Promise<void>;
};

export interface DevToolsStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<[string, string | null][]>;
  multiRemove(keys: string[]): Promise<void>;
  clear(): Promise<void>;
}

// Storage backend state
type StorageBackend = "filesystem" | "asyncstorage" | "memory";
let storageBackend: StorageBackend | null = null;
let initPromise: Promise<void> | null = null;
let initWarningShown = false;

// Cached modules
let FileSystem: FileSystemModule | null = null;
let AsyncStorage: AsyncStorageModule | null = null;

// Memory fallback
const memoryStore = new Map<string, string>();

// Constants
const STORAGE_DIR_NAME = "react-buoy";
const HEALTH_CHECK_FILE_NAME = ".health-check";

function getStorageDir(): string | null {
  if (!FileSystem?.documentDirectory) return null;
  return `${FileSystem.documentDirectory}${STORAGE_DIR_NAME}/`;
}

function getFilePath(key: string): string | null {
  const dir = getStorageDir();
  if (!dir) return null;
  return `${dir}${encodeURIComponent(key)}.json`;
}

/**
 * Try to load expo-file-system
 *
 * Note: We try the legacy import first (expo-file-system/legacy) for v19+ compatibility,
 * then fall back to the main import for older versions.
 */
function loadFileSystem(): FileSystemModule | null {
  if (FileSystem) return FileSystem;

  // Try legacy import first (v19+ moved legacy functions here)
  try {
    const mod = require("expo-file-system/legacy");
    FileSystem = mod?.default || mod;
    if (FileSystem && FileSystem.documentDirectory) {
      return FileSystem;
    }
    FileSystem = null;
  } catch {
    // Not available, try main import
  }

  // Fall back to main import (older versions or if legacy path doesn't exist)
  try {
    const mod = require("expo-file-system");
    FileSystem = mod?.default || mod;
    if (FileSystem && FileSystem.documentDirectory) {
      return FileSystem;
    }
    FileSystem = null;
  } catch {
    // Not installed or not available
  }
  return null;
}

/**
 * Try to load AsyncStorage
 */
function loadAsyncStorage(): AsyncStorageModule | null {
  if (AsyncStorage) return AsyncStorage;

  try {
    const mod = require("@react-native-async-storage/async-storage");
    AsyncStorage = mod?.default || mod;
    if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
      return AsyncStorage;
    }
    AsyncStorage = null;
  } catch {
    // Not installed or not available
  }
  return null;
}

/**
 * Test if FileSystem works with CRUD operations
 */
async function testFileSystem(): Promise<boolean> {
  const fs = loadFileSystem();
  if (!fs || !fs.documentDirectory) {
    return false;
  }

  const storageDir = getStorageDir();
  if (!storageDir) return false;

  const healthCheckFile = `${storageDir}${HEALTH_CHECK_FILE_NAME}`;

  try {
    // Ensure directory exists
    const dirInfo = await fs.getInfoAsync(storageDir);
    if (!dirInfo.exists) {
      await fs.makeDirectoryAsync(storageDir, { intermediates: true });
    }

    // Test write
    const testData = `health-check-${Date.now()}`;
    await fs.writeAsStringAsync(healthCheckFile, testData);

    // Test read
    const readBack = await fs.readAsStringAsync(healthCheckFile);
    if (readBack !== testData) {
      return false;
    }

    // Test delete
    await fs.deleteAsync(healthCheckFile, { idempotent: true });

    return true;
  } catch (error) {
    console.warn("[React Buoy] FileSystem health check failed:", error);
    return false;
  }
}

/**
 * Migrate existing AsyncStorage keys to FileSystem
 */
async function migrateFromAsyncStorage(): Promise<void> {
  const asyncStorage = loadAsyncStorage();
  if (!asyncStorage) return;

  try {
    const allKeys = await asyncStorage.getAllKeys();
    const buoyKeys = allKeys.filter((k) =>
      k.startsWith(devToolsStorageKeys.base)
    );

    if (buoyKeys.length === 0) {
      return; // Nothing to migrate
    }

    const pairs = await asyncStorage.multiGet(buoyKeys);
    let migratedCount = 0;

    for (const [fullKey, value] of pairs) {
      if (value !== null) {
        // Store in file system (key already has the prefix)
        await fileSystemStorage.setItem(fullKey, value);
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(
        `[React Buoy] Migrated ${migratedCount} settings to persistent storage`
      );
    }

    // Optionally: clean up old AsyncStorage keys after successful migration
    // await asyncStorage.multiRemove(buoyKeys);
  } catch (error) {
    console.warn("[React Buoy] Migration failed:", error);
    // Continue anyway - not critical
  }
}

// File system storage implementation
const fileSystemStorage: DevToolsStorage = {
  async getItem(key: string): Promise<string | null> {
    const fs = loadFileSystem();
    if (!fs) return null;

    const filePath = getFilePath(key);
    if (!filePath) return null;

    try {
      // Check if file exists before reading (best practice from Expo docs)
      const fileInfo = await fs.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        return null;
      }

      const content = await fs.readAsStringAsync(filePath);
      return content;
    } catch {
      return null; // File doesn't exist or read failed
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const fs = loadFileSystem();
    if (!fs) return;

    const storageDir = getStorageDir();
    const filePath = getFilePath(key);
    if (!storageDir || !filePath) return;

    try {
      // Ensure directory exists
      const dirInfo = await fs.getInfoAsync(storageDir);
      if (!dirInfo.exists) {
        await fs.makeDirectoryAsync(storageDir, { intermediates: true });
      }

      await fs.writeAsStringAsync(filePath, value);
    } catch (error) {
      console.warn("[React Buoy] FileSystem write failed:", error);
    }
  },

  async removeItem(key: string): Promise<void> {
    const fs = loadFileSystem();
    if (!fs) return;

    const filePath = getFilePath(key);
    if (!filePath) return;

    try {
      await fs.deleteAsync(filePath, { idempotent: true });
    } catch {
      // Ignore if doesn't exist
    }
  },

  async getAllKeys(): Promise<string[]> {
    const fs = loadFileSystem();
    if (!fs) return [];

    const storageDir = getStorageDir();
    if (!storageDir) return [];

    try {
      const dirInfo = await fs.getInfoAsync(storageDir);
      if (!dirInfo.exists) return [];

      const files = await fs.readDirectoryAsync(storageDir);
      return files
        .filter((f) => f.endsWith(".json"))
        .map((f) => decodeURIComponent(f.replace(".json", "")));
    } catch {
      return [];
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const results: [string, string | null][] = [];
    for (const key of keys) {
      const value = await this.getItem(key);
      results.push([key, value]);
    }
    return results;
  },

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.removeItem(key);
    }
  },

  async clear(): Promise<void> {
    const fs = loadFileSystem();
    if (!fs) return;

    const storageDir = getStorageDir();
    if (!storageDir) return;

    try {
      await fs.deleteAsync(storageDir, { idempotent: true });
    } catch {
      // Ignore
    }
  },
};

// AsyncStorage adapter
const asyncStorageAdapter: DevToolsStorage = {
  async getItem(key: string): Promise<string | null> {
    const storage = loadAsyncStorage();
    if (!storage) return memoryStore.get(key) ?? null;

    try {
      return await storage.getItem(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    const storage = loadAsyncStorage();
    if (!storage) {
      memoryStore.set(key, value);
      return;
    }

    try {
      await storage.setItem(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  async removeItem(key: string): Promise<void> {
    const storage = loadAsyncStorage();
    memoryStore.delete(key);
    if (!storage) return;

    try {
      await storage.removeItem(key);
    } catch {
      // Ignore
    }
  },

  async getAllKeys(): Promise<string[]> {
    const storage = loadAsyncStorage();
    if (!storage) return Array.from(memoryStore.keys());

    try {
      const keys = await storage.getAllKeys();
      return keys.filter((k) => k.startsWith(devToolsStorageKeys.base)) as string[];
    } catch {
      return Array.from(memoryStore.keys());
    }
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    const storage = loadAsyncStorage();
    if (!storage) {
      return keys.map((k) => [k, memoryStore.get(k) ?? null]);
    }

    try {
      const results = await storage.multiGet(keys);
      return results as [string, string | null][];
    } catch {
      return keys.map((k) => [k, memoryStore.get(k) ?? null]);
    }
  },

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach((k) => memoryStore.delete(k));
    const storage = loadAsyncStorage();
    if (!storage) return;

    try {
      await storage.multiRemove(keys);
    } catch {
      // Ignore
    }
  },

  async clear(): Promise<void> {
    memoryStore.clear();
    const storage = loadAsyncStorage();
    if (!storage) return;

    try {
      const allKeys = await storage.getAllKeys();
      const buoyKeys = allKeys.filter((k) =>
        k.startsWith(devToolsStorageKeys.base)
      );
      if (buoyKeys.length > 0) {
        await storage.multiRemove(buoyKeys);
      }
    } catch {
      // Ignore
    }
  },
};

// Memory-only storage
const memoryStorage: DevToolsStorage = {
  async getItem(key: string): Promise<string | null> {
    return memoryStore.get(key) ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryStore.set(key, value);
  },

  async removeItem(key: string): Promise<void> {
    memoryStore.delete(key);
  },

  async getAllKeys(): Promise<string[]> {
    return Array.from(memoryStore.keys());
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    return keys.map((k) => [k, memoryStore.get(k) ?? null]);
  },

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach((k) => memoryStore.delete(k));
  },

  async clear(): Promise<void> {
    memoryStore.clear();
  },
};

/**
 * Initialize storage - determines which backend to use
 */
async function initStorage(): Promise<void> {
  // Only run once
  if (storageBackend !== null) return;

  // Test FileSystem first
  const fileSystemWorks = await testFileSystem();

  if (fileSystemWorks) {
    // Check if we need to migrate from AsyncStorage
    const existingFiles = await fileSystemStorage.getAllKeys();

    if (existingFiles.length === 0) {
      // Empty file storage - check for AsyncStorage data to migrate
      await migrateFromAsyncStorage();
    }

    storageBackend = "filesystem";
    console.log("[React Buoy] Using persistent file storage");
  } else {
    // Try AsyncStorage
    const asyncStorage = loadAsyncStorage();
    if (asyncStorage) {
      storageBackend = "asyncstorage";
      if (!initWarningShown) {
        initWarningShown = true;
        console.warn(
          "[React Buoy] Using AsyncStorage fallback. " +
            "Settings may be lost if AsyncStorage is cleared. " +
            "Install expo-file-system for persistent storage."
        );
      }
    } else {
      storageBackend = "memory";
      if (!initWarningShown) {
        initWarningShown = true;
        console.warn(
          "[React Buoy] Using in-memory storage. " +
            "Settings will be lost on app restart."
        );
      }
    }
  }
}

/**
 * Ensure init runs before any storage operation
 */
function ensureInit(): Promise<void> {
  if (!initPromise) {
    initPromise = initStorage();
  }
  return initPromise;
}

/**
 * Get the current storage implementation based on detected backend
 */
function getStorage(): DevToolsStorage {
  switch (storageBackend) {
    case "filesystem":
      return fileSystemStorage;
    case "asyncstorage":
      return asyncStorageAdapter;
    case "memory":
    default:
      return memoryStorage;
  }
}

/**
 * Persistent storage for React Buoy DevTools
 *
 * Uses FileSystem when available (survives AsyncStorage.clear()),
 * falls back to AsyncStorage, then memory.
 *
 * Same API as AsyncStorage for easy migration.
 */
export const persistentStorage: DevToolsStorage = {
  async getItem(key: string): Promise<string | null> {
    await ensureInit();
    return getStorage().getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    await ensureInit();
    return getStorage().setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await ensureInit();
    return getStorage().removeItem(key);
  },

  async getAllKeys(): Promise<string[]> {
    await ensureInit();
    return getStorage().getAllKeys();
  },

  async multiGet(keys: string[]): Promise<[string, string | null][]> {
    await ensureInit();
    return getStorage().multiGet(keys);
  },

  async multiRemove(keys: string[]): Promise<void> {
    await ensureInit();
    return getStorage().multiRemove(keys);
  },

  async clear(): Promise<void> {
    await ensureInit();
    return getStorage().clear();
  },
};

/**
 * Check if persistent storage (FileSystem) is being used
 */
export async function isUsingPersistentStorage(): Promise<boolean> {
  await ensureInit();
  return storageBackend === "filesystem";
}

/**
 * Get the current storage backend type
 */
export async function getStorageBackendType(): Promise<StorageBackend> {
  await ensureInit();
  return storageBackend ?? "memory";
}

/**
 * Force re-initialization of storage (useful for testing)
 */
export function resetStorageInit(): void {
  storageBackend = null;
  initPromise = null;
  initWarningShown = false;
}
