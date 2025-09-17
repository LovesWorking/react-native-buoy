import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Package1Component,
  FloatingMenu,
  type InstalledApp,
  AppHostProvider,
  AppOverlay,
} from "@monorepo/package-1";
import {
  createEnvVarConfig,
  envVar,
  type UserRole,
  type Environment,
  EnvVarsModal,
} from "@monorepo/package-2";
import { EnvLaptopIcon, ReactQueryIcon } from "@monorepo/shared";
import { ReactQueryComponent } from "@monorepo/react-query";
import { ReactQueryModal } from "@monorepo/react-query/react-query";
import {
  QueryClient,
  QueryClientProvider,
  type Query,
  type Mutation,
  type QueryKey,
} from "@tanstack/react-query";

// Test AsyncStorage import
let asyncStorageStatus = "❌ Module not found";
try {
  require("@react-native-async-storage/async-storage");
  asyncStorageStatus = "✅ Module found and imported successfully";
} catch (error) {
  asyncStorageStatus = `❌ Module not found: ${error}`;
}

type ReactQueryDevToolsAppProps = {
  visible: boolean;
  onClose: () => void;
  enableSharedModalDimensions?: boolean;
};

const ReactQueryDevToolsApp = ({
  visible,
  onClose,
  enableSharedModalDimensions = true,
}: ReactQueryDevToolsAppProps) => {
  type ReactQueryModalProps = React.ComponentProps<typeof ReactQueryModal>;
  type OnQuerySelect = NonNullable<ReactQueryModalProps["onQuerySelect"]>;
  type OnMutationSelect = NonNullable<ReactQueryModalProps["onMutationSelect"]>;
  type OnTabChange = ReactQueryModalProps["onTabChange"];

  const [selectedQueryKey, setSelectedQueryKey] = useState<QueryKey | undefined>(
    undefined,
  );
  const [selectedMutationId, setSelectedMutationId] = useState<
    number | undefined
  >(undefined);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queries" | "mutations">(
    "queries",
  );

  const handleClose = useCallback(() => {
    setSelectedQueryKey(undefined);
    setSelectedMutationId(undefined);
    setActiveFilter(null);
    setActiveTab("queries");
    onClose();
  }, [onClose]);

  const handleQuerySelect = useCallback<OnQuerySelect>((query) => {
      setSelectedQueryKey(query?.queryKey);
    }, []);

  const handleMutationSelect = useCallback<OnMutationSelect>((mutation) => {
      setSelectedMutationId(mutation?.mutationId);
    }, []);

  const handleTabChange = useCallback<OnTabChange>((tab) => {
    setActiveTab(tab);
    setActiveFilter(null);
    setSelectedQueryKey(undefined);
    setSelectedMutationId(undefined);
  }, []);

  const handleFilterChange = useCallback<NonNullable<ReactQueryModalProps["onFilterChange"]>>(
    (filter) => {
      setActiveFilter(filter);
    },
    [],
  );

  if (!visible) {
    return null;
  }

  return (
    <ReactQueryModal
      visible={visible}
      selectedQueryKey={selectedQueryKey}
      selectedMutationId={selectedMutationId}
      onQuerySelect={handleQuerySelect}
      onMutationSelect={handleMutationSelect}
      onClose={handleClose}
      activeFilter={activeFilter}
      onFilterChange={handleFilterChange}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      enableSharedModalDimensions={enableSharedModalDimensions}
    />
  );
};

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
        component: ReactQueryDevToolsApp,
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
          <ReactQueryComponent />

          <ScrollView style={styles.scrollView}>
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
});
