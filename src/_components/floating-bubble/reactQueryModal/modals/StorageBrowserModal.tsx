import { Query, QueryKey } from "@tanstack/react-query";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { useGetQueryByQueryKey } from "../../../_hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "../ReactQueryModalHeader";
import { StorageBrowserMode } from "../../admin/components/StorageBrowserMode";

import { useCallback } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { SwipeIndicator } from "../components/SwipeIndicator";

import { RequiredStorageKey } from "../../admin/sections/storage/types";

interface StorageBrowserModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  enableSharedModalDimensions?: boolean;
  onTabChange: (tab: "queries" | "mutations" | "storage") => void;
  requiredStorageKeys?: RequiredStorageKey[]; // Configuration for required storage keys
}

/**
 * Specialized modal for storage browsing following "Decompose by Responsibility"
 * Single purpose: Display storage queries when storage tab is selected
 */
export function StorageBrowserModal({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
  enableSharedModalDimensions = false,
  onTabChange,
  requiredStorageKeys,
}: StorageBrowserModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);

  // Get floating mode state for conditional styling
  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@react_query_browser_modal";

  // Shared values for gesture tracking [[memory:4875251]]
  const translationX = useSharedValue(0);

  const handleSwipeNavigation = useCallback(
    (direction: "left" | "right") => {
      if (direction === "left") {
        onTabChange("queries"); // Swipe left goes to queries (first tab)
      } else if (direction === "right") {
        onTabChange("mutations"); // Swipe right goes to mutations (middle tab)
      }
    },
    [onTabChange]
  );

  const panGesture = Gesture.Pan()
    .onChange((event) => {
      // Update translation for visual feedback
      translationX.value = event.translationX;
    })
    .onEnd((event) => {
      const { translationX: eventTranslationX, velocityX } = event;
      const swipeThreshold = 80; // Match EDGE_THRESHOLD from SwipeIndicator
      const velocityThreshold = 500;

      // Reset visual feedback with spring animation
      translationX.value = withSpring(0);

      if (
        Math.abs(eventTranslationX) > swipeThreshold ||
        Math.abs(velocityX) > velocityThreshold
      ) {
        if (eventTranslationX > 0 || velocityX > 0) {
          handleSwipeNavigation("right");
        } else {
          handleSwipeNavigation("left");
        }
      }
    })
    .runOnJS(true);

  if (!visible) return null;

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      activeTab="storage"
      onTabChange={onTabChange}
      onBack={() => onQuerySelect(undefined)}
    />
  );

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <View style={{ flex: 1 }}>
        <GestureDetector gesture={panGesture}>
          <View style={{ flex: 1 }}>
            <SwipeIndicator
              translationX={translationX}
              canSwipeLeft={true}
              canSwipeRight={true}
            />
            <StorageBrowserMode
              selectedQuery={selectedQuery}
              onQuerySelect={onQuerySelect}
              requiredStorageKeys={requiredStorageKeys}
            />
          </View>
        </GestureDetector>
      </View>
    </BaseFloatingModal>
  );
}
