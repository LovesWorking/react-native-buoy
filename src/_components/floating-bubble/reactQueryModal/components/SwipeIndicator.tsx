import { View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  SharedValue,
} from "react-native-reanimated";
import { ChevronLeft, ChevronRight } from "lucide-react-native";

/**
 * Morphing swipe indicator – thin line ➜ pill ➜ circle with a pop-out cue at
 * full commit.  Visual-only; gesture logic lives upstream.
 */

interface SwipeIndicatorProps {
  translationX: SharedValue<number>; // gesture translation
  maxTranslation?: number; // distance that maps to progress 1.0 (px)
  canSwipeRight?: boolean; // left-edge back gesture
  canSwipeLeft?: boolean; // right-edge gesture (optional)
}

/* -------------------------------------------------------------------------- */
// VISUAL CONSTANTS – tuned for typical back-gesture UX
/* -------------------------------------------------------------------------- */
const INDICATOR_HEIGHT = 32; // ⬆️ bigger circle (line height)
const MIN_WIDTH = 6; // hairline start
const MAX_WIDTH = INDICATOR_HEIGHT; // circle when width == height
const DEFAULT_MAX_TRANSLATION = 120;
const POP_OUT_START = 0.95; // progress at which pop-out begins
const POP_OUT_SCALE = 1.15; // final scale factor when fully committed

export function SwipeIndicator({
  translationX,
  maxTranslation = DEFAULT_MAX_TRANSLATION,
  canSwipeLeft = true,
  canSwipeRight = true,
}: SwipeIndicatorProps) {
  /* Utility executed on UI thread */
  const buildIndicatorStyle = (progress: number) => {
    "worklet";
    const width = MIN_WIDTH + (MAX_WIDTH - MIN_WIDTH) * progress;
    const popOutProgress = Math.max(
      0,
      (progress - POP_OUT_START) / (1 - POP_OUT_START)
    );
    const scale = 1 + (POP_OUT_SCALE - 1) * popOutProgress; // 1 → POP_OUT_SCALE

    return {
      width,
      height: INDICATOR_HEIGHT,
      borderRadius: INDICATOR_HEIGHT / 2,
      backgroundColor: "rgba(255,255,255,0.9)",
      justifyContent: "center",
      alignItems: "center",
      transform: [{ scale }],
    } as const;
  };

  /* ---------------- LEFT EDGE (Back) ---------------- */
  const leftIndicatorStyle = useAnimatedStyle(() => {
    if (!canSwipeRight) return { opacity: 0, width: 0 } as const;

    const progress = interpolate(
      translationX.value,
      [0, maxTranslation],
      [0, 1],
      Extrapolate.CLAMP
    );

    const base = buildIndicatorStyle(progress);
    const commitProgress = Math.max(0, (progress - 0.99) / 0.01);
    const translateX = 16 * commitProgress; // shift circle 16px into screen at full commit

    return {
      ...base,
      opacity: progress > 0 ? 1 : 0,
      transform: [...(base.transform || []), { translateX }],
    } as const;
  });

  const leftArrowStyle = useAnimatedStyle(() => {
    if (!canSwipeRight)
      return { opacity: 0, transform: [{ scale: 0 }] } as const;

    const progress = interpolate(
      translationX.value,
      [0, maxTranslation],
      [0, 1],
      Extrapolate.CLAMP
    );

    // Arrow becomes visible after 50% expansion of the indicator
    const visibleProgress = Math.max(0, (progress - 0.5) / 0.5);

    // Additional pop-out growth once we cross POP_OUT_START (95%)
    const popOutProgress = Math.max(
      0,
      (progress - POP_OUT_START) / (1 - POP_OUT_START)
    );

    // Base scale 0.8 → 1.0 through visibleProgress, plus 0.2 in the pop-out window
    const scale = 0.8 + 0.2 * visibleProgress + 0.2 * popOutProgress;

    return {
      opacity: visibleProgress,
      transform: [{ scale }],
    } as const;
  });

  /* ---------------- RIGHT EDGE ---------------- */
  const rightIndicatorStyle = useAnimatedStyle(() => {
    if (!canSwipeLeft) return { opacity: 0, width: 0 } as const;

    const progress = interpolate(
      translationX.value,
      [-maxTranslation, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const base = buildIndicatorStyle(progress);
    const commitProgress = Math.max(0, (progress - 0.99) / 0.01);
    const translateX = -16 * commitProgress; // shift circle inwards from right edge

    return {
      ...base,
      opacity: progress > 0 ? 1 : 0,
      transform: [...(base.transform || []), { translateX }],
    } as const;
  });

  const rightArrowStyle = useAnimatedStyle(() => {
    if (!canSwipeLeft)
      return { opacity: 0, transform: [{ scale: 0 }] } as const;

    const progress = interpolate(
      translationX.value,
      [-maxTranslation, 0],
      [1, 0],
      Extrapolate.CLAMP
    );

    const visibleProgress = Math.max(0, (progress - 0.5) / 0.5);
    const popOutProgress = Math.max(
      0,
      (progress - POP_OUT_START) / (1 - POP_OUT_START)
    );

    // for right side progress goes 1→0, invert for scale
    const scale = 0.8 + 0.2 * visibleProgress + 0.2 * popOutProgress;

    return {
      opacity: visibleProgress,
      transform: [{ scale }],
    } as const;
  });

  /* ---------------- Render ---------------- */
  return (
    <View style={styles.container} pointerEvents="none">
      {/* LEFT indicator (back gesture) */}
      <Animated.View style={[styles.leftWrapper, leftIndicatorStyle]}>
        <Animated.View style={leftArrowStyle}>
          <ChevronLeft
            size={INDICATOR_HEIGHT * 0.6}
            color="#007AFF"
            strokeWidth={3}
          />
        </Animated.View>
      </Animated.View>

      {/* RIGHT indicator */}
      <Animated.View style={[styles.rightWrapper, rightIndicatorStyle]}>
        <Animated.View style={rightArrowStyle}>
          <ChevronRight
            size={INDICATOR_HEIGHT * 0.6}
            color="#007AFF"
            strokeWidth={3}
          />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  leftWrapper: {
    position: "absolute",
    left: 16,
  },
  rightWrapper: {
    position: "absolute",
    right: 16,
  },
});
