import { Mutation } from "@tanstack/react-query";
import { useCallback, useState, useRef } from "react";
import { useGetMutationById } from "../../hooks/useSelectedMutation";
import { MutationBrowserMode } from "../MutationBrowserMode";
import { MutationBrowserFooter } from "./MutationBrowserFooter";
import {
  JsModal,
  type ModalMode,
} from "@react-buoy/shared-ui";
import { ReactQueryModalHeader } from "./ReactQueryModalHeader";
import { View, Animated, PanResponder } from "react-native";
import { SwipeIndicator } from "./SwipeIndicator";
import { devToolsStorageKeys } from "@react-buoy/shared-ui";

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

  // Track modal mode for conditional styling
  // Initialize with bottomSheet but it will be updated from persisted state if available
  const [modalMode, setModalMode] = useState<ModalMode>("bottomSheet");
  const storagePrefix = enableSharedModalDimensions
    ? devToolsStorageKeys.reactQuery.modal()
    : devToolsStorageKeys.reactQuery.mutationModal();

  // Animated value for gesture tracking [[memory:4875251]]
  const translationX = useRef(new Animated.Value(0)).current;

  const handleSwipeNavigation = useCallback(
    (direction: "left" | "right") => {
      if (direction === "right") {
        onTabChange("queries");
      }
    },
    [onTabChange]
  );

  const handleModeChange = useCallback((mode: ModalMode) => {
    setModalMode(mode);
  }, []);

  // Create PanResponder for swipe navigation
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only capture horizontal swipes
        return Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 10;
      },

      onPanResponderMove: (evt, gestureState) => {
        // Update translation for visual feedback
        translationX.setValue(gestureState.dx);
      },

      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        const swipeThreshold = 80; // Match EDGE_THRESHOLD from SwipeIndicator
        const velocityThreshold = 0.5;

        // Reset visual feedback with spring animation
        Animated.spring(translationX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();

        if (Math.abs(dx) > swipeThreshold || Math.abs(vx) > velocityThreshold) {
          if (dx > 0 || vx > 0) {
            handleSwipeNavigation("right");
          } else {
            handleSwipeNavigation("left");
          }
        }
      },

      onPanResponderTerminate: () => {
        // Reset on termination
        Animated.spring(translationX, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  if (!visible) return null;

  const renderHeaderContent = () => (
    <ReactQueryModalHeader
      selectedMutation={selectedMutation}
      activeTab="mutations"
      onTabChange={onTabChange}
      onBack={() => onMutationSelect(undefined)}
      onClose={onClose}
    />
  );

  const footerNode = (
    <MutationBrowserFooter
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      modalMode={modalMode}
    />
  );

  return (
    <JsModal
      visible={visible}
      onClose={onClose}
      persistenceKey={storagePrefix}
      header={{
        customContent: renderHeaderContent(),
        showToggleButton: true,
      }}
      onModeChange={handleModeChange}
      enablePersistence={true}
      initialMode="bottomSheet"
      enableGlitchEffects={true}
      styles={{}}
      footer={footerNode}
      footerHeight={56}
    >
      <View style={{ flex: 1 }}>
        <View {...panResponder.panHandlers} style={{ flex: 1 }}>
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
      </View>
    </JsModal>
  );
}
