import { StatusBar } from "expo-status-bar";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo, useRef } from "react";
import {
  AppHostProvider,
  AppOverlay,
  FloatingMenu,
  Package1Component,
  type InstalledApp,
} from "@monorepo/package-1";
import {
  EnvVarsModal,
  createEnvVarConfig,
  envVar,
  type Environment,
  type UserRole,
} from "@monorepo/package-2";
import { EnvLaptopIcon, ReactQueryIcon, Globe } from "@monorepo/shared";
import { ReactQueryDevToolsModal } from "@monorepo/react-query";
import { NetworkModal } from "@monorepo/network";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import BankingShowcase from "./components/BankingShowcase";

// Test AsyncStorage import
let asyncStorageStatus = "❌ Module not found";
try {
  require("@react-native-async-storage/async-storage");
  asyncStorageStatus = "✅ Module found and imported successfully";
} catch (error) {
  asyncStorageStatus = `❌ Module not found: ${error}`;
}

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

  const installedApps: InstalledApp[] = useMemo(
    () => [
      {
        id: "env",
        name: "ENV",
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
      },
      {
        id: "react-query",
        name: "QUERY",
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
        id: "network",
        name: "NET",
        slot: "both",
        icon: ({ size }: { size: number }) => (
          <Globe size={size} color="#38bdf8" />
        ),
        component: NetworkModal,
        props: {
          enableSharedModalDimensions: true,
        },
      },
    ],
    [requiredEnvVars],
  );

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <AppHostProvider>
        <View style={styles.container}>
          <FloatingMenu
            apps={installedApps}
            actions={{}}
            environment={environment}
            userRole={userRole}
          />

          {/* AppOverlay renders the currently open app */}
          <AppOverlay />

          <Text style={styles.title}>Monorepo Test App</Text>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <BankingShowcase />

            <Text style={styles.subtitle}>Packages loaded via workspace:</Text>
            <Package1Component />

            <Text style={styles.asyncStorageTest}>
              AsyncStorage Test: {asyncStorageStatus}
            </Text>
          </ScrollView>
          <StatusBar style="auto" />
        </View>
      </AppHostProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  asyncStorageTest: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    margin: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
});
