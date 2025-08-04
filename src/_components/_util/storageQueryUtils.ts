/**
 * Centralized storage query keys for all storage hooks
 * This ensures consistency across MMKV, AsyncStorage, and SecureStorage hooks
 * and allows easy modification of the base storage key in one place
 */
export const storageQueryKeys = {
  /**
   * Base storage key - change this to update all storage-related queries
   */
  base: () => ["#storage"] as const,

  /**
   * MMKV storage query keys
   */
  mmkv: {
    root: () => [...storageQueryKeys.base(), "mmkv"] as const,
    key: (key: string) => [...storageQueryKeys.mmkv.root(), key] as const,
    all: () => [...storageQueryKeys.mmkv.root(), "all"] as const,
  },

  /**
   * AsyncStorage query keys
   */
  async: {
    root: () => [...storageQueryKeys.base(), "async"] as const,
    key: (key: string) => [...storageQueryKeys.async.root(), key] as const,
    all: () => [...storageQueryKeys.async.root(), "all"] as const,
  },

  /**
   * SecureStorage query keys
   */
  secure: {
    root: () => [...storageQueryKeys.base(), "secure"] as const,
    key: (key: string) => [...storageQueryKeys.secure.root(), key] as const,
    all: () => [...storageQueryKeys.secure.root(), "all"] as const,
  },
} as const;

/**
 * Storage types that can be enabled/disabled
 */
export type StorageType = "mmkv" | "async" | "secure";

/**
 * Check if a query key matches any of the storage patterns
 */
export function isStorageQuery(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return false;
  }

  return queryKey[0] === "#storage";
}

/**
 * Get the storage type from a query key
 */
export function getStorageType(
  queryKey: readonly unknown[]
): StorageType | null {
  if (!isStorageQuery(queryKey) || queryKey.length < 2) {
    return null;
  }

  const storageType = queryKey[1];
  if (
    storageType === "mmkv" ||
    storageType === "async" ||
    storageType === "secure"
  ) {
    return storageType;
  }

  return null;
}

/**
 * Get display label for storage type
 */
export function getStorageTypeLabel(storageType: StorageType): string {
  switch (storageType) {
    case "mmkv":
      return "MMKV";
    case "async":
      return "Async";
    case "secure":
      return "Secure";
    default:
      return storageType;
  }
}

/**
 * Get storage type color class for styling
 */
export function getStorageTypeColor(
  storageType: StorageType
): "blue" | "green" | "gray" | "yellow" | "purple" | "red" {
  switch (storageType) {
    case "mmkv":
      return "purple"; // Premium, high-performance
    case "async":
      return "blue"; // Standard, reliable
    case "secure":
      return "green"; // Security, safety
    default:
      return "gray";
  }
}

/**
 * Get storage type hex color for UI components
 * Design rationale:
 * - MMKV: Purple (#8B5CF6) - Premium, high-performance, sophisticated
 * - Async: Blue (#3B82F6) - Standard, reliable, default
 * - Secure: Green (#10B981) - Security, safety, protection
 */
export function getStorageTypeHexColor(storageType: StorageType): string {
  switch (storageType) {
    case "mmkv":
      return "#8B5CF6"; // Purple - Premium, high-performance
    case "async":
      return "#3B82F6"; // Blue - Standard, reliable
    case "secure":
      return "#10B981"; // Green - Security, safety
    default:
      return "#6B7280"; // Gray
  }
}

/**
 * Extract clean storage key from storage query key
 * Example: ["#storage", "async", "@dev_tools_modal_state"] → "@dev_tools_modal_state"
 */
export function getCleanStorageKey(queryKey: readonly unknown[]): string {
  if (!isStorageQuery(queryKey) || queryKey.length < 3) {
    return "Unknown Storage Key";
  }

  // Return everything after the storage type (index 2 and beyond)
  const cleanKeys = queryKey.slice(2);
  return (
    cleanKeys
      .filter((k) => k != null)
      .map((k) => String(k))
      .join(" › ") || "Unknown Storage Key"
  );
}
