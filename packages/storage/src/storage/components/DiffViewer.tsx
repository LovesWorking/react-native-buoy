import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";
import {
  Plus,
  Minus,
  Edit3,
  GitBranch,
  ChevronRight,
} from "rn-better-dev-tools/icons";
import { objectDiff, type DiffItem } from "../utils/objectDiff";
import {
  formatValue,
  getTypeColor,
  formatPath,
} from "@/rn-better-dev-tools/src/shared/utils/valueFormatting";

interface DiffViewerProps {
  oldValue: unknown;
  newValue: unknown;
}

interface FlattenedDiff {
  path: string;
  type: "CREATE" | "REMOVE" | "CHANGE";
  oldValue?: unknown;
  newValue?: unknown;
}

export function DiffViewer({ oldValue, newValue }: DiffViewerProps) {
  // Parse values if they're strings
  const parseValue = (value: unknown): unknown => {
    if (value === null || value === undefined) return value;
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  };

  const flattened = useMemo(() => {
    const oldParsed = parseValue(oldValue);
    const newParsed = parseValue(newValue);

    // Only show diff for objects and arrays
    if (
      (!oldParsed || typeof oldParsed !== "object") &&
      (!newParsed || typeof newParsed !== "object")
    ) {
      return [];
    }

    // Calculate the differences
    let differences: DiffItem[] = [];
    try {
      differences = objectDiff(oldParsed || {}, newParsed || {});
    } catch (error) {
      console.warn("Failed to calculate diff:", error);
      return [];
    }

    // Convert to flattened format with readable paths
    const flatDiffs: FlattenedDiff[] = differences.map((diff) => {
      return {
        path: formatPath(diff.path),
        type: diff.type,
        oldValue: diff.oldValue,
        newValue: diff.value,
      };
    });

    // Sort by path for better readability
    return flatDiffs.sort((a, b) => a.path.localeCompare(b.path));
  }, [oldValue, newValue]);

  if (flattened.length === 0) {
    return null;
  }

  const getDiffIcon = (type: string) => {
    switch (type) {
      case "CREATE":
        return <Plus size={12} color={macOSColors.semantic.success} />;
      case "REMOVE":
        return <Minus size={12} color={macOSColors.semantic.error} />;
      case "CHANGE":
        return <Edit3 size={12} color={macOSColors.semantic.warning} />;
      default:
        return null;
    }
  };

  const getDiffColor = (type: string) => {
    switch (type) {
      case "CREATE":
        return macOSColors.semantic.success;
      case "REMOVE":
        return macOSColors.semantic.error;
      case "CHANGE":
        return macOSColors.semantic.warning;
      default:
        return macOSColors.text.muted;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <GitBranch size={14} color={macOSColors.semantic.info} />
          <Text style={styles.title}>CHANGES</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{flattened.length}</Text>
        </View>
      </View>

      {/* Diff List */}
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {flattened.map((diff, index) => (
          <View
            key={index}
            style={[
              styles.diffCard,
              { borderLeftColor: getDiffColor(diff.type) },
            ]}
          >
            {/* Card Header with Path and Badge */}
            <View style={styles.cardHeader}>
              <View style={styles.pathContainer}>
                {getDiffIcon(diff.type)}
                <Text style={styles.path} numberOfLines={1}>
                  {diff.path}
                </Text>
              </View>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: getDiffColor(diff.type) + "15" },
                ]}
              >
                <Text
                  style={[styles.typeText, { color: getDiffColor(diff.type) }]}
                >
                  {diff.type}
                </Text>
              </View>
            </View>

            {/* Values Section */}
            {diff.type === "CHANGE" && (
              <View style={styles.changeValuesContainer}>
                <View style={styles.changeValue}>
                  <Text style={styles.valueLabel}>OLD</Text>
                  <View style={styles.valueContent}>
                    <Text
                      style={[
                        styles.value,
                        { color: getTypeColor(diff.oldValue) },
                      ]}
                    >
                      {formatValue(diff.oldValue)}
                    </Text>
                  </View>
                </View>

                <View style={styles.arrowContainer}>
                  <ChevronRight size={16} color={macOSColors.semantic.warning} />
                </View>

                <View style={styles.changeValue}>
                  <Text style={styles.valueLabel}>NEW</Text>
                  <View style={styles.valueContent}>
                    <Text
                      style={[
                        styles.value,
                        { color: getTypeColor(diff.newValue) },
                      ]}
                    >
                      {formatValue(diff.newValue)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {diff.type === "CREATE" && (
              <View style={styles.singleValueContainer}>
                <View style={styles.singleValue}>
                  <Text
                    style={[styles.valueLabel, { color: macOSColors.semantic.success }]}
                  >
                    ADDED
                  </Text>
                  <View style={[styles.valueContent, styles.addedContent]}>
                    <Text
                      style={[
                        styles.value,
                        { color: getTypeColor(diff.newValue) },
                      ]}
                    >
                      {formatValue(diff.newValue)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {diff.type === "REMOVE" && (
              <View style={styles.singleValueContainer}>
                <View style={styles.singleValue}>
                  <Text
                    style={[styles.valueLabel, { color: macOSColors.semantic.error }]}
                  >
                    REMOVED
                  </Text>
                  <View style={[styles.valueContent, styles.removedContent]}>
                    <Text
                      style={[
                        styles.value,
                        { color: getTypeColor(diff.oldValue) },
                      ]}
                    >
                      {formatValue(diff.oldValue)}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    maxHeight: 400,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: "700",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  countBadge: {
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "40",
    minWidth: 28,
    alignItems: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
  },
  scrollContainer: {
    backgroundColor: "transparent",
  },
  diffCard: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: macOSColors.background.input,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },
  pathContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  path: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    fontWeight: "600",
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeText: {
    fontSize: 9,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  changeValuesContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  changeValue: {
    flex: 1,
  },
  arrowContainer: {
    opacity: 0.6,
  },
  valueLabel: {
    fontSize: 9,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  valueContent: {
    backgroundColor: macOSColors.background.input,
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  addedContent: {
    borderColor: macOSColors.semantic.success + "30",
    backgroundColor: macOSColors.semantic.successBackground,
  },
  removedContent: {
    borderColor: macOSColors.semantic.error + "30",
    backgroundColor: macOSColors.semantic.errorBackground,
  },
  value: {
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  singleValueContainer: {
    padding: 12,
  },
  singleValue: {
    width: "100%",
  },
});
