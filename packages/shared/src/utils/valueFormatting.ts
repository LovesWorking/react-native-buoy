import { gameUIColors } from "../ui/gameUI";

/**
 * Safely parses a value that might be a JSON string
 * @param value - The value to parse
 * @returns The parsed value or original value if parsing fails
 */
export const parseValue = (value: unknown): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

/**
 * Formats a value for display with appropriate type representation
 * @param value - The value to format
 * @returns A string representation of the value
 */
export const formatValue = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return String(value);
  if (typeof value === "function") return `[Function: ${value.name || "anonymous"}]`;
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return `[Array: ${value.length} items]`;
    }
    return `{Object: ${Object.keys(value).length} keys}`;
  }
  return String(value);
};

/**
 * Gets the color for a value based on its type
 * @param value - The value to get color for
 * @returns The color string for the value type
 */
export const getTypeColor = (value: unknown): string => {
  if (value === null) return gameUIColors.dataTypes.null;
  if (value === undefined) return gameUIColors.dataTypes.undefined;
  
  const type = typeof value;
  switch (type) {
    case "string":
      return gameUIColors.dataTypes.string;
    case "number":
      return gameUIColors.dataTypes.number;
    case "boolean":
      return gameUIColors.dataTypes.boolean;
    case "function":
      return gameUIColors.dataTypes.function;
    case "object":
      return Array.isArray(value)
        ? gameUIColors.dataTypes.array
        : gameUIColors.dataTypes.object;
    default:
      return gameUIColors.primary;
  }
};

/**
 * Truncates text to a specified length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

/**
 * Flattens a nested object into a flat structure with dot notation paths
 * @param obj - The object to flatten
 * @param prefix - The prefix for the current level
 * @returns A flat object with dot notation keys
 */
export const flattenObject = (
  obj: unknown,
  prefix = ""
): Record<string, unknown> => {
  const flattened: Record<string, unknown> = {};

  if (obj === null || obj === undefined) {
    return flattened;
  }

  if (typeof obj !== "object") {
    flattened[prefix || "root"] = obj;
    return flattened;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const path = prefix ? `${prefix}[${index}]` : `[${index}]`;
      if (typeof item === "object" && item !== null) {
        Object.assign(flattened, flattenObject(item, path));
      } else {
        flattened[path] = item;
      }
    });
  } else {
    Object.keys(obj).forEach((key) => {
      const path = prefix ? `${prefix}.${key}` : key;
      const objValue = (obj as Record<string, unknown>)[key];
      if (typeof objValue === "object" && objValue !== null) {
        Object.assign(flattened, flattenObject(objValue, path));
      } else {
        flattened[path] = objValue;
      }
    });
  }

  return flattened;
};

/**
 * Creates a readable path from an array of segments (for diff viewers)
 * @param pathSegments - Array of path segments
 * @returns A readable path string
 */
export const formatPath = (pathSegments: (string | number)[]): string => {
  if (pathSegments.length === 0) return "root";
  
  return pathSegments
    .map((segment, index) => {
      if (typeof segment === "number") {
        return `[${segment}]`;
      }
      // First segment doesn't need a dot
      return index === 0 ? segment : `.${segment}`;
    })
    .join("");
};