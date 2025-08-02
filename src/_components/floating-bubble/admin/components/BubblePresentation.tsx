import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";
import { PanGesture } from "react-native-gesture-handler";
import { DragHandle } from "./DragHandle";
import {
  RnBetterDevToolsBubbleContent,
  type BubbleConfig,
} from "./RnBetterDevToolsBubbleContent";
import { type Environment } from "../../bubble/EnvironmentIndicator";
import { type UserRole } from "./UserStatus";

interface DragState {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  panGesture: PanGesture;
  isDragging: boolean;
}

interface BubblePresentationProps {
  environment?: Environment;
  userRole?: UserRole;
  dragState: DragState;
  bubbleWidth: number;
  contentRef: React.RefObject<any>; // For dynamic width measurement
  onStatusPress?: () => void;
  onQueryPress?: () => void;
  config?: BubbleConfig;
}

/**
 * Pure presentation component for the floating bubble UI
 * Follows "Decompose by Responsibility" principle - handles only UI rendering
 */
export function BubblePresentation({
  environment,
  userRole,
  dragState,
  bubbleWidth,
  contentRef,
  onStatusPress,
  onQueryPress,
  config,
}: BubblePresentationProps) {
  const { translateX, translateY, panGesture, isDragging } = dragState;
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
            onStatusPress={onStatusPress}
            onQueryPress={onQueryPress}
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
