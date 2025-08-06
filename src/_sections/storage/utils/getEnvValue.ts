/**
 * Get environment variable value from mobile sources
 * Handles React Native and Expo environments only
 */
export function getEnvValue(key: string): any {
  // Try process.env first (works in React Native with Metro bundler)
  if (
    typeof process !== "undefined" &&
    process.env &&
    process.env[key] !== undefined
  ) {
    return process.env[key];
  }

  // Try Expo Constants (for Expo apps)
  try {
    // Check if Constants exists as a global variable (from expo-constants)
    const globalConstants = (globalThis as any).Constants || (global as any).Constants;
    if (globalConstants) {
      if (globalConstants.expoConfig?.extra?.[key] !== undefined) {
        return globalConstants.expoConfig.extra[key];
      }
      if (globalConstants.manifest?.extra?.[key] !== undefined) {
        return globalConstants.manifest.extra[key];
      }
      if (globalConstants.manifest2?.extra?.[key] !== undefined) {
        return globalConstants.manifest2.extra[key];
      }
    }
  } catch {
    // Constants not available
  }

  // Try global object (React Native global)
  if (typeof global !== "undefined" && (global as any)[key] !== undefined) {
    return (global as any)[key];
  }

  // Try __DEV__ flag for common React Native env vars
  if (key === "NODE_ENV" && typeof __DEV__ !== "undefined") {
    return __DEV__ ? "development" : "production";
  }

  return undefined;
}
