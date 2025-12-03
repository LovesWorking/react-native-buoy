/**
 * IsolatedRenderList
 *
 * Performance-optimized component that isolates the render tracking subscription
 * to prevent parent re-renders. Only this component re-renders when new renders
 * are tracked, keeping the modal UI stable.
 *
 * Following the optimization guide: move subscriptions to child components to
 * prevent parent re-renders.
 */

import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { RenderTracker, type TrackedRender, type FilterConfig } from "../utils/RenderTracker";
import { RenderListItem } from "./RenderListItem";
import { Activity, macOSColors } from "@react-buoy/shared-ui";

interface IsolatedRenderListProps {
  searchText: string;
  filters: FilterConfig;
  onSelectRender: (render: TrackedRender, index: number, allRenders: TrackedRender[]) => void;
  onStatsChange: (stats: { totalComponents: number; totalRenders: number }) => void;
  onRendersChange?: (renders: TrackedRender[]) => void;
  isTracking: boolean;
}

/**
 * Isolated list component that owns the render subscription.
 * Parent component does NOT re-render when renders change.
 */
function IsolatedRenderListInner({
  searchText,
  filters,
  onSelectRender,
  onStatsChange,
  onRendersChange,
  isTracking,
}: IsolatedRenderListProps) {
  // Initialize with current data to avoid flash of empty state
  const [renders, setRenders] = useState<TrackedRender[]>(() =>
    RenderTracker.getFilteredRenders(searchText)
  );
  const flatListRef = useRef<FlatList<TrackedRender>>(null);

  // Subscribe to RenderTracker updates - ONLY this component re-renders
  useEffect(() => {
    const unsubscribe = RenderTracker.subscribe(() => {
      const newRenders = RenderTracker.getFilteredRenders(searchText);
      setRenders(newRenders);
      // Notify parent of stats via callback (parent uses ref, no re-render)
      onStatsChange(RenderTracker.getStats());
      // Notify parent of renders list for navigation
      onRendersChange?.(newRenders);
    });

    return unsubscribe;
  }, [searchText, onStatsChange, onRendersChange]);

  // Update filtered renders when search or filters change
  useEffect(() => {
    const newRenders = RenderTracker.getFilteredRenders(searchText);
    setRenders(newRenders);
    onRendersChange?.(newRenders);
  }, [searchText, filters, onRendersChange]);

  // Stable keyExtractor - moved outside to avoid recreation
  const keyExtractor = useCallback((item: TrackedRender) => item.id, []);

  // Stable renderItem - uses stable onSelectRender callback
  const renderItem = useCallback(
    ({ item, index }: { item: TrackedRender; index: number }) => (
      <RenderListItem
        render={item}
        onPress={() => onSelectRender(item, index, renders)}
      />
    ),
    [onSelectRender, renders]
  );

  // Show empty state when no renders
  if (renders.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Activity size={32} color={macOSColors.text.muted} />
        <Text style={styles.emptyTitle}>No renders tracked</Text>
        <Text style={styles.emptyText}>
          {isTracking
            ? "Component renders will appear here"
            : "Enable tracking to start capturing"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={flatListRef}
      data={renders}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={10}
      scrollEnabled={false}
    />
  );
}

// Memoize to prevent re-renders from parent state changes
export const IsolatedRenderList = memo(IsolatedRenderListInner);

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyTitle: {
    color: macOSColors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    color: macOSColors.text.muted,
    fontSize: 12,
    textAlign: "center",
  },
});

export default IsolatedRenderList;
