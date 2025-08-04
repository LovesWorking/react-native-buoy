import { EnvVarType } from "../types";

/**
 * Detects the type of an environment variable value
 * First checks if useDynamicEnv already parsed it to the correct type,
 * then analyzes string content to detect what type it represents
 * 
 * @returns One of: "string", "number", "boolean", "array", "object"
 */
export function getEnvVarType(value: unknown): EnvVarType | "unknown" {
  // Check the actual parsed value type from useDynamicEnv
  const type = typeof value;

  if (type === "boolean") return "boolean";
  if (type === "number") return "number";
  if (Array.isArray(value)) return "array";
  if (type === "object" && value !== null) return "object";

  // For strings, check if they look like other types
  if (type === "string") {
    const strValue = value as string;

    // Check if it looks like JSON
    if (
      (strValue.startsWith("{") && strValue.endsWith("}")) ||
      (strValue.startsWith("[") && strValue.endsWith("]"))
    ) {
      try {
        const parsed = JSON.parse(strValue);
        return Array.isArray(parsed) ? "array" : "object";
      } catch {
        return "string";
      }
    }

    // Check if it's a boolean string
    if (
      strValue.toLowerCase() === "true" ||
      strValue.toLowerCase() === "false"
    ) {
      return "boolean";
    }

    // Check if it's a number string
    if (!isNaN(Number(strValue)) && strValue.trim() !== "") {
      return "number";
    }

    // Check if it's a comma-separated array
    if (strValue.includes(",")) {
      return "array";
    }

    return "string";
  }

  return "unknown";
}
