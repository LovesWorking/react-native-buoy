import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { Query, useQueryClient } from "@tanstack/react-query";
import { isStorageQuery } from "../utils/storageQueryUtils";

// React Query DevTools sorting logic - moved outside component for performance
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
 * Optimized hook to track all queries with live updates
 * Performance optimizations for mobile:
 * - Filters event types to only relevant ones
 * - Uses lightweight comparison instead of deep equality
 * - Batches updates to reduce re-renders
 * - Memoizes sorted results
 */
function useAllQueries() {
  const queryClient = useQueryClient();
  const [queries, setQueries] = useState<Query[]>(() => {
    // Initialize with current queries to avoid flash
    const initial = queryClient.getQueryCache().getAll()
      .filter(query => !isStorageQuery(query.queryKey))
      .sort(statusAndDateSort);
    return initial;
  });
  
  // Track query states using a Map for O(1) lookups
  const queryStatesRef = useRef<Map<string, Query["state"]>>(new Map());
  const updateTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoized callback to check if queries need update
  const hasQueriesChanged = useCallback((newQueries: Query[]): boolean => {
    const statesMap = queryStatesRef.current;
    
    // Quick length check first
    if (newQueries.length !== statesMap.size) {
      return true;
    }
    
    // Check if any query state has changed
    for (const query of newQueries) {
      const prevState = statesMap.get(query.queryHash);
      if (!prevState) return true;
      
      // Compare only relevant state properties for rendering
      if (
        prevState.dataUpdatedAt !== query.state.dataUpdatedAt ||
        prevState.errorUpdatedAt !== query.state.errorUpdatedAt ||
        prevState.fetchStatus !== query.state.fetchStatus ||
        prevState.status !== query.state.status ||
        prevState.isInvalidated !== query.state.isInvalidated
      ) {
        return true;
      }
    }
    
    return false;
  }, []);

  // Memoized update function
  const updateQueries = useCallback(() => {
    const allQueries = queryClient.getQueryCache().getAll();
    
    // Filter out storage queries
    const nonStorageQueries = allQueries.filter(
      (query) => !isStorageQuery(query.queryKey)
    );
    
    // Check if update is needed
    if (hasQueriesChanged(nonStorageQueries)) {
      // Update states map
      const newStatesMap = new Map<string, Query["state"]>();
      nonStorageQueries.forEach(q => {
        newStatesMap.set(q.queryHash, q.state);
      });
      queryStatesRef.current = newStatesMap;
      
      // Sort and update
      const sortedQueries = [...nonStorageQueries].sort(statusAndDateSort);
      setQueries(sortedQueries);
    }
  }, [queryClient, hasQueriesChanged]);

  useEffect(() => {
    // Initial update
    updateQueries();

    // Subscribe with event filtering for performance
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only process events that affect query list
      if (
        event.type === 'added' || 
        event.type === 'removed' || 
        event.type === 'updated'
      ) {
        // Skip storage queries
        if ('query' in event && event.query && isStorageQuery(event.query.queryKey)) {
          return;
        }
        
        // Debounce updates to batch rapid changes
        if (updateTimerRef.current) {
          clearTimeout(updateTimerRef.current);
        }
        
        updateTimerRef.current = setTimeout(() => {
          updateQueries();
        }, 10); // Small delay to batch updates
      }
    });

    return () => {
      unsubscribe();
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [queryClient, updateQueries]);

  // Memoize the final sorted array to prevent unnecessary re-renders
  return useMemo(() => queries, [queries]);
}

export default useAllQueries;
