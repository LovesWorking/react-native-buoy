import { useEffect, useState } from "react";
import { Query, useQueryClient } from "@tanstack/react-query";

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
  const [queries, setQueries] = useState<Query<any, any, any, any>[]>([]);

  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient.getQueryCache().getAll();

      // Sort queries using React Query DevTools logic
      const sortedQueries = allQueries.sort(statusAndDateSort);

      setTimeout(() => {
        setQueries(sortedQueries);
      }, 1);
    };
    // Perform an initial update
    updateQueries();
    // Subscribe to the query cache to run updates on changes
    const unsubscribe = queryClient.getQueryCache().subscribe(updateQueries);
    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [queryClient]);

  return queries;
}

export default useAllQueries;
