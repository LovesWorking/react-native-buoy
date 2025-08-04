import { Query } from "@tanstack/react-query";
type QueryStatus =
  | "fetching"
  | "inactive"
  | "paused"
  | "stale"
  | "fresh"
  | "error";

export function getQueryStatusLabel(query: Query): QueryStatus {
  return query.state.fetchStatus === "fetching"
    ? "fetching"
    : !query.getObserversCount()
      ? "inactive"
      : query.state.fetchStatus === "paused"
        ? "paused"
        : query.isStale()
          ? "stale"
          : "fresh";
}
