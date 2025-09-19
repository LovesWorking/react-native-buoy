import { useEffect, useState, useRef } from "react";
import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook to track a single query by its queryKey with live updates
 * Optimized to only re-render when the specific query changes
 */
interface QueryWithVersion {
  query: Query | undefined;
  version: number;
}

export function useGetQueryByQueryKey(queryKey?: QueryKey) {
  const queryClient = useQueryClient();
  const [queryState, setQueryState] = useState<QueryWithVersion>({
    query: undefined,
    version: 0,
  });
  const queryHashRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!queryKey) {
      setQueryState({ query: undefined, version: 0 });
      queryHashRef.current = undefined;
      return;
    }

    // Get initial query state
    const query = queryClient.getQueryCache().find({ queryKey, exact: true });
    setQueryState({ query, version: 0 });

    // Store the stringified queryKey for comparison
    const queryKeyString = JSON.stringify(queryKey);
    queryHashRef.current = queryKeyString;

    // Subscribe to query cache changes but only update if our specific query changed
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      // Only process events for our specific query
      if (
        event.type === "updated" ||
        event.type === "added" ||
        event.type === "removed"
      ) {
        if ("query" in event && event.query) {
          // Check if the event is for our query by comparing the stringified keys
          const eventQueryKeyString = JSON.stringify(event.query.queryKey);
          const isOurQuery = eventQueryKeyString === queryHashRef.current;

          if (isOurQuery) {
            if (event.type === "removed") {
              setQueryState({ query: undefined, version: 0 });
            } else {
              // For 'updated' and 'added' events, use the query from the event
              // Update both the query and increment version to force re-renders
              setQueryState((prev) => ({
                query: event.query,
                version: prev.version + 1,
              }));
            }
          }
        }
      }
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [queryClient, queryKey]);

  // Return just the query, but because we're updating the queryState object
  // with a new version, components will re-render when data changes
  return queryState.query;
}
