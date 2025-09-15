import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Button, Card, useCounter, formatNumber } from "@monorepo/shared";

export const Package1Component = () => {
  const { count, increment, decrement, reset } = useCounter(0);

  return (
    <Card margin={10}>
      <Text style={styles.title}>Package 1 - Counter Demo</Text>
      <Text style={styles.count}>Count: {formatNumber(count)}</Text>

      <View style={styles.buttonRow}>
        <Button
          title="Increment"
          onPress={increment}
          variant="primary"
          size="medium"
          style={styles.button}
        />
        <Button
          title="Decrement"
          onPress={decrement}
          variant="secondary"
          size="medium"
          style={styles.button}
        />
      </View>

      <Button
        title="Reset"
        onPress={reset}
        variant="danger"
        size="small"
        style={styles.resetButton}
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
