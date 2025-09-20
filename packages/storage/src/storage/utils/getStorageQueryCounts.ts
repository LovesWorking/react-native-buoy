import type { Query } from "@tanstack/react-query";
import { isDevToolsStorageKey } from "@react-buoy/shared-ui";
import {
  getCleanStorageKey,
  getStorageType,
  isStorageQuery,
  type StorageType,
} from "./storageQueryUtils";

export interface StorageTypeCounts {
  mmkv: number;
  async: number;
  secure: number;
  total: number;
}

export function getStorageQueryCounts(queries: Query[]): StorageTypeCounts {
  const counts: StorageTypeCounts = {
    mmkv: 0,
    async: 0,
    secure: 0,
    total: 0,
  };

  const storageQueries = queries.filter((query) =>
    isStorageQuery(query.queryKey),
  );

  storageQueries.forEach((query) => {
    const storageType = getStorageType(query.queryKey);
    if (!storageType) return;

    const cleanKey = getCleanStorageKey(query.queryKey);
    if (isDevToolsStorageKey(cleanKey)) return;

    counts[storageType as StorageType]++;
    counts.total++;
  });

  return counts;
}
