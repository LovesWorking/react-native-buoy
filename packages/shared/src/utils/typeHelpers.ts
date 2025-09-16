/**
 * Type detection and validation utilities
 */

/**
 * Detects the type of a value with more granular type checking
 * @param value - The value to check
 * @returns A string representing the specific type
 */
export const getValueType = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  
  const type = typeof value;
  if (type === "object") {
    // Check for specific object types
    if (value instanceof Date) return "date";
    if (value instanceof RegExp) return "regexp";
    if (value instanceof Map) return "map";
    if (value instanceof Set) return "set";
    if (value instanceof Error) return "error";
    return "object";
  }
  
  return type;
};

/**
 * Checks if a value is a primitive type
 * @param value - The value to check
 * @returns True if the value is primitive
 */
export const isPrimitive = (value: unknown): boolean => {
  const type = typeof value;
  return (
    value === null ||
    value === undefined ||
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "bigint" ||
    type === "symbol"
  );
};

/**
 * Checks if a value is a valid JSON serializable value
 * @param value - The value to check
 * @returns True if the value can be JSON serialized
 */
export const isJsonSerializable = (value: unknown): boolean => {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Checks if a string represents a valid JSON value
 * @param str - The string to test
 * @returns True if the string is valid JSON
 */
export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

/**
 * Safely gets the constructor name of a value
 * @param value - The value to check
 * @returns The constructor name or type string
 */
export const getConstructorName = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  
  try {
    return value.constructor?.name || typeof value;
  } catch {
    return typeof value;
  }
};

/**
 * Checks if a value is an empty object or array
 * @param value - The value to check
 * @returns True if the value is empty
 */
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

/**
 * Gets a human-readable size description for objects and arrays
 * @param value - The value to get size for
 * @returns A human-readable size string
 */
export const getValueSize = (value: unknown): string => {
  if (Array.isArray(value)) {
    const count = value.length;
    if (count === 0) return "empty array";
    if (count === 1) return "1 item";
    return `${count} items`;
  }
  
  if (value && typeof value === "object") {
    const keys = Object.keys(value);
    const count = keys.length;
    if (count === 0) return "empty object";
    if (count === 1) return "1 key";
    return `${count} keys`;
  }
  
  if (typeof value === "string") {
    const length = value.length;
    if (length === 0) return "empty string";
    if (length === 1) return "1 character";
    return `${length} characters`;
  }
  
  return "";
};

/**
 * Type guard to check if a value is an object (not null, not array)
 * @param value - The value to check
 * @returns True if value is a plain object
 */
export const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    value.constructor === Object
  );
};