import { useCallback, useEffect, useRef } from "react";
import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  clamp,
  runOnJS,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface UseDragGestureProps {
  bubbleWidth: number;
  onDraggingChange: (isDragging: boolean) => void;
}

export function useDragGesture({
  bubbleWidth,
  onDraggingChange,
}: UseDragGestureProps) {
  const { top, bottom } = useSafeAreaInsets();
  const isInitialized = useRef(false);

  // Animation values
  const translateX = useSharedValue(screenWidth - bubbleWidth - 5);
  const translateY = useSharedValue(screenHeight - bottom - 120);
  const borderOpacity = useSharedValue(0);
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const setDragging = useCallback(
    (dragging: boolean) => {
      onDraggingChange(dragging);
    },
    [onDraggingChange]
  );

  const panGesture = Gesture.Pan()
    .minDistance(5)
    .shouldCancelWhenOutside(false)
    .runOnJS(true)
    .onBegin(() => {
      runOnJS(setDragging)(true);
      borderOpacity.value = withSpring(1);
      offsetX.value = translateX.value;
      offsetY.value = translateY.value;
    })
    .onUpdate((event) => {
      const handleWidth = 24;

      translateX.value = clamp(
        offsetX.value + event.translationX,
        -bubbleWidth + handleWidth,
        screenWidth - handleWidth
      );
      translateY.value = clamp(
        offsetY.value + event.translationY,
        top + 10,
        screenHeight - bottom - 32 - 10
      );
    })
    .onEnd(() => {
      const handleWidth = 24;
      const centerX = translateX.value + bubbleWidth / 2;

      if (centerX < screenWidth / 2) {
        if (translateX.value < -bubbleWidth / 2) {
          translateX.value = withSpring(-bubbleWidth + handleWidth);
        } else {
          translateX.value = withSpring(1);
        }
      } else {
        if (translateX.value > screenWidth - bubbleWidth / 2) {
          translateX.value = withSpring(screenWidth - handleWidth);
        } else {
          translateX.value = withSpring(screenWidth - bubbleWidth - 5);
        }
      }

      borderOpacity.value = withSpring(0);
      runOnJS(setDragging)(false);
    })
    .onFinalize(() => {
      runOnJS(setDragging)(false);
      borderOpacity.value = withSpring(0);
    });

  // Only set initial position once, then preserve position during width changes
  useEffect(() => {
    if (!isInitialized.current) {
      const spacing = 5;
      translateX.value = screenWidth - bubbleWidth - spacing;
      isInitialized.current = true;
    } else {
      // When width changes, adjust position to maintain the same side
      const currentCenterX = translateX.value + bubbleWidth / 2;
      const isOnLeft = currentCenterX < screenWidth / 2;

      if (isOnLeft) {
        // Keep on left side
        if (translateX.value >= 1) {
          translateX.value = 1; // Full visible on left
        }
        // If it's hidden (negative), leave it hidden
      } else {
        // Keep on right side
        const rightVisiblePosition = screenWidth - bubbleWidth - 5;
        if (translateX.value <= rightVisiblePosition) {
          translateX.value = rightVisiblePosition; // Full visible on right
        }
        // If it's beyond screen (for hiding), leave it hidden
      }
    }
  }, [bubbleWidth, translateX]);

  return {
    panGesture,
    translateX,
    translateY,
    borderOpacity,
  };
}
