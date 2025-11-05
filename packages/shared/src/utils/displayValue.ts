import { serialize, deserialize } from "./minimalSuperJSON";

/**
 * Displays a string regardless the type of the data
 * Uses minimal SuperJSON to properly serialize complex objects, avoiding [object Object].
 * @param {unknown} value Value to be stringified
 * @param {boolean} beautify Formats json to multiline
 */
export const displayValue = (value: unknown, beautify: boolean = false) => {
  const { json } = serialize(value);
  return JSON.stringify(json, null, beautify ? 2 : undefined);
};

/**
 * Parses a string that was serialized with displayValue/minimal SuperJSON.
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
