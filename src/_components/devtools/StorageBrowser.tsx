import React from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { Query } from "@tanstack/react-query";
import { FlashList, ContentStyle } from "@shopify/flash-list";
import StorageQueryRow from "./StorageQueryRow";

interface Props {
  queries: Query<any, any, any, any>[];
  selectedQuery: Query<any, any, any, any> | undefined;
  onQuerySelect: (query: Query<any, any, any, any> | undefined) => void;
  emptyStateMessage?: string;
  contentContainerStyle?: ContentStyle;
}

// Stable module-scope functions to prevent FlashList view recreation [[memory:4875251]]
const renderStorageItem = ({ item, extraData }: any) => (
  <StorageQueryRow
    query={item}
    isSelected={extraData?.selectedQuery?.queryHash === item.queryHash}
    onSelect={extraData?.handleQuerySelect}
  />
);

// Key extractor for FlashList optimization [[memory:4875251]]
const keyExtractor = (item: Query<any, any, any, any>) => item.queryHash;

// EstimatedItemSize for FlashList performance [[memory:4875251]]
const ESTIMATED_ITEM_SIZE = 53;

/**
 * Specialized browser for storage queries following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Single purpose component for storage query browsing
 * - Prefer Composition over Configuration: Dedicated browser without status filtering
 * - Extract Reusable Logic: Uses same FlashList patterns as QueryBrowser
 */
export default function StorageBrowser({
  queries,
  selectedQuery,
  onQuerySelect,
  emptyStateMessage,
  contentContainerStyle,
}: Props) {
  // Stable callback to prevent FlashList view recreation [[memory:4875251]]
  const handleQuerySelect = React.useCallback(
    (query: Query<any, any, any, any>) => {
      onQuerySelect(query);
    },
    [onQuerySelect]
  );

  // Stable extraData object [[memory:4875251]]
  const extraData = React.useMemo(
    () => ({
      selectedQuery,
      handleQuerySelect,
    }),
    [selectedQuery, handleQuerySelect]
  );

  if (queries.length === 0) {
    return (
      <ScrollView
        style={styles.emptyContainer}
        contentContainerStyle={[
          styles.emptyContentContainer,
          contentContainerStyle,
        ]}
      >
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {emptyStateMessage || "No storage queries found"}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={queries}
        renderItem={renderStorageItem}
        keyExtractor={keyExtractor}
        extraData={extraData}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        getItemType={() => "storage-query"} // Single item type for storage queries
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyContentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 20,
  },
});
