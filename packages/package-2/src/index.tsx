import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { EnvLaptopIcon } from "@monorepo/shared";

export const Package2Component = () => {
  return (
    <View>
      <Text style={styles.title}>Package 2 - Counter Demo</Text>
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
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#666",
  },
  status: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
  },
  statusOn: {
    color: "#4caf50",
  },
  statusOff: {
    color: "#f44336",
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
  debounceButton: {
    marginTop: 10,
  },
});
