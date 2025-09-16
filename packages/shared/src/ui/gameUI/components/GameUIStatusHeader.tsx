import { StyleSheet, Text, View, ViewStyle, Animated } from "react-native";
import { gameUIColors } from "../constants/gameUIColors";
import type { AlertStateConfig } from "../hooks/useGameUIAlertState";

export interface GameUIStatusHeaderProps {
  // Alert configuration with icon, color, label, subtitle
  alertConfig: AlertStateConfig;
  // Badge text (e.g., "STATIC", "PERSISTENT")
  badgeText: string;
  // Animated style from useGameUIAlertState hook
  animatedStyle?: Animated.AnimatedProps<ViewStyle>;
  // Optional container style
  style?: ViewStyle;
  // Optional indicator dots count (default: 3)
  indicatorCount?: number;
}

/**
 * Reusable status header component showing system health
 * Displays icon, status label, subtitle, and badge
 * Used at the top of ENV, Storage, and other diagnostic screens
 */
export function GameUIStatusHeader({
  alertConfig,
  badgeText,
  animatedStyle,
  style,
  indicatorCount = 3,
}: GameUIStatusHeaderProps) {
  const IconComponent = alertConfig.icon;

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor: alertConfig.color + "40" },
        style,
        animatedStyle,
      ]}
    >
      <View
        style={[styles.glow, { backgroundColor: alertConfig.color + "10" }]}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: alertConfig.color + "15" },
          ]}
        >
          <IconComponent size={20} color={alertConfig.color} />
        </View>

        <View style={styles.textContainer}>
          <Text style={[styles.label, { color: alertConfig.color }]}>
            {alertConfig.label}
          </Text>
          <Text style={styles.subtitle}>{alertConfig.subtitle}</Text>
        </View>

        <View
          style={[styles.badge, { backgroundColor: alertConfig.color + "20" }]}
        >
          <Text style={[styles.badgeText, { color: alertConfig.color }]}>
            {badgeText}
          </Text>
        </View>
      </View>

      {/* Alert indicator lights */}
      <View style={styles.indicators}>
        {[...Array(indicatorCount)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.indicatorDot,
              {
                backgroundColor: alertConfig.color,
                opacity: alertConfig.pulse
                  ? i === 0
                    ? 1
                    : 0.5 - i * 0.2
                  : 0.3 - i * 0.1,
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 10,
    color: gameUIColors.secondary,
    fontFamily: "monospace",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  indicators: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    gap: 3,
  },
  indicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
