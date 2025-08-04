import { Query } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../../utils/getQueryStatusLabel";
import { Text, View, StyleSheet } from "react-native";
interface Props {
  query: Query;
}
const backgroundColors = {
  fresh: "rgba(16, 185, 129, 0.1)", // Green
  stale: "rgba(245, 158, 11, 0.1)", // Yellow
  fetching: "rgba(59, 130, 246, 0.1)", // Blue
  paused: "rgba(139, 92, 246, 0.1)", // Purple
  noObserver: "rgba(107, 114, 128, 0.1)", // Grey
  error: "rgba(239, 68, 68, 0.1)", // Red
  inactive: "rgba(107, 114, 128, 0.1)", // Grey
};

const borderColors = {
  fresh: "rgba(16, 185, 129, 0.2)", // Green
  stale: "rgba(245, 158, 11, 0.2)", // Yellow
  fetching: "rgba(59, 130, 246, 0.2)", // Blue
  paused: "rgba(139, 92, 246, 0.2)", // Purple
  noObserver: "rgba(107, 114, 128, 0.2)", // Grey
  error: "rgba(239, 68, 68, 0.2)", // Red
  inactive: "rgba(107, 114, 128, 0.2)", // Grey
};

const textColors = {
  fresh: "#10B981", // Green
  stale: "#F59E0B", // Yellow
  fetching: "#3B82F6", // Blue
  paused: "#8B5CF6", // Purple
  noObserver: "#6B7280", // Grey
  error: "#EF4444", // Red
  inactive: "#6B7280", // Grey
};
type QueryStatus =
  | "fresh"
  | "stale"
  | "fetching"
  | "paused"
  | "noObserver"
  | "error"
  | "inactive";

export default function QueryDetailsChip({ query }: Props) {
  const status = getQueryStatusLabel(query) as QueryStatus;
  const backgroundColor = backgroundColors[status];
  const borderColor = borderColors[status];
  const textColor = textColors[status];

  return (
    <View style={[styles.container, { backgroundColor, borderColor }]}>
      <Text style={[styles.text, { color: textColor }]}>{status}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
