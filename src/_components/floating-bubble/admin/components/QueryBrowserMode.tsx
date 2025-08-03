import { View, StyleSheet } from "react-native";
import { Query, QueryKey } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { QueryBrowser } from "../../../devtools/index";

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
  const insets = useSafeAreaInsets();

  return (
    <>
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
      {/* Query Browser safe area */}
      <View style={[styles.queryBrowserSafeArea, { height: insets.bottom }]} />
    </>
  );
}

const styles = StyleSheet.create({
  // Query list matching main dev tools exactly
  queryListContainer: {
    flex: 1,
  },
  queryListContent: {
    padding: 8, // Reduced to match main dev tools
    backgroundColor: "#171717",
    flexGrow: 1,
  },

  // Query browser safe area with matching background
  queryBrowserSafeArea: {
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },
});
