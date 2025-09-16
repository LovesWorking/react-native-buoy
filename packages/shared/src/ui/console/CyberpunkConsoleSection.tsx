import { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  Animated,
  Easing,
} from "react-native";
import type { LucideIcon } from "../../icons";
import { ChevronRight } from "../../icons";
import { gameUIColors } from "../gameUI";

// CONFIGURABLE: Change this value to adjust glitch duration (in milliseconds)
// Examples: 100 for very quick, 500 for half second, 1000 for 1 second, 2000 for 2 seconds
const GLITCH_DURATION_MS = 100;

interface CyberpunkConsoleSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  iconColor: string;
  iconBackgroundColor: string;
  onPress: () => void;
  style?: ViewStyle;
  index?: number;
}

export function CyberpunkConsoleSection({
  id: _id, // Unused but required by interface
  title,
  subtitle,
  icon: Icon,
  iconColor,
  iconBackgroundColor,
  onPress,
  style,
  index = 0,
}: CyberpunkConsoleSectionProps) {
  // Animation values
  const glowIntensity = useRef(new Animated.Value(0.3)).current;
  const borderGlow = useRef(new Animated.Value(0)).current;
  const glitchX = useRef(new Animated.Value(0)).current;
  const glitchY = useRef(new Animated.Value(0)).current;
  const glitchOpacity = useRef(new Animated.Value(0)).current;
  const glitchScale = useRef(new Animated.Value(1)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const isPressedRef = useRef(0);

  useEffect(() => {
    // Border glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlow, {
          toValue: 0.8,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(borderGlow, {
          toValue: 0.2,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Random glitch effect with varying delays per item
    const startRandomGlitch = () => {
      // Random delay between 3-8 seconds with stagger based on index
      const nextGlitchDelay = 3000 + Math.random() * 5000 + index * 500;

      setTimeout(() => {
        // Calculate proportional durations based on GLITCH_DURATION_MS
        const d = GLITCH_DURATION_MS; // Total duration

        // Glitch opacity animation - uses proportional timing
        Animated.sequence([
          Animated.timing(glitchOpacity, {
            toValue: 1,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.3,
            duration: d * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.9,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.2,
            duration: d * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.8,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.4,
            duration: d * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.7,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0,
            duration: d * 0.05,
            useNativeDriver: true,
          }),
        ]).start();

        // Glitch X displacement - proportional timing
        Animated.sequence([
          Animated.timing(glitchX, {
            toValue: 10,
            duration: d * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: -10,
            duration: d * 0.1,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 8,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: -6,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 5,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: -3,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 0,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
        ]).start();

        // Glitch Y displacement - proportional timing
        Animated.sequence([
          Animated.timing(glitchY, {
            toValue: -5,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: 4,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: -3,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: 2,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchY, {
            toValue: 0,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
        ]).start();

        // Glitch scale - proportional timing
        Animated.sequence([
          Animated.timing(glitchScale, {
            toValue: 1.05,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 0.98,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 1.03,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 0.97,
            duration: d * 0.2,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 1.02,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 1,
            duration: d * 0.15,
            useNativeDriver: true,
          }),
        ]).start();

        // Glow intensity glitch - proportional timing
        Animated.sequence([
          Animated.timing(glowIntensity, {
            toValue: 1,
            duration: d * 0.3,
            useNativeDriver: false,
          }),
          Animated.timing(glowIntensity, {
            toValue: 0.5,
            duration: d * 0.4,
            useNativeDriver: false,
          }),
          Animated.timing(glowIntensity, {
            toValue: 0.3,
            duration: d * 0.3,
            useNativeDriver: false,
          }),
        ]).start();

        // Border glow pulse during glitch - proportional timing
        Animated.sequence([
          Animated.timing(borderGlow, {
            toValue: 1,
            duration: d * 0.5,
            useNativeDriver: false,
          }),
          Animated.timing(borderGlow, {
            toValue: 0.2,
            duration: d * 0.5,
            useNativeDriver: false,
          }),
        ]).start();

        // Schedule next glitch
        startRandomGlitch();
      }, nextGlitchDelay);
    };

    // Start the random glitch cycle
    const initialDelay = Math.random() * 2000 + index * 300;
    const timeoutId = setTimeout(startRandomGlitch, initialDelay);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Animated values are stable useRef().current
  }, [index]);

  const handlePressIn = () => {
    isPressedRef.current = 1;
    Animated.spring(pulseScale, {
      toValue: 0.98,
      damping: 15,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(glowIntensity, {
      toValue: 1,
      duration: 100,
      useNativeDriver: false,
    }).start();

    // Trigger glitch on press
    Animated.sequence([
      Animated.timing(glitchOpacity, {
        toValue: 1,
        duration: 20,
        useNativeDriver: true,
      }),
      Animated.timing(glitchOpacity, {
        toValue: 0,
        duration: 30,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.sequence([
      Animated.timing(glitchX, {
        toValue: 5,
        duration: 20,
        useNativeDriver: true,
      }),
      Animated.timing(glitchX, {
        toValue: -5,
        duration: 20,
        useNativeDriver: true,
      }),
      Animated.timing(glitchX, {
        toValue: 0,
        duration: 20,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    isPressedRef.current = 0;
    Animated.spring(pulseScale, {
      toValue: 1,
      damping: 15,
      stiffness: 400,
      useNativeDriver: true,
    }).start();
    Animated.timing(glowIntensity, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const containerAnimatedStyle = {
    transform: [{ scale: pulseScale }],
  };

  // Get accent color for this section
  const getAccentColor = () => {
    // Direct color matching
    if (iconColor === "#10B981") return "#10B981"; // Green
    if (iconColor === "#EF4444") return "#EF4444"; // Red
    if (iconColor === "#3B82F6") return "#3B82F6"; // Blue
    if (iconColor === "#8B5CF6") return "#8B5CF6"; // Purple
    if (iconColor === "#F59E0B") return "#F59E0B"; // Yellow
    if (iconColor === "#00FFFF") return gameUIColors.info; // Cyan
    if (iconColor === "#EC4899") return "#EC4899"; // Pink
    if (iconColor === "#14B8A6") return "#14B8A6"; // Teal
    if (iconColor === "#FF006E") return "#FF006E"; // React Query pink/red
    if (iconColor === "#00FF88") return "#00FF88"; // Storage green
    if (iconColor === "#00E5FF") return gameUIColors.info; // Storage Events cyan
    if (iconColor === "#E040FB") return "#E040FB"; // Network purple

    // Fallback pattern matching for any other colors
    if (iconColor.includes("FF006E")) return "#FF006E";
    if (iconColor.includes("00FF88")) return "#00FF88";
    if (iconColor.includes("00E5FF")) return "#00E5FF";
    if (iconColor.includes("E040FB")) return "#E040FB";

    return gameUIColors.info; // Default cyan
  };

  const accentColor = getAccentColor();

  // Convert hex color to RGB values for interpolation
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 255, b: 255 };
  };

  const rgb = hexToRgb(accentColor);

  const shadowOpacityValue = glowIntensity.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const borderAnimatedStyle = {
    borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4)`, // Static fallback
    shadowOpacity: shadowOpacityValue,
  };

  const glitchStyle = {
    opacity: glitchOpacity,
    transform: [
      { translateX: glitchX },
      { translateY: glitchY },
      { scale: glitchScale },
    ],
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={style}
    >
      <Animated.View style={[styles.container, containerAnimatedStyle]}>
        <Animated.View
          style={[
            styles.card,
            borderAnimatedStyle,
            { shadowColor: accentColor },
          ]}
        >
          {/* Glass effect layers with accent color tint */}
          <View
            style={[
              styles.glassLayer1,
              { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.02)` },
            ]}
          />
          <View
            style={[
              styles.glassLayer2,
              { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.015)` },
            ]}
          />
          <View
            style={[
              styles.glassLayer3,
              { backgroundColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.01)` },
            ]}
          />

          {/* Glass shimmer overlay */}
          <View style={[styles.glassShimmer]} />

          {/* Corner accents */}
          <View
            style={[
              styles.cornerAccent,
              styles.cornerTL,
              { backgroundColor: accentColor },
            ]}
          />
          <View
            style={[
              styles.cornerAccent,
              styles.cornerTR,
              { backgroundColor: `${accentColor}80` },
            ]}
          />
          <View
            style={[
              styles.cornerAccent,
              styles.cornerBL,
              { backgroundColor: `${accentColor}80` },
            ]}
          />
          <View
            style={[
              styles.cornerAccent,
              styles.cornerBR,
              { backgroundColor: accentColor },
            ]}
          />

          {/* Glitch overlay layer - duplicates content with glitch effect */}
          <Animated.View
            style={[
              styles.glitchOverlayLayer,
              glitchStyle,
              {
                backgroundColor: `${accentColor}20`,
                borderColor: accentColor,
              },
            ]}
            pointerEvents="none"
          >
            <View style={styles.glitchContent}>
              {/* Glitched icon */}
              <View
                style={[styles.iconContainer, { borderColor: accentColor }]}
              >
                <Icon size={20} color={accentColor} />
              </View>

              {/* Glitched text */}
              <View style={styles.textContainer}>
                <Text style={[styles.glitchTitle, { color: accentColor }]}>
                  {"_"}
                  {title}
                  {"_"}
                </Text>
                {subtitle && (
                  <Text style={[styles.glitchSubtitle, { color: accentColor }]}>
                    {subtitle}
                  </Text>
                )}
              </View>
            </View>
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            {/* Icon container with glow */}
            <View
              style={[
                styles.iconContainer,
                { borderColor: `${accentColor}30` },
              ]}
            >
              <View
                style={[
                  styles.iconInner,
                  {
                    backgroundColor: `${iconBackgroundColor}15`,
                    borderColor: `${accentColor}40`,
                  },
                ]}
              >
                <Icon size={20} color={iconColor} />
              </View>
              {/* Icon glow effect */}
              <View
                style={[styles.iconGlow, { backgroundColor: accentColor }]}
              />
            </View>

            {/* Text content */}
            <View style={styles.textContainer}>
              <Text style={[styles.title, { textShadowColor: accentColor }]}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: `${accentColor}99` }]}>
                  {subtitle}
                </Text>
              )}
            </View>

            {/* Arrow indicator */}
            <View style={styles.arrowContainer}>
              <ChevronRight size={16} color={`${accentColor}80`} />
            </View>

            {/* Data dots */}
            <View style={styles.dataDots}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: accentColor, opacity: 0.8 },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  { backgroundColor: accentColor, opacity: 0.5 },
                ]}
              />
              <View
                style={[
                  styles.dot,
                  { backgroundColor: accentColor, opacity: 0.3 },
                ]}
              />
            </View>
          </View>

          {/* Binary pattern decoration */}
          <View style={styles.binaryPattern}>
            <Text style={[styles.binaryText, { color: `${accentColor}40` }]}>
              01101
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    height: 82,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 15,
    backgroundColor: "rgba(5, 5, 10, 0.6)", // Darker glass background
  },
  glassLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 10, 15, 0.7)",
    opacity: 0.8,
  },
  glassLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 15, 25, 0.5)",
    opacity: 0.6,
    top: "20%",
    left: "20%",
  },
  glassLayer3: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 35, 0.3)",
    opacity: 0.4,
    top: "40%",
    left: "40%",
  },
  glassShimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    opacity: 0.6,
  },
  glitchOverlayLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    zIndex: 5,
  },
  glitchContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: "100%",
  },
  glitchTitle: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 2,
    fontFamily: "monospace",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 10,
  },
  glitchSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 1,
    fontFamily: "monospace",
    opacity: 0.8,
  },
  cornerAccent: {
    position: "absolute",
    width: 16,
    height: 2,
  },
  cornerTL: {
    top: 0,
    left: 0,
    width: 2,
    height: 16,
  },
  cornerTR: {
    top: 0,
    right: 0,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    width: 2,
    height: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    height: "100%",
    paddingHorizontal: 16,
    zIndex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    position: "relative",
  },
  iconInner: {
    width: 42,
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGlow: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 10,
    opacity: 0.1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
    fontFamily: "monospace",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
    fontFamily: "monospace",
  },
  arrowContainer: {
    marginLeft: 8,
    opacity: 0.8,
  },
  dataDots: {
    position: "absolute",
    right: 16,
    bottom: 8,
    flexDirection: "row",
    gap: 3,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  binaryPattern: {
    position: "absolute",
    top: 8,
    right: 12,
    opacity: 0.05,
  },
  binaryText: {
    fontSize: 8,
    fontFamily: "monospace",
    color: gameUIColors.info,
    letterSpacing: 1,
  },
});
