import { View, Text, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import QueryStatusCount from "../../devtools/QueryStatusCount";
import { BackButton } from "../admin/components/BackButton";

interface ReactQueryModalHeaderProps {
  selectedQuery: Query | undefined;
  activeFilter: string | null;
  onQuerySelect: (query: Query | undefined) => void;
  onFilterChange: (filter: string | null) => void;
}

export function ReactQueryModalHeader({
  selectedQuery,
  activeFilter,
  onQuerySelect,
  onFilterChange,
}: ReactQueryModalHeaderProps) {
  // Simple function to get query display text
  const getQueryText = (query: Query) => {
    if (!query?.queryKey) return "Unknown Query";
    const keys = Array.isArray(query.queryKey)
      ? query.queryKey
      : [query.queryKey];
    return (
      keys
        .filter((k) => k != null)
        .map((k) => String(k))
        .join(" › ") || "Unknown Query"
    );
  };

  return (
    <View style={styles.container}>
      {selectedQuery ? (
        // Query Details View - Show back button and query name
        <View style={styles.detailsView}>
          <BackButton
            onPress={() => onQuerySelect(undefined)}
            color="#FFFFFF"
            size={16}
            accessibilityLabel="Back to query list"
            accessibilityHint="Return to query list view"
          />
          <Text style={styles.queryText} numberOfLines={1}>
            {getQueryText(selectedQuery)}
          </Text>
        </View>
      ) : (
        // Query Browser View - Show filter/status counts
        <View style={styles.browserView}>
          <QueryStatusCount
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 32, // Match FloatingModalHeader minHeight exactly
    justifyContent: "center",
    // Remove horizontal padding - let content handle its own spacing
  },

  detailsView: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    minHeight: 32, // Match FloatingModalHeader minHeight
    paddingLeft: 4, // Only left padding for consistent spacing
    paddingRight: 0, // No right padding - buttons handle their own spacing
  },

  browserView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch", // Let QueryStatusCount use full width
    minHeight: 32, // Match FloatingModalHeader minHeight
    paddingLeft: 4, // Consistent left spacing
    paddingRight: 4, // Minimal right padding to match left
  },

  queryText: {
    flex: 1,
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
    paddingHorizontal: 4,
  },
});
