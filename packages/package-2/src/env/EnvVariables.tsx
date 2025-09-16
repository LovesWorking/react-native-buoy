/**
 * Main entry point for the Environment Variables feature
 * This component orchestrates all env-related functionality
 */

// Re-export only the public APIs that are actually used
export type { RequiredEnvVar, EnvVarInfo, EnvVarStats, EnvVarType } from "./types";
export { envVar, createEnvVarConfig } from "./utils/helpers";
export { EnvVarsModal } from "./components/EnvVarsModal";
export type { Environment } from "./components/EnvironmentIndicator";
export { EnvironmentIndicator } from "./components/EnvironmentIndicator";
