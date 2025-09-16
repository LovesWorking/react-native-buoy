import { View, Text, StyleSheet } from "react-native";
import { EnvVarInfo } from "../types";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";
import { CompactRow } from "@/rn-better-dev-tools/src/shared/ui/components/CompactRow";
import { TypeBadge } from "@/rn-better-dev-tools/src/shared/ui/components/TypeBadge";
import { getEnvVarType } from "../utils/envTypeDetector";

interface EnvVarRowProps {
  envVar: EnvVarInfo;
  isExpanded?: boolean;
  onPress?: (envVar: EnvVarInfo) => void;
}

const getStatusConfig = (status: EnvVarInfo["status"], expectedType?: string) => {
  switch (status) {
    case "required_present":
      return {
        label: "Valid",
        color: macOSColors.semantic.success,
        sublabel: "Required",
      };
    case "required_missing":
      return {
        label: "Missing",
        color: macOSColors.semantic.error,
        sublabel: "Required",
      };
    case "required_wrong_value":
      return {
        label: "Wrong",
        color: macOSColors.semantic.warning,
        sublabel: "Invalid value",
      };
    case "required_wrong_type":
      return {
        label: "Type Error",
        color: macOSColors.semantic.info,
        sublabel: "Wrong type", // Keep it short and consistent
      };
    case "optional_present":
      return {
        label: "Set",
        color: macOSColors.semantic.debug,
        sublabel: "Optional",
      };
  }
};

const formatEnvKey = (key: string): string => {
  // Format key similar to React Query: "section > subsection"
  return key.split("_").join(" › ");
};

const formatValue = (value: unknown): string => {
  if (value === undefined || value === null) {
    return "undefined";
  }
  const str = typeof value === "string" ? value : String(value);
  return str;
};

export function EnvVarRow({ envVar, isExpanded, onPress }: EnvVarRowProps) {
  const config = getStatusConfig(envVar.status, envVar.expectedType);
  const hasValue = envVar.value !== undefined && envVar.value !== null;
  
  // Format primary text like React Query does: "section › subsection"
  // For env vars, we'll show the key formatted nicely
  const keyParts = envVar.key.split("_");
  const primaryText = keyParts.map(part => part.toLowerCase()).join(" › ");
  
  // Create expanded content for value and expected value
  const expandedContent = (
    <View style={styles.expandedContainer}>
      <View style={styles.expandedRow}>
        <Text style={styles.expandedLabel}>Value:</Text>
        <Text style={styles.expandedValue} numberOfLines={3}>
          {formatValue(envVar.value) || "undefined"}
        </Text>
      </View>
      {envVar.status === "required_wrong_type" && envVar.expectedType && (
        <>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Type:</Text>
            <TypeBadge type={getEnvVarType(envVar.value)} />
          </View>
          <View style={styles.expandedRow}>
            <Text style={styles.expandedLabel}>Expected:</Text>
            <TypeBadge type={envVar.expectedType} />
          </View>
        </>
      )}
      {envVar.status === "required_wrong_value" && envVar.expectedValue && (
        <View style={styles.expandedRow}>
          <Text style={styles.expandedLabel}>Expected:</Text>
          <Text style={styles.expandedExpected}>
            {String(envVar.expectedValue)}
          </Text>
        </View>
      )}
      {envVar.description && (
        <View style={styles.expandedRow}>
          <Text style={styles.expandedLabel}>Info:</Text>
          <Text style={styles.expandedDescription}>
            {envVar.description}
          </Text>
        </View>
      )}
    </View>
  );
  
  return (
    <CompactRow
      statusDotColor={config.color}
      statusLabel={config.label}
      statusSublabel={config.sublabel}
      primaryText={primaryText}
      secondaryText={undefined} // Don't show value inline anymore
      expandedContent={expandedContent}
      isExpanded={isExpanded}
      expandedGlowColor={config.color}
      customBadge={envVar.expectedType ? <TypeBadge type={envVar.expectedType} /> : undefined}
      showChevron={true}
      onPress={onPress ? () => onPress(envVar) : undefined}
    />
  );
}

const styles = StyleSheet.create({
  expandedContainer: {
    gap: 6,
  },
  expandedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandedLabel: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontWeight: "600",
    minWidth: 60,
    fontFamily: "monospace",
  },
  expandedValue: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    flex: 1,
  },
  expandedExpected: {
    fontSize: 11,
    color: gameUIColors.warning,
    fontFamily: "monospace",
    flex: 1,
  },
  expandedDescription: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    flex: 1,
  },
});