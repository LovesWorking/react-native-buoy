import { View, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import { QueryBrowser } from "./query-browser/index";
import { gameUIColors } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";

interface QueryBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  activeFilter: string | null;
  searchText?: string;
  ignoredPatterns?: Set<string>;
  includedPatterns?: Set<string>;
}

/** Wrapper around the query list experience used inside the modal view. */
export function QueryBrowserMode({
  selectedQuery,
  onQuerySelect,
  activeFilter,
  searchText = "",
  ignoredPatterns = new Set(),
  includedPatterns = new Set(),
}: QueryBrowserModeProps) {
  const hasIncludeFilters = includedPatterns.size > 0;
  const hasExcludeFilters = ignoredPatterns.size > 0;

  return (
    <View style={styles.queryListContainer}>
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
