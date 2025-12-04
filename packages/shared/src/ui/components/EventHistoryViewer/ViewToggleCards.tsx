/**
 * ViewToggleCards
 *
 * Two side-by-side cards for switching between current and diff views.
 * This is a dumb component - all state is controlled externally.
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { macOSColors } from "../../gameUI/constants/macOSDesignSystemColors";
import type { ViewToggleCardsProps } from "./types";

/**
 * ViewToggleCards displays two cards for switching between
 * "current" view and "diff" view modes.
 */
export const ViewToggleCards = memo(function ViewToggleCards({
  activeView,
  onViewChange,
  currentLabel,
  currentDescription,
  currentIcon: CurrentIcon,
  diffLabel,
  diffDescription,
  diffIcon: DiffIcon,
  diffDisabled = false,
}: ViewToggleCardsProps) {
  const isCurrentActive = activeView === "current";
  const isDiffActive = activeView === "diff";

  return (
    <View style={styles.container}>
      {/* Current View Card */}
      <TouchableOpacity
        style={[styles.card, isCurrentActive && styles.cardActive]}
        onPress={() => onViewChange("current")}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <CurrentIcon
            size={16}
            color={
              isCurrentActive
                ? macOSColors.semantic.info
                : macOSColors.text.secondary
            }
          />
          <Text
            style={[styles.cardLabel, isCurrentActive && styles.cardLabelActive]}
          >
            {currentLabel}
          </Text>
        </View>
        <Text
          style={[
            styles.cardDescription,
            isCurrentActive && styles.cardDescriptionActive,
          ]}
        >
          {currentDescription}
        </Text>
      </TouchableOpacity>

      {/* Diff View Card */}
      <TouchableOpacity
        style={[
          styles.card,
          isDiffActive && styles.cardActive,
          diffDisabled && styles.cardDisabled,
        ]}
        onPress={() => !diffDisabled && onViewChange("diff")}
        activeOpacity={diffDisabled ? 1 : 0.8}
        disabled={diffDisabled}
      >
        <View style={styles.cardContent}>
          <DiffIcon
            size={16}
            color={
              isDiffActive
                ? macOSColors.semantic.success
                : diffDisabled
                ? macOSColors.text.muted
                : macOSColors.text.secondary
            }
          />
          <Text
            style={[
              styles.cardLabel,
              isDiffActive && styles.cardLabelActive,
              diffDisabled && styles.cardLabelDisabled,
            ]}
          >
            {diffLabel}
          </Text>
        </View>
        <Text
          style={[
            styles.cardDescription,
            isDiffActive && styles.cardDescriptionActive,
            diffDisabled && styles.cardDescriptionDisabled,
          ]}
        >
          {diffDescription}
        </Text>
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: macOSColors.background.base,
  },
  card: {
    flex: 1,
    backgroundColor: macOSColors.background.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    padding: 14,
    gap: 8,
  },
  cardActive: {
    borderWidth: 1.5,
    borderColor: macOSColors.semantic.info,
    backgroundColor: macOSColors.semantic.infoBackground + "30",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: macOSColors.text.secondary,
    textTransform: "uppercase",
  },
  cardLabelActive: {
    color: macOSColors.text.primary,
  },
  cardLabelDisabled: {
    color: macOSColors.text.muted,
  },
  cardDescription: {
    fontSize: 11,
    color: macOSColors.text.muted,
    lineHeight: 16,
  },
  cardDescriptionActive: {
    color: macOSColors.text.primary,
  },
  cardDescriptionDisabled: {
    color: macOSColors.text.muted,
  },
});
