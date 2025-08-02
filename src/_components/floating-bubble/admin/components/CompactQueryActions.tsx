import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { QueryClient } from "@tanstack/react-query";

interface CompactQueryActionsProps {
  queryClient: QueryClient;
}

function CompactQueryActions({ queryClient }: CompactQueryActionsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.actionButton, styles.refetchButton]}
        hitSlop={8}
      >
        <Text style={[styles.buttonText, styles.refetchText]}>Refetch</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.resetButton]}
        hitSlop={8}
      >
        <Text style={[styles.buttonText, styles.resetText]}>Reset</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.removeButton]}
        hitSlop={8}
      >
        <Text style={[styles.buttonText, styles.removeText]}>Remove</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.errorButton]}
        hitSlop={8}
      >
        <Text style={[styles.buttonText, styles.errorText]}>Error</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "500",
  },
  refetchButton: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderColor: "rgba(14, 165, 233, 0.2)",
  },
  refetchText: {
    color: "#0EA5E9",
  },
  resetButton: {
    backgroundColor: "rgba(155, 138, 251, 0.1)",
    borderColor: "rgba(155, 138, 251, 0.2)",
  },
  resetText: {
    color: "#9B8AFB",
  },
  removeButton: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
    borderColor: "rgba(248, 113, 113, 0.2)",
  },
  removeText: {
    color: "#F87171",
  },
  errorButton: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#EF4444",
  },
});
