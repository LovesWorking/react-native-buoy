import { Query } from "@tanstack/react-query";
import QueryDetails from "./QueryDetails";
import QueryActions from "./QueryActions";
import DataExplorer from "./Explorer";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface Props {
  setSelectedQuery: React.Dispatch<React.SetStateAction<Query | undefined>>;
  selectedQuery: Query | undefined;
}
export default function QueryInformation({
  selectedQuery,
  setSelectedQuery,
}: Props) {
  return (
    <ScrollView
      sentry-label="ignore devtools query info scroll"
      style={styles.flexOne}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.section}>
        <QueryDetails query={selectedQuery} />
      </View>
      <View style={styles.section}>
        <QueryActions
          query={selectedQuery}
          setSelectedQuery={setSelectedQuery}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.headerText}>Data Explorer</Text>
        <View style={styles.contentView}>
          <DataExplorer
            editable={true}
            label="Data"
            value={selectedQuery?.state.data}
            defaultExpanded={["Data"]}
            activeQuery={selectedQuery}
          />
        </View>
      </View>
      <View style={styles.section}>
        <Text style={styles.headerText}>Query Explorer</Text>
        <View style={styles.contentView}>
          <DataExplorer
            label="Query"
            value={selectedQuery}
            defaultExpanded={["Query", "queryKey"]}
            activeQuery={selectedQuery}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flexOne: {
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
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "left",
  },
  contentView: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
  },
});
