// A tiny wrapper that tries to load AsyncStorage dynamically and
// falls back to an in-memory store if not available. Logs once.

import { useEffect, useMemo, useState } from "react";

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const memoryStore = new Map<string, string>();

// Debug logging removed for production
let warnedMissing = false;
let cachedAsyncStorage: StorageLike | null = null;
let loadAttempted = false;

function loadAsyncStorage(): StorageLike | null {
  if (cachedAsyncStorage) {
    return cachedAsyncStorage;
  }

  if (!loadAttempted) {
    loadAttempted = true;
    try {
      // Use require for better Metro compatibility with optional dependencies
      const AsyncStorage = require("@react-native-async-storage/async-storage")
        .default as StorageLike | undefined;
      if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
        cachedAsyncStorage = AsyncStorage;
        return cachedAsyncStorage;
      }
    } catch (err) {
      if (!warnedMissing) {
        warnedMissing = true;
        // Keep this as console.warn for visibility across environments
        console.warn(
          "@react-native-async-storage/async-storage not found; falling back to in-memory storage."
        );
      }
    }
  }

  return null;
}

/**
 * Read a value from AsyncStorage when available, falling back to an in-memory store if the module
 * is missing or errors.
 */
export async function safeGetItem(key: string): Promise<string | null> {
  const storage = loadAsyncStorage();
  if (storage) {
    try {
      const value = await storage.getItem(key);
      return value;
    } catch (e) {
      console.warn("AsyncStorage.getItem failed; using memory fallback", e);
    }
  }
  const fallback = memoryStore.has(key) ? memoryStore.get(key)! : null;
  return fallback;
}

/**
 * Persist a value to AsyncStorage or the in-memory fallback when AsyncStorage is unavailable.
 */
export async function safeSetItem(key: string, value: string): Promise<void> {
  const storage = loadAsyncStorage();
  if (storage) {
    try {
      await storage.setItem(key, value);
      return;
    } catch (e) {
      console.warn("AsyncStorage.setItem failed; using memory fallback", e);
    }
  }
  memoryStore.set(key, value);
}

/** Remove an item from AsyncStorage or the in-memory fallback store. */
export async function safeRemoveItem(key: string): Promise<void> {
  const storage = loadAsyncStorage();
  if (storage) {
    try {
      await storage.removeItem(key);
      return;
    } catch (e) {
      console.warn("AsyncStorage.removeItem failed; using memory fallback", e);
    }
  }
  memoryStore.delete(key);
}

// Optional hook to know if persistent storage is available.
// Not required for use, but handy in some UIs.
/** Determine whether AsyncStorage was successfully loaded. */
export function isPersistentStorageAvailable(): boolean {
  const storage = loadAsyncStorage();
  return !!storage;
}

/** React hook exposing AsyncStorage-like APIs backed by the safe wrappers. */
export function useSafeAsyncStorage() {
  const [isPersistent, setIsPersistent] = useState(false);

  useEffect(() => {
    // Synchronously check if persistent storage is available
    setIsPersistent(isPersistentStorageAvailable());
  }, []);

  return useMemo(
    () => ({
      getItem: safeGetItem,
      setItem: safeSetItem,
      removeItem: safeRemoveItem,
      isPersistent,
    }),
    [isPersistent]
  );
}
