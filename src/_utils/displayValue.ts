import { serialize, deserialize } from 'superjson';

/**
 * Converts any value to a display-friendly string representation.
 * Uses SuperJSON to properly serialize complex objects, avoiding [object Object].
 * 
 * @param value - The value to display
 * @param beautify - Whether to format the output with indentation
 * @returns JSON string representation of the value
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const { json } = serialize(value);
  return JSON.stringify(json, null, beautify ? 2 : undefined);
};

/**
 * Parses a string that was serialized with displayValue/SuperJSON.
 * Properly deserializes complex types like Date, RegExp, Map, Set, etc.
 * 
 * @param value - The string to parse
 * @returns The deserialized value
 */
export const parseDisplayValue = (value: string) => {
  try {
    const parsed = JSON.parse(value);
    return deserialize({ json: parsed, meta: undefined });
  } catch {
    // Fallback to regular JSON.parse if not a SuperJSON serialized value
    return JSON.parse(value);
  }
};