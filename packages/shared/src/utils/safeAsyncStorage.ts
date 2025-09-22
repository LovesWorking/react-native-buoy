// A tiny wrapper that tries to load AsyncStorage dynamically and
// falls back to an in-memory store if not available. Logs once.

import { useEffect, useMemo, useState } from "react";

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const memoryStore = new Map<string, string>();

const log = (...args: unknown[]) => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[safeAsyncStorage]", ...args);
  }
};
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
        log("AsyncStorage module loaded successfully");
        cachedAsyncStorage = AsyncStorage;
        return cachedAsyncStorage;
      }
    } catch (err) {
      log("AsyncStorage require failed", err);
      if (!warnedMissing) {
        warnedMissing = true;
        // Keep this as console.warn for visibility across environments
        console.warn(
          "@react-native-async-storage/async-storage not found; falling back to in-memory storage."
        );
        log("Using in-memory fallback for AsyncStorage");
      }
    }
  }

  return null;
}

export async function safeGetItem(key: string): Promise<string | null> {
  const storage = loadAsyncStorage();
  if (storage) {
    try {
      const value = await storage.getItem(key);
      log("getItem", key, value ? "(hit)" : "(miss)");
      return value;
    } catch (e) {
      console.warn("AsyncStorage.getItem failed; using memory fallback", e);
    }
  }
  const fallback = memoryStore.has(key) ? memoryStore.get(key)! : null;
  log("getItem fallback", key, fallback ? "(hit)" : "(miss)");
  return fallback;
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  const storage = loadAsyncStorage();
  if (storage) {
    try {
      await storage.setItem(key, value);
      log("setItem", key, value, "(persistent)");
      return;
    } catch (e) {
      console.warn("AsyncStorage.setItem failed; using memory fallback", e);
    }
  }
  memoryStore.set(key, value);
  log("setItem fallback", key, value);
}

export async function safeRemoveItem(key: string): Promise<void> {
  const storage = loadAsyncStorage();
  if (storage) {
    try {
      await storage.removeItem(key);
      log("removeItem", key, "(persistent)");
      return;
    } catch (e) {
      console.warn("AsyncStorage.removeItem failed; using memory fallback", e);
    }
  }
  memoryStore.delete(key);
  log("removeItem fallback", key);
}

// Optional hook to know if persistent storage is available.
// Not required for use, but handy in some UIs.
export function isPersistentStorageAvailable(): boolean {
  const storage = loadAsyncStorage();
  return !!storage;
}

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
