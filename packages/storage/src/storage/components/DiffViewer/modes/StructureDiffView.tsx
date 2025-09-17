import { View, Text, ScrollView, StyleSheet } from "react-native";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";
import {
  Plus,
  Minus,
  Edit3,
  Database,
  FileText,
  Hash,
  FileCode,
  CheckCircle,
  Box,
} from "rn-better-dev-tools/icons";
import type { DiffItem } from "../../../utils/objectDiff";

interface StructureDiffViewProps {
  oldValue: unknown;
  newValue: unknown;
  differences: DiffItem[];
  debugMode?: boolean;
}

interface StructureNode {
  path: string;
  type: "object" | "array" | "primitive";
  changeType?: "CREATE" | "REMOVE" | "CHANGE";
  oldType?: string;
  newType?: string;
  children: Map<string, StructureNode>;
}

export function StructureDiffView({
  oldValue,
  newValue,
  differences,
  debugMode,
}: StructureDiffViewProps) {
  // Build a tree structure from differences
  const buildStructureTree = (): StructureNode => {
    const root: StructureNode = {
      path: "root",
      type: "object",
      children: new Map(),
    };

    differences.forEach((diff) => {
      let current = root;

      diff.path.forEach((segment, index) => {
        const pathKey = String(segment);

        if (!current.children.has(pathKey)) {
          const isLast = index === diff.path.length - 1;
          const node: StructureNode = {
            path: pathKey,
            type: isLast
              ? getValueType(
                  diff.type === "REMOVE" ? diff.oldValue : diff.value,
                )
              : "object",
            children: new Map(),
          };

          if (isLast) {
            node.changeType = diff.type;
            if (diff.type === "CHANGE") {
              node.oldType = getValueType(diff.oldValue);
              node.newType = getValueType(diff.value);
            }
          }

          current.children.set(pathKey, node);
        }

        current = current.children.get(pathKey)!;
      });
    });

    return root;
  };

  const getValueType = (value: unknown): "object" | "array" | "primitive" => {
    if (value === null || value === undefined) return "primitive";
    if (Array.isArray(value)) return "array";
    if (typeof value === "object") return "object";
    return "primitive";
  };

  const getTypeIcon = (type: string, value?: unknown) => {
    switch (type) {
      case "object":
        return <Database size={11} color={gameUIColors.dataTypes.object} />;
      case "array":
        return <Box size={11} color={gameUIColors.dataTypes.array} />;
      case "primitive":
        if (value === null || value === undefined) {
          return <FileText size={11} color={gameUIColors.dataTypes.null} />;
        }
        const primitiveType = typeof value;
        if (primitiveType === "number") {
          return <Hash size={11} color={gameUIColors.dataTypes.number} />;
        }
        if (primitiveType === "string") {
          return <FileCode size={11} color={gameUIColors.dataTypes.string} />;
        }
        if (primitiveType === "boolean") {
          return (
            <CheckCircle size={11} color={gameUIColors.dataTypes.boolean} />
          );
        }
        return <FileText size={11} color={macOSColors.text.muted} />;
      default:
        return <FileText size={11} color={macOSColors.text.muted} />;
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "CREATE":
        return <Plus size={10} color={macOSColors.semantic.success} />;
      case "REMOVE":
        return <Minus size={10} color={macOSColors.semantic.error} />;
      case "CHANGE":
        return <Edit3 size={10} color={macOSColors.semantic.warning} />;
      default:
        return null;
    }
  };

  const renderNode = (
    node: StructureNode,
    depth: number = 0,
  ): ReactNode => {
    const indent = depth * 16;
    const hasChildren = node.children.size > 0;

    return (
      <>
        {node.path !== "root" && (
          <View style={[styles.nodeContainer, { paddingLeft: indent }]}>
            <View style={styles.nodeContent}>
              <View style={styles.nodeLeft}>
                {getTypeIcon(node.type)}
                <Text style={styles.nodeName}>{node.path}</Text>
                {node.changeType && getChangeIcon(node.changeType)}
              </View>

              {node.changeType === "CHANGE" &&
                node.oldType !== node.newType && (
                  <View style={styles.typeChange}>
                    <Text style={styles.typeChangeText}>
                      {node.oldType} → {node.newType}
                    </Text>
                  </View>
                )}

              {node.changeType && (
                <View
                  style={[
                    styles.changeBadge,
                    { backgroundColor: getChangeColor(node.changeType) + "15" },
                  ]}
                >
                  <Text
                    style={[
                      styles.changeBadgeText,
                      { color: getChangeColor(node.changeType) },
                    ]}
                  >
                    {node.changeType === "CREATE"
                      ? "NEW"
                      : node.changeType === "REMOVE"
                        ? "DEL"
                        : "MOD"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {hasChildren && (
          <View>
            {Array.from(node.children.entries()).map(([key, child]) => (
              <View key={key}>
                {renderNode(child, node.path === "root" ? depth : depth + 1)}
              </View>
            ))}
          </View>
        )}
      </>
    );
  };

  const getChangeColor = (type: string) => {
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

  const tree = buildStructureTree();

  // Count structural changes
  const structuralChanges = differences.filter((diff) => {
    const oldType = getValueType(diff.oldValue);
    const newType = getValueType(diff.value);
    return (
      diff.type === "CREATE" ||
      diff.type === "REMOVE" ||
      (diff.type === "CHANGE" && oldType !== newType)
    );
  });

  return (
    <View style={[styles.container, debugMode && styles.debugStructure]}>
      {debugMode && <Text style={styles.debugLabel}>STRUCTURE MODE</Text>}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Structure Changes</Text>
        <Text style={styles.headerSubtitle}>
          {structuralChanges.length} structural modification
          {structuralChanges.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <View style={styles.treeContainer}>{renderNode(tree)}</View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Database size={10} color={gameUIColors.dataTypes.object} />
          <Text style={styles.legendText}>Object</Text>
        </View>
        <View style={styles.legendItem}>
          <Box size={10} color={gameUIColors.dataTypes.array} />
          <Text style={styles.legendText}>Array</Text>
        </View>
        <View style={styles.legendItem}>
          <FileText size={10} color={macOSColors.text.muted} />
          <Text style={styles.legendText}>Value</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  debugStructure: {
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
  header: {
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: macOSColors.semantic.info,
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 9,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginTop: 2,
  },
  scrollContainer: {
    backgroundColor: macOSColors.background.card + "30",
    borderRadius: 6,
    padding: 8,
  },
  treeContainer: {
    gap: 2,
  },
  nodeContainer: {
    minHeight: 24,
    paddingVertical: 2,
  },
  nodeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: macOSColors.background.base + "40",
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  nodeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  nodeName: {
    fontSize: 10,
    fontFamily: "monospace",
    color: macOSColors.text.primaryLight,
    flex: 1,
  },
  typeChange: {
    backgroundColor: macOSColors.semantic.warning + "10",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginRight: 4,
  },
  typeChangeText: {
    fontSize: 8,
    fontFamily: "monospace",
    color: macOSColors.semantic.warning,
    fontWeight: "600",
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    minWidth: 30,
    alignItems: "center",
  },
  changeBadgeText: {
    fontSize: 8,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
    paddingVertical: 6,
    backgroundColor: macOSColors.background.base + "20",
    borderRadius: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendText: {
    fontSize: 9,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },
});
