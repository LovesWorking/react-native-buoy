import { Query } from "@tanstack/react-query";
import QueryDetailsChip from "./QueryDetailsChip";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { displayValue } from "./displayValue";

interface Props {
  query: Query | undefined;
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
        <ScrollView sentry-label="ignore devtools query details scroll" horizontal style={styles.flexOne}>
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
    backgroundColor: "#171717",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    overflow: "hidden",
  },
  headerText: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 12,
    fontWeight: "600",
    fontSize: 14,
    color: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.02)",
  },
  flexOne: {
    flex: 1,
    marginRight: 8,
  },
  queryKeyText: {
    fontSize: 12,
    color: "#F9FAFB",
    fontFamily: "monospace",
    lineHeight: 16,
    flexShrink: 1,
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
