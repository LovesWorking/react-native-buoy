import { useEffect, useState } from "react";
import { Query, QueryClient, QueryKey } from "@tanstack/react-query";

/**
 * Custom hook to track a single query by its queryKey with live updates
 * Similar to useAllQueries but for a specific query
 */
function useSelectedQuery(queryClient: QueryClient, queryKey?: QueryKey) {
  const [selectedQuery, setSelectedQuery] = useState<
    Query<any, any, any, any> | undefined
  >(undefined);

  useEffect(() => {
    const updateSelectedQuery = () => {
      if (queryKey) {
        // Find the specific query by its key - this gets fresh data from cache
        const query = queryClient.getQueryCache().find({ queryKey });
        setSelectedQuery(query);
      } else {
        setSelectedQuery(undefined);
      }
    };

    // Perform initial update
    updateSelectedQuery();

    // Subscribe to query cache changes to get live updates
    const unsubscribe = queryClient
      .getQueryCache()
      .subscribe(updateSelectedQuery);

    // Cleanup subscription when component unmounts
    return () => unsubscribe();
  }, [queryClient, queryKey]);

  return selectedQuery;
}

export default useSelectedQuery;
