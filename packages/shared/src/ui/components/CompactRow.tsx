import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ReactNode } from "react";
import { ChevronDown, ChevronRight } from "../../icons";
import { gameUIColors } from "../gameUI";

export interface CompactRowProps {
  // Status section
  statusDotColor: string;
  statusLabel: string;
  statusSublabel?: string;

  // Content section
  primaryText: string;
  secondaryText?: string;
  expandedContent?: ReactNode;
  isExpanded?: boolean;

  // Badge section (right side) - can be text or custom component
  badgeText?: string | number;
  badgeColor?: string;
  customBadge?: ReactNode;
  showChevron?: boolean;
  bottomRightText?: string; // New: text positioned at bottom right of card

  // Interaction
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  expandedGlowColor?: string;
}

export function CompactRow({
  statusDotColor,
  statusLabel,
  statusSublabel,
  primaryText,
  secondaryText,
  expandedContent,
  isExpanded,
  badgeText,
  badgeColor,
  customBadge,
  showChevron,
  bottomRightText,
  isSelected,
  onPress,
  disabled,
  expandedGlowColor,
}: CompactRowProps) {
  return (
    <View style={styles.rowWrapper}>
      {/* Actual card content */}
      <TouchableOpacity
        style={[
          styles.row,
          isSelected && styles.selectedRow,
          isExpanded && [
            styles.expandedRowActive,
            {
              borderColor: expandedGlowColor || gameUIColors.info,
              shadowColor: expandedGlowColor || gameUIColors.info,
            },
          ],
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={disabled || !onPress}
      >
        <View style={styles.rowContent}>
          {/* Status Section */}
          <View style={styles.statusSection}>
            <View
              style={[styles.statusDot, { backgroundColor: statusDotColor }]}
            />
            <View style={styles.statusInfo}>
              <Text
                style={[styles.statusLabel, { color: statusDotColor }]}
                numberOfLines={1}
              >
                {statusLabel}
              </Text>
              {statusSublabel && (
                <Text style={styles.observerText} numberOfLines={1}>
                  {statusSublabel}
                </Text>
              )}
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.querySection}>
            <Text
              style={styles.queryHash}
              numberOfLines={isExpanded ? undefined : 2}
            >
              {primaryText}
            </Text>
            {!isExpanded && secondaryText && (
              <Text style={styles.secondaryText} numberOfLines={1}>
                {secondaryText}
              </Text>
            )}
          </View>

          {/* Badge and Chevron Section */}
          <View style={styles.rightSection}>
            {(customBadge || badgeText !== undefined) && (
              <View style={styles.badgeContainer}>
                {customBadge ? (
                  customBadge
                ) : (
                  <Text
                    style={[
                      styles.statusBadge,
                      { color: badgeColor || statusDotColor },
                    ]}
                  >
                    {badgeText}
                  </Text>
                )}
              </View>
            )}
            {showChevron && (
              <View style={styles.chevronContainer}>
                {isExpanded ? (
                  <ChevronDown size={14} color={gameUIColors.muted} />
                ) : (
                  <ChevronRight size={14} color={gameUIColors.muted} />
                )}
              </View>
            )}
          </View>
        </View>

        {/* Expanded Content */}
        {isExpanded && expandedContent && (
          <View style={styles.expandedContent}>{expandedContent}</View>
        )}

        {/* Bottom Right Text (timestamp) */}
        {!isExpanded && bottomRightText && (
          <View style={styles.bottomRightContainer}>
            <Text style={styles.bottomRightText}>{bottomRightText}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrapper: {
    position: "relative",
    marginHorizontal: 8,
    marginVertical: 3,
  },
  row: {
    backgroundColor: gameUIColors.panel,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.border + "40",
    padding: 12,
    transform: [{ scale: 1 }],
  },
  selectedRow: {
    backgroundColor: gameUIColors.info + "15",
    borderColor: gameUIColors.info + "50",
    transform: [{ scale: 1.01 }],
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  expandedRowActive: {
    transform: [{ scale: 1.02 }],
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: 90, // Fixed width instead of flex to ensure consistent alignment
    minWidth: 90,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusInfo: {
    flex: 1,
    maxWidth: 70, // Ensure status text doesn't overflow
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  observerText: {
    fontSize: 10,
    color: gameUIColors.muted,
    marginTop: 1,
  },
  querySection: {
    flex: 2,
    paddingHorizontal: 12,
  },
  queryHash: {
    fontFamily: "monospace",
    fontSize: 12,
    color: gameUIColors.primary,
    lineHeight: 16,
  },
  secondaryText: {
    fontSize: 10,
    color: gameUIColors.muted,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeContainer: {
    alignItems: "flex-end",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  chevronContainer: {
    padding: 2,
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: gameUIColors.border + "20",
    marginLeft: 24, // Align with content after status dot
  },
  bottomRightContainer: {
    position: "absolute",
    bottom: 4,
    right: 8,
  },
  bottomRightText: {
    fontSize: 9,
    color: gameUIColors.muted,
    fontFamily: "monospace",
  },
});
