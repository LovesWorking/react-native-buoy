export * from "./network";

import React from "react";
import { View, Text, StyleSheet } from "react-native";

export interface NetworkProps {
  title?: string;
}

export function NetworkComponent({
  title = "network Component",
}: NetworkProps) {
  return (
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>
        This is a new package created with create-package script
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
