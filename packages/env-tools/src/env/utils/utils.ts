import { EnvVarInfo, RequiredEnvVar, EnvVarStats } from "../types";
import { getEnvVarType } from "./envTypeDetector";

/**
 * Combines the auto-detected runtime environment values with the declared `requiredEnvVars`
 * configuration and produces categorized metadata for rendering in the UI.
 *
 * @param autoCollectedEnvVars - Values discovered via `useDynamicEnv` (key/value string map).
 * @param requiredEnvVars - Optional list of required variables describing expectations to validate.
 * @returns Required and optional variable collections annotated with validation status.
 */
export const processEnvVars = (
  autoCollectedEnvVars: Record<string, string>,
  requiredEnvVars?: RequiredEnvVar[],
) => {
  const requiredVarInfos: EnvVarInfo[] = [];
  const optionalVarInfos: EnvVarInfo[] = [];
  const processedKeys = new Set<string>();

  // Process required variables
  requiredEnvVars?.forEach((envVar) => {
    const key = typeof envVar === "string" ? envVar : envVar.key;
    const expectedValue =
      typeof envVar === "object" && "expectedValue" in envVar
        ? envVar.expectedValue
        : undefined;
    const expectedType =
      typeof envVar === "object" && "expectedType" in envVar
        ? envVar.expectedType
        : undefined;
    const description =
      typeof envVar === "object" && "description" in envVar
        ? envVar.description
        : undefined;

    processedKeys.add(key);
    const actualValue = autoCollectedEnvVars[key];
    const isPresent = actualValue !== undefined;

    let status: EnvVarInfo["status"];
    if (!isPresent) {
      status = "required_missing";
    } else if (expectedValue) {
      // Handle different expectedValue patterns
      let valueMatches = false;
      if (expectedValue === "sk_*") {
        valueMatches = actualValue.startsWith("sk_");
      } else if (expectedValue === "production or development") {
        valueMatches =
          actualValue === "production" || actualValue === "development";
      } else {
        valueMatches = actualValue === expectedValue;
      }
      status = valueMatches ? "required_present" : "required_wrong_value";
    } else if (
      expectedType &&
      getEnvVarType(actualValue).toLowerCase() !== expectedType.toLowerCase()
    ) {
      status = "required_wrong_type";
    } else {
      status = "required_present";
    }

    requiredVarInfos.push({
      key,
      value: actualValue,
      expectedValue,
      expectedType,
      description,
      status,
      category: "required",
    });
  });

  // Process optional variables (those that exist but aren't required)
  Object.entries(autoCollectedEnvVars).forEach(([key, value]) => {
    if (!processedKeys.has(key)) {
      optionalVarInfos.push({
        key,
        value,
        status: "optional_present",
        category: "optional",
      });
    }
  });

  // Sort each category
  requiredVarInfos.sort((a, b) => {
    const statusOrder: Record<EnvVarInfo["status"], number> = {
      required_missing: 0,
      required_wrong_value: 1,
      required_wrong_type: 2,
      required_present: 3,
      optional_present: 4,
    };
    if (statusOrder[a.status] !== statusOrder[b.status]) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.key.localeCompare(b.key);
  });

  optionalVarInfos.sort((a, b) => a.key.localeCompare(b.key));

  return {
    requiredVars: requiredVarInfos,
    optionalVars: optionalVarInfos,
  };
};

/**
 * Derives aggregate statistics from the processed environment variable lists for health badges
 * and summary chips in the modal UI.
 *
 * @param requiredVars - Processed required variables with validation state.
 * @param optionalVars - Processed optional variables discovered at runtime.
 * @param totalEnvVars - Raw key/value map of every detected environment variable.
 * @returns Counts related to overall env health for display purposes.
 */
export const calculateStats = (
  requiredVars: EnvVarInfo[],
  optionalVars: EnvVarInfo[],
  totalEnvVars: Record<string, string>,
): EnvVarStats => {
  const totalCount = Object.keys(totalEnvVars).length;
  const requiredCount = requiredVars.length;
  const missingCount = requiredVars.filter(
    (v) => v.status === "required_missing",
  ).length;
  const wrongValueCount = requiredVars.filter(
    (v) => v.status === "required_wrong_value",
  ).length;
  const wrongTypeCount = requiredVars.filter(
    (v) => v.status === "required_wrong_type",
  ).length;
  const presentRequiredCount = requiredVars.filter(
    (v) => v.status === "required_present",
  ).length;
  const optionalCount = optionalVars.length;

  return {
    totalCount,
    requiredCount,
    missingCount,
    wrongValueCount,
    wrongTypeCount,
    presentRequiredCount,
    optionalCount,
  };
};
