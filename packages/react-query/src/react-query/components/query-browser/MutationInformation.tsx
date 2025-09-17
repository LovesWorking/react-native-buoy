import { Mutation } from "@tanstack/react-query";
import DataExplorer from "./Explorer";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import MutationDetails from "./MutationDetails";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";

interface Props {
  selectedMutation: Mutation | undefined;
}

export default function MutationInformation({ selectedMutation }: Props) {
  return (
    <ScrollView
      sentry-label="ignore devtools mutation information scroll"
      style={styles.flex1}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <MutationDetails selectedMutation={selectedMutation} />
      </View>
      <View style={styles.section}>
        <Text style={styles.textHeader}>Variables Details</Text>
        <View style={styles.padding}>
          <DataExplorer
            label="Variables"
            value={selectedMutation?.state.variables}
            defaultExpanded={["Variables"]}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.textHeader}>Context Details</Text>
        <View style={styles.padding}>
          <DataExplorer
            label="Context"
            value={selectedMutation?.state.context}
            defaultExpanded={["Context"]}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.textHeader}>Data Explorer</Text>
        <View style={styles.padding}>
          <DataExplorer
            label="Data"
            defaultExpanded={["Data"]}
            value={selectedMutation?.state.data}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.textHeader}>Mutations Explorer</Text>
        <View style={styles.padding}>
          <DataExplorer
            label="Mutation"
            defaultExpanded={["Mutation"]}
            value={selectedMutation}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
    backgroundColor: gameUIColors.background,
  },
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  section: {
    marginBottom: 16,
  },
  textHeader: {
    textAlign: "left",
    backgroundColor: gameUIColors.panel,
    padding: 12,
    fontSize: 12,
    fontWeight: "700",
    color: gameUIColors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: gameUIColors.border + "40",
    fontFamily: "monospace",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  padding: {
    padding: 12,
    backgroundColor: gameUIColors.panel + "80",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    borderTopWidth: 0,
  },
});
