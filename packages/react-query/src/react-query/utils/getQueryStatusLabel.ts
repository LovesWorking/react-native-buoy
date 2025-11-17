import { Query } from "@tanstack/react-query";
type QueryStatus =
  | "disabled"
  | "fetching"
  | "inactive"
  | "paused"
  | "stale"
  | "fresh"
  | "error";

/**
 * Converts a query object into a human-friendly status string for badge rendering.
 * Priority order: disabled > fetching > inactive > paused > stale > fresh
 */
export function getQueryStatusLabel(query: Query): QueryStatus {
  // Check disabled first - disabled queries won't automatically fetch
  if (query.isDisabled()) {
    return "disabled";
  }

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
