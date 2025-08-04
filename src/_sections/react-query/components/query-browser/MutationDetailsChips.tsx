import { Mutation } from "@tanstack/react-query";
import { Text, View, StyleSheet } from "react-native";

const backgroundColors = {
  success: "rgba(16, 185, 129, 0.1)", // Green
  error: "rgba(239, 68, 68, 0.1)", // Red
  pending: "rgba(59, 130, 246, 0.1)", // Blue
  idle: "rgba(107, 114, 128, 0.1)", // Grey
};

const borderColors = {
  success: "rgba(16, 185, 129, 0.2)", // Green
  error: "rgba(239, 68, 68, 0.2)", // Red
  pending: "rgba(59, 130, 246, 0.2)", // Blue
  idle: "rgba(107, 114, 128, 0.2)", // Grey
};

const textColors = {
  success: "#10B981", // Green
  error: "#EF4444", // Red
  pending: "#3B82F6", // Blue
  idle: "#6B7280", // Grey
};
interface Props {
  status: Mutation["state"]["status"];
}
export default function QueryDetailsChip({ status }: Props) {
  const statusToColor = status;
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
