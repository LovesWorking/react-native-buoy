import type { Query } from "@tanstack/react-query";

/**
 * Maps a query’s runtime state to one of the predefined status color tokens used in the UI.
 */
export function getQueryStatusColor({
  queryState,
  observerCount,
  isStale,
}: {
  queryState: Query["state"];
  observerCount: number;
  isStale: boolean;
}) {
  return queryState.fetchStatus === "fetching"
    ? "blue"
    : !observerCount
      ? "gray"
      : queryState.fetchStatus === "paused"
        ? "purple"
        : isStale
          ? "yellow"
          : "green";
}
