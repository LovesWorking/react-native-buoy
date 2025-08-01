import useAllQueries from "../../../_hooks/useAllQueries";

// Simple wrapper that just re-exports useAllQueries
// Error handling is done by ErrorBoundary components
export function useSafeQueries() {
  return useAllQueries();
}
