/**
 * Network monitoring types for React Native dev tools
 */

/**
 * Canonical shape for network activity captured by the dev tools interceptor.
 */
export interface NetworkEvent {
  id: string;
  method:
    | "GET"
    | "POST"
    | "PUT"
    | "DELETE"
    | "PATCH"
    | "HEAD"
    | "OPTIONS"
    | string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestData?: unknown;
  responseData?: unknown;
  responseSize?: number;
  requestSize?: number;
  timestamp: number;
  duration?: number;
  error?: string;
  // Additional metadata
  host?: string;
  path?: string;
  query?: string;
  responseType?: string;
  cached?: boolean;
  requestClient?: "fetch" | "axios" | "graphql";
}

/**
 * Aggregated counts derived from the currently loaded set of network events.
 */
export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  pendingRequests: number;
  totalDataSent: number;
  totalDataReceived: number;
  averageDuration: number;
}

/**
 * Criteria used when filtering network events in the UI.
 */
export interface NetworkFilter {
  method?: string[];
  status?: "success" | "error" | "pending" | "all";
  contentType?: string[];
  searchText?: string;
  host?: string;
}

/** Human readable status classifications derived from request/response metadata. */
export type NetworkEventStatus = "pending" | "success" | "error" | "timeout";

/**
 * Insight surfaces highlight notable traffic patterns or issues for the current session.
 */
export interface NetworkInsight {
  type: "performance" | "error" | "security" | "optimization";
  severity: "low" | "medium" | "high";
  message: string;
  details?: string;
  eventId: string;
}
