// @ts-nocheck
/**
 * Tree Diff Viewer Component
 *
 * A React Native diff viewer that displays changes in a hierarchical tree structure
 * Shows added (+), removed (−), and changed (≈) items with visual indicators
 *
 * Usage:
 * <TreeDiffViewer
 *   oldValue={oldObject}
 *   newValue={newObject}
 *   theme="dark" // or "light"
 * />
 */

import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { gameUIColors } from "@monorepo/shared";

// ============================================
// TYPES & INTERFACES
// ============================================

type DiffType = "added" | "removed" | "changed" | "unchanged";

interface DiffNode {
  key: string;
  path: string[];
  type: DiffType;
  oldValue?: any;
  newValue?: any;
  children?: DiffNode[];
  expanded?: boolean;
}

interface Theme {
  background: string;
  text: string;
  addedBg: string;
  addedText: string;
  removedBg: string;
  removedText: string;
  changedBg: string;
  changedText: string;
  addedWordBg: string;
  removedWordBg: string;
  arrowText: string;
  keyText: string;
  expandIcon: string;
  bracketText: string;
  nullText: string;
  undefinedText: string;
  stringText: string;
  numberText: string;
  booleanText: string;
}

// ============================================
// THEMES
// ============================================

const darkTheme: Theme = {
  background: gameUIColors.diff.lineNumberBackground, // Exact from gameUIColors
  text: gameUIColors.diff.unchangedText, // Exact from gameUIColors
  // Line backgrounds - exact from gameUIColors
  addedBg: gameUIColors.diff.addedBackground,
  removedBg: gameUIColors.diff.removedBackground,
  changedBg: gameUIColors.diff.modifiedBackground,
  // Text colors - exact from gameUIColors
  addedText: gameUIColors.diff.addedText,
  removedText: gameUIColors.diff.removedText,
  changedText: gameUIColors.diff.modifiedText,
  // Word highlights - darker backgrounds for text
  addedWordBg: gameUIColors.diff.addedWordHighlight,
  removedWordBg: gameUIColors.diff.removedWordHighlight,
  // UI elements
  arrowText: gameUIColors.diff.modifiedText,
  keyText: gameUIColors.diff.modifiedText,
  expandIcon: gameUIColors.diff.lineNumberText,
  bracketText: gameUIColors.diff.unchangedText,
  nullText: gameUIColors.diff.modifiedText,
  undefinedText: gameUIColors.diff.modifiedText,
  stringText: gameUIColors.diff.unchangedText,
  numberText: gameUIColors.diff.unchangedText,
  booleanText: gameUIColors.diff.modifiedText,
};

const lightTheme: Theme = {
  background: "#ffffff",
  text: "#333333",
  addedBg: "rgba(40, 167, 69, 0.1)",
  addedText: "#28A745",
  removedBg: "rgba(220, 53, 69, 0.1)",
  removedText: "#DC3545",
  changedBg: "rgba(255, 193, 7, 0.1)",
  changedText: "#FFC107",
  arrowText: "#007BFF",
  keyText: "#0451A5",
  expandIcon: "#6A737D",
  bracketText: "#6A737D",
  nullText: "#0000FF",
  undefinedText: "#0000FF",
  stringText: "#A31515",
  numberText: "#098658",
  booleanText: "#0000FF",
};

// ============================================
// DIFF COMPUTATION
// ============================================

// Removed unused getType function

function isObject(obj: any): boolean {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

function isEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, idx) => isEqual(val, b[idx]));
    }
    if (isObject(a) && isObject(b)) {
      const aKeys = Object.keys(a);
      const bKeys = Object.keys(b);
      if (aKeys.length !== bKeys.length) return false;
      return aKeys.every((key) => isEqual(a[key], b[key]));
    }
  }

  return false;
}

function computeDiff(
  oldValue: any,
  newValue: any,
  path: string[] = []
): DiffNode[] {
  const result: DiffNode[] = [];

  // Handle primitives and null/undefined
  if (
    !isObject(oldValue) &&
    !isObject(newValue) &&
    !Array.isArray(oldValue) &&
    !Array.isArray(newValue)
  ) {
    if (!isEqual(oldValue, newValue)) {
      return [
        {
          key: path.length > 0 ? path[path.length - 1] : "root",
          path,
          type:
            oldValue === undefined
              ? "added"
              : newValue === undefined
              ? "removed"
              : "changed",
          oldValue,
          newValue,
        },
      ];
    }
    return [
      {
        key: path.length > 0 ? path[path.length - 1] : "root",
        path,
        type: "unchanged",
        oldValue,
        newValue,
      },
    ];
  }

  // Handle arrays
  if (Array.isArray(oldValue) || Array.isArray(newValue)) {
    const oldArray = Array.isArray(oldValue) ? oldValue : [];
    const newArray = Array.isArray(newValue) ? newValue : [];
    const maxLength = Math.max(oldArray.length, newArray.length);

    for (let i = 0; i < maxLength; i++) {
      const itemPath = [...path, `[${i}]`];
      const oldItem = i < oldArray.length ? oldArray[i] : undefined;
      const newItem = i < newArray.length ? newArray[i] : undefined;

      if (oldItem === undefined) {
        // Added array item: if complex, include children so it can expand
        const isComplex = Array.isArray(newItem) || isObject(newItem);
        result.push({
          key: `[${i}]`,
          path: itemPath,
          type: "added",
          newValue: newItem,
          ...(isComplex
            ? {
                children: computeDiff(
                  Array.isArray(newItem) ? [] : {},
                  newItem,
                  itemPath
                ),
                expanded: false,
              }
            : {}),
        });
      } else if (newItem === undefined) {
        // Removed array item: if complex, include children so it can expand
        const isComplex = Array.isArray(oldItem) || isObject(oldItem);
        result.push({
          key: `[${i}]`,
          path: itemPath,
          type: "removed",
          oldValue: oldItem,
          ...(isComplex
            ? {
                children: computeDiff(
                  oldItem,
                  Array.isArray(oldItem) ? [] : {},
                  itemPath
                ),
                expanded: false,
              }
            : {}),
        });
      } else if (!isEqual(oldItem, newItem)) {
        if (
          isObject(oldItem) ||
          isObject(newItem) ||
          Array.isArray(oldItem) ||
          Array.isArray(newItem)
        ) {
          result.push({
            key: `[${i}]`,
            path: itemPath,
            type: "changed",
            oldValue: oldItem,
            newValue: newItem,
            children: computeDiff(oldItem, newItem, itemPath),
            expanded: false,
          });
        } else {
          result.push({
            key: `[${i}]`,
            path: itemPath,
            type: "changed",
            oldValue: oldItem,
            newValue: newItem,
          });
        }
      } else {
        const isComplex = Array.isArray(oldItem) || isObject(oldItem);
        result.push({
          key: `[${i}]`,
          path: itemPath,
          type: "unchanged",
          oldValue: oldItem,
          newValue: newItem,
          ...(isComplex
            ? {
                children: computeDiff(oldItem, newItem, itemPath),
                expanded: false,
              }
            : {}),
        });
      }
    }

    return result;
  }

  // Handle objects
  const oldObj = isObject(oldValue) ? oldValue : {};
  const newObj = isObject(newValue) ? newValue : {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const keyPath = [...path, key];
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (!(key in oldObj)) {
      // Added key: if complex, include children so it can expand
      const isComplex = Array.isArray(newVal) || isObject(newVal);
      result.push({
        key,
        path: keyPath,
        type: "added",
        newValue: newVal,
        ...(isComplex
          ? {
              children: computeDiff(
                Array.isArray(newVal) ? [] : {},
                newVal,
                keyPath
              ),
              expanded: false,
            }
          : {}),
      });
    } else if (!(key in newObj)) {
      // Removed key: if complex, include children so it can expand
      const isComplex = Array.isArray(oldVal) || isObject(oldVal);
      result.push({
        key,
        path: keyPath,
        type: "removed",
        oldValue: oldVal,
        ...(isComplex
          ? {
              children: computeDiff(
                oldVal,
                Array.isArray(oldVal) ? [] : {},
                keyPath
              ),
              expanded: false,
            }
          : {}),
      });
    } else if (!isEqual(oldVal, newVal)) {
      if (
        isObject(oldVal) ||
        isObject(newVal) ||
        Array.isArray(oldVal) ||
        Array.isArray(newVal)
      ) {
        result.push({
          key,
          path: keyPath,
          type: "changed",
          oldValue: oldVal,
          newValue: newVal,
          children: computeDiff(oldVal, newVal, keyPath),
          expanded: false,
        });
      } else {
        result.push({
          key,
          path: keyPath,
          type: "changed",
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    } else {
      const isComplex = Array.isArray(oldVal) || isObject(oldVal);
      result.push({
        key,
        path: keyPath,
        type: "unchanged",
        oldValue: oldVal,
        newValue: newVal,
        ...(isComplex
          ? {
              children: computeDiff(oldVal, newVal, keyPath),
              expanded: false,
            }
          : {}),
      });
    }
  }

  return result;
}

// ============================================
// VALUE RENDERING
// ============================================

function stringifyValue(value: any, compact: boolean = true): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") {
    // Truncate long strings for better readability
    if (compact && value.length > 30) {
      return `"${value.substring(0, 27)}..."`;
    }
    return `"${value}"`;
  }
  if (typeof value === "number") {
    // Format large numbers with commas for readability
    return value.toLocaleString();
  }
  if (typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (compact) {
      const count = value.length;
      return count === 0 ? "[ ]" : `[ ${count} item${count !== 1 ? "s" : ""} ]`;
    }
    return JSON.stringify(value, null, 2);
  }

  if (isObject(value)) {
    if (compact) {
      const keys = Object.keys(value).length;
      return keys === 0 ? "{ }" : `{ ${keys} key${keys !== 1 ? "s" : ""} }`;
    }
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

// ============================================
// MAIN COMPONENT
// ============================================

interface TreeDiffViewerProps {
  oldValue: any;
  newValue: any;
  theme?: "dark" | "light";
  expandAll?: boolean;
  showUnchanged?: boolean;
}

export default function TreeDiffViewer({
  oldValue,
  newValue,
  theme: themeName = "dark",
  expandAll = false,
  showUnchanged = true,
}: TreeDiffViewerProps) {
  const theme = themeName === "dark" ? darkTheme : lightTheme;

  // Initialize with first-level items expanded
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    const initialExpanded = new Set<string>();
    // Auto-expand first level items
    const rootDiff = computeDiff(oldValue, newValue);
    rootDiff.forEach((node) => {
      if (node.children && node.children.length > 0) {
        initialExpanded.add(node.path.join("."));
      }
    });
    return initialExpanded;
  });

  const diffTree = useMemo(() => {
    const rootDiff = computeDiff(oldValue, newValue);
    return rootDiff;
  }, [oldValue, newValue]);

  // Auto-expand all first-level nodes whenever the compared values change
  useEffect(() => {
    const initial = new Set<string>();
    diffTree.forEach((node) => {
      if (node.children && node.children.length > 0) {
        initial.add(node.path.join("."));
      }
    });
    setExpandedPaths(initial);
  }, [diffTree]);

  const toggleExpanded = (path: string[]) => {
    const pathStr = path.join(".");
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(pathStr)) {
        next.delete(pathStr);
      } else {
        next.add(pathStr);
      }
      return next;
    });
  };

  // Track line numbers globally for the entire tree
  let globalLineNumber = 0;

  const renderDiffNode = (
    node: DiffNode,
    depth: number = 0
  ): React.ReactNode => {
    if (!showUnchanged && node.type === "unchanged") {
      return null;
    }

    globalLineNumber++;
    const currentLine = globalLineNumber;
    const indent = depth * 20;
    const isExpanded = expandAll || expandedPaths.has(node.path.join("."));
    const hasChildren = node.children && node.children.length > 0;

    // Row background matches DEFAULT viewer behavior
    const getNodeStyle = () => {
      switch (node.type) {
        case "added":
          return { backgroundColor: theme.addedBg };
        case "removed":
          return { backgroundColor: theme.removedBg };
        case "changed":
          return { backgroundColor: theme.changedBg };
        default:
          return { backgroundColor: "transparent" };
      }
    };

    // Removed unused getTextColor function

    // Get the marker (+, -, ~) for the diff type
    const getMarker = () => {
      switch (node.type) {
        case "added":
          return "+";
        case "removed":
          return "−"; // Use proper minus sign
        case "changed":
          return "≈"; // Use proper approximation sign
        default:
          return " ";
      }
    };

    // Get marker colors
    const getMarkerStyle = () => {
      switch (node.type) {
        case "added":
          return {
            backgroundColor: gameUIColors.diff.markerAddedBackground,
            color: gameUIColors.diff.addedText,
          };
        case "removed":
          return {
            backgroundColor: gameUIColors.diff.markerRemovedBackground,
            color: gameUIColors.diff.removedText,
          };
        case "changed":
          return {
            backgroundColor: gameUIColors.diff.markerModifiedBackground,
            color: gameUIColors.diff.modifiedText,
          };
        default:
          return {
            backgroundColor: "transparent",
            color: gameUIColors.diff.markerText,
          };
      }
    };

    return (
      <View key={node.path.join(".")}>
        <TouchableOpacity
          activeOpacity={hasChildren ? 0.7 : 1}
          onPress={hasChildren ? () => toggleExpanded(node.path) : undefined}
          style={[styles.row, getNodeStyle()]}
        >
          <View style={styles.lineNumber}>
            <Text
              style={[
                styles.lineNumberText,
                { color: gameUIColors.diff.lineNumberText },
              ]}
            >
              {String(currentLine).padStart(2, " ")}
            </Text>
          </View>
          <View style={[styles.marker, getMarkerStyle()]}>
            <Text
              style={[styles.markerText, { color: getMarkerStyle().color }]}
            >
              {getMarker()}
            </Text>
          </View>
          <View style={[styles.content, { paddingLeft: indent }]}>
            {hasChildren && (
              <View style={styles.expandIconContainer}>
                <Text style={[styles.expandIcon, { color: theme.expandIcon }]}>
                  {isExpanded ? "−" : "+"}
                </Text>
              </View>
            )}

            <Text style={[styles.key, { color: theme.keyText }]}>
              {node.key}
            </Text>
            <Text style={[styles.colon, { color: theme.expandIcon }]}>:</Text>

            {node.type === "changed" && !hasChildren && (
              <>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.removedText,
                      backgroundColor: theme.removedWordBg, // Use word highlight for stronger effect
                      paddingHorizontal: 3,
                      paddingVertical: 2,
                      borderRadius: 3,
                      textDecorationLine: "line-through",
                      textDecorationColor: theme.removedText,
                    },
                  ]}
                >
                  {stringifyValue(node.oldValue)}
                </Text>
                <Text
                  style={[
                    styles.arrow,
                    { color: theme.arrowText, paddingHorizontal: 4 },
                  ]}
                >
                  {" => "}
                </Text>
                <Text
                  style={[
                    styles.value,
                    {
                      color: theme.addedText,
                      backgroundColor: theme.addedWordBg, // Use word highlight for stronger effect
                      paddingHorizontal: 3,
                      paddingVertical: 2,
                      borderRadius: 3,
                    },
                  ]}
                >
                  {stringifyValue(node.newValue)}
                </Text>
              </>
            )}

            {node.type === "added" && !hasChildren && (
              <Text
                style={[
                  styles.value,
                  {
                    color: theme.addedText,
                    backgroundColor: theme.addedWordBg, // Use word highlight for stronger effect
                    paddingHorizontal: 3,
                    paddingVertical: 2,
                    borderRadius: 3,
                  },
                ]}
              >
                {stringifyValue(node.newValue)}
              </Text>
            )}

            {node.type === "removed" && !hasChildren && (
              <Text
                style={[
                  styles.value,
                  {
                    color: theme.removedText,
                    backgroundColor: theme.removedWordBg, // Use word highlight for stronger effect
                    paddingHorizontal: 3,
                    paddingVertical: 2,
                    borderRadius: 3,
                    textDecorationLine: "line-through",
                    textDecorationColor: theme.removedText,
                  },
                ]}
              >
                {stringifyValue(node.oldValue)}
              </Text>
            )}

            {node.type === "unchanged" && !hasChildren && (
              <Text style={[styles.value, { color: theme.text }]}>
                {stringifyValue(node.oldValue)}
              </Text>
            )}

            {hasChildren && !isExpanded && (
              <>
                {node.type === "changed" && (
                  <>
                    <Text
                      style={[
                        styles.value,
                        {
                          color: theme.removedText,
                          backgroundColor: theme.removedWordBg, // Use word highlight for stronger effect
                          paddingHorizontal: 3,
                          paddingVertical: 2,
                          borderRadius: 3,
                          textDecorationLine: "line-through",
                          textDecorationColor: theme.removedText,
                        },
                      ]}
                    >
                      {stringifyValue(node.oldValue, true)}
                    </Text>
                    <Text
                      style={[
                        styles.arrow,
                        { color: theme.arrowText, paddingHorizontal: 4 },
                      ]}
                    >
                      {" => "}
                    </Text>
                    <Text
                      style={[
                        styles.value,
                        {
                          color: theme.addedText,
                          backgroundColor: theme.addedWordBg, // Use word highlight for stronger effect
                          paddingHorizontal: 3,
                          paddingVertical: 2,
                          borderRadius: 3,
                        },
                      ]}
                    >
                      {stringifyValue(node.newValue, true)}
                    </Text>
                  </>
                )}
                {node.type === "added" && (
                  <Text
                    style={[
                      styles.value,
                      {
                        color: theme.addedText,
                        backgroundColor: theme.addedWordBg, // Use word highlight for stronger effect
                        paddingHorizontal: 3,
                        paddingVertical: 2,
                        borderRadius: 3,
                      },
                    ]}
                  >
                    {stringifyValue(node.newValue, true)}
                  </Text>
                )}
                {node.type === "removed" && (
                  <Text
                    style={[
                      styles.value,
                      {
                        color: theme.removedText,
                        backgroundColor: theme.removedWordBg, // Use word highlight for stronger effect
                        paddingHorizontal: 3,
                        paddingVertical: 2,
                        borderRadius: 3,
                        textDecorationLine: "line-through",
                        textDecorationColor: theme.removedText,
                      },
                    ]}
                  >
                    {stringifyValue(node.oldValue, true)}
                  </Text>
                )}
              </>
            )}

            {/* Removed badges as they're redundant with background highlighting */}
          </View>
        </TouchableOpacity>

        {hasChildren && isExpanded && (
          <View>
            {node.children.map((child) => renderDiffNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const countChanges = (
    nodes: DiffNode[]
  ): { added: number; removed: number; changed: number } => {
    let added = 0,
      removed = 0,
      changed = 0;

    const count = (nodeList: DiffNode[]) => {
      for (const node of nodeList) {
        if (node.type === "added") added++;
        else if (node.type === "removed") removed++;
        else if (node.type === "changed") changed++;

        if (node.children) {
          count(node.children);
        }
      }
    };

    count(nodes);
    return { added, removed, changed };
  };

  const stats = useMemo(() => countChanges(diffTree), [diffTree]);

  // Show header only if there are changes
  const hasChanges = stats.added > 0 || stats.removed > 0 || stats.changed > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {hasChanges && (
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View style={styles.summaryContainer}>
            {stats.added > 0 && (
              <View style={[styles.summaryItem, styles.summaryAdded]}>
                <Text style={[styles.summaryIcon, { color: theme.addedText }]}>
                  +
                </Text>
                <Text style={[styles.summaryCount, { color: theme.addedText }]}>
                  {stats.added}
                </Text>
                <Text style={[styles.summaryLabel, { color: theme.addedText }]}>
                  new
                </Text>
              </View>
            )}
            {stats.removed > 0 && (
              <View style={[styles.summaryItem, styles.summaryRemoved]}>
                <Text
                  style={[styles.summaryIcon, { color: theme.removedText }]}
                >
                  −
                </Text>
                <Text
                  style={[styles.summaryCount, { color: theme.removedText }]}
                >
                  {stats.removed}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: theme.removedText }]}
                >
                  gone
                </Text>
              </View>
            )}
            {stats.changed > 0 && (
              <View style={[styles.summaryItem, styles.summaryChanged]}>
                <Text
                  style={[styles.summaryIcon, { color: theme.changedText }]}
                >
                  ≈
                </Text>
                <Text
                  style={[styles.summaryCount, { color: theme.changedText }]}
                >
                  {stats.changed}
                </Text>
                <Text
                  style={[styles.summaryLabel, { color: theme.changedText }]}
                >
                  modified
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {diffTree.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyIcon, { color: theme.text }]}>≡</Text>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              No changes detected
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.expandIcon }]}>
              The data is identical
            </Text>
          </View>
        ) : (
          <View>
            {(() => {
              globalLineNumber = 0; // Reset counter before rendering
              return diffTree.map((node) => renderDiffNode(node, 0));
            })()}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: gameUIColors.diff.lineNumberBorder,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryAdded: {
    backgroundColor: gameUIColors.diff.addedBackground,
  },
  summaryRemoved: {
    backgroundColor: gameUIColors.diff.removedBackground,
  },
  summaryChanged: {
    backgroundColor: gameUIColors.diff.modifiedBackground,
  },
  summaryIcon: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  summaryCount: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: "monospace",
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  row: {
    minHeight: 26,
    justifyContent: "center",
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.02)",
  },
  lineNumber: {
    width: 32,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: gameUIColors.diff.lineNumberBackground,
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: gameUIColors.diff.lineNumberBorder,
  },
  lineNumberText: {
    fontSize: 11,
    fontFamily: "monospace",
    textAlign: "right",
  },
  marker: {
    width: 20,
    paddingHorizontal: 2,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  markerText: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  expandIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 3,
    backgroundColor: gameUIColors.diff.lineNumberBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  expandIcon: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  colon: {
    fontSize: 12,
    fontFamily: "monospace",
    marginHorizontal: 4,
  },
  key: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "500",
    opacity: 0.9,
  },
  value: {
    fontSize: 11,
    fontFamily: "monospace",
    maxWidth: "80%",
  },
  arrow: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  badge: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    fontFamily: "monospace",
    opacity: 0.2,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "600",
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: "monospace",
    opacity: 0.6,
  },
});
