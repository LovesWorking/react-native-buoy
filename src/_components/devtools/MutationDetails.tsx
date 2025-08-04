import { Mutation } from "@tanstack/react-query";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { displayValue } from "./displayValue";
import MutationDetailsChips from "./MutationDetailsChips";

interface Props {
  selectedMutation: Mutation | undefined;
}

export default function MutationDetails({ selectedMutation }: Props) {
  if (selectedMutation === undefined) {
    return null;
  }

  const submittedAt = new Date(
    selectedMutation.state.submittedAt
  ).toLocaleTimeString();

  return (
    <View style={styles.container}>
      <Text style={[styles.mutationDetailsText, styles.bgEAECF0, styles.p1]}>
        Mutation Details
      </Text>
      <View style={[styles.flexRow, styles.justifyBetween, styles.p1]}>
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
      <View style={[styles.flexRow, styles.justifyBetween, styles.p1]}>
        <Text style={styles.labelText}>Submitted At:</Text>
        <Text style={styles.valueText}>{submittedAt}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 200,
    backgroundColor: "#171717",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  mutationDetailsText: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    fontWeight: "600",
    fontSize: 14,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.02)",
  },
  justifyBetween: {
    justifyContent: "space-between",
  },
  p1: {
    padding: 12,
  },
  flex1: {
    flex: 1,
    marginRight: 8,
  },
  flexWrap: {
    fontSize: 12,
    color: "#F9FAFB",
    fontFamily: "monospace",
    lineHeight: 16,
    flexShrink: 1,
  },
  bgEAECF0: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  labelText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  valueText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
});
