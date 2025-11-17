import { FC, useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  Easing,
} from "react-native";
import { gameUIColors, dialColors } from "@react-buoy/shared-ui";

interface OnboardingTooltipProps {
  visible: boolean;
  onDismiss: () => void;
}

export const OnboardingTooltip: FC<OnboardingTooltipProps> = ({
  visible,
  onDismiss,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const arrowBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 12,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Continuous pulse animation for the tooltip
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Bouncing arrow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(arrowBounceAnim, {
            toValue: -8,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(arrowBounceAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      // Exit animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      {/* Tooltip content positioned above the center button */}
      <Animated.View
        style={[
          styles.tooltipContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <View style={styles.tooltip}>
          {/* Glow effect */}
          <View style={styles.glowEffect} />

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>Welcome to Buoy Dev Tools!</Text>
            <Text style={styles.message}>
              Tap the center button to configure and add developer tools to your
              dial menu.
            </Text>

            {/* Got it button */}
            <Pressable
              onPress={onDismiss}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
              ]}
            >
              <View style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Got it!</Text>
              </View>
            </Pressable>
          </View>

          {/* Arrow pointing down to center button */}
          <Animated.View
            style={[
              styles.arrowContainer,
              {
                transform: [{ translateY: arrowBounceAnim }],
              },
            ]}
          >
            <View style={styles.arrow} />
          </Animated.View>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "box-none",
  },
  tooltipContainer: {
    position: "absolute",
    bottom: 300, // Position above the center button (raised higher)
    alignItems: "center",
    maxWidth: 280,
  },
  tooltip: {
    backgroundColor: dialColors.dialBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: dialColors.dialBorder,
    padding: 20,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  glowEffect: {
    position: "absolute",
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    opacity: 0.15,
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: gameUIColors.primary,
    fontSize: 16,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 1,
    textAlign: "center",
    textTransform: "uppercase",
    textShadowColor: gameUIColors.info,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontFamily: "monospace",
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  buttonGradient: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 24,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "monospace",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  arrowContainer: {
    position: "absolute",
    bottom: -40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 20,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: gameUIColors.info,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});
