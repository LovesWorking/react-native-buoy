import { QueryKey, Query } from "@tanstack/react-query";
type QueryStatus =
  | "fetching"
  | "inactive"
  | "paused"
  | "stale"
  | "fresh"
  | "error";

export function getQueryStatusLabel(
  query: Query<any, any, any, QueryKey>
): QueryStatus {
  if (!query || !query.state) return "inactive";

  if (query.state.error) return "error";

  if (query.state.fetchStatus === "fetching") return "fetching";

  if (!query.getObserversCount()) return "inactive";

  if (query.state.fetchStatus === "paused") return "paused";

  return query.isStale() ? "stale" : "fresh";
}
