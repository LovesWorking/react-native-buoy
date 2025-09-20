import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { EnvVarInfo } from "../types";
import { EnvVarRow } from "./EnvVarRow";
import { SectionHeader } from "@react-buoy/shared-ui";

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
  const [expandedVar, setExpandedVar] = useState<string | null>(null);

  const handleVarPress = useCallback((envVar: EnvVarInfo) => {
    setExpandedVar(prev => prev === envVar.key ? null : envVar.key);
  }, []);

  if (vars.length === 0 && title === "Required Variables") {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader>
          <SectionHeader.Title>{title}</SectionHeader.Title>
          <SectionHeader.Badge count={0} color="#00FFFF" />
        </SectionHeader>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  if (vars.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {title !== "" && (
        <SectionHeader>
          <SectionHeader.Title>{title}</SectionHeader.Title>
          <SectionHeader.Badge count={count} color="#00FFFF" />
        </SectionHeader>
      )}
      <View style={styles.sectionContent}>
        {vars.map((envVar) => (
          <EnvVarRow
            key={envVar.key}
            envVar={envVar}
            isExpanded={expandedVar === envVar.key}
            onPress={handleVarPress}
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
  sectionContent: {
    // No gap needed, EnvVarRow has its own margins
  },
  emptySection: {
    padding: 20,
    backgroundColor: "rgba(0, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 255, 255, 0.1)",
    alignItems: "center",
  },
  emptySectionText: {
    color: "#00FFFF",
    fontSize: 11,
    textAlign: "center",
    fontFamily: "monospace",
    opacity: 0.6,
    letterSpacing: 0.5,
  },
});
