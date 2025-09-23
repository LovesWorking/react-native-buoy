import { RequiredEnvVar, EnvVarType } from "../types";

/**
 * Helper to create a required env var configuration with type checking
 *
 * @example
 * const config = envVar("EXPO_PUBLIC_API_URL")
 *   .withType("string")
 *   .withDescription("Backend API endpoint")
 *   .build();
 *
 * @example
 * const config = envVar("EXPO_PUBLIC_DEBUG_MODE")
 *   .withDescription("Enable debug logging")
 *   .withType("boolean")
 *   .build();
 */
class EnvVarBuilder {
  constructor(private key: string) {}

  private expectedType?: EnvVarType;
  private expectedValue?: string;
  private description?: string;

  /** Just check if the variable exists */
  exists(): RequiredEnvVar {
    return this.key;
  }

  /** Check for a specific value */
  withValue(value: string): this {
    this.expectedValue = value;
    delete this.expectedType; // Can't have both type and value
    return this;
  }

  /** Check for a specific type */
  withType(type: EnvVarType): this {
    this.expectedType = type;
    delete this.expectedValue; // Can't have both type and value
    return this;
  }

  /** Add a description for documentation */
  withDescription(desc: string): this {
    this.description = desc;
    return this;
  }

  /** Build the final configuration */
  build(): RequiredEnvVar {
    if (this.expectedValue !== undefined) {
      return this.description
        ? {
            key: this.key,
            expectedValue: this.expectedValue,
            description: this.description,
          }
        : { key: this.key, expectedValue: this.expectedValue };
    }

    if (this.expectedType !== undefined) {
      return this.description
        ? {
            key: this.key,
            expectedType: this.expectedType,
            description: this.description,
          }
        : { key: this.key, expectedType: this.expectedType };
    }

    // If neither type nor value is specified, just check existence
    return this.key;
  }
}

/**
 * Fluent builder for defining expected environment variables. Helps teams author readable
 * `requiredEnvVars` arrays by chaining type/value/description requirements while keeping the
 * final shape compatible with `EnvVarsModal` and related helpers.
 *
 * @param key - Environment variable name to validate.
 * @returns Builder with convenience methods like `.withType()` and `.withValue()`.
 */
export function envVar(key: string) {
  return new EnvVarBuilder(key);
}

/**
 * Normalizes `requiredEnvVars` definitions while documenting intent in code. The helper simply
 * returns the provided array, but allows teams to co-locate examples and benefit from IDE hovers.
 *
 * @param vars - Collection of required environment variable definitions created manually or via `envVar()`.
 * @returns The original array, unchanged, for ergonomic chaining and inference.
 *
 * @example
 * const requiredEnvVars = createEnvVarConfig([
 *   // Simple existence check
 *   "EXPO_PUBLIC_API_URL",
 *
 *   // Type checking
 *   { key: "EXPO_PUBLIC_DEBUG_MODE", expectedType: "boolean" },
 *
 *   // Value checking
 *   { key: "EXPO_PUBLIC_ENVIRONMENT", expectedValue: "development" },
 *
 *   // With descriptions
 *   envVar("EXPO_PUBLIC_MAX_RETRIES")
 *     .withType("number")
 *     .withDescription("Maximum number of API retry attempts")
 *     .build(),
 * ]);
 */
export function createEnvVarConfig(vars: RequiredEnvVar[]): RequiredEnvVar[] {
  return vars;
}
