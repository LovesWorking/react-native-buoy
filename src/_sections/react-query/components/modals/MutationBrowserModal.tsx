import { Mutation } from "@tanstack/react-query";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useCallback, useState } from "react";
import { useGetMutationById } from "../../hooks/useSelectedMutation";
import { MutationBrowserMode } from "../MutationBrowserMode";
import { MutationBrowserFooter } from "./MutationBrowserFooter";
import { BaseFloatingModal } from "../../../../_components/floating-bubble/floatingModal/BaseFloatingModal";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { View } from "react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import { SwipeIndicator } from "./SwipeIndicator";
import { useModalState } from "../../../../_components/floating-bubble/admin/hooks/useModalState";

interface MutationBrowserModalProps {
  visible: boolean;
  selectedMutationId?: number;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  onTabChange: (tab: "queries" | "mutations" | "storage") => void;
  enableSharedModalDimensions?: boolean;
}

export function MutationBrowserModal({
  visible,
  selectedMutationId,
  onMutationSelect,
  onClose,
  activeFilter: externalActiveFilter,
  onFilterChange: externalOnFilterChange,
  onTabChange,
  enableSharedModalDimensions = false,
}: MutationBrowserModalProps) {
  const selectedMutation = useGetMutationById(selectedMutationId);
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
      if (direction === "right") {
        onTabChange("queries");
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
      selectedMutation={selectedMutation}
      activeTab="mutations"
      onTabChange={onTabChange}
      onBack={() => onMutationSelect(undefined)}
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
              canSwipeLeft={false}
              canSwipeRight={true}
            />
            <MutationBrowserMode
              selectedMutation={selectedMutation}
              onMutationSelect={onMutationSelect}
              activeFilter={activeFilter}
            />
          </View>
        </GestureDetector>
        <MutationBrowserFooter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          isFloatingMode={modalState.isFloatingMode}
        />
      </View>
    </BaseFloatingModal>
  );
}
