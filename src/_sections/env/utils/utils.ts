import { EnvVarInfo, RequiredEnvVar, EnvVarStats } from "../types";
import { getEnvVarType } from "./envTypeDetector";

export const processEnvVars = (
  autoCollectedEnvVars: Record<string, string>,
  requiredEnvVars?: RequiredEnvVar[]
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
    } else if (expectedValue && actualValue !== expectedValue) {
      status = "required_wrong_value";
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

export const calculateStats = (
  requiredVars: EnvVarInfo[],
  optionalVars: EnvVarInfo[],
  totalEnvVars: Record<string, string>
): EnvVarStats => {
  const totalCount = Object.keys(totalEnvVars).length;
  const requiredCount = requiredVars.length;
  const missingCount = requiredVars.filter(
    (v) => v.status === "required_missing"
  ).length;
  const wrongValueCount = requiredVars.filter(
    (v) => v.status === "required_wrong_value"
  ).length;
  const wrongTypeCount = requiredVars.filter(
    (v) => v.status === "required_wrong_type"
  ).length;
  const presentRequiredCount = requiredVars.filter(
    (v) => v.status === "required_present"
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

export const getSubtitle = (stats: EnvVarStats) => {
  const {
    requiredCount,
    missingCount,
    wrongValueCount,
    wrongTypeCount,
    optionalCount,
  } = stats;
  const issueCount = missingCount + wrongValueCount + wrongTypeCount;

  if (requiredCount > 0) {
    if (issueCount > 0) {
      // Break down the issues for clarity
      const issues: string[] = [];
      if (missingCount > 0) issues.push(`${missingCount} missing`);
      if (wrongTypeCount > 0) issues.push(`${wrongTypeCount} wrong type`);
      if (wrongValueCount > 0) issues.push(`${wrongValueCount} wrong value`);
      
      return `⚠️ ${issueCount} issue${issueCount > 1 ? 's' : ''}: ${issues.join(', ')}`;
    } else {
      return `✅ All ${requiredCount} required vars valid${optionalCount > 0 ? ` • ${optionalCount} optional` : ''}`;
    }
  } else {
    return `${optionalCount} variable${optionalCount !== 1 ? 's' : ''} found`;
  }
};
