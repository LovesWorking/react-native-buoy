import { Query, QueryKey } from "@tanstack/react-query";
import { BaseFloatingModal } from "../../../../_components/floating-bubble/floatingModal/BaseFloatingModal";
import { useGetQueryByQueryKey } from "../../hooks/useSelectedQuery";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { QueryBrowserMode } from "../QueryBrowserMode";
import { QueryBrowserFooter } from "./QueryBrowserFooter";
import { useState } from "react";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useCallback } from "react";
import { View } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { SwipeIndicator } from "./SwipeIndicator";
import { useModalState } from "../../../../_components/floating-bubble/admin/hooks/useModalState";

interface QueryBrowserModalProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  enableSharedModalDimensions?: boolean;
  onTabChange: (tab: "queries" | "mutations" | "storage") => void;
}

/**
 * Specialized modal for query browsing following "Decompose by Responsibility"
 * Single purpose: Display query browser when no query is selected
 */
export function QueryBrowserModal({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
  activeFilter: externalActiveFilter,
  onFilterChange: externalOnFilterChange,
  enableSharedModalDimensions = false,
  onTabChange,
}: QueryBrowserModalProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  // Use external filter state if provided (for persistence), otherwise use internal state
  const [internalActiveFilter, setInternalActiveFilter] = useState<
    string | null
  >(null);
  const activeFilter = externalActiveFilter ?? internalActiveFilter;
  const setActiveFilter = externalOnFilterChange ?? setInternalActiveFilter;

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
        onTabChange("mutations");
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
      selectedQuery={selectedQuery}
      activeTab="queries"
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
              canSwipeRight={false}
            />
            <QueryBrowserMode
              selectedQuery={selectedQuery}
              onQuerySelect={onQuerySelect}
              activeFilter={activeFilter}
            />
          </View>
        </GestureDetector>
        <QueryBrowserFooter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          isFloatingMode={modalState.isFloatingMode}
        />
      </View>
    </BaseFloatingModal>
  );
}
