/**
 * Extract GraphQL operation name from request data
 *
 * This utility extracts the operation name from GraphQL requests to enable
 * searching and filtering by operation name rather than just URL paths.
 *
 * For GraphQL, all requests typically go to the same endpoint (e.g., /graphql),
 * making URL-based search ineffective. This function extracts the actual
 * operation name (e.g., "GetUser", "CreatePost") from the request payload.
 *
 * Extraction Methods (tried in order):
 * 1. Direct operationName field in request data
 * 2. Parse from query string using regex pattern
 *
 * @param requestData - The request data object (typically GraphQL query payload)
 * @returns Operation name string or null if not found
 *
 * @example
 * // Method 1: Explicit operationName field
 * const data1 = {
 *   operationName: "GetUser",
 *   query: "query GetUser { user { id name } }"
 * };
 * extractOperationName(data1); // Returns "GetUser"
 *
 * @example
 * // Method 2: Parse from query string
 * const data2 = {
 *   query: "mutation CreatePost { createPost(title: \"Hello\") { id } }"
 * };
 * extractOperationName(data2); // Returns "CreatePost"
 *
 * @example
 * // No operation name (anonymous query)
 * const data3 = {
 *   query: "{ user { id name } }"
 * };
 * extractOperationName(data3); // Returns null
 */
export function extractOperationName(requestData: unknown): string | null {
  // Validate input is an object
  if (!requestData || typeof requestData !== 'object') {
    return null;
  }

  // Method 1: Check for explicit operationName field
  // This is the standard GraphQL request format
  if ('operationName' in requestData && requestData.operationName) {
    const opName = requestData.operationName;
    // Ensure it's a string and not empty
    if (typeof opName === 'string' && opName.trim().length > 0) {
      return opName.trim();
    }
  }

  // Method 2: Parse from query string
  // Handles cases where operationName field is missing or null
  if ('query' in requestData && typeof requestData.query === 'string') {
    const query = requestData.query;

    // Match: query OperationName or mutation OperationName or subscription OperationName
    // Pattern explanation:
    // - (?:query|mutation|subscription) - Match operation type (non-capturing group)
    // - \s+ - One or more whitespace characters
    // - (\w+) - Capture operation name (letters, numbers, underscore)
    const match = query.match(/(?:query|mutation|subscription)\s+(\w+)/);

    if (match && match[1]) {
      return match[1];
    }
  }

  // No operation name found
  return null;
}
