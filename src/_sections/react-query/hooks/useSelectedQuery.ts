import { useEffect, useState, useRef } from "react";
import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";

/**
 * Custom hook to track a single query by its queryKey with live updates
 * Optimized to only re-render when the specific query changes
 */
export function useGetQueryByQueryKey(queryKey?: QueryKey) {
  const queryClient = useQueryClient();
  const [selectedQuery, setSelectedQuery] = useState<Query | undefined>(
    undefined
  );
  const queryHashRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!queryKey) {
      setSelectedQuery(undefined);
      queryHashRef.current = undefined;
      return;
    }

    // Get initial query state
    const query = queryClient.getQueryCache().find({ queryKey, exact: true });
    setSelectedQuery(query);

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
          if (eventQueryKeyString === queryHashRef.current) {
            if (event.type === "removed") {
              setSelectedQuery(undefined);
            } else {
              // For 'updated' and 'added' events, use the query from the event
              setSelectedQuery(event.query);
            }
          }
        }
      }
    });

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [queryClient, queryKey]);

  return selectedQuery;
}
