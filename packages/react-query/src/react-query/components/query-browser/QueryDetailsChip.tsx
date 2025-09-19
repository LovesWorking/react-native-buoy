import { Query } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../../utils/getQueryStatusLabel";
import { Text, View, StyleSheet } from "react-native";
import { gameUIColors } from "@monorepo/shared";
import { macOSColors } from "@monorepo/shared";

interface Props {
  query: Query;
}

const backgroundColors = {
  fresh: macOSColors.semantic.successBackground,
  stale: macOSColors.semantic.warningBackground,
  fetching: macOSColors.semantic.infoBackground,
  paused: macOSColors.semantic.debug + "1A",
  noObserver: macOSColors.text.muted + "1A",
  error: macOSColors.semantic.errorBackground,
  inactive: macOSColors.text.muted + "1A",
};

const borderColors = {
  fresh: macOSColors.semantic.success + "33",
  stale: macOSColors.semantic.warning + "33",
  fetching: macOSColors.semantic.info + "33",
  paused: macOSColors.semantic.debug + "33",
  noObserver: macOSColors.text.muted + "33",
  error: macOSColors.semantic.error + "33",
  inactive: macOSColors.text.muted + "33",
};

const textColors = {
  fresh: macOSColors.semantic.success,
  stale: macOSColors.semantic.warning,
  fetching: macOSColors.semantic.info,
  paused: macOSColors.semantic.debug,
  noObserver: macOSColors.text.muted,
  error: macOSColors.semantic.error,
  inactive: macOSColors.text.muted,
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
    fontFamily: "monospace",
  },
});
