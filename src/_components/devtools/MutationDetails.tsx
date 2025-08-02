import { Mutation } from "@tanstack/react-query";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { displayValue } from "./displayValue";
import MutationDetailsChips from "./MutationDetailsChips";

interface Props {
  selectedMutation: Mutation<any, any, any, any> | undefined;
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
        <ScrollView horizontal style={styles.flex1}>
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
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  mutationDetailsText: {
    textAlign: "left",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    fontWeight: "600",
    fontSize: 13,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  justifyBetween: {
    justifyContent: "space-between",
  },
  p1: {
    padding: 12,
  },
  flex1: {
    flex: 1,
  },
  flexWrap: {
    fontSize: 12,
    color: "#E5E7EB",
    fontFamily: "monospace",
    marginRight: 8,
    lineHeight: 16,
  },
  bgEAECF0: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  labelText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  valueText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
});
