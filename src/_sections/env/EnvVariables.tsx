/**
 * Main entry point for the Environment Variables feature
 * This component orchestrates all env-related functionality
 */

// Re-export all public APIs from this feature
export * from './types';
export * from './utils/helpers';
export { EnvVarsContent, useEnvVarsSubtitle } from './components/EnvVarsContent';
export { EnvVarsSection } from './components/EnvVarsSection';
export { EnvVarsDetailContent } from './components/EnvVarsSection';
export { EnvVarsModal } from './components/EnvVarsModal';
export type { Environment } from './components/EnvironmentIndicator';
export { EnvironmentIndicator } from './components/EnvironmentIndicator';
export { useDynamicEnv } from './hooks/useDynamicEnv';

// Re-export components for backward compatibility
export { EnvVarsModalContent } from './components/EnvVarsModalContent';
export { EnvVarsSection as AdminEnvVarsSection } from './components/AdminEnvVarsSection';