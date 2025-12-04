/**
 * CompareBar
 *
 * Displays PREV/CUR comparison metadata for diff view.
 * Shows event labels, timestamps, badges, and optional navigation controls.
 * This is a dumb component - all state is controlled externally.
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { macOSColors } from "../../gameUI/constants/macOSDesignSystemColors";
import { ChevronLeft, ChevronRight } from "../../../icons/lucide-icons";
import type { CompareBarProps } from "./types";

/**
 * CompareBar displays a side-by-side comparison of two events
 * with optional navigation controls for any-to-any compare mode.
 */
export const CompareBar = memo(function CompareBar({
  leftEvent,
  rightEvent,
  showNavigation = false,
  onLeftPrevious,
  onLeftNext,
  onRightPrevious,
  onRightNext,
  canLeftPrevious = false,
  canLeftNext = false,
  canRightPrevious = false,
  canRightNext = false,
  onLeftPress,
  onRightPress,
}: CompareBarProps) {
  return (
    <View style={styles.container}>
      {/* Left (PREV) side */}
      <View style={styles.side}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, styles.labelPrev]}>PREV</Text>
          {leftEvent.badge}
        </View>

        <View style={styles.controls}>
          {showNavigation && (
            <TouchableOpacity
              onPress={onLeftPrevious}
              disabled={!canLeftPrevious}
              style={[styles.navBtn, !canLeftPrevious && styles.navBtnDisabled]}
            >
              <ChevronLeft
                size={14}
                color={
                  canLeftPrevious
                    ? macOSColors.text.secondary
                    : macOSColors.text.muted
                }
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.meta}
            onPress={onLeftPress}
            disabled={!onLeftPress}
            activeOpacity={onLeftPress ? 0.8 : 1}
          >
            <Text style={styles.index}>{leftEvent.label}</Text>
            <Text style={styles.time}>{leftEvent.timestamp}</Text>
            <Text style={styles.relative}>({leftEvent.relativeTime})</Text>
          </TouchableOpacity>

          {showNavigation && (
            <TouchableOpacity
              onPress={onLeftNext}
              disabled={!canLeftNext}
              style={[styles.navBtn, !canLeftNext && styles.navBtnDisabled]}
            >
              <ChevronRight
                size={14}
                color={
                  canLeftNext
                    ? macOSColors.text.secondary
                    : macOSColors.text.muted
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.divider} />

      {/* Right (CUR) side */}
      <View style={styles.side}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, styles.labelCur]}>CUR</Text>
          {rightEvent.badge}
        </View>

        <View style={styles.controls}>
          {showNavigation && (
            <TouchableOpacity
              onPress={onRightPrevious}
              disabled={!canRightPrevious}
              style={[styles.navBtn, !canRightPrevious && styles.navBtnDisabled]}
            >
              <ChevronLeft
                size={14}
                color={
                  canRightPrevious
                    ? macOSColors.text.secondary
                    : macOSColors.text.muted
                }
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.meta}
            onPress={onRightPress}
            disabled={!onRightPress}
            activeOpacity={onRightPress ? 0.8 : 1}
          >
            <Text style={styles.index}>{rightEvent.label}</Text>
            <Text style={styles.time}>{rightEvent.timestamp}</Text>
            <Text style={styles.relative}>({rightEvent.relativeTime})</Text>
          </TouchableOpacity>

          {showNavigation && (
            <TouchableOpacity
              onPress={onRightNext}
              disabled={!canRightNext}
              style={[styles.navBtn, !canRightNext && styles.navBtnDisabled]}
            >
              <ChevronRight
                size={14}
                color={
                  canRightNext
                    ? macOSColors.text.secondary
                    : macOSColors.text.muted
                }
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 8,
  },
  side: {
    flex: 1,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  label: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  labelPrev: {
    color: macOSColors.semantic.debug,
  },
  labelCur: {
    color: macOSColors.semantic.success,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  navBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "center",
  },
  navBtnDisabled: {
    opacity: 0.4,
  },
  meta: {
    flex: 1,
  },
  index: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  time: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
  relative: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  divider: {
    width: 1,
    height: 34,
    backgroundColor: macOSColors.background.input,
  },
});
