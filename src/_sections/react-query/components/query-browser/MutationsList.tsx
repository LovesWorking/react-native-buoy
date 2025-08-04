import React, { useState, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Mutation } from "@tanstack/react-query";
import MutationButton from "./MutationButton";
import MutationInformation from "./MutationInformation";
import useAllMutations from "../../hooks/useAllMutations";
import { ContentStyle } from "@shopify/flash-list";

interface Props {
  selectedMutation: Mutation | undefined;
  setSelectedMutation: React.Dispatch<
    React.SetStateAction<Mutation | undefined>
  >;
  activeFilter?: string | null;
  hideInfoPanel?: boolean;
  contentContainerStyle?: ContentStyle;
}

export default function MutationsList({
  selectedMutation,
  setSelectedMutation,
  activeFilter,
  hideInfoPanel = false,
  contentContainerStyle,
}: Props) {
  const { mutations: allmutations } = useAllMutations();

  // Helper function to get mutation status for filtering
  const getMutationStatus = (mutation: Mutation) => {
    if (mutation.state.isPaused) return "paused";
    const status = mutation.state.status;
    return status; // 'idle', 'pending', 'success', 'error'
  };

  // Filter mutations based on active filter
  const filteredMutations = React.useMemo(() => {
    if (!activeFilter) {
      return allmutations;
    }

    return allmutations.filter((mutation) => {
      const status = getMutationStatus(mutation);
      return status === activeFilter;
    });
  }, [allmutations, activeFilter]);

  // Height management for resizable mutation information panel
  const screenHeight = Dimensions.get("window").height;
  const defaultInfoHeight = screenHeight * 0.4; // 40% of screen height
  const minInfoHeight = 150;
  const maxInfoHeight = screenHeight * 0.7; // 70% of screen height

  const infoHeightAnim = useRef(new Animated.Value(defaultInfoHeight)).current;
  const [, setCurrentInfoHeight] = useState(defaultInfoHeight);
  const currentInfoHeightRef = useRef(defaultInfoHeight);

  // Pan responder for dragging the mutation information panel
  const infoPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 10
        );
      },
      onPanResponderGrant: () => {
        infoHeightAnim.stopAnimation((value) => {
          setCurrentInfoHeight(value);
          currentInfoHeightRef.current = value;
          infoHeightAnim.setValue(value);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        // Use the ref value which is always current
        const newHeight = currentInfoHeightRef.current - gestureState.dy;
        const clampedHeight = Math.max(
          minInfoHeight,
          Math.min(maxInfoHeight, newHeight)
        );
        infoHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const finalHeight = Math.max(
          minInfoHeight,
          Math.min(
            maxInfoHeight,
            currentInfoHeightRef.current - gestureState.dy
          )
        );
        setCurrentInfoHeight(finalHeight);
        currentInfoHeightRef.current = finalHeight;

        Animated.timing(infoHeightAnim, {
          toValue: finalHeight,
          duration: 200,
          useNativeDriver: false,
        }).start(() => {
          // Ensure the animated value and state are perfectly synced after animation
          infoHeightAnim.setValue(finalHeight);
          setCurrentInfoHeight(finalHeight);
          currentInfoHeightRef.current = finalHeight;
        });
      },
    })
  ).current;

  const renderMutation = ({ item }: { item: Mutation }) => (
    <MutationButton
      selected={selectedMutation}
      setSelectedMutation={setSelectedMutation}
      mutation={item}
    />
  );

  return (
    <View style={styles.container}>
      {filteredMutations.length > 0 ? (
        <View style={styles.listWrapper}>
          <FlashList
            sentry-label="ignore devtools mutations list"
            data={filteredMutations}
            renderItem={renderMutation}
            keyExtractor={(item, index) => `${item.mutationId}-${index}`}
            estimatedItemSize={60}
            showsVerticalScrollIndicator
            removeClippedSubviews
            renderScrollComponent={ScrollView}
            contentContainerStyle={contentContainerStyle || styles.listContent}
          />
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {activeFilter
              ? `No ${activeFilter} mutations found`
              : "No mutations found"}
          </Text>
        </View>
      )}
      {selectedMutation && !hideInfoPanel && (
        <Animated.View
          style={[styles.mutationInfo, { height: infoHeightAnim }]}
        >
          {/* Drag handle for resizing */}
          <View style={styles.dragHandle} {...infoPanResponder.panHandlers}>
            <View style={styles.dragIndicator} />
          </View>
          <View style={styles.mutationInfoContent}>
            <MutationInformation selectedMutation={selectedMutation} />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  listWrapper: {
    flex: 1,
  },
  listContent: {
    backgroundColor: "#171717",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  mutationInfo: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    backgroundColor: "#171717",
  },
  dragHandle: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
  mutationInfoContent: {
    flex: 1,
    backgroundColor: "#171717",
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
