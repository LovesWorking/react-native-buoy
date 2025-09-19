import { View, Text, StyleSheet, ViewStyle } from "react-native";
import type { DiffTheme } from "../themes/diffThemes";

interface DiffSummaryProps {
  added: number;
  removed: number;
  modified: number;
  theme: DiffTheme;
  style?: ViewStyle;
}

export function DiffSummary({
  added,
  removed,
  modified,
  theme,
  style,
}: DiffSummaryProps) {
  const hasChanges = added > 0 || removed > 0 || modified > 0;

  if (!hasChanges) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.summaryBackground,
          borderTopColor: theme.borderColor,
        },
        style,
      ]}
    >
      {added > 0 && (
        <View
          style={[styles.badge, { backgroundColor: theme.addedBackground }]}
        >
          <Text style={[styles.icon, { color: theme.summaryAddedText }]}>
            +
          </Text>
          <Text style={[styles.count, { color: theme.summaryAddedText }]}>
            {added}
          </Text>
          <Text style={[styles.label, { color: theme.summaryAddedText }]}>
            new
          </Text>
        </View>
      )}
      {removed > 0 && (
        <View
          style={[styles.badge, { backgroundColor: theme.removedBackground }]}
        >
          <Text style={[styles.icon, { color: theme.summaryRemovedText }]}>
            −
          </Text>
          <Text style={[styles.count, { color: theme.summaryRemovedText }]}>
            {removed}
          </Text>
          <Text style={[styles.label, { color: theme.summaryRemovedText }]}>
            gone
          </Text>
        </View>
      )}
      {modified > 0 && (
        <View
          style={[styles.badge, { backgroundColor: theme.modifiedBackground }]}
        >
          <Text style={[styles.icon, { color: theme.summaryModifiedText }]}>
            ≈
          </Text>
          <Text style={[styles.count, { color: theme.summaryModifiedText }]}>
            {modified}
          </Text>
          <Text style={[styles.label, { color: theme.summaryModifiedText }]}>
            modified
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  icon: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "700",
  },
  count: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  label: {
    fontSize: 9,
    fontFamily: "monospace",
    opacity: 0.9,
  },
});
