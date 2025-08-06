import { useCallback, type PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const clamp = (value: number, lowerBound: number, upperBound: number) => {
  "worklet";
  return Math.min(Math.max(lowerBound, value), upperBound);
};

const _renderHandler: Props["renderHandler"] = ({ handler }) => {
  return (
    <Animated.View style={[styles.cornerHandle, styles[handler]]}>
      <View style={[styles.handler]} />
    </Animated.View>
  );
};

type BoxDimension = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type Handlers = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

type Props = {
  heightBound: number;
  widthBound: number;
  minWidth?: number;
  minHeight?: number;
  height?: number;
  width?: number;
  left: number;
  top: number;
  topInset?: number; // Add safe area top inset
  isDraggable?: boolean;
  isResizable?: boolean;
  onDragStart?: () => void;
  onDragEnd?: (state: BoxDimension) => void;
  onResizeStart?: () => void;
  onResizeEnd?: (state: BoxDimension) => void;
  onTap?: () => void;
  scale?: number;
  style?: StyleProp<ViewStyle>;
  resizeHandlers?: Array<Handlers>;
  renderHandler?: (prop: { handler: Handlers }) => React.ReactNode;
};

export function DragResizable(props: PropsWithChildren<Props>) {
  const {
    left,
    top,
    topInset = 0,
    heightBound,
    widthBound,
    height = 50,
    width = 150,
    minWidth = 50,
    minHeight = 50,
    isDraggable = true,
    isResizable = true,
    onDragStart,
    onDragEnd,
    onResizeStart,
    onResizeEnd,
    scale = 1,
    onTap,
    children,
    style,
    resizeHandlers = ["bottomLeft", "bottomRight", "topLeft", "topRight"],
    renderHandler = _renderHandler,
  } = props;

  const boxX = useSharedValue(left);
  const boxY = useSharedValue(top);
  const boxHeight = useSharedValue(height);
  const boxWidth = useSharedValue(width);

  // shared
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);
  const sHeight = useSharedValue(0);
  const sWidth = useSharedValue(0);

  const gestureHandler = Gesture.Pan()
    .enabled(isDraggable)
    .onStart(() => {
      "worklet";
      offsetX.value = boxX.value;
      offsetY.value = boxY.value;
      if (onDragStart) runOnJS(onDragStart)();
    })
    .onUpdate((ev) => {
      "worklet";
      boxX.value = clamp(
        offsetX.value + ev.translationX / scale,
        0,
        widthBound - boxWidth.value
      );
      boxY.value = clamp(
        offsetY.value + ev.translationY / scale,
        topInset,
        heightBound - boxHeight.value
      );
    })
    .onEnd(() => {
      "worklet";
      if (onDragEnd) {
        runOnJS(onDragEnd)({
          width: boxWidth.value,
          height: boxHeight.value,
          left: boxX.value,
          top: boxY.value,
        });
      }
    })
    .minDistance(10)
    .minPointers(1)
    .maxPointers(1);

  const tapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd(() => {
      "worklet";
      if (onTap) runOnJS(onTap)();
    });

  const createResizeHandler = useCallback(
    (corner: Handlers) => {
      return Gesture.Pan()
        .enabled(isResizable)
        .onStart(() => {
          "worklet";
          sHeight.value = boxHeight.value;
          sWidth.value = boxWidth.value;
          offsetX.value = boxX.value;
          offsetY.value = boxY.value;
          if (onResizeStart) runOnJS(onResizeStart)();
        })
        .onUpdate((ev) => {
          "worklet";
          let updatedWidth = sWidth.value;
          let updatedHeight = sHeight.value;
          let updatedX = offsetX.value;
          let updatedY = offsetY.value;

          switch (corner) {
            case "topLeft": {
              updatedWidth = clamp(
                sWidth.value - ev.translationX / scale,
                minWidth,
                widthBound - offsetX.value
              );
              updatedHeight = clamp(
                sHeight.value - ev.translationY / scale,
                minHeight,
                heightBound - updatedY
              );

              // Only update `boxX` if `updatedWidth` is valid and decreasing
              if (updatedWidth !== sWidth.value) {
                updatedX = offsetX.value + (sWidth.value - updatedWidth);
              }
              if (updatedHeight !== sHeight.value) {
                updatedY = clamp(
                  offsetY.value + ev.translationY / scale,
                  topInset,
                  heightBound - updatedHeight
                );
              }
              break;
            }
            case "topRight": {
              updatedWidth = clamp(
                sWidth.value + ev.translationX / scale,
                minWidth,
                widthBound - offsetX.value
              );
              updatedHeight = clamp(
                sHeight.value - ev.translationY / scale,
                minHeight,
                heightBound - updatedY
              );
              if (updatedHeight !== sHeight.value) {
                updatedY = clamp(
                  offsetY.value + ev.translationY / scale,
                  topInset,
                  heightBound - updatedHeight
                );
              }
              break;
            }
            case "bottomLeft": {
              updatedWidth = clamp(
                sWidth.value - ev.translationX / scale,
                minWidth,
                widthBound - offsetX.value
              );
              updatedHeight = clamp(
                sHeight.value + ev.translationY / scale,
                minHeight,
                heightBound - offsetY.value
              );

              // Only update `boxX` if `updatedWidth` is valid and decreasing
              if (updatedWidth !== sWidth.value) {
                updatedX = offsetX.value + (sWidth.value - updatedWidth);
              }
              break;
            }
            case "bottomRight": {
              updatedWidth = clamp(
                sWidth.value + ev.translationX / scale,
                minWidth,
                widthBound - offsetX.value
              );
              updatedHeight = clamp(
                sHeight.value + ev.translationY / scale,
                minHeight,
                heightBound - offsetY.value
              );
              break;
            }
          }

          boxWidth.value = updatedWidth;
          boxHeight.value = updatedHeight;
          boxX.value = updatedX;
          boxY.value = updatedY;
        })
        .onEnd(() => {
          "worklet";
          if (onResizeEnd) {
            runOnJS(onResizeEnd)({
              width: boxWidth.value,
              height: boxHeight.value,
              left: boxX.value,
              top: boxY.value,
            });
          }
        })
        .minDistance(0)
        .minPointers(1)
        .maxPointers(1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      onResizeStart,
      scale,
      minWidth,
      widthBound,
      minHeight,
      heightBound,
      onResizeEnd,
    ]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: boxX.value,
      },
      {
        translateY: boxY.value,
      },
    ],
    height: boxHeight.value,
    width: boxWidth.value,
    position: "absolute",
  }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <GestureDetector
        gesture={Gesture.Simultaneous(gestureHandler, tapGesture)}
      >
        {children}
      </GestureDetector>
      {isResizable
        ? resizeHandlers.map((handler) => (
            <GestureDetector
              key={handler}
              gesture={createResizeHandler(handler)}
            >
              {renderHandler?.({ handler })}
            </GestureDetector>
          ))
        : null}
    </Animated.View>
  );
}

// Stable styles created once at module scope for optimal performance
const styles = StyleSheet.create({
  cornerHandle: {
    position: "absolute",
    zIndex: 1,
  },
  topLeft: {
    left: -8,
    top: -8,
  },
  topRight: {
    right: -8,
    top: -8,
  },
  bottomLeft: {
    left: -8,
    bottom: -8,
  },
  bottomRight: {
    right: -8,
    bottom: -8,
  },
  handler: {
    width: 16,
    height: 16,
    backgroundColor: "#0EA5E9", // Use project's accent color
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
