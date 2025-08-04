import { useEffect, useState, useRef } from "react";
import { Query, useQueryClient } from "@tanstack/react-query";
import { isEqual } from "lodash";
import { isStorageQuery } from "../_util/storageQueryUtils";

// React Query DevTools sorting logic
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

function useAllQueries() {
  const queryClient = useQueryClient();
  const [queries, setQueries] = useState<Query[]>([]);
  const queriesRef = useRef<any[]>([]);

  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient.getQueryCache().getAll();

      // Filter out storage queries - they have their own dedicated tab
      const nonStorageQueries = allQueries.filter(
        (query) => !isStorageQuery(query.queryKey)
      );

      const sortedQueries = nonStorageQueries.sort(statusAndDateSort);
      const newStates = sortedQueries.map((q) => q.state);
      if (!isEqual(queriesRef.current, newStates)) {
        queriesRef.current = newStates;
        setTimeout(() => setQueries(sortedQueries), 0);
      }
    };

    setTimeout(updateQueries, 0);

    const unsubscribe = queryClient.getQueryCache().subscribe(updateQueries);

    return () => unsubscribe();
  }, [queryClient]);

  return queries;
}

export default useAllQueries;
