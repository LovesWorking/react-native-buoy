import { useEffect, useState } from "react";
import { Query, useQueryClient } from "@tanstack/react-query";
function useAllQueries() {
  const queryClient = useQueryClient();
  const [queries, setQueries] = useState<Query<any, any, any, any>[]>([]);

  useEffect(() => {
    const updateQueries = () => {
      const allQueries = queryClient.getQueryCache().findAll();
      setTimeout(() => {
        setQueries(allQueries);
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
