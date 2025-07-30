import React from "react";
import { Query } from "@tanstack/react-query";
import QueryDetails from "./QueryDetails";
import QueryActions from "./QueryActions";
import DataExplorer from "./Explorer";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface Props {
  setSelectedQuery: React.Dispatch<
    React.SetStateAction<Query<any, any, any, any> | undefined>
  >;
  selectedQuery: Query<any, any, any, any> | undefined;
}
export default function QueryInformation({
  selectedQuery,
  setSelectedQuery,
}: Props) {
  return (
    <ScrollView
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
  contentView: {
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderTopWidth: 0,
  },
});
