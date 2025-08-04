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

// Debounced save function will be created inside the hook

// AsyncStorage import with fallback for when it's not available
let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
} | null = null;
try {
  import("@react-native-async-storage/async-storage").then((module) => {
    AsyncStorage = module.default;
  });
} catch {
  // AsyncStorage not available - will fall back to in-memory storage
  console.warn(
    "AsyncStorage not found. Bubble position will not persist across app restarts. To enable persistence, install @react-native-async-storage/async-storage"
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

// Fallback in-memory storage when AsyncStorage is not available
const memoryStorage: Record<string, string> = {};

// Helper functions for persisting bubble position
const setItem = async (key: string, value: string) => {
  if (AsyncStorage) {
    await AsyncStorage.setItem(key, value);
  } else {
    memoryStorage[key] = value;
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (AsyncStorage) {
    return await AsyncStorage.getItem(key);
  } else {
    return memoryStorage[key] || null;
  }
};

// These functions will be moved inside the hook to access storageKey

interface UseDragGestureProps {
  bubbleWidth: number;
  onDraggingChange: (isDragging: boolean) => void;
  storageKey?: string; // Optional key to distinguish different bubbles
}

export function useDragGesture({
  bubbleWidth,
  onDraggingChange,
  storageKey = "status_bubble", // Default to status bubble
}: UseDragGestureProps) {
  const { top, bottom } = useSafeAreaInsets();
  const isInitialized = useRef(false);
  const isPositionLoaded = useRef(false);

  // Dynamic storage keys based on bubble type
  const dynamicStorageKeys = {
    BUBBLE_POSITION_X: `@floating_${storageKey}_position_x`,
    BUBBLE_POSITION_Y: `@floating_${storageKey}_position_y`,
  };

  // Position storage functions with dynamic keys
  const saveBubblePosition = async (x: number, y: number) => {
    try {
      await Promise.all([
        setItem(dynamicStorageKeys.BUBBLE_POSITION_X, x.toString()),
        setItem(dynamicStorageKeys.BUBBLE_POSITION_Y, y.toString()),
      ]);
    } catch {
      console.warn("Failed to save bubble position");
    }
  };

  const loadBubblePosition = useCallback(async (): Promise<{
    x: number | null;
    y: number | null;
  }> => {
    try {
      const [xStr, yStr] = await Promise.all([
        getItem(dynamicStorageKeys.BUBBLE_POSITION_X),
        getItem(dynamicStorageKeys.BUBBLE_POSITION_Y),
      ]);

      const x = xStr ? parseFloat(xStr) : null;
      const y = yStr ? parseFloat(yStr) : null;

      return { x, y };
    } catch {
      console.warn("Failed to load bubble position");
      return { x: null, y: null };
    }
  }, [
    dynamicStorageKeys.BUBBLE_POSITION_X,
    dynamicStorageKeys.BUBBLE_POSITION_Y,
  ]);

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

      let finalX = translateX.value;
      if (centerX < screenWidth / 2) {
        if (translateX.value < -bubbleWidth / 2) {
          finalX = -bubbleWidth + handleWidth;
          translateX.value = withSpring(finalX);
        } else {
          finalX = 1;
          translateX.value = withSpring(finalX);
        }
      } else {
        if (translateX.value > screenWidth - bubbleWidth / 2) {
          finalX = screenWidth - handleWidth;
          translateX.value = withSpring(finalX);
        } else {
          finalX = screenWidth - bubbleWidth - 5;
          translateX.value = withSpring(finalX);
        }
      }

      // Save position to storage (immediate save since this is the final position)
      runOnJS(saveBubblePosition)(finalX, translateY.value);

      borderOpacity.value = withSpring(0);
      runOnJS(setDragging)(false);
    })
    .onFinalize(() => {
      runOnJS(setDragging)(false);
      borderOpacity.value = withSpring(0);
    });

  // Load saved position and handle width changes
  useEffect(() => {
    const initializePosition = async () => {
      if (!isInitialized.current) {
        // Load saved position first
        const { x, y } = await loadBubblePosition();

        if (x !== null && y !== null) {
          // Validate saved position is within current screen bounds
          const validatedX = Math.max(
            -bubbleWidth + 24, // Hidden on left but handle visible
            Math.min(x, screenWidth - 24) // Hidden on right but handle visible
          );
          const validatedY = Math.max(
            top + 10,
            Math.min(y, screenHeight - bottom - 32 - 10)
          );

          translateX.value = validatedX;
          translateY.value = validatedY;
        } else {
          // Use default position
          const spacing = 5;
          translateX.value = screenWidth - bubbleWidth - spacing;
          translateY.value = screenHeight - bottom - 120;
        }

        isInitialized.current = true;
        isPositionLoaded.current = true;
      } else if (isPositionLoaded.current) {
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
    };

    initializePosition();
  }, [bubbleWidth, translateX, translateY, top, bottom, loadBubblePosition]);

  return {
    panGesture,
    translateX,
    translateY,
    borderOpacity,
  };
}
