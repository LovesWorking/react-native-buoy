import { View, Text, Pressable, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import QueryStatusCount from "../../devtools/QueryStatusCount";

// Stable constants moved to module scope to prevent re-renders
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

// Simplified breadcrumb without complex mapping
const getQueryBreadcrumb = (query: Query) => {
  const queryKey = Array.isArray(query.queryKey)
    ? query.queryKey
    : [query.queryKey];
  return queryKey.join(" › ");
};

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
  if (selectedQuery) {
    return (
      <QueryDetailsHeader
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
      />
    );
  }

  return (
    <QueryBrowserHeader
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
    />
  );
}

interface QueryDetailsHeaderProps {
  selectedQuery: Query;
  onQuerySelect: (query: Query | undefined) => void;
}

function QueryDetailsHeader({
  selectedQuery,
  onQuerySelect,
}: QueryDetailsHeaderProps) {
  return (
    <View style={styles.headerContainer}>
      {/* <Pressable
        onPress={() => onQuerySelect(undefined)}
        style={styles.backButton}
        hitSlop={HIT_SLOP}
      >
        <ChevronLeft color="#E5E7EB" size={20} />
      </Pressable> */}
      <View style={styles.breadcrumbContainer}>
        <Text style={styles.breadcrumbItem} numberOfLines={1}>
          teststsetests
        </Text>
      </View>
    </View>
  );
}

interface QueryBrowserHeaderProps {
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

function QueryBrowserHeader({
  activeFilter,
  onFilterChange,
}: QueryBrowserHeaderProps) {
  return (
    <View style={styles.filterContainer}>
      <QueryStatusCount
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)", // Match main dev tools button
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)", // Match main dev tools button
    zIndex: 1002, // Ensure button is above corner handles
  },

  // Breadcrumb navigation
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12, // Space after back button
  },
  breadcrumbItem: {
    color: "#E5E7EB", // Exact match with main dev tools text
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
    flex: 1,
  },

  // Filter container for QueryStatusCount component
  filterContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
