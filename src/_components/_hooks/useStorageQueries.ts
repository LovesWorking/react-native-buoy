import { useEffect, useState, useRef } from "react";
import { Query, useQueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";
import {
  isStorageQuery,
  StorageType,
  shouldFilterStorageQuery,
} from "../_util/storageQueryUtils";

// React Query DevTools sorting logic - same as useAllQueries [[memory:4875251]]
type SortFn = (a: Query, b: Query) => number;

const getStatusRank = (q: Query) =>
  q.state.fetchStatus !== "idle"
    ? 0
    : !q.getObserversCount()
      ? 3
      : q.isStale()
        ? 2
        : 1;

const dateSort: SortFn = (a, b) =>
  a.state.dataUpdatedAt < b.state.dataUpdatedAt ? 1 : -1;

const statusAndDateSort: SortFn = (a, b) => {
  if (getStatusRank(a) === getStatusRank(b)) {
    return dateSort(a, b);
  }

  return getStatusRank(a) > getStatusRank(b) ? 1 : -1;
};

/**
 * Hook to get storage queries with optional storage type filtering
 *
 * Applied performance principles:
 * - No unnecessary memoization [[memory:4875074]]
 * - Composition over memo - filtering at component level
 * - Stable references with useRef for comparison
 */
function useStorageQueries(enabledStorageTypes?: Set<StorageType>) {
  const queryClient = useQueryClient();
  const [queries, setQueries] = useState<Query[]>([]);
  const queriesRef = useRef<Query["state"][]>([]);

  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient.getQueryCache().getAll();

      // Filter to only storage queries first
      const storageQueries = allQueries.filter((query) =>
        isStorageQuery(query.queryKey)
      );

      // Apply storage type filtering if enabled types are specified
      const filteredQueries = enabledStorageTypes
        ? storageQueries.filter(
            (query) =>
              !shouldFilterStorageQuery(query.queryKey, enabledStorageTypes)
          )
        : storageQueries;

      const sortedQueries = filteredQueries.sort(statusAndDateSort);
      const newStates = sortedQueries.map((q) => q.state);

      if (!isEqual(queriesRef.current, newStates)) {
        queriesRef.current = newStates;
        setTimeout(() => setQueries(sortedQueries), 0);
      }
    };

    setTimeout(updateQueries, 0);

    const unsubscribe = queryClient.getQueryCache().subscribe(updateQueries);

    return () => unsubscribe();
  }, [queryClient, enabledStorageTypes]);

  return queries;
}

export default useStorageQueries;
