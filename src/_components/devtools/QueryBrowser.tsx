import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Query } from "@tanstack/react-query";
import { FlashList } from "@shopify/flash-list";
import QueryRow from "./QueryRow";
import useAllQueries from "../_hooks/useAllQueries";
import { getQueryStatusLabel } from "../_util/getQueryStatusLabel";

interface Props {
  selectedQuery: Query<any, any, any, any> | undefined;
  onQuerySelect: (query: Query<any, any, any, any> | undefined) => void;
  activeFilter?: string | null;
  emptyStateMessage?: string;
  contentContainerStyle?: any;
}

// Stable module-scope functions to prevent FlashList view recreation [[memory:4875251]]
const renderItem = ({ item, extraData }: any) => (
  <QueryRow
    query={item}
    isSelected={extraData?.selectedQuery?.queryHash === item.queryHash}
    onSelect={extraData?.handleQuerySelect}
  />
);

// Key extractor for FlashList optimization [[memory:4875251]]
const keyExtractor = (item: Query<any, any, any, any>) => item.queryHash;

// EstimatedItemSize for FlashList performance [[memory:4875251]]
const ESTIMATED_ITEM_SIZE = 53;

export default function QueryBrowser({
  selectedQuery,
  onQuerySelect,
  activeFilter,
  emptyStateMessage,
  contentContainerStyle,
}: Props) {
  // Holds all queries using the working hook
  const allQueries = useAllQueries();

  // Filter queries based on active filter - same logic as working implementation
  const filteredQueries = React.useMemo(() => {
    if (!activeFilter) {
      return allQueries;
    }

    return allQueries.filter((query) => {
      const status = getQueryStatusLabel(query);
      return status === activeFilter;
    });
  }, [allQueries, activeFilter]);

  // Function to handle query selection with stable comparison - exact same logic as working version
  const handleQuerySelect = React.useCallback(
    (query: Query<any, any, any, any>) => {
      // Compare queries by their queryKey and queryHash for stable selection
      const isCurrentlySelected = selectedQuery?.queryHash === query.queryHash;

      if (isCurrentlySelected) {
        onQuerySelect(undefined); // Deselect
        return;
      }
      onQuerySelect(query);
    },
    [selectedQuery?.queryHash, selectedQuery?.queryKey, onQuerySelect]
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
    <FlashList
      data={filteredQueries}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={ESTIMATED_ITEM_SIZE}
      style={styles.listStyle}
      contentContainerStyle={contentContainerStyle || styles.listContent}
      showsVerticalScrollIndicator
      removeClippedSubviews
      overrideItemLayout={(layout, item) => {
        layout.size = ESTIMATED_ITEM_SIZE; // Fixed size for better recycling
      }}
      drawDistance={200}
      renderScrollComponent={ScrollView}
      extraData={{
        selectedQuery,
        handleQuerySelect,
        filteredQueries,
      }} // Pass selection state, handler, and filtered data for re-renders
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 16,
  },
  listStyle: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
  },
});
