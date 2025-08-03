import { View, Text, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import QueryStatusCount from "../../devtools/QueryStatusCount";
import { BackButton } from "../admin/components/BackButton";
import { Mutation } from "@tanstack/react-query";
import MutationStatusCount from "../../devtools/MutationStatusCount";
import { TouchableOpacity } from "react-native";
import { displayValue } from "../../devtools/displayValue";

interface ReactQueryModalHeaderProps {
  selectedQuery?: Query;
  selectedMutation?: Mutation;
  activeTab: "queries" | "mutations";
  onTabChange: (tab: "queries" | "mutations") => void;
  onBack: () => void;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export function ReactQueryModalHeader({
  selectedQuery,
  selectedMutation,
  activeTab,
  onTabChange,
  onBack,
  activeFilter,
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

  const getItemText = (item: Query | Mutation) => {
    if ("queryKey" in item) {
      return getQueryText(item);
    } else {
      return item.options.mutationKey
        ? (Array.isArray(item.options.mutationKey)
            ? item.options.mutationKey
            : [item.options.mutationKey]
          )
            .filter((k) => k != null)
            .map((k) => String(k))
            .join(" › ") || `Mutation #${item.mutationId}`
        : `Mutation #${item.mutationId}`;
    }
  };

  return (
    <View style={styles.container}>
      {selectedQuery || selectedMutation ? (
        <View style={styles.detailsView}>
          <BackButton
            onPress={onBack}
            color="#FFFFFF"
            size={16}
            accessibilityLabel="Back to list"
            accessibilityHint="Return to list view"
          />
          <Text style={styles.queryText} numberOfLines={1}>
            {getItemText(selectedQuery ?? selectedMutation!)}
          </Text>
        </View>
      ) : (
        <View style={styles.browserView}>
          {activeTab === "queries" ? (
            <QueryStatusCount
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
            />
          ) : (
            <MutationStatusCount
              activeFilter={activeFilter}
              onFilterChange={onFilterChange}
            />
          )}
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
