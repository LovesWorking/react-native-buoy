import { gameUIColors } from "@react-buoy/shared-ui";

export type StorageType = "mmkv" | "async" | "secure";

/** Human readable label for a storage type id. */
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

/** Preferred color token for rendering a given storage type. */
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
