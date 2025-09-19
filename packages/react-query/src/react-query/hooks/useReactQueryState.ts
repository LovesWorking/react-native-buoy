import { QueryClient } from "@tanstack/react-query";

/**
 * Custom hook for getting React Query state information
 * Separated from UI concerns following composition principles
 */
export function useReactQueryState(queryClient: QueryClient) {
  const getRnBetterDevToolsSubtitle = () => {
    try {
      const allQueries = queryClient.getQueryCache().getAll();
      const allMutations = queryClient.getMutationCache().getAll();
      return `${allQueries.length} queries • ${allMutations.length} mutations`;
    } catch {
      return "Data management & cache inspector";
    }
  };

  return {
    getRnBetterDevToolsSubtitle,
  };
}
