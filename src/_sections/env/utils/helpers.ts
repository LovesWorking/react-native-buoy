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
        ? { key: this.key, expectedValue: this.expectedValue, description: this.description }
        : { key: this.key, expectedValue: this.expectedValue };
    }
    
    if (this.expectedType !== undefined) {
      return this.description
        ? { key: this.key, expectedType: this.expectedType, description: this.description }
        : { key: this.key, expectedType: this.expectedType };
    }
    
    // If neither type nor value is specified, just check existence
    return this.key;
  }
}

export function envVar(key: string) {
  return new EnvVarBuilder(key);
}

/**
 * Type guard to check if a RequiredEnvVar has an expected value
 */
export function hasExpectedValue(
  requiredEnvVar: RequiredEnvVar
): requiredEnvVar is { key: string; expectedValue: string; description?: string } {
  return typeof requiredEnvVar === "object" && "expectedValue" in requiredEnvVar;
}

/**
 * Type guard to check if a RequiredEnvVar has an expected type
 */
export function hasExpectedType(
  requiredEnvVar: RequiredEnvVar
): requiredEnvVar is { key: string; expectedType: EnvVarType; description?: string } {
  return typeof requiredEnvVar === "object" && "expectedType" in requiredEnvVar;
}

/**
 * Helper to create a set of required environment variables with better readability
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
 *   {
 *     key: "EXPO_PUBLIC_MAX_RETRIES",
 *     expectedType: "number",
 *     description: "Maximum number of API retry attempts"
 *   }
 * ]);
 */
export function createEnvVarConfig(vars: RequiredEnvVar[]): RequiredEnvVar[] {
  return vars;
}

/**
 * Helper to validate environment variables at runtime
 * Returns an object with validation results
 */
export function validateEnvVars(
  envVars: Record<string, unknown>,
  requiredVars: RequiredEnvVar[]
): {
  isValid: boolean;
  errors: Array<{
    key: string;
    issue: "missing" | "wrong_type" | "wrong_value";
    expected?: string | EnvVarType;
    actual?: unknown;
  }>;
} {
  const errors: Array<{
    key: string;
    issue: "missing" | "wrong_type" | "wrong_value";
    expected?: string | EnvVarType;
    actual?: unknown;
  }> = [];

  for (const requiredVar of requiredVars) {
    const key = typeof requiredVar === "string" ? requiredVar : requiredVar.key;
    const value = envVars[key];

    if (value === undefined) {
      errors.push({ key, issue: "missing" });
      continue;
    }

    if (hasExpectedValue(requiredVar) && value !== requiredVar.expectedValue) {
      errors.push({
        key,
        issue: "wrong_value",
        expected: requiredVar.expectedValue,
        actual: value,
      });
    }

    if (hasExpectedType(requiredVar)) {
      const actualType = typeof value === "string" 
        ? "string"
        : Array.isArray(value)
        ? "array"
        : typeof value;
        
      if (actualType !== requiredVar.expectedType) {
        errors.push({
          key,
          issue: "wrong_type",
          expected: requiredVar.expectedType,
          actual: actualType,
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}