import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import {
  Package1Component,
  FloatingMenu,
  type InstalledApp,
} from "@monorepo/package-1";
import {
  createEnvVarConfig,
  envVar,
  type UserRole,
  type Environment,
  EnvVarsModal,
} from "@monorepo/package-2";
import { EnvLaptopIcon } from "@monorepo/shared";
import { useState } from "react";

export default function App() {
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

  const [isEnvOpen, setEnvOpen] = useState(false);
  const [envCloseResolver, setEnvCloseResolver] = useState<(() => void) | null>(
    null
  );

  const installedApps: InstalledApp[] = [
    {
      id: "env",
      name: "ENV",
      slot: "both",
      icon: ({ size }) => (
        <EnvLaptopIcon size={size} color="#9f6" glowColor="#9f6" noBackground />
      ),
      onPress: () =>
        new Promise<void>((resolve) => {
          setEnvOpen(true);
          resolve();
        }),
    },
  ];
  return (
    <View style={styles.container}>
      <FloatingMenu
        apps={installedApps}
        actions={{}}
        environment={environment}
        userRole={userRole}
      />
      <EnvVarsModal
        visible={isEnvOpen}
        onClose={() => {
          setEnvOpen(false);
          envCloseResolver?.();
          setEnvCloseResolver(null);
        }}
        requiredEnvVars={requiredEnvVars}
        enableSharedModalDimensions={true}
      />
      <Text style={styles.title}>Monorepo Test App</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.subtitle}>Packages loaded via workspace:</Text>
        <Package1Component />
      </ScrollView>
      <StatusBar style="auto" />
    </View>
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
  scrollView: {
    flex: 1,
  },
});
