// React Query dev tools entry point
// Re-export the full dev tools surface so consumers can tree-shake as needed
export * from "./react-query";
export * from "./react-query/components";
export * from "./react-query/hooks";
export * from "./react-query/utils";
export * from "./react-query/types";

// Legacy placeholder component kept for example app compatibility
import React from "react";
import { View, Text, StyleSheet } from "react-native";

/** Props accepted by the lightweight placeholder component. */
export interface ReactQueryProps {
  /** Optional heading displayed inside the sample view. */
  title?: string;
}

/**
 * Placeholder component shipped for quick smoke tests. Real consumers should render the dev tools
 * exported from the `react-query` subpath instead of this stub.
 */
export function ReactQueryComponent({
  title = "React Query Dev Tools",
}: ReactQueryProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        React Query package loaded. Import components from
        `@react-buoy/react-query/react-query` to access the dev tools surface.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
  },
});
