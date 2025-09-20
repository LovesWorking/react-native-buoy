import { useMemo, useCallback } from "react";
import { View, StyleSheet, Text, ScrollView, ViewStyle } from "react-native";
import { Query } from "@tanstack/react-query";
import QueryRow from "./QueryRow";
import useAllQueries from "../../hooks/useAllQueries";
import { getQueryStatusLabel } from "../../utils/getQueryStatusLabel";
import { gameUIColors } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";

interface Props {
  selectedQuery: Query | undefined;
  onQuerySelect: (query: Query | undefined) => void;
  activeFilter?: string | null;
  emptyStateMessage?: string;
  contentContainerStyle?: ViewStyle;
  queries?: Query[]; // Optional external queries to override useAllQueries
}

export default function QueryBrowser({
  selectedQuery,
  onQuerySelect,
  activeFilter,
  emptyStateMessage,
  contentContainerStyle,
  queries: externalQueries,
}: Props) {
  // Holds all queries using the working hook, or use external queries if provided
  const internalQueries = useAllQueries();
  const allQueries = externalQueries ?? internalQueries;

  // Filter queries based on active filter - same logic as working implementation
  const filteredQueries = useMemo(() => {
    if (!activeFilter) {
      return allQueries;
    }

    return allQueries.filter((query: Query) => {
      const status = getQueryStatusLabel(query);
      return status === activeFilter;
    });
  }, [allQueries, activeFilter]);

  // Function to handle query selection with stable comparison
  const handleQuerySelect = useCallback(
    (query: Query) => {
      // Compare queries by their queryKey and queryHash for stable selection
      const isCurrentlySelected = selectedQuery?.queryHash === query.queryHash;

      if (isCurrentlySelected) {
        onQuerySelect(undefined); // Deselect
        return;
      }
      onQuerySelect(query);
    },
    [selectedQuery?.queryHash, onQuerySelect]
  );

  if (filteredQueries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {emptyStateMessage ||
            (activeFilter
              ? `No ${activeFilter} queries found`
              : "No queries found")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.listWrapper}
      contentContainerStyle={contentContainerStyle || styles.listContent}
      showsVerticalScrollIndicator
    >
      {filteredQueries.map((query) => (
        <QueryRow
          key={query.queryHash}
          query={query}
          isSelected={selectedQuery?.queryHash === query.queryHash}
          onSelect={handleQuerySelect}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listWrapper: {
    flexGrow: 1,
  },
  listContent: {
    paddingBottom: 16,
    backgroundColor: macOSColors.background.base,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: macOSColors.background.card,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  emptyText: {
    color: macOSColors.text.muted,
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
});
