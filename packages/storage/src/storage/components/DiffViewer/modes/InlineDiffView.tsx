import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";
import {
  Plus,
  Minus,
  Edit3,
  ChevronDown,
  ChevronRight,
} from "rn-better-dev-tools/icons";
import { DataViewer } from "../../../../react-query/components/shared/DataViewer";
import type { DiffItem } from "../../../utils/objectDiff";

interface InlineDiffViewProps {
  oldValue: unknown;
  newValue: unknown;
  differences: DiffItem[];
  debugMode?: boolean;
}

export function InlineDiffView({
  oldValue,
  newValue,
  differences,
  debugMode,
}: InlineDiffViewProps) {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const formatPath = (path: (string | number)[]): string => {
    if (path.length === 0) return "root";
    return path
      .map((segment, index) => {
        if (typeof segment === "number") {
          return `[${segment}]`;
        }
        return index === 0 ? segment : `.${segment}`;
      })
      .join("");
  };

  const getDiffIcon = (type: string) => {
    switch (type) {
      case "CREATE":
        return <Plus size={11} color={macOSColors.semantic.success} />;
      case "REMOVE":
        return <Minus size={11} color={macOSColors.semantic.error} />;
      case "CHANGE":
        return <Edit3 size={11} color={macOSColors.semantic.warning} />;
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

  // Group differences by parent path for inline display
  const groupedDiffs = differences.reduce(
    (acc, diff) => {
      const pathStr = formatPath(diff.path);
      acc[pathStr] = diff;
      return acc;
    },
    {} as Record<string, DiffItem>,
  );

  return (
    <View style={[styles.container, debugMode && styles.debugInline]}>
      {debugMode && <Text style={styles.debugLabel}>INLINE MODE</Text>}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Show full current data with inline change markers */}
        <View style={styles.currentDataSection}>
          <Text style={styles.sectionTitle}>Current State with Changes</Text>
          <View style={styles.dataContainer}>
            <DataViewer
              title=""
              data={newValue}
              maxDepth={10}
              rawMode={true}
              showTypeFilter={false}
              initialExpanded={true}
            />
          </View>
        </View>

        {/* List of changes */}
        <View style={styles.changesSection}>
          <Text style={styles.sectionTitle}>Change Details</Text>
          {Object.entries(groupedDiffs).map(([pathStr, diff]) => {
            const isExpanded = expandedPaths.has(pathStr);

            return (
              <View key={pathStr} style={styles.changeItem}>
                <TouchableOpacity
                  style={styles.changeHeader}
                  onPress={() => togglePath(pathStr)}
                  activeOpacity={0.7}
                >
                  <View style={styles.headerContent}>
                    {isExpanded ? (
                      <ChevronDown size={12} color={macOSColors.text.muted} />
                    ) : (
                      <ChevronRight size={12} color={macOSColors.text.muted} />
                    )}
                    {getDiffIcon(diff.type)}
                    <Text style={styles.path}>{pathStr}</Text>
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: getDiffColor(diff.type) + "15" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: getDiffColor(diff.type) },
                      ]}
                    >
                      {diff.type === "CREATE"
                        ? "NEW"
                        : diff.type === "REMOVE"
                          ? "DEL"
                          : "CHG"}
                    </Text>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {diff.type === "CHANGE" && (
                      <>
                        <Text style={styles.valueLabel}>PREV:</Text>
                        <View style={styles.valueContainer}>
                          {typeof diff.oldValue === "object" &&
                          diff.oldValue !== null ? (
                            <DataViewer
                              title=""
                              data={diff.oldValue}
                              maxDepth={5}
                              rawMode={true}
                              showTypeFilter={false}
                              initialExpanded={false}
                            />
                          ) : (
                            <Text style={styles.primitiveValue}>
                              {JSON.stringify(diff.oldValue)}
                            </Text>
                          )}
                        </View>
                        <Text style={[styles.valueLabel, { marginTop: 8 }]}>
                          CUR:
                        </Text>
                        <View style={styles.valueContainer}>
                          {typeof diff.value === "object" &&
                          diff.value !== null ? (
                            <DataViewer
                              title=""
                              data={diff.value}
                              maxDepth={5}
                              rawMode={true}
                              showTypeFilter={false}
                              initialExpanded={false}
                            />
                          ) : (
                            <Text style={styles.primitiveValue}>
                              {JSON.stringify(diff.value)}
                            </Text>
                          )}
                        </View>
                      </>
                    )}
                    {diff.type === "CREATE" && (
                      <>
                        <Text
                          style={[
                            styles.valueLabel,
                            { color: macOSColors.semantic.success },
                          ]}
                        >
                          ADDED:
                        </Text>
                        <View style={styles.valueContainer}>
                          {typeof diff.value === "object" &&
                          diff.value !== null ? (
                            <DataViewer
                              title=""
                              data={diff.value}
                              maxDepth={5}
                              rawMode={true}
                              showTypeFilter={false}
                              initialExpanded={false}
                            />
                          ) : (
                            <Text style={styles.primitiveValue}>
                              {JSON.stringify(diff.value)}
                            </Text>
                          )}
                        </View>
                      </>
                    )}
                    {diff.type === "REMOVE" && (
                      <>
                        <Text
                          style={[
                            styles.valueLabel,
                            { color: macOSColors.semantic.error },
                          ]}
                        >
                          REMOVED:
                        </Text>
                        <View style={styles.valueContainer}>
                          {typeof diff.oldValue === "object" &&
                          diff.oldValue !== null ? (
                            <DataViewer
                              title=""
                              data={diff.oldValue}
                              maxDepth={5}
                              rawMode={true}
                              showTypeFilter={false}
                              initialExpanded={false}
                            />
                          ) : (
                            <Text style={styles.primitiveValue}>
                              {JSON.stringify(diff.oldValue)}
                            </Text>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  debugInline: {
    backgroundColor: "rgba(255, 0, 255, 0.1)",
    borderWidth: 2,
    borderColor: "magenta",
  },
  debugLabel: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "magenta",
    color: "white",
    fontSize: 10,
    padding: 2,
    zIndex: 999,
  },
  scrollContainer: {
    backgroundColor: macOSColors.background.card + "30",
    borderRadius: 6,
    padding: 8,
  },
  currentDataSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default + "20",
  },
  changesSection: {
    gap: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  dataContainer: {
    backgroundColor: macOSColors.background.base + "40",
    borderRadius: 4,
    padding: 8,
  },
  changeItem: {
    marginBottom: 4,
  },
  changeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.background.base + "40",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  path: {
    fontSize: 11,
    color: macOSColors.text.primaryLight,
    fontFamily: "monospace",
    flex: 1,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  expandedContent: {
    marginTop: 4,
    marginLeft: 24,
    padding: 8,
    backgroundColor: macOSColors.background.base + "20",
    borderRadius: 4,
    borderLeftWidth: 2,
    borderLeftColor: macOSColors.border.default + "30",
  },
  valueLabel: {
    fontSize: 9,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    fontWeight: "700",
    marginBottom: 4,
  },
  valueContainer: {
    marginLeft: 4,
  },
  primitiveValue: {
    fontSize: 10,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },
});
