import { Query, QueryKey } from "@tanstack/react-query";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { useGetQueryByQueryKey } from "../../../_hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "../ReactQueryModalHeader";
import { StorageBrowserMode } from "../../admin/components/StorageBrowserMode";
import { StorageBrowserFooter } from "../components/StorageBrowserFooter";
import { useState, useCallback } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { View } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { SwipeIndicator } from "../components/SwipeIndicator";
import { StorageType } from "../../../_util/storageQueryUtils";
import { useModalState } from "../../admin/hooks";
import { StorageTypeCounts } from "../../../_util/getStorageQueryCounts";
import { RequiredStorageKey } from "../../admin/sections/storage/types";

interface StorageBrowserModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  activeStorageTypes?: Set<StorageType>;
  onStorageTypesChange?: (storageTypes: Set<StorageType>) => void;
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
  activeStorageTypes = new Set(["mmkv", "async", "secure"]),
  onStorageTypesChange,
  enableSharedModalDimensions = false,
  onTabChange,
  requiredStorageKeys,
}: StorageBrowserModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  const [storageCounts, setStorageCounts] = useState<StorageTypeCounts>({
    mmkv: 0,
    async: 0,
    secure: 0,
    total: 0,
  });

  // Stable callback to prevent infinite re-renders [[rule3]]
  const handleCountsChange = useCallback((newCounts: StorageTypeCounts) => {
    setStorageCounts(newCounts);
  }, []);

  // Get floating mode state for conditional styling
  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@react_query_browser_modal";
  const modalState = useModalState({ storagePrefix });

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
              activeStorageTypes={activeStorageTypes}
              onCountsChange={handleCountsChange}
              requiredStorageKeys={requiredStorageKeys}
            />
          </View>
        </GestureDetector>
        <StorageBrowserFooter
          activeStorageTypes={activeStorageTypes}
          onStorageTypesChange={onStorageTypesChange}
          isFloatingMode={modalState.isFloatingMode}
          counts={storageCounts}
        />
      </View>
    </BaseFloatingModal>
  );
}
