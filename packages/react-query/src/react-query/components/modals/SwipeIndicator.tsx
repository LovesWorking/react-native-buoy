import { View, StyleSheet, Animated } from "react-native";
import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "@monorepo/shared";

/**
 * Morphing swipe indicator – thin line ➜ pill ➜ circle with a pop-out cue at
 * full commit.  Visual-only; gesture logic lives upstream.
 */

interface SwipeIndicatorProps {
  translationX: Animated.Value; // gesture translation
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
  /* ---------------- LEFT EDGE (Back) ---------------- */
  const leftProgress = useMemo(() => {
    return translationX.interpolate({
      inputRange: [0, maxTranslation],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
  }, [translationX, maxTranslation]);

  const leftIndicatorWidth = useMemo(() => {
    return leftProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [MIN_WIDTH, MAX_WIDTH],
    });
  }, [leftProgress]);

  const leftIndicatorScale = useMemo(() => {
    return leftProgress.interpolate({
      inputRange: [0, POP_OUT_START, 1],
      outputRange: [1, 1, POP_OUT_SCALE],
    });
  }, [leftProgress]);

  const leftIndicatorTranslateX = useMemo(() => {
    return leftProgress.interpolate({
      inputRange: [0, 0.99, 1],
      outputRange: [0, 0, 16],
    });
  }, [leftProgress]);

  const leftIndicatorOpacity = useMemo(() => {
    return leftProgress.interpolate({
      inputRange: [0, 0.01],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
  }, [leftProgress]);

  const leftArrowOpacity = useMemo(() => {
    return leftProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
      extrapolate: "clamp",
    });
  }, [leftProgress]);

  const leftArrowScale = useMemo(() => {
    return leftProgress.interpolate({
      inputRange: [0, 0.5, POP_OUT_START, 1],
      outputRange: [0.8, 0.8, 1, 1.2],
    });
  }, [leftProgress]);

  /* ---------------- RIGHT EDGE ---------------- */
  const rightProgress = useMemo(() => {
    return translationX.interpolate({
      inputRange: [-maxTranslation, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    });
  }, [translationX, maxTranslation]);

  const rightIndicatorWidth = useMemo(() => {
    return rightProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [MIN_WIDTH, MAX_WIDTH],
    });
  }, [rightProgress]);

  const rightIndicatorScale = useMemo(() => {
    return rightProgress.interpolate({
      inputRange: [0, POP_OUT_START, 1],
      outputRange: [1, 1, POP_OUT_SCALE],
    });
  }, [rightProgress]);

  const rightIndicatorTranslateX = useMemo(() => {
    return rightProgress.interpolate({
      inputRange: [0, 0.99, 1],
      outputRange: [0, 0, -16],
    });
  }, [rightProgress]);

  const rightIndicatorOpacity = useMemo(() => {
    return rightProgress.interpolate({
      inputRange: [0, 0.01],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
  }, [rightProgress]);

  const rightArrowOpacity = useMemo(() => {
    return rightProgress.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0, 0, 1],
      extrapolate: "clamp",
    });
  }, [rightProgress]);

  const rightArrowScale = useMemo(() => {
    return rightProgress.interpolate({
      inputRange: [0, 0.5, POP_OUT_START, 1],
      outputRange: [0.8, 0.8, 1, 1.2],
    });
  }, [rightProgress]);

  /* ---------------- Render ---------------- */
  return (
    <View style={styles.container} pointerEvents="none">
      {/* LEFT indicator (back gesture) */}
      {canSwipeRight && (
        <Animated.View
          style={[
            styles.leftWrapper,
            {
              width: leftIndicatorWidth,
              height: INDICATOR_HEIGHT,
              borderRadius: INDICATOR_HEIGHT / 2,
              backgroundColor: "rgba(255,255,255,0.9)",
              justifyContent: "center",
              alignItems: "center",
              opacity: leftIndicatorOpacity,
              transform: [
                { scale: leftIndicatorScale },
                { translateX: leftIndicatorTranslateX },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: leftArrowOpacity,
              transform: [{ scale: leftArrowScale }],
            }}
          >
            <ChevronLeft
              size={INDICATOR_HEIGHT * 0.6}
              color="#007AFF"
              strokeWidth={3}
            />
          </Animated.View>
        </Animated.View>
      )}

      {/* RIGHT indicator */}
      {canSwipeLeft && (
        <Animated.View
          style={[
            styles.rightWrapper,
            {
              width: rightIndicatorWidth,
              height: INDICATOR_HEIGHT,
              borderRadius: INDICATOR_HEIGHT / 2,
              backgroundColor: "rgba(255,255,255,0.9)",
              justifyContent: "center",
              alignItems: "center",
              opacity: rightIndicatorOpacity,
              transform: [
                { scale: rightIndicatorScale },
                { translateX: rightIndicatorTranslateX },
              ],
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: rightArrowOpacity,
              transform: [{ scale: rightArrowScale }],
            }}
          >
            <ChevronRight
              size={INDICATOR_HEIGHT * 0.6}
              color="#007AFF"
              strokeWidth={3}
            />
          </Animated.View>
        </Animated.View>
      )}
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
