/**
 * Supported environment variable types that can be automatically detected
 */
export type EnvVarType = "string" | "number" | "boolean" | "array" | "object";

/**
 * Configuration for a required environment variable
 * 
 * @example
 * // Simple string check (just check if it exists)
 * "EXPO_PUBLIC_API_URL"
 * 
 * @example
 * // Check for specific value
 * { key: "EXPO_PUBLIC_ENVIRONMENT", expectedValue: "development" }
 * 
 * @example
 * // Check for specific type
 * { key: "EXPO_PUBLIC_DEBUG_MODE", expectedType: "boolean" }
 * 
 * @example
 * // With description for documentation
 * { 
 *   key: "EXPO_PUBLIC_API_URL", 
 *   expectedType: "string",
 *   description: "Backend API endpoint URL"
 * }
 */
export type RequiredEnvVar =
  | string  // Just check if the env var exists
  | {
      /** The environment variable key/name */
      key: string;
      /** Expected exact value for this variable */
      expectedValue: string;
      /** Optional description for documentation */
      description?: string;
    }
  | {
      /** The environment variable key/name */
      key: string;
      /** Expected type for this variable */
      expectedType: EnvVarType;
      /** Optional description for documentation */
      description?: string;
    };

/**
 * Internal representation of environment variable information
 */
export interface EnvVarInfo {
  key: string;
  value: unknown;
  expectedValue?: string;
  expectedType?: EnvVarType;
  description?: string;
  status:
    | "required_present"
    | "required_missing"
    | "required_wrong_value"
    | "required_wrong_type"
    | "optional_present";
  category: "required" | "optional";
}

/**
 * Statistics about environment variables
 */
export interface EnvVarStats {
  totalCount: number;
  requiredCount: number;
  missingCount: number;
  wrongValueCount: number;
  wrongTypeCount: number;
  presentRequiredCount: number;
  optionalCount: number;
}
