import { View, Text, Pressable, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import QueryStatusCount from "../../devtools/QueryStatusCount";

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
          <Pressable
            onPress={() => onQuerySelect(undefined)}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft color="#FFFFFF" size={18} />
          </Pressable>
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
    minHeight: 50, // Ensure adequate height
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  detailsView: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    minHeight: 40,
    paddingVertical: 4,
  },

  browserView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 40,
  },

  backButton: {
    width: 36, // Larger for better touch target
    height: 36,
    borderRadius: 8,
    backgroundColor: "rgba(156, 163, 175, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.3)",
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
