import { Slot } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRef, useMemo } from "react";
import {
  createEnvTool,
  createEnvVarConfig,
  envVar,
  type Environment,
  type UserRole,
} from "@react-buoy/env";
import {
  reactQueryToolPreset,
  wifiTogglePreset,
} from "@react-buoy/react-query";
import { createNetworkTool } from "@react-buoy/network";
import { routeEventsToolPreset } from "@react-buoy/route-events";
import {
  createStorageTool,
  type RequiredStorageKey,
} from "@react-buoy/storage";
import { FloatingDevTools, type InstalledApp } from "@react-buoy/core";

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

  const installedApps: InstalledApp[] = useMemo(
    () => [
      // ENV tool with custom required env vars
      createEnvTool({
        requiredEnvVars,
      }),

      // Storage tool with custom required keys
      createStorageTool({
        requiredStorageKeys: storageRequiredKeys,
      }),

      // React Query preset - simplest way!
      reactQueryToolPreset,

      // WiFi toggle preset - one line!
      wifiTogglePreset,

      // Network tool
      createNetworkTool(),

      // Routes preset - simplest way!
      routeEventsToolPreset,
    ],
    [requiredEnvVars, storageRequiredKeys]
  );

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <FloatingDevTools
        apps={installedApps}
        actions={{}}
        environment={environment}
        userRole={userRole}
      />
      <Slot />
    </QueryClientProvider>
  );
}
