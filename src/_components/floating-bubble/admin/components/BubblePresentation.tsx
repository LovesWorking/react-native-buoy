import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { PanGesture } from "react-native-gesture-handler";
import { ErrorBoundary } from "./ErrorBoundary";
import { DragHandle } from "./DragHandle";
import { RnBetterDevToolsBubbleContent } from "./RnBetterDevToolsBubbleContent";
import { type Environment } from "./EnvironmentIndicator";
import { type UserRole } from "./UserStatus";

const { width: screenWidth } = Dimensions.get("window");

interface BubblePresentationProps {
  environment: Environment;
  userRole: UserRole;
  isOnline: boolean;
  isDragging: boolean;
  bubbleWidth: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  panGesture: PanGesture;
  onEnvironmentLayout: (event: any) => void;
  onStatusLayout: (event: any) => void;
  onQueryLayout: (event: any) => void;
  onStatusPress: () => void;
  onQueryPress: () => void;
  onWifiToggle: () => void;
}

/**
 * Pure presentation component for the floating bubble UI
 * Follows "Decompose by Responsibility" principle - handles only UI rendering
 */
export function BubblePresentation({
  environment,
  userRole,
  isOnline,
  isDragging,
  bubbleWidth,
  translateX,
  translateY,
  panGesture,
  onEnvironmentLayout,
  onStatusLayout,
  onQueryLayout,
  onStatusPress,
  onQueryPress,
  onWifiToggle,
}: BubblePresentationProps) {
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
    const centerX = translateX.value + bubbleWidth / 2;
    const isOnLeft = centerX < screenWidth / 2;

    return {
      flexDirection: isOnLeft ? "row-reverse" : "row",
      alignItems: "center",
      width: bubbleWidth,
    };
  });

  return (
    <ErrorBoundary>
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
          <DragHandle panGesture={panGesture} translateX={translateX} />

          <ErrorBoundary>
            <RnBetterDevToolsBubbleContent
              environment={environment}
              userRole={userRole}
              isOnline={isOnline}
              isDragging={isDragging}
              onEnvironmentLayout={onEnvironmentLayout}
              onStatusLayout={onStatusLayout}
              onQueryLayout={onQueryLayout}
              onStatusPress={onStatusPress}
              onQueryPress={onQueryPress}
              onWifiToggle={onWifiToggle}
            />
          </ErrorBoundary>
        </Animated.View>
      </Animated.View>
    </ErrorBoundary>
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
