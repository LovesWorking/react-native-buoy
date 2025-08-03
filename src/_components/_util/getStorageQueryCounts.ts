import { Query } from "@tanstack/react-query";
import {
  isStorageQuery,
  getStorageType,
  StorageType,
} from "./storageQueryUtils";

export interface StorageTypeCounts {
  mmkv: number;
  async: number;
  secure: number;
  total: number;
}

/**
 * Calculate counts for each storage type from storage queries
 * Following performance principles: no unnecessary memoization [[memory:4875074]]
 */
export function getStorageQueryCounts(queries: Query[]): StorageTypeCounts {
  const counts: StorageTypeCounts = {
    mmkv: 0,
    async: 0,
    secure: 0,
    total: 0,
  };

  // Filter to storage queries only, then count by type
  const storageQueries = queries.filter((query) =>
    isStorageQuery(query.queryKey)
  );

  storageQueries.forEach((query) => {
    const storageType = getStorageType(query.queryKey);
    if (storageType) {
      counts[storageType]++;
      counts.total++;
    }
  });

  return counts;
}
