/**
 * Format GraphQL variables for display using arrow notation
 *
 * Mimics React Query key display format to provide visual consistency:
 * - React Query: ["pokemon", "Sandshrew"] → "pokemon › Sandshrew"
 * - GraphQL: GetPokemon(id: "Sandshrew") → "GetPokemon › Sandshrew"
 *
 * Extracts only the values from variables (not keys) and formats them
 * for clean, compact display in the network request list.
 */

/**
 * Format a single variable value for display
 *
 * @param value - The variable value to format
 * @param maxLength - Maximum length for string values (default: 30)
 * @returns Formatted string or null if value should be skipped
 */
function formatValue(value: unknown, maxLength: number = 30): string | null {
  // Null/undefined - skip
  if (value === null || value === undefined) {
    return null;
  }

  // Boolean
  if (typeof value === 'boolean') {
    return String(value);
  }

  // Number
  if (typeof value === 'number') {
    return String(value);
  }

  // String
  if (typeof value === 'string') {
    // Truncate long strings
    if (value.length > maxLength) {
      return value.substring(0, maxLength - 1) + '…';
    }
    return value;
  }

  // Array - take first value or show count
  if (Array.isArray(value)) {
    if (value.length === 0) return null;
    if (value.length === 1) {
      return formatValue(value[0], maxLength);
    }
    // Multiple items - show count
    return `${value.length} items`;
  }

  // Object - extract first string/number value
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return null;

    // Find first meaningful value
    for (const [_, v] of entries) {
      const formatted = formatValue(v, maxLength);
      if (formatted) {
        return formatted;
      }
    }
    return null;
  }

  return null;
}

/**
 * Extract variable values from GraphQL variables object
 *
 * Returns an array of formatted values for display with arrow notation.
 *
 * @param variables - GraphQL variables object
 * @param maxValues - Maximum number of values to show (default: 3)
 * @returns Array of formatted variable values
 *
 * @example
 * formatGraphQLVariables({ id: "pikachu" })
 * // Returns: ["pikachu"]
 *
 * @example
 * formatGraphQLVariables({ userId: 123, includeProfile: true })
 * // Returns: ["123", "true"]
 *
 * @example
 * formatGraphQLVariables({ filter: { status: "active" }, limit: 10 })
 * // Returns: ["active", "10"]
 */
export function formatGraphQLVariables(
  variables: Record<string, unknown> | undefined,
  maxValues: number = 3
): string[] | null {
  if (!variables || typeof variables !== 'object') {
    return null;
  }

  const values: string[] = [];

  // Extract values from variables object
  for (const [_, value] of Object.entries(variables)) {
    const formatted = formatValue(value);
    if (formatted) {
      values.push(formatted);
    }

    // Stop if we've reached max values
    if (values.length >= maxValues) {
      break;
    }
  }

  return values.length > 0 ? values : null;
}

/**
 * Combine operation name with variables using arrow notation
 *
 * Matches React Query display pattern: "pokemon › Sandshrew"
 * This provides visual consistency across all dev tools.
 *
 * @param operationName - GraphQL operation name (e.g., "GetPokemon")
 * @param variables - GraphQL variables object
 * @returns Formatted string with arrow notation
 *
 * @example
 * formatGraphQLDisplay("GetPokemon", { id: "Sandshrew" })
 * // Returns: "GetPokemon › Sandshrew"
 *
 * @example
 * formatGraphQLDisplay("GetUser", { userId: 123, includeProfile: true })
 * // Returns: "GetUser › 123 › true"
 *
 * @example
 * formatGraphQLDisplay("GetPosts", { status: "published", limit: 10, offset: 0 })
 * // Returns: "GetPosts › published › 10 › 0" (first 3 values by default)
 *
 * @example
 * formatGraphQLDisplay("GetCurrentUser", {})
 * // Returns: "GetCurrentUser" (no variables)
 */
export function formatGraphQLDisplay(
  operationName: string,
  variables?: Record<string, unknown>
): string {
  const values = formatGraphQLVariables(variables);

  if (!values || values.length === 0) {
    // No variables - just operation name
    return operationName;
  }

  // Combine: "GetPokemon › Sandshrew" (matches React Query pattern)
  return [operationName, ...values].join(" › ");
}

/**
 * Search GraphQL variables for a given text
 *
 * Recursively searches through all variable values to find matches.
 * Used for filtering GraphQL requests by variable content.
 *
 * @param variables - GraphQL variables object
 * @param searchText - Text to search for (already lowercased)
 * @returns true if search text found in any variable value
 *
 * @example
 * searchGraphQLVariables({ id: "pikachu" }, "pika")
 * // Returns: true
 *
 * @example
 * searchGraphQLVariables({ userId: 123, name: "John" }, "123")
 * // Returns: true
 */
export function searchGraphQLVariables(
  variables: Record<string, unknown> | undefined,
  searchText: string
): boolean {
  if (!variables || typeof variables !== 'object') {
    return false;
  }

  // Search through all variable values
  for (const value of Object.values(variables)) {
    if (searchValue(value, searchText)) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively search a value for matching text
 */
function searchValue(value: unknown, searchText: string): boolean {
  // String - direct match
  if (typeof value === 'string') {
    return value.toLowerCase().includes(searchText);
  }

  // Number - convert to string and match
  if (typeof value === 'number') {
    return String(value).includes(searchText);
  }

  // Boolean - convert to string and match
  if (typeof value === 'boolean') {
    return String(value).includes(searchText);
  }

  // Array - search each item
  if (Array.isArray(value)) {
    return value.some(item => searchValue(item, searchText));
  }

  // Object - search nested values
  if (typeof value === 'object' && value !== null) {
    return Object.values(value).some(v => searchValue(v, searchText));
  }

  return false;
}
