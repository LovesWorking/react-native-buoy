// Safe storage wrapper that uses persistent file storage when available,
// falling back to AsyncStorage, then in-memory store.
//
// This module re-exports the persistentStorage API with the legacy function names
// (safeGetItem, safeSetItem, safeRemoveItem) for backwards compatibility.

import { useEffect, useMemo, useState } from "react";
import {
  persistentStorage,
  isUsingPersistentStorage,
} from "./persistentStorage";

/**
 * Read a value from persistent storage (FileSystem > AsyncStorage > Memory)
 *
 * @deprecated Use `persistentStorage.getItem()` directly for new code
 */
export async function safeGetItem(key: string): Promise<string | null> {
  return persistentStorage.getItem(key);
}

/**
 * Persist a value to storage (FileSystem > AsyncStorage > Memory)
 *
 * @deprecated Use `persistentStorage.setItem()` directly for new code
 */
export async function safeSetItem(key: string, value: string): Promise<void> {
  return persistentStorage.setItem(key, value);
}

/**
 * Remove an item from storage
 *
 * @deprecated Use `persistentStorage.removeItem()` directly for new code
 */
export async function safeRemoveItem(key: string): Promise<void> {
  return persistentStorage.removeItem(key);
}

/**
 * Check if persistent storage (FileSystem) is being used
 * Returns true if FileSystem storage is available and working
 */
export async function isPersistentStorageAvailable(): Promise<boolean> {
  return isUsingPersistentStorage();
}

/**
 * React hook exposing storage APIs backed by persistent storage
 *
 * @deprecated Use `persistentStorage` directly for new code
 */
export function useSafeAsyncStorage() {
  const [isPersistent, setIsPersistent] = useState(false);

  useEffect(() => {
    // Check if persistent storage is available
    isUsingPersistentStorage().then(setIsPersistent);
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
