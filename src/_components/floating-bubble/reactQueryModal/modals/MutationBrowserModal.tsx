import { Mutation } from "@tanstack/react-query";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useCallback, useState } from "react";
import { useGetMutationById } from "../../../_hooks/useSelectedMutation";
import { MutationBrowserMode } from "../../admin/components/MutationBrowserMode";
import { BaseFloatingModal } from "../../floatingModal/BaseFloatingModal";
import { ReactQueryModalHeader } from "../ReactQueryModalHeader";
import { View } from "react-native";

interface MutationBrowserModalProps {
  visible: boolean;
  selectedMutationId?: number;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  onClose: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  onTabChange: (tab: "queries" | "mutations") => void;
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

  const handleSwipeNavigation = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onTabChange("queries");
      }
    },
    [onTabChange]
  );

  const panGesture = Gesture.Pan()
    .onEnd((event) => {
      const { translationX, velocityX } = event;
      const swipeThreshold = 50;
      const velocityThreshold = 500;

      if (
        Math.abs(translationX) > swipeThreshold ||
        Math.abs(velocityX) > velocityThreshold
      ) {
        if (translationX > 0 || velocityX > 0) {
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
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
    />
  );

  const storagePrefix = enableSharedModalDimensions
    ? "@react_query_modal"
    : "@mutation_browser_modal";

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix={storagePrefix}
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      <GestureDetector gesture={panGesture}>
        <View style={{ flex: 1 }}>
          <MutationBrowserMode
            selectedMutation={selectedMutation}
            onMutationSelect={onMutationSelect}
            activeFilter={activeFilter}
          />
        </View>
      </GestureDetector>
    </BaseFloatingModal>
  );
}
