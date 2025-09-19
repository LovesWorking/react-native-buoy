import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getStorageQueryCounts, type StorageTypeCounts } from "../utils/getStorageQueryCounts";

export function useStorageQueryCounts(): StorageTypeCounts {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const allQueries = queryClient.getQueryCache().getAll();
    return getStorageQueryCounts(allQueries);
  }, [queryClient]);
}
