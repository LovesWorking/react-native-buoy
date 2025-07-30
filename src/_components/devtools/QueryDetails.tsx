import { Query, QueryKey } from "@tanstack/react-query";
import React from "react";
import QueryDetailsChip from "./QueryDetailsChip";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { displayValue } from "./displayValue";

interface Props {
  query: Query<any, any, any, any> | undefined;
}
export default function QueryDetails({ query }: Props) {
  if (query === undefined) {
    return null;
  }
  // Convert the timestamp to a Date object and format it
  const lastUpdated = new Date(query.state.dataUpdatedAt).toLocaleTimeString();

  return (
    <View style={styles.minWidth}>
      <Text style={styles.headerText}>Query Details</Text>
      <View style={styles.row}>
        <ScrollView horizontal style={styles.flexOne}>
          <Text style={styles.queryKeyText}>
            {displayValue(query.queryKey, true)}
          </Text>
        </ScrollView>
        <QueryDetailsChip query={query} />
      </View>
      <View style={styles.row}>
        <Text style={styles.labelText}>Observers:</Text>
        <Text style={styles.valueText}>{`${query.getObserversCount()}`}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.labelText}>Last Updated:</Text>
        <Text style={styles.valueText}>{`${lastUpdated}`}</Text>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  minWidth: {
    minWidth: 200,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  headerText: {
    textAlign: "left",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    fontWeight: "600",
    fontSize: 13,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.03)",
  },
  flexOne: {
    flex: 1,
  },
  queryKeyText: {
    fontSize: 12,
    color: "#E5E7EB",
    fontFamily: "monospace",
    marginRight: 8,
    lineHeight: 16,
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
