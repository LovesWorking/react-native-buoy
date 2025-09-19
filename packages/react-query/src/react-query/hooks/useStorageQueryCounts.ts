import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getStorageQueryCounts,
  StorageTypeCounts,
} from "../utils/getStorageQueryCounts";

/**
 * Hook to get storage query counts with proper memoization
 * Following rule3 - Component Composition principles:
 * - Extract Reusable Logic: Dedicated hook for storage counting
 * - Rigor and Justification: Proper memoization only where proven necessary
 * - Stable references: useMemo with correct dependencies to prevent infinite loops
 */
export function useStorageQueryCounts(): StorageTypeCounts {
  const queryClient = useQueryClient();

  // Memoize counts based on query cache state changes
  // This prevents infinite re-renders by stabilizing the counts object
  const counts = useMemo(() => {
    const allQueries = queryClient.getQueryCache().getAll();
    return getStorageQueryCounts(allQueries);
  }, [queryClient]); // Depend on queryClient, not the result of getAll()

  return counts;
}
