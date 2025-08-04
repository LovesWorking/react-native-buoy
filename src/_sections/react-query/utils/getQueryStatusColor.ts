import type { Query } from "@tanstack/query-core";

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
