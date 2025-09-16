import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EnvLaptopIcon } from "@monorepo/shared";

export const Package1Component = () => {
  return (
    <View>
      <Text style={styles.title}>Package 1 - Counter Demo</Text>
      <EnvLaptopIcon />
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  count: {
    fontSize: 24,
    color: "#007AFF",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  resetButton: {
    marginTop: 10,
  },
});
