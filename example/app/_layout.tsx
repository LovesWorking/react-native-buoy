import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useMemo } from "react";
import {
  FloatingDevTools,
  createEnvTool,
  createEnvVarConfig,
  envVar,
  createStorageTool,
  type Environment,
  type UserRole,
  type RequiredStorageKey,
} from "@react-buoy/core";

export default function RootLayout() {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }

  const userRole: UserRole = "admin";
  const environment: Environment = "local";

  const requiredEnvVars = useMemo(
    () =>
      createEnvVarConfig([
        // 🟢 GREEN - Valid variables
        envVar("EXPO_PUBLIC_API_URL").exists(), // ✓ Exists

        envVar("EXPO_PUBLIC_DEBUG_MODE")
          .withType("boolean")
          .withDescription("Enable debug logging")
          .build(), // ✓ Correct type

        envVar("EXPO_PUBLIC_MAX_RETRIES").withType("number").build(), // ✓ Correct type

        envVar("EXPO_PUBLIC_ENVIRONMENT").withValue("development").build(), // ✓ Correct value

        // 🟠 ORANGE - Wrong values (exists but incorrect)
        envVar("EXPO_PUBLIC_API_VERSION")
          .withValue("v2")
          .withDescription("API version (should be v2)")
          .build(), // ⚠ Wrong value

        envVar("EXPO_PUBLIC_REGION").withValue("us-east-1").build(), // ⚠ Wrong value

        // 🔴 RED - Wrong types (exists but wrong type)
        envVar("EXPO_PUBLIC_FEATURE_FLAGS")
          .withDescription("Feature flags configuration object")
          .withType("object")
          .build(), // ⚠ Wrong type

        envVar("EXPO_PUBLIC_PORT").withType("number").build(), // ⚠ Wrong type

        // 🔴 RED - Missing variables
        envVar("EXPO_PUBLIC_SENTRY_DSN").exists(), // ⚠ Missing

        envVar("EXPO_PUBLIC_ANALYTICS_KEY")
          .withDescription("Analytics service API key")
          .withType("string")
          .build(), // ⚠ Missing

        envVar("EXPO_PUBLIC_ENABLE_TELEMETRY").withType("boolean").build(), // ⚠ Missing
      ]),
    []
  );

  const storageRequiredKeys = useMemo<RequiredStorageKey[]>(
    () => [
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
    ],
    []
  );

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <FloatingDevTools
        // Auto-discovers ALL installed tools and merges with custom configs
        // Only specify tools that need custom configuration
        apps={[
          createEnvTool({ requiredEnvVars }),
          createStorageTool({ requiredStorageKeys: storageRequiredKeys }),
          // Network, React Query, WiFi, and Routes load automatically!
        ]}
        actions={{}}
        environment={environment}
        userRole={userRole}
      />
      <Slot />
    </QueryClientProvider>
  );
}
