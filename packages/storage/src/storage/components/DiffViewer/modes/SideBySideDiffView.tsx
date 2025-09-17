import { View, Text, ScrollView, StyleSheet } from "react-native";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";
import { DataViewer } from "../../../../react-query/components/shared/DataViewer";
import type { DiffItem } from "../../../utils/objectDiff";

interface SideBySideDiffViewProps {
  oldValue: unknown;
  newValue: unknown;
  differences: DiffItem[];
  debugMode?: boolean;
}

export function SideBySideDiffView({
  oldValue,
  newValue,
  differences,
  debugMode,
}: SideBySideDiffViewProps) {
  return (
    <View style={[styles.container, debugMode && styles.debugSideBySide]}>
      {debugMode && <Text style={styles.debugLabel}>SIDE-BY-SIDE MODE</Text>}

      <View style={styles.columnsContainer}>
        {/* Previous Value Column */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>PREV</Text>
            <View style={styles.removedBadge}>
              <Text style={styles.badgeText}>
                {differences.filter((d) => d.type === "REMOVE").length} removed
              </Text>
            </View>
          </View>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.dataContainer}>
              {oldValue !== null && oldValue !== undefined ? (
                <DataViewer
                  title=""
                  data={oldValue}
                  maxDepth={10}
                  rawMode={true}
                  showTypeFilter={false}
                  initialExpanded={true}
                />
              ) : (
                <Text style={styles.emptyState}>No previous value</Text>
              )}
            </View>
          </ScrollView>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Current Value Column */}
        <View style={styles.column}>
          <View style={styles.columnHeader}>
            <Text style={styles.columnTitle}>CUR</Text>
            <View style={styles.addedBadge}>
              <Text style={styles.badgeText}>
                {differences.filter((d) => d.type === "CREATE").length} added
              </Text>
            </View>
          </View>
          <ScrollView
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            <View style={styles.dataContainer}>
              {newValue !== null && newValue !== undefined ? (
                <DataViewer
                  title=""
                  data={newValue}
                  maxDepth={10}
                  rawMode={true}
                  showTypeFilter={false}
                  initialExpanded={true}
                />
              ) : (
                <Text style={styles.emptyState}>No current value</Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Change Summary */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryText}>
          {differences.filter((d) => d.type === "CHANGE").length} modified
        </Text>
        <Text style={styles.summaryText}>•</Text>
        <Text style={styles.summaryText}>
          {differences.filter((d) => d.type === "CREATE").length} added
        </Text>
        <Text style={styles.summaryText}>•</Text>
        <Text style={styles.summaryText}>
          {differences.filter((d) => d.type === "REMOVE").length} removed
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  debugSideBySide: {
    backgroundColor: "rgba(0, 255, 255, 0.1)",
    borderWidth: 2,
    borderColor: "cyan",
  },
  debugLabel: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "cyan",
    color: "black",
    fontSize: 10,
    padding: 2,
    zIndex: 999,
  },
  columnsContainer: {
    flexDirection: "row",
    backgroundColor: macOSColors.background.card + "30",
    borderRadius: 6,
    padding: 8,
    gap: 8,
  },
  column: {
    flex: 1,
  },
  columnHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  columnTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  removedBadge: {
    backgroundColor: macOSColors.semantic.error + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  addedBadge: {
    backgroundColor: macOSColors.semantic.success + "15",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
  scrollContainer: {
    maxHeight: 300,
  },
  dataContainer: {
    backgroundColor: macOSColors.background.base + "40",
    borderRadius: 4,
    padding: 8,
    minHeight: 100,
  },
  divider: {
    width: 1,
    backgroundColor: macOSColors.border.default + "30",
    marginVertical: 24,
  },
  emptyState: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: macOSColors.background.base + "20",
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 9,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    fontWeight: "600",
  },
});
