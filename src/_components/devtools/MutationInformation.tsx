import { Mutation } from "@tanstack/react-query";
import DataExplorer from "./Explorer";
import { ScrollView, Text, View, StyleSheet } from "react-native";
import MutationDetails from "./MutationDetails";

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
    backgroundColor: "#171717",
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
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  padding: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderTopWidth: 0,
  },
});
