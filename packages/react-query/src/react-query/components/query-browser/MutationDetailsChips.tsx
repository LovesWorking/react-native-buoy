import { Mutation } from "@tanstack/react-query";
import { Text, View, StyleSheet } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";

const backgroundColors = {
  success: macOSColors.semantic.successBackground,
  error: macOSColors.semantic.errorBackground,
  pending: macOSColors.semantic.infoBackground,
  idle: macOSColors.text.muted + "1A",
};

const borderColors = {
  success: macOSColors.semantic.success + "33",
  error: macOSColors.semantic.error + "33",
  pending: macOSColors.semantic.info + "33",
  idle: macOSColors.text.muted + "33",
};

const textColors = {
  success: macOSColors.semantic.success,
  error: macOSColors.semantic.error,
  pending: macOSColors.semantic.info,
  idle: macOSColors.text.muted,
};
interface Props {
  status: Mutation["state"]["status"];
}
/**
 * Small status chip used in mutation detail views that adapts styling to the mutation status.
 */
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
    fontFamily: "monospace",
  },
});
