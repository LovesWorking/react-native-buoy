import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Check, ChevronUp } from "../icons";
import { gameUIColors } from "../ui/gameUI/constants/gameUIColors";
import type { Environment } from "../types/types";

// ============================================================================
// Constants
// ============================================================================

const OPTION_HEIGHT = 36;

// ============================================================================
// Types
// ============================================================================

export interface EnvironmentSelectorInlineProps {
  /** The currently active environment */
  currentEnvironment: Environment;
  /** List of environments available for selection */
  availableEnvironments: Environment[];
  /** Called when an environment is selected */
  onSelect: (env: Environment) => void;
}

// ============================================================================
// Environment Config Helper
// ============================================================================

interface EnvironmentConfig {
  label: string;
  backgroundColor: string;
}

function getEnvironmentConfig(environment: Environment): EnvironmentConfig {
  switch (environment) {
    case "local":
      return {
        label: "LOCAL",
        backgroundColor: gameUIColors.info,
      };
    case "dev":
      return {
        label: "DEV",
        backgroundColor: gameUIColors.warning,
      };
    case "qa":
      return {
        label: "QA",
        backgroundColor: gameUIColors.optional,
      };
    case "staging":
      return {
        label: "STAGING",
        backgroundColor: gameUIColors.success,
      };
    case "prod":
      return {
        label: "PROD",
        backgroundColor: gameUIColors.error,
      };
    default:
      return {
        label: "LOCAL",
        backgroundColor: gameUIColors.info,
      };
  }
}

// ============================================================================
// Environment Option Component
// ============================================================================

interface EnvironmentOptionProps {
  environment: Environment;
  isSelected: boolean;
  onPress: () => void;
}

function EnvironmentOption({
  environment,
  isSelected,
  onPress,
}: EnvironmentOptionProps) {
  const config = getEnvironmentConfig(environment);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionContainer,
        isSelected && styles.optionContainerSelected,
        pressed && styles.optionContainerPressed,
      ]}
    >
      <View style={styles.optionLeft}>
        <View
          style={[
            styles.optionDot,
            { backgroundColor: config.backgroundColor },
            {
              shadowColor: config.backgroundColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 3,
              elevation: 2,
            },
          ]}
        />
        <Text style={styles.optionLabel} numberOfLines={1}>
          {config.label}
        </Text>
      </View>
      {isSelected && (
        <Check size={12} color={gameUIColors.success} strokeWidth={3} />
      )}
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EnvironmentSelectorInline({
  currentEnvironment,
  availableEnvironments,
  onSelect,
}: EnvironmentSelectorInlineProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const config = getEnvironmentConfig(currentEnvironment);

  // Calculate expanded height based on number of environments
  const expandedHeight = availableEnvironments.length * OPTION_HEIGHT;

  // Animate height and chevron rotation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(heightAnim, {
        toValue: isExpanded ? expandedHeight : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(rotateAnim, {
        toValue: isExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, expandedHeight, heightAnim, rotateAnim]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleSelect = useCallback(
    (env: Environment) => {
      setIsExpanded(false);
      onSelect(env);
    },
    [onSelect]
  );

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View style={styles.wrapper}>
      {/* Expanded options - absolutely positioned above the badge */}
      <Animated.View
        style={[
          styles.optionsDropup,
          {
            height: heightAnim,
            opacity: heightAnim.interpolate({
              inputRange: [0, expandedHeight * 0.5, expandedHeight],
              outputRange: [0, 0.8, 1],
            }),
          },
        ]}
        pointerEvents={isExpanded ? "auto" : "none"}
      >
        <View style={{ height: expandedHeight }}>
          {availableEnvironments.map((env) => (
            <EnvironmentOption
              key={env}
              environment={env}
              isSelected={env === currentEnvironment}
              onPress={() => handleSelect(env)}
            />
          ))}
        </View>
      </Animated.View>

      {/* Badge / trigger - this is the only thing that affects layout */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.badge,
          isExpanded && styles.badgeExpanded,
          pressed && styles.badgePressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Current environment: ${config.label}. Tap to switch.`}
      >
        <View
          style={[
            styles.dot,
            { backgroundColor: config.backgroundColor },
            {
              shadowColor: config.backgroundColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
        <Text style={styles.label} numberOfLines={1}>
          {config.label}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
          <ChevronUp size={10} color={gameUIColors.muted} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 1000,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 6,
    gap: 6,
    backgroundColor: "transparent",
    borderRadius: 6,
  },
  badgeExpanded: {
    backgroundColor: gameUIColors.blackTint1,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  badgePressed: {
    opacity: 0.7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: gameUIColors.primaryLight,
    letterSpacing: 0.5,
  },
  optionsDropup: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    backgroundColor: gameUIColors.blackTint1,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: gameUIColors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    height: OPTION_HEIGHT,
  },
  optionContainerSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  optionContainerPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  optionLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: gameUIColors.primaryLight,
    letterSpacing: 0.5,
  },
});
