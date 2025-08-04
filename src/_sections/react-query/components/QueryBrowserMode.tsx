import { View, StyleSheet } from "react-native";
import { Query } from "@tanstack/react-query";
import { QueryBrowser } from "./query-browser/index";

interface QueryBrowserModeProps {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  activeFilter: string | null;
}

export function QueryBrowserMode({
  selectedQuery,
  onQuerySelect,
  activeFilter,
}: QueryBrowserModeProps) {
  return (
    <View style={styles.queryListContainer}>
      <QueryBrowser
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
        activeFilter={activeFilter}
        emptyStateMessage="No React Query queries are currently active.

To see queries here:
• Make API calls using useQuery
• Ensure queries are within QueryClientProvider
• Check console for debugging info"
        contentContainerStyle={styles.queryListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Query list matching main dev tools exactly
  queryListContainer: {
    flex: 1,
    backgroundColor: "#171717", // Match container background to content background
  },
  queryListContent: {
    padding: 8, // Reduced to match main dev tools
    backgroundColor: "#171717",
    flexGrow: 1,
  },
});
