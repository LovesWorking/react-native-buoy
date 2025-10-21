import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useMemo, useRef } from "react";
import {
  EnvVarsModal,
  createEnvVarConfig,
  envVar,
  type Environment,
  type UserRole,
} from "@react-buoy/env";
import {
  EnvLaptopIcon,
  ReactQueryIcon,
  StorageStackIcon,
  Globe,
} from "@react-buoy/shared-ui";
import { ReactQueryDevToolsModal } from "@react-buoy/react-query";
import { NetworkModal } from "@react-buoy/network";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PokemonScreen } from "./screens/pokemon/Pokemon";
import {
  StorageModalWithTabs,
  type RequiredStorageKey,
} from "@react-buoy/storage";
import { WifiToggle } from "@react-buoy/react-query";
import { FloatingDevTools, InstalledApp } from "@react-buoy/core";

export default function App() {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }
  const userRole: UserRole = "admin";
  const environment: Environment = "local";
  const requiredEnvVars = createEnvVarConfig([
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
  ]);

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
      {
        id: "env",
        name: "ENV",
        description: "Environment variables debugger",
        slot: "both",
        icon: ({ size }: { size: number }) => (
          <EnvLaptopIcon
            size={size}
            color="#9f6"
            glowColor="#9f6"
            noBackground
          />
        ),
        component: EnvVarsModal,
        props: {
          requiredEnvVars,
          enableSharedModalDimensions: true,
        },
        onPress: () => {
          console.log(
            "🚀 ENV tool icon pressed! onPress callback fired before modal opens"
          );
        },
      },
      {
        id: "storage",
        name: "STORAGE",
        description: "Storage browser",
        slot: "both",
        icon: ({ size }: { size: number }) => (
          <StorageStackIcon
            size={size}
            color="#38f8a7"
            glowColor="#10B981"
            noBackground
          />
        ),
        component: StorageModalWithTabs,
        props: {
          enableSharedModalDimensions: true,
          requiredStorageKeys: storageRequiredKeys,
        },
      },
      {
        id: "query",
        name: "QUERY",
        description: "React Query inspector",
        slot: "both",
        icon: ({ size }: { size: number }) => (
          <ReactQueryIcon
            size={size}
            colorPreset="red"
            glowColor="#FF6B8A"
            noBackground
          />
        ),
        component: ReactQueryDevToolsModal,
        props: {
          enableSharedModalDimensions: true,
        },
      },
      {
        id: "query-wifi-toggle",
        name: "WIFI",
        description: "React Query WiFi toggle",
        slot: "both",
        icon: ({ size }: { size: number }) => <WifiToggle size={size} />,
        component: () => <></>,
        props: {},
      },
      {
        id: "network",
        name: "NET",
        description: "Network request logger",
        slot: "both",
        icon: ({ size }: { size: number }) => (
          <Globe size={size} color="#38bdf8" />
        ),
        component: NetworkModal,
        props: {
          enableSharedModalDimensions: true,
        },
        onPress: () => {
          console.log("📡 Network tool opened - tracking analytics event");
          // This could be used for analytics tracking in a real app
        },
      },
    ],
    [requiredEnvVars, storageRequiredKeys]
  );
  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <View style={styles.container}>
        <FloatingDevTools
          apps={installedApps}
          actions={{}}
          environment={environment}
          userRole={userRole}
        />
        <PokemonScreen />
        <StatusBar style="dark" />
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  navBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 16,
    backgroundColor: "#111827",
    borderRadius: 999,
    padding: 4,
  },
  navButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 2,
  },
  navButtonActive: {
    backgroundColor: "#F9FAFB",
  },
  navButtonText: {
    color: "#E5E7EB",
    fontWeight: "600",
    fontSize: 13,
  },
  navButtonTextActive: {
    color: "#111827",
  },
  screenContainer: {
    flex: 1,
  },
});
