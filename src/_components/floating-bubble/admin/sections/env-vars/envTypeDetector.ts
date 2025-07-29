/**
 * Detects the type of an environment variable value
 * First checks if useDynamicEnv already parsed it to the correct type,
 * then analyzes string content to detect what type it represents
 */
export function getEnvVarType(value: unknown): string {
  // Check the actual parsed value type from useDynamicEnv
  const type = typeof value;

  if (type === "boolean") return "BOOLEAN";
  if (type === "number") return "NUMBER";
  if (Array.isArray(value)) return "ARRAY";
  if (type === "object" && value !== null) return "OBJECT";

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
        return Array.isArray(parsed) ? "ARRAY" : "OBJECT";
      } catch {
        return "STRING";
      }
    }

    // Check if it's a boolean string
    if (
      strValue.toLowerCase() === "true" ||
      strValue.toLowerCase() === "false"
    ) {
      return "BOOLEAN";
    }

    // Check if it's a number string
    if (!isNaN(Number(strValue)) && strValue.trim() !== "") {
      return "NUMBER";
    }

    // Check if it's a comma-separated array
    if (strValue.includes(",")) {
      return "ARRAY";
    }

    return "STRING";
  }

  return "UNKNOWN";
}
