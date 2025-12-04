/**
 * EventPickerModal
 *
 * Modal for selecting events in any-to-any compare mode.
 * Displays a scrollable list of events with timestamps, badges, and diff previews.
 * This is a dumb component - all state is controlled externally.
 */

import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { macOSColors } from "../../gameUI/constants/macOSDesignSystemColors";
import { X } from "../../../icons/lucide-icons";
import type { EventPickerModalProps } from "./types";

/**
 * EventPickerModal displays a modal for selecting events
 * with color-coded styling based on position (left/right).
 */
export const EventPickerModal = memo(function EventPickerModal({
  isOpen,
  onClose,
  title,
  position,
  items,
  onSelect,
}: EventPickerModalProps) {
  if (!isOpen) return null;

  const isLeft = position === "left";

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <View
        style={[
          styles.card,
          isLeft ? styles.cardLeft : styles.cardRight,
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text
            style={[
              styles.title,
              isLeft ? styles.titleLeft : styles.titleRight,
            ]}
          >
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Close event picker"
          >
            <X size={16} color={macOSColors.text.secondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Event List */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator
          nestedScrollEnabled
        >
          {items.map((item) => (
            <TouchableOpacity
              key={item.index}
              disabled={item.disabled}
              onPress={() => onSelect(item.index)}
              style={[
                styles.item,
                item.selected && styles.itemSelected,
                item.selected && isLeft && styles.itemSelectedLeft,
                item.selected && !isLeft && styles.itemSelectedRight,
                item.disabled && styles.itemDisabled,
              ]}
            >
              <Text style={styles.itemIndex}>{item.label}</Text>
              <Text style={styles.itemTime}>{item.timestamp}</Text>
              <Text style={styles.itemRelative}>({item.relativeTime})</Text>
              {item.badge}
              {item.diffPreview}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  card: {
    width: "86%",
    maxHeight: 320,
    backgroundColor: macOSColors.background.card,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 40,
    elevation: 15,
  },
  cardLeft: {
    borderColor: macOSColors.semantic.debug,
    shadowColor: macOSColors.semantic.debug,
  },
  cardRight: {
    borderColor: macOSColors.semantic.success,
    shadowColor: macOSColors.semantic.success,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "monospace",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.6,
  },
  titleLeft: {
    color: macOSColors.semantic.debug,
  },
  titleRight: {
    color: macOSColors.semantic.success,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  divider: {
    height: 1,
    backgroundColor: macOSColors.background.input,
    marginVertical: 8,
  },
  scroll: {
    maxHeight: 260,
  },
  list: {
    gap: 4,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: macOSColors.background.base,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  itemSelected: {
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  itemSelectedLeft: {
    backgroundColor: macOSColors.semantic.debug + "1A",
    borderColor: macOSColors.semantic.debug,
    shadowColor: macOSColors.semantic.debug,
  },
  itemSelectedRight: {
    backgroundColor: macOSColors.semantic.successBackground + "30",
    borderColor: macOSColors.semantic.success,
    shadowColor: macOSColors.semantic.success,
  },
  itemDisabled: {
    opacity: 0.4,
  },
  itemIndex: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    width: 40,
  },
  itemTime: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },
  itemRelative: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
});
