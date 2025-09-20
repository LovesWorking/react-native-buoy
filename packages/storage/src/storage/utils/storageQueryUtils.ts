import { gameUIColors } from "@react-buoy/shared-ui";

export type StorageType = "mmkv" | "async" | "secure";

export function isStorageQuery(queryKey: readonly unknown[]): boolean {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return false;
  }
  return queryKey[0] === "#storage";
}

export function getStorageType(
  queryKey: readonly unknown[],
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

export function getStorageTypeHexColor(storageType: StorageType): string {
  switch (storageType) {
    case "mmkv":
      return gameUIColors.info;
    case "async":
      return gameUIColors.warning;
    case "secure":
      return gameUIColors.success;
    default:
      return gameUIColors.muted;
  }
}

export function getCleanStorageKey(queryKey: readonly unknown[]): string {
  if (!isStorageQuery(queryKey) || queryKey.length < 3) {
    return "Unknown Storage Key";
  }

  const cleanKeys = queryKey.slice(2);
  return (
    cleanKeys
      .filter((k) => k != null)
      .map((k) => String(k))
      .join(" › ") || "Unknown Storage Key"
  );
}
