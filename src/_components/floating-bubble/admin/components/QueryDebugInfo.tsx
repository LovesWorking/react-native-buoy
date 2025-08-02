import { View, Text, StyleSheet } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

export function QueryDebugInfo() {
  try {
    const queryClient = useQueryClient();
    const queries = queryClient.getQueryCache().getAll();
    const mutations = queryClient.getMutationCache().getAll();

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Debug Info</Text>
        <Text style={styles.info}>QueryClient: ✅ Available</Text>
        <Text style={styles.info}>Queries: {queries.length}</Text>
        <Text style={styles.info}>Mutations: {mutations.length}</Text>
        {queries.length > 0 && (
          <View style={styles.queriesList}>
            <Text style={styles.subtitle}>Query Keys:</Text>
            {queries.slice(0, 3).map((query, index) => (
              <Text key={index} style={styles.queryKey}>
                •{" "}
                {Array.isArray(query.queryKey)
                  ? query.queryKey.join(" - ")
                  : String(query.queryKey)}
              </Text>
            ))}
            {queries.length > 3 && (
              <Text style={styles.more}>... and {queries.length - 3} more</Text>
            )}
          </View>
        )}
      </View>
    );
  } catch (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Debug Info</Text>
        <Text style={styles.error}>❌ QueryClient Error: {String(error)}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 8,
    margin: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  subtitle: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 4,
  },
  info: {
    color: "#9CA3AF",
    fontSize: 12,
    marginBottom: 4,
  },
  error: {
    color: "#EF4444",
    fontSize: 12,
    marginBottom: 4,
  },
  queriesList: {
    marginTop: 4,
  },
  queryKey: {
    color: "#60A5FA",
    fontSize: 11,
    marginLeft: 8,
    marginBottom: 2,
  },
  more: {
    color: "#9CA3AF",
    fontSize: 11,
    fontStyle: "italic",
    marginLeft: 8,
  },
});
