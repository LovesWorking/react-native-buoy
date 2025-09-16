import { useRef, FC } from "react";
import {
  StyleSheet,
  Pressable,
  View,
  Text,
  Dimensions,
  Animated,
} from "react-native";
import { IconType } from "./DialDevTools";
import { gameUIColors } from "../colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIEW_SIZE = 60;
const CIRCLE_SIZE = Math.min(SCREEN_WIDTH * 0.75, 320);
const CIRCLE_RADIUS = CIRCLE_SIZE / 2;
const START_ANGLE = (-1 * Math.PI) / 2;

type Props = {
  index: number;
  icon: IconType;
  iconsProgress: Animated.Value;
  onPress: (index: number) => void;
  selectedIcon: number;
  totalIcons: number;
};

export const DialIcon: FC<Props> = ({
  index,
  icon,
  iconsProgress,
  onPress,
  selectedIcon,
  totalIcons,
}) => {
  const ANGLE_PER_VIEW = (2 * Math.PI) / totalIcons;
  const angle = START_ANGLE + ANGLE_PER_VIEW * index;

  // Animation values - using interpolation for better performance
  const scale = useRef(new Animated.Value(1)).current;

  // Calculate final position for this icon
  const radius = CIRCLE_RADIUS - VIEW_SIZE / 2 - 20;
  const finalX = radius * Math.cos(angle);
  const finalY = radius * Math.sin(angle);

  // Hover animation on press in/out
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      damping: 15,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      damping: 15,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
  };

  // Create staggered progress for each icon
  const staggerDelay = index * 0.1;
  const maxStagger = (totalIcons - 1) * 0.1;

  // Use interpolation for smooth animation that works both directions
  const staggeredProgress = iconsProgress.interpolate({
    inputRange: [0, staggerDelay, staggerDelay + (1 - maxStagger), 1],
    outputRange: [0, 0, 1, 1],
    extrapolate: "clamp",
  });

  // Spiral animation with interpolation
  const spiralRotation = staggeredProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [Math.PI * 2, 0], // Spiral from 2π to 0
  });

  // Distance from center
  const distance = staggeredProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, radius],
  });

  // Calculate X and Y positions using Animated operations
  const translateX = Animated.add(
    Animated.multiply(
      distance,
      spiralRotation.interpolate({
        inputRange: [0, Math.PI * 2],
        outputRange: [Math.cos(angle), Math.cos(angle + Math.PI * 2)],
      })
    ),
    staggeredProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, finalX - radius * Math.cos(angle + Math.PI * 2)],
    })
  );

  const translateY = Animated.add(
    Animated.multiply(
      distance,
      spiralRotation.interpolate({
        inputRange: [0, Math.PI * 2],
        outputRange: [Math.sin(angle), Math.sin(angle + Math.PI * 2)],
      })
    ),
    staggeredProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, finalY - radius * Math.sin(angle + Math.PI * 2)],
    })
  );

  // Opacity animation
  const itemOpacity = staggeredProgress.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.3, 1],
  });

  // Scale based on progress
  const progressScale = staggeredProgress;

  // Main animated style for position and appearance
  const animatedStyle = {
    position: "absolute" as const,
    left: CIRCLE_RADIUS - VIEW_SIZE / 2, // Center position
    top: CIRCLE_RADIUS - VIEW_SIZE / 2, // Center position
    opacity: itemOpacity,
    transform: [
      { translateX }, // Apply translation from center
      { translateY }, // Apply translation from center
      { scale: Animated.multiply(scale, progressScale) },
    ],
  };

  // Check if this is an empty spot
  const isEmpty = icon.icon === null;

  return (
    <Animated.View style={[styles.view, animatedStyle]}>
      {isEmpty ? (
        // Empty spot - just show a subtle circle
        <View style={styles.emptySpot}>
          <View style={styles.emptyDot} />
        </View>
      ) : (
        <Pressable
          onPress={() => onPress(index)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          {/* Gradient background layers for depth */}
          <View
            style={[
              styles.iconGradientBg,
              {
                backgroundColor: "rgba(0, 0, 0, 0.2)",
              },
            ]}
          />

          {/* Inner glow effect */}
          <View
            style={[
              styles.iconInnerGlow,
              {
                backgroundColor: "rgba(255, 255, 255, 0.02)",
              },
            ]}
          />

          {/* Icon */}
          <View style={styles.iconWrapper}>{icon.icon}</View>

          {/* Label */}
          <Text style={styles.label}>{icon.name.toUpperCase()}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  view: {
    width: VIEW_SIZE,
    height: VIEW_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  pressable: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 4,
    backgroundColor: "transparent",
  },
  iconGradientBg: {
    position: "absolute",
    width: "85%",
    height: "85%",
    borderRadius: 12,
    opacity: 0.3,
  },
  iconInnerGlow: {
    position: "absolute",
    width: "70%",
    height: "70%",
    borderRadius: 10,
    opacity: 0.5,
  },
  iconWrapper: {
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
    fontFamily: "monospace",
    marginTop: 2,
    color: gameUIColors.secondary,
  },
  emptySpot: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: `${gameUIColors.muted}15`,
    borderWidth: 1,
    borderColor: `${gameUIColors.muted}50`,
  },
});
