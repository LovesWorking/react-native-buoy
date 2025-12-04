/**
 * DiffModeTabs
 *
 * Tab bar for switching between diff visualization modes.
 * Examples: "SPLIT VIEW" / "TREE VIEW" or "CAUSE" / "PROPS" / "STATE"
 * This is a dumb component - all state is controlled externally.
 */

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { macOSColors } from "../../gameUI/constants/macOSDesignSystemColors";
import type { DiffModeTabsProps } from "./types";

/**
 * DiffModeTabs displays a horizontal tab bar for switching
 * between different diff visualization modes.
 */
export const DiffModeTabs = memo(function DiffModeTabs({
  tabs,
  activeTab,
  onTabChange,
}: DiffModeTabsProps) {
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const isDisabled = tab.disabled === true;

        return (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              isActive && styles.tabActive,
              isDisabled && styles.tabDisabled,
            ]}
            onPress={() => !isDisabled && onTabChange(tab.key)}
            activeOpacity={isDisabled ? 1 : 0.7}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.tabText,
                isActive && styles.tabTextActive,
                isDisabled && styles.tabTextDisabled,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 8,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignItems: "center",
    backgroundColor: "transparent",
  },
  tabActive: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "40",
  },
  tabDisabled: {
    opacity: 0.4,
  },
  tabText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
    color: macOSColors.text.secondary,
    letterSpacing: 0.5,
  },
  tabTextActive: {
    color: macOSColors.text.primary,
  },
  tabTextDisabled: {
    color: macOSColors.text.muted,
  },
});
