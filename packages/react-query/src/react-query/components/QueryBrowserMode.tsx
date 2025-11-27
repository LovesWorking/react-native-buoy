import { View, StyleSheet } from "react-native";
import { useMemo } from "react";
import { Query } from "@tanstack/react-query";
import { QueryBrowser } from "./query-browser/index";
import { FilterStatusBadge } from "./FilterStatusBadge";
import { macOSColors } from "@react-buoy/shared-ui";
import useAllQueries from "../hooks/useAllQueries";

interface QueryBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  activeFilter: string | null;
  searchText?: string;
  ignoredPatterns?: Set<string>;
  includedPatterns?: Set<string>;
  onFilterPress?: () => void;
}

/** Wrapper around the query list experience used inside the modal view. */
export function QueryBrowserMode({
  selectedQuery,
  onQuerySelect,
  activeFilter,
  searchText = "",
  ignoredPatterns = new Set(),
  includedPatterns = new Set(),
  onFilterPress,
}: QueryBrowserModeProps) {
  const hasIncludeFilters = includedPatterns.size > 0;
  const hasExcludeFilters = ignoredPatterns.size > 0;
  const allQueries = useAllQueries();

  // Calculate filtered count for the badge
  const filteredCount = useMemo(() => {
    let filtered = allQueries;

    // Apply included patterns filter
    if (includedPatterns.size > 0) {
      filtered = filtered.filter((query) => {
        if (!query?.queryKey) return false;
        const keys = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey];
        const keyString = keys.filter((k) => k != null).map((k) => String(k)).join(" ").toLowerCase();
        return Array.from(includedPatterns).some((pattern) =>
          keyString.includes(pattern.toLowerCase())
        );
      });
    }

    // Apply ignored patterns filter
    if (ignoredPatterns.size > 0) {
      filtered = filtered.filter((query) => {
        if (!query?.queryKey) return true;
        const keys = Array.isArray(query.queryKey) ? query.queryKey : [query.queryKey];
        const keyString = keys.filter((k) => k != null).map((k) => String(k)).join(" ").toLowerCase();
        return !Array.from(ignoredPatterns).some((pattern) =>
          keyString.includes(pattern.toLowerCase())
        );
      });
    }

    return filtered.length;
  }, [allQueries, includedPatterns, ignoredPatterns]);

  return (
    <View style={styles.queryListContainer}>
      {/* Filter status badge - shows when filters reduce the count */}
      {(hasIncludeFilters || hasExcludeFilters) && (
        <FilterStatusBadge
          totalCount={allQueries.length}
          filteredCount={filteredCount}
          onPress={onFilterPress}
        />
      )}
      <QueryBrowser
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
        activeFilter={activeFilter}
        searchText={searchText}
        ignoredPatterns={ignoredPatterns}
        includedPatterns={includedPatterns}
        emptyStateMessage={
          searchText
            ? `No queries found matching "${searchText}"`
            : activeFilter
            ? `No ${activeFilter} queries found`
            : hasIncludeFilters
            ? `No queries match your "include only" filters. ${includedPatterns.size} pattern(s) active.`
            : hasExcludeFilters
            ? `No queries match the current filters. ${ignoredPatterns.size} pattern(s) excluded.`
            : "No React Query queries are currently active.\n\nTo see queries here:\n• Make API calls using useQuery\n• Ensure queries are within QueryClientProvider\n• Check console for debugging info"
        }
        contentContainerStyle={styles.queryListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  queryListContainer: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  queryListContent: {
    padding: 8,
    backgroundColor: macOSColors.background.base,
    flexGrow: 1,
  },
});
