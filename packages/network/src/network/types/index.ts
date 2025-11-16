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
  requestClient?: "fetch" | "axios" | "graphql" | "grpc-web";
  /**
   * GraphQL operation name extracted from request data.
   *
   * For GraphQL requests, this contains the operation name (e.g., "GetUser", "CreatePost")
   * extracted from either the operationName field or parsed from the query string.
   * This enables searching and filtering GraphQL operations by name rather than just URL.
   *
   * @example
   * // For a GraphQL query like: query GetUser { user { id name } }
   * // operationName will be: "GetUser"
   */
  operationName?: string;
  /**
   * GraphQL variables object for the operation.
   *
   * Contains the input parameters passed to the GraphQL query/mutation.
   * Used to differentiate between multiple requests with the same operation name.
   * Displayed with arrow notation matching React Query pattern: "GetPokemon › Sandshrew"
   *
   * @example
   * // For query GetPokemon($id: String!) with variables { id: "Sandshrew" }
   * // graphqlVariables will be: { id: "Sandshrew" }
   * // Display: "GetPokemon › Sandshrew"
   */
  graphqlVariables?: Record<string, unknown>;
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
