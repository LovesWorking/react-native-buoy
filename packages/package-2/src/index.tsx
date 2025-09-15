import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { Card, Button, useToggle, debounce } from "@monorepo/shared";

export const Package2Component = () => {
  const { isOn, toggle, setOn, setOff } = useToggle(false);

  // Example of using debounce utility
  const handleToggle = React.useMemo(
    () => debounce(() => {
      console.log("Toggle debounced!");
      toggle();
    }, 500),
    [toggle]
  );

  return (
    <Card margin={10} backgroundColor={isOn ? "#e8f5e9" : "#fce4ec"}>
      <Text style={styles.title}>Package 2 - Toggle Demo</Text>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Feature Flag:</Text>
        <Switch
          value={isOn}
          onValueChange={toggle}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isOn ? "#f5dd4b" : "#f4f3f4"}
        />
      </View>

      <Text style={[styles.status, isOn ? styles.statusOn : styles.statusOff]}>
        Status: {isOn ? "ENABLED" : "DISABLED"}
      </Text>

      <View style={styles.buttonRow}>
        <Button
          title="Enable"
          onPress={setOn}
          variant="primary"
          size="small"
          disabled={isOn}
          style={styles.button}
        />
        <Button
          title="Disable"
          onPress={setOff}
          variant="secondary"
          size="small"
          disabled={!isOn}
          style={styles.button}
        />
      </View>

      <Button
        title="Debounced Toggle"
        onPress={handleToggle}
        variant="danger"
        size="medium"
        style={styles.debounceButton}
      />
    </Card>
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
