import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StorageKeyInfo } from "../types";
import { StorageKeyCard } from "./StorageKeyCard";

interface StorageKeySectionProps {
  title: string;
  count: number;
  keys: StorageKeyInfo[];
  emptyMessage: string;
  headerColor?: string;
}

/**
 * Storage key section component following composition principles [[rule3]]
 *
 * Applied principles:
 * - Decompose by Responsibility: Single purpose component for grouped storage keys
 * - Prefer Composition over Configuration: Reuses patterns from EnvVarSection
 * - Extract Reusable Logic: Shares expansion state management pattern
 */
export function StorageKeySection({
  title,
  count,
  keys,
  emptyMessage,
  headerColor,
}: StorageKeySectionProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCardExpansion = useCallback((key: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  if (keys.length === 0 && title === "Required Keys") {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, headerColor && { color: headerColor }]}>{title}</Text>
          <Text style={[styles.sectionCount, headerColor && { color: headerColor, opacity: 0.8 }]}>0</Text>
        </View>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  if (keys.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, headerColor && { color: headerColor }]}>{title}</Text>
        <Text style={[styles.sectionCount, headerColor && { color: headerColor, opacity: 0.8 }]}>{count}</Text>
      </View>
      <View style={styles.sectionContent}>
        {keys.map((storageKey) => (
          <StorageKeyCard
            key={storageKey.key}
            storageKey={storageKey}
            isExpanded={expandedCards.has(storageKey.key)}
            onToggle={() => toggleCardExpansion(storageKey.key)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  sectionContent: {
    gap: 6,
  },
  emptySection: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  emptySectionText: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },
});
