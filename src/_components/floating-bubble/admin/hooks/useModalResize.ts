import { useEffect } from "react";
import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_HEIGHT = 150;

interface UseModalResizeProps {
  isFloatingMode: boolean;
  panelHeight: number;
  isResizing: boolean;
  setIsResizing: (resizing: boolean) => void;
  updatePanelHeight: (height: number) => void;
}

export const useModalResize = ({
  isFloatingMode,
  panelHeight,
  setIsResizing,
  updatePanelHeight,
}: UseModalResizeProps) => {
  const insets = useSafeAreaInsets();
  const MAX_HEIGHT = SCREEN_HEIGHT - insets.top;

  // Reanimated shared values for smooth resizing
  const sharedHeight = useSharedValue(panelHeight);
  const offsetHeight = useSharedValue(0);

  // Update shared value when state changes
  useEffect(() => {
    sharedHeight.value = panelHeight;
  }, [panelHeight, sharedHeight]);

  // Header-based resize gesture for bottom sheet mode
  const resizeGesture = Gesture.Pan()
    .enabled(!isFloatingMode)
    .onBegin(() => {
      "worklet";
      offsetHeight.value = sharedHeight.value;
      runOnJS(setIsResizing)(true);
    })
    .onUpdate((event) => {
      "worklet";
      // Bottom sheet: dragging up (negative dy) increases height
      const newHeight = offsetHeight.value - event.translationY;
      const clampedHeight = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
      sharedHeight.value = clampedHeight;

      // Update React state on JS thread
      runOnJS(updatePanelHeight)(clampedHeight);
    })
    .onEnd(() => {
      "worklet";
      // Final height is already set via runOnJS
      runOnJS(setIsResizing)(false);
    })
    .onFinalize(() => {
      "worklet";
      runOnJS(setIsResizing)(false);
    });

  // Animated style for smooth height transitions
  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: sharedHeight.value,
  }));

  return {
    resizeGesture,
    animatedPanelStyle,
  };
};
