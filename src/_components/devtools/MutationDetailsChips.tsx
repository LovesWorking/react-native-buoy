import { Mutation } from "@tanstack/react-query";
import { Text, View, StyleSheet } from "react-native";

const backgroundColors = {
  fresh: "#D1FADF", // Green
  stale: "#FEF0C7", // Yellow
  fetching: "#D1E9FF", // Blue
  paused: "#EBE9FE", // Indigo
  inactive: "#F2F4F7", // Grey
};

const borderColors = {
  fresh: "#32D583", // Green
  stale: "#FDB022", // Yellow
  fetching: "#53B1FD", // Blue
  paused: "#9B8AFB", // Indigo
  inactive: "#344054", // Grey
};

const textColors = {
  fresh: "#027A48", // Green
  stale: "#B54708", // Yellow
  fetching: "#175CD3", // Blue
  paused: "#5925DC", // Indigo
  inactive: "#344054", // Grey
};
interface Props {
  status: Mutation["state"]["status"];
}
export default function QueryDetailsChip({ status }: Props) {
  const statusToColor =
    status === "pending"
      ? "fetching"
      : status === "idle"
      ? "inactive"
      : status === "error"
      ? "stale"
      : "fresh";
  const backgroundColor = backgroundColors[statusToColor];
  const borderColor = borderColors[statusToColor];
  const textColor = textColors[statusToColor];

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{status}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
    margin: 4,
  },
  text: {
    fontSize: 12,
  },
});
