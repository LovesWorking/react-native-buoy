// A tiny wrapper that tries to load AsyncStorage dynamically and
// falls back to an in-memory store if not available. Logs once.

import { useEffect, useMemo, useState } from "react";

type StorageLike = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const memoryStore = new Map<string, string>();
let warnedMissing = false;
let loadAttempted = false;
let cachedAsyncStorage: StorageLike | null = null;

async function loadAsyncStorage(): Promise<StorageLike | null> {
  if (loadAttempted) return cachedAsyncStorage;
  loadAttempted = true;
  try {
    //  @ts-expect-error Cannot find module '@react-native-async-storage/async-storage' or its corresponding type declarations.ts(2307)
    const mod = await import("@react-native-async-storage/async-storage");
    // The default export is the AsyncStorage module in RN
    const AsyncStorage = (mod as any)?.default as StorageLike | undefined;
    if (AsyncStorage && typeof AsyncStorage.getItem === "function") {
      cachedAsyncStorage = AsyncStorage;
      return cachedAsyncStorage;
    }
  } catch (err) {
    // No-op; we will fall back to memory.
  }
  if (!warnedMissing) {
    warnedMissing = true;
    // Keep this as console.warn for visibility across environments
    console.warn(
      "@react-native-async-storage/async-storage not found; falling back to in-memory storage."
    );
  }
  cachedAsyncStorage = null;
  return null;
}

export async function safeGetItem(key: string): Promise<string | null> {
  const storage = await loadAsyncStorage();
  if (storage) {
    try {
      return await storage.getItem(key);
    } catch (e) {
      console.warn("AsyncStorage.getItem failed; using memory fallback", e);
    }
  }
  return memoryStore.has(key) ? memoryStore.get(key)! : null;
}

export async function safeSetItem(key: string, value: string): Promise<void> {
  const storage = await loadAsyncStorage();
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

export async function safeRemoveItem(key: string): Promise<void> {
  const storage = await loadAsyncStorage();
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
export async function isPersistentStorageAvailable(): Promise<boolean> {
  const storage = await loadAsyncStorage();
  return !!storage;
}

export function useSafeAsyncStorage() {
  const [isPersistent, setIsPersistent] = useState(false);

  useEffect(() => {
    let mounted = true;
    isPersistentStorageAvailable()
      .then((available) => {
        if (mounted) setIsPersistent(available);
      })
      .catch(() => {
        if (mounted) setIsPersistent(false);
      });
    return () => {
      mounted = false;
    };
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
