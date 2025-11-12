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
}

/** Wrapper around the query list experience used inside the modal view. */
export function QueryBrowserMode({
  selectedQuery,
  onQuerySelect,
  activeFilter,
  searchText = "",
}: QueryBrowserModeProps) {
  return (
    <View style={styles.queryListContainer}>
      <QueryBrowser
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
        activeFilter={activeFilter}
        searchText={searchText}
        emptyStateMessage={
          searchText
            ? `No queries found matching "${searchText}"`
            : activeFilter
            ? `No ${activeFilter} queries found`
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
