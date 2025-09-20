import { Mutation } from "@tanstack/react-query";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { displayValue } from "@react-buoy/shared-ui";
import MutationDetailsChips from "./MutationDetailsChips";
import { macOSColors } from "@react-buoy/shared-ui";

interface Props {
  selectedMutation: Mutation | undefined;
}

export default function MutationDetails({ selectedMutation }: Props) {
  if (selectedMutation === undefined) {
    return null;
  }

  const submittedAt = new Date(
    selectedMutation.state.submittedAt,
  ).toLocaleTimeString();

  return (
    <View style={styles.minWidth}>
      <Text style={styles.headerText}>
        Mutation Details
      </Text>
      <View style={styles.row}>
        <ScrollView
          sentry-label="ignore devtools mutation details scroll"
          horizontal
          style={styles.flex1}
        >
          <Text style={styles.flexWrap}>{`${
            selectedMutation.options.mutationKey
              ? displayValue(selectedMutation.options.mutationKey, true)
              : "No mutationKey found"
          }`}</Text>
        </ScrollView>
        <MutationDetailsChips status={selectedMutation.state.status} />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelText}>Submitted At:</Text>
        <Text style={styles.valueText}>{submittedAt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  minWidth: {
    minWidth: 200,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "4D",
    overflow: "hidden",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  headerText: {
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "600",
    fontSize: 12,
    color: macOSColors.semantic.info,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.semantic.info + "33",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.text.muted + "66",
  },
  flex1: {
    flex: 1,
    marginRight: 8,
  },
  flexWrap: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    lineHeight: 18,
    flexShrink: 1,
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "4D",
  },
  labelText: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  valueText: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    fontFamily: "monospace",
  },
});
