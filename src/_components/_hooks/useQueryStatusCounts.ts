import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../_util/getQueryStatusLabel";

interface QueryStatusCounts {
  fresh: number;
  stale: number;
  fetching: number;
  paused: number;
  inactive: number;
}

function useQueryStatusCounts(): QueryStatusCounts {
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<QueryStatusCounts>({
    fresh: 0,
    stale: 0,
    fetching: 0,
    paused: 0,
    inactive: 0,
  });

  useEffect(() => {
    const updateCounts = () => {
      const allQueries = queryClient.getQueryCache().getAll();

      const newCounts = allQueries.reduce(
        (acc, query) => {
          const status = getQueryStatusLabel(query);
          acc[status as keyof QueryStatusCounts] =
            (acc[status as keyof QueryStatusCounts] || 0) + 1;
          return acc;
        },
        { fresh: 0, stale: 0, fetching: 0, paused: 0, inactive: 0 }
      );

      setCounts(newCounts);
    };

    // Perform an initial update
    updateCounts();

    // Subscribe to the query cache to run updates on changes
    const unsubscribe = queryClient.getQueryCache().subscribe(updateCounts);

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [queryClient]);

  return counts;
}

export default useQueryStatusCounts;

// Mutation status counts hook
interface MutationStatusCounts {
  pending: number;
  success: number;
  error: number;
  paused: number;
}

export function useMutationStatusCounts(): MutationStatusCounts {
  const queryClient = useQueryClient();
  const [counts, setCounts] = useState<MutationStatusCounts>({
    pending: 0,
    success: 0,
    error: 0,
    paused: 0,
  });

  useEffect(() => {
    const updateCounts = () => {
      const allMutations = queryClient.getMutationCache().getAll();

      const newCounts = allMutations.reduce(
        (acc, mutation) => {
          const status = mutation.state.status;
          const isPaused = mutation.state.isPaused;

          if (isPaused) {
            acc.paused = (acc.paused || 0) + 1;
          } else if (status === "pending") {
            // 'pending' is the current state (v5), 'loading' was older
            acc.pending = (acc.pending || 0) + 1;
          } else if (status === "success") {
            acc.success = (acc.success || 0) + 1;
          } else if (status === "error") {
            acc.error = (acc.error || 0) + 1;
          }
          return acc;
        },
        { pending: 0, success: 0, error: 0, paused: 0 }
      );

      setCounts(newCounts);
    };

    // Perform an initial update
    updateCounts();

    // Subscribe to the mutation cache to run updates on changes
    const unsubscribe = queryClient.getMutationCache().subscribe(updateCounts);

    // Cleanup the subscription when the component unmounts
    return () => unsubscribe();
  }, [queryClient]);

  return counts;
}
