import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useEffect } from "react";
import { FloatingDevTools } from "@react-buoy/core";
import type { Environment, UserRole } from "@react-buoy/env";
import type { EnvVarConfig, StorageKeyConfig } from "@react-buoy/core";
import { initializeMockMMKVData } from "../utils/mmkvSetup";

export default function RootLayout() {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }

  // Initialize MMKV with mock data on mount
  useEffect(() => {
    initializeMockMMKVData();
  }, []);

  const userRole: UserRole = "admin";
  const environment: Environment = "local";

  const requiredEnvVars: EnvVarConfig[] = [
    // Valid variables
    "EXPO_PUBLIC_API_URL",
    {
      key: "EXPO_PUBLIC_DEBUG_MODE",
      expectedType: "boolean",
      description: "Enable debug logging",
    },
    { key: "EXPO_PUBLIC_MAX_RETRIES", expectedType: "number" },
    { key: "EXPO_PUBLIC_ENVIRONMENT", expectedValue: "development" },

    // Wrong values (exists but incorrect)
    {
      key: "EXPO_PUBLIC_API_VERSION",
      expectedValue: "v2",
      description: "API version (should be v2)",
    },
    { key: "EXPO_PUBLIC_REGION", expectedValue: "us-east-1" },

    // Wrong types (exists but wrong type)
    {
      key: "EXPO_PUBLIC_FEATURE_FLAGS",
      description: "Feature flags configuration object",
      expectedType: "object",
    },
    { key: "EXPO_PUBLIC_PORT", expectedType: "number" },

    // Missing variables
    "EXPO_PUBLIC_SENTRY_DSN",
    {
      key: "EXPO_PUBLIC_ANALYTICS_KEY",
      description: "Analytics service API key",
      expectedType: "string",
    },
    { key: "EXPO_PUBLIC_ENABLE_TELEMETRY", expectedType: "boolean" },
  ];

  const storageRequiredKeys: StorageKeyConfig[] = [
    {
      key: "@app/session",
      expectedType: "string",
      description: "Current user session token",
      storageType: "secure",
    },
    {
      key: "@app/settings:theme",
      expectedValue: "dark",
      description: "Preferred theme",
      storageType: "mmkv",
    },
    {
      key: "@devtools/storage/activeTab",
      description: "Last viewed storage tab",
      storageType: "async",
    },
  ];

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <FloatingDevTools
        requiredEnvVars={requiredEnvVars}
        requiredStorageKeys={storageRequiredKeys}
        actions={{}}
        environment={environment}
        userRole={userRole}
      />
      <Slot />
    </QueryClientProvider>
  );
}
