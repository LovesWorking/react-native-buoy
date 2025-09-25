import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useMemo, useRef } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PokemonScreen } from "./screens/pokemon/Pokemon";

export default function App() {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <View style={styles.container}>
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
