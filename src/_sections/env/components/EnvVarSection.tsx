import { useCallback, useState } from 'react';
import { View, Text, StyleSheet } from "react-native";
import { EnvVarInfo } from "../types";
import { EnvVarCard } from "./EnvVarCard";

interface EnvVarSectionProps {
  title: string;
  count: number;
  vars: EnvVarInfo[];
  emptyMessage: string;
}

export function EnvVarSection({
  title,
  count,
  vars,
  emptyMessage,
}: EnvVarSectionProps) {
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

  if (vars.length === 0 && title === "Required Variables") {
    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionCount}>0</Text>
        </View>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  if (vars.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      <View style={styles.sectionContent}>
        {vars.map((envVar) => (
          <EnvVarCard
            key={envVar.key}
            envVar={envVar}
            isExpanded={expandedCards.has(envVar.key)}
            onToggle={() => toggleCardExpansion(envVar.key)}
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 4,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  sectionCount: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionContent: {
    gap: 8,
  },
  emptySection: {
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
    alignItems: "center",
  },
  emptySectionText: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },
});
