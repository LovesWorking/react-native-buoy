import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { DragHandle } from "../../modal/components/DragHandle";
import {
  RnBetterDevToolsBubbleContent,
  type BubbleConfig,
} from "./RnBetterDevToolsBubbleContent";
import { type Environment } from "../../../../_sections/env";
import { type UserRole } from "./UserStatus";
import { useDynamicBubbleWidth } from "../hooks/useDynamicBubbleWidth";
import { useDragGesture } from "../hooks/useDragGesture";
import { useState } from "react";
import { devToolsStorageKeys } from "../../../../_shared/storage/devToolsStorageKeys";

interface BubblePresentationProps {
  environment?: Environment;
  userRole?: UserRole;
  onStatusPress?: () => void;
  onQueryPress?: () => void;
  onEnvPress?: () => void;
  onSentryPress?: () => void;
  onStoragePress?: () => void;
  config?: BubbleConfig;
}

/**
 * Pure presentation component for the floating bubble UI
 * Encapsulates all UI-related logic including width measurement and drag gestures
 * Follows composition over props principle to reduce prop drilling
 */
export function BubblePresentation({
  environment,
  userRole,
  onStatusPress,
  onQueryPress,
  onEnvPress,
  onSentryPress,
  onStoragePress,
  config,
}: BubblePresentationProps) {
  // Internal state for drag interaction
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic width measurement - automatically adapts to content changes
  const { contentRef, bubbleWidth } = useDynamicBubbleWidth();

  // Drag gesture handling with position persistence
  const { panGesture, translateX, translateY } = useDragGesture({
    bubbleWidth,
    onDraggingChange: setIsDragging,
    storageKey: devToolsStorageKeys.bubble.position(),
  });
  // Animated styles - matching FloatingStatusBubble exactly
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => {
    const normalBorder = "rgba(75, 85, 99, 0.4)";
    const dragBorder = "rgba(34, 197, 94, 1)";

    return {
      borderColor: isDragging ? dragBorder : normalBorder,
      borderWidth: isDragging ? 2 : 1,
      transform: [{ translateY: isDragging ? 1 : 0 }],
    };
  });

  const bubbleLayout = useAnimatedStyle(() => {
    return {
      flexDirection: "row",
      alignItems: "center",
      width: bubbleWidth,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          zIndex: 1001,
        },
        animatedStyle,
      ]}
      sentry-label="ignore react query dev tools bubble"
    >
      <Animated.View
        style={[
          {
            alignItems: "center",
            backgroundColor: "#171717",
            borderRadius: 6,
            elevation: 8,
            overflow: "hidden",
            width: bubbleWidth,
          },
          bubbleLayout,
          isDragging ? styles.dragShadow : styles.normalShadow,
          animatedBorderStyle,
        ]}
      >
        <Animated.View
          ref={contentRef}
          style={{
            flexDirection: "row",
            alignItems: "center",
            // Let content size naturally for measurement
          }}
        >
          <DragHandle panGesture={panGesture} translateX={translateX} />

          <RnBetterDevToolsBubbleContent
            environment={environment}
            userRole={userRole}
            isDragging={isDragging}
            onStatusPress={() => !isDragging && onStatusPress?.()}
            onQueryPress={() => !isDragging && onQueryPress?.()}
            onEnvPress={() => !isDragging && onEnvPress?.()}
            onSentryPress={() => !isDragging && onSentryPress?.()}
            onStoragePress={() => !isDragging && onStoragePress?.()}
            config={config}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  normalShadow: {
    boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.3)",
  },
  dragShadow: {
    boxShadow: "0px 6px 12px 0px rgba(34, 197, 94, 0.6)",
  },
});
