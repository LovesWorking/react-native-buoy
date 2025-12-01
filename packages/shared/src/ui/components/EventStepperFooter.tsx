/**
 * EventStepperFooter
 *
 * A reusable footer component for stepping through events/items.
 * Used in storage event details, render history, and other event-based views.
 * This is a "dumb" component with no internal logic - all state is controlled externally.
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronLeft, ChevronRight } from "../../icons/lucide-icons";
import { macOSColors } from "../gameUI/constants/macOSDesignSystemColors";
import { useSafeAreaInsets } from "../../hooks/useSafeAreaInsets";

export interface EventStepperFooterProps {
  /** Current index (0-based) */
  currentIndex: number;
  /** Total number of items */
  totalItems: number;
  /** Callback when previous is pressed */
  onPrevious: () => void;
  /** Callback when next is pressed */
  onNext: () => void;
  /** Label for the item type (e.g., "Event", "Render") - defaults to "Event" */
  itemLabel?: string;
  /** Optional timestamp or subtitle text to show below the counter */
  subtitle?: string;
  /** Whether to use absolute positioning (for use inside ScrollView) */
  absolute?: boolean;
  /** Whether to apply safe area bottom inset */
  applySafeAreaInset?: boolean;
}

/**
 * A footer component for navigating through a list of events/items.
 * Shows Previous/Next buttons with a counter in the middle.
 */
export const EventStepperFooter = memo(function EventStepperFooter({
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  itemLabel = "Event",
  subtitle,
  absolute = false,
  applySafeAreaInset = true,
}: EventStepperFooterProps) {
  const insets = useSafeAreaInsets();

  // Don't render if there's only one or no items
  if (totalItems <= 1) return null;

  const isFirstItem = currentIndex === 0;
  const isLastItem = currentIndex === totalItems - 1;
  const bottomPadding = applySafeAreaInset ? 12 + insets.bottom : 12;

  return (
    <View
      style={[
        styles.footer,
        absolute && styles.footerAbsolute,
        { paddingBottom: bottomPadding },
      ]}
    >
      <TouchableOpacity
        onPress={onPrevious}
        disabled={isFirstItem}
        style={[styles.navButton, isFirstItem && styles.navButtonDisabled]}
        activeOpacity={0.7}
      >
        <ChevronLeft
          size={20}
          color={isFirstItem ? macOSColors.text.muted : macOSColors.text.primary}
        />
        <Text
          style={[
            styles.navButtonText,
            isFirstItem && styles.navButtonTextDisabled,
          ]}
        >
          Previous
        </Text>
      </TouchableOpacity>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>
          {itemLabel} {currentIndex + 1} of {totalItems}
        </Text>
        {subtitle && <Text style={styles.subtitleText}>{subtitle}</Text>}
      </View>

      <TouchableOpacity
        onPress={onNext}
        disabled={isLastItem}
        style={[styles.navButton, isLastItem && styles.navButtonDisabled]}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.navButtonText,
            isLastItem && styles.navButtonTextDisabled,
          ]}
        >
          Next
        </Text>
        <ChevronRight
          size={20}
          color={isLastItem ? macOSColors.text.muted : macOSColors.text.primary}
        />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: macOSColors.background.base,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  footerAbsolute: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    minWidth: 100,
    justifyContent: "center",
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  navButtonTextDisabled: {
    color: macOSColors.text.muted,
  },
  counterContainer: {
    alignItems: "center",
  },
  counterText: {
    fontSize: 14,
    fontWeight: "700",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  subtitleText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginTop: 2,
  },
});
