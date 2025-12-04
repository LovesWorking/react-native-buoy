import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Check } from "../icons";
import { gameUIColors } from "../ui/gameUI/constants/gameUIColors";
import { ExpandablePopover } from "../ui/components/ExpandablePopover";
import type { Environment } from "../types/types";

// ============================================================================
// Constants
// ============================================================================

const ENV_SELECTOR_WIDTH = 140; // Wider than minimized tools stack
const PEEK_HEIGHT = 28;
const OPTION_HEIGHT = 44;
const PADDING_VERTICAL = 8;
const COLLAPSE_BUTTON_HEIGHT = 24;

// ============================================================================
// Types
// ============================================================================

export interface EnvironmentSelectorProps {
  /** Whether the selector has items to show */
  hasItems: boolean;
  /** The currently active environment */
  currentEnvironment: Environment;
  /** List of environments available for selection */
  availableEnvironments: Environment[];
  /** Called when an environment is selected */
  onSelect: (env: Environment) => void;
  /** Width of the selector (defaults to 140) */
  width?: number;
  /** Custom collapsed peek content */
  collapsedContent?: React.ReactNode;
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
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        />
        <Text style={styles.optionLabel}>{config.label}</Text>
      </View>
      {isSelected && (
        <Check size={14} color={gameUIColors.success} strokeWidth={3} />
      )}
    </Pressable>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function EnvironmentSelector({
  hasItems,
  currentEnvironment,
  availableEnvironments,
  onSelect,
  width = ENV_SELECTOR_WIDTH,
  collapsedContent,
}: EnvironmentSelectorProps) {
  // Calculate expanded height based on number of environments
  const expandedHeight =
    PADDING_VERTICAL +
    availableEnvironments.length * OPTION_HEIGHT +
    COLLAPSE_BUTTON_HEIGHT +
    4;

  // Default collapsed content shows current environment
  const defaultCollapsedContent = (
    <View style={styles.collapsedEnvBadge}>
      <View
        style={[
          styles.collapsedDot,
          {
            backgroundColor: getEnvironmentConfig(currentEnvironment)
              .backgroundColor,
          },
        ]}
      />
      <Text style={styles.collapsedLabel}>
        {getEnvironmentConfig(currentEnvironment).label}
      </Text>
    </View>
  );

  return (
    <ExpandablePopover
      hasItems={hasItems}
      width={width}
      expandedHeight={expandedHeight}
      peekHeight={PEEK_HEIGHT}
      showCount={false}
      collapsedContent={collapsedContent || defaultCollapsedContent}
      collapsedLabel={`Switch environment from ${currentEnvironment}`}
    >
      {availableEnvironments.map((env) => (
        <EnvironmentOption
          key={env}
          environment={env}
          isSelected={env === currentEnvironment}
          onPress={() => onSelect(env)}
        />
      ))}
    </ExpandablePopover>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  collapsedEnvBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  collapsedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  collapsedLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: gameUIColors.primaryLight,
    letterSpacing: 0.5,
  },
  optionContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: OPTION_HEIGHT,
    width: "100%",
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
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: gameUIColors.primaryLight,
    letterSpacing: 0.5,
  },
});
