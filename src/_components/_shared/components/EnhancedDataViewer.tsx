import React, { useState, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { ChevronRight, ChevronDown, Copy } from "lucide-react-native";
import { TypeLegend } from "./TypeLegend";
import { useCopy } from "../../context/CopyContext";
import { displayValue } from "../../devtools/displayValue";

interface EnhancedDataViewerProps {
  title: string;
  data: unknown;
  showTypeFilter?: boolean;
  defaultExpanded?: boolean;
}

// Type color mapping - same as VirtualizedDataExplorer
const getTypeColor = (type: string): string => {
  const colors: { [key: string]: string } = {
    string: "#22D3EE", // Cyan
    number: "#3B82F6", // Blue
    bigint: "#8B5CF6", // Purple
    boolean: "#F59E0B", // Orange
    null: "#6B7280", // Gray
    undefined: "#9CA3AF", // Light gray
    function: "#A855F7", // Magenta
    symbol: "#D946EF", // Hot pink
    date: "#EC4899", // Pink
    error: "#EF4444", // Red
    array: "#10B981", // Green
    object: "#F97316", // Orange-red
  };
  return colors[type] || "#9CA3AF";
};

// Get the type of a value
const getValueType = (value: unknown): string => {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (value instanceof Date) return "date";
  if (value instanceof Error) return "error";
  return typeof value;
};

/**
 * Enhanced DataViewer combining best features of Explorer and VirtualizedDataExplorer
 *
 * Features from Explorer:
 * - Clean, readable layout with good spacing
 * - Copy buttons for individual values
 * - Clear key/value display
 *
 * Features from VirtualizedDataExplorer:
 * - Type filtering with colored badges
 * - Type colors and indicators
 * - Compact but informative display
 *
 * Improvements:
 * - Removed "Clear Filter" and "X values found" for more space
 * - Better spacing when expanded
 * - Simplified filtering UX
 */
export const EnhancedDataViewer: React.FC<EnhancedDataViewerProps> = ({
  title,
  data,
  showTypeFilter = true,
  defaultExpanded = false,
}) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const { onCopy } = useCopy();

  // Calculate visible types in the data
  const visibleTypes = useMemo(() => {
    if (!data || !showTypeFilter) return [];

    const types: string[] = [];
    const processValue = (value: any, depth = 0) => {
      if (depth > 3) return; // Limit depth for performance

      const type = getValueType(value);
      types.push(type);

      if (type === "object" && value !== null) {
        Object.values(value)
          .slice(0, 10)
          .forEach((v) => processValue(v, depth + 1));
      } else if (type === "array") {
        value.slice(0, 10).forEach((v: any) => processValue(v, depth + 1));
      }
    };

    processValue(data);
    return Array.from(new Set(types)).slice(0, 8); // Unique types, limit to 8
  }, [data, showTypeFilter]);

  // Toggle expansion
  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  }, []);

  // Handle copy
  const handleCopy = useCallback(
    async (value: any) => {
      if (!onCopy) {
        Alert.alert("Copy", "Copy functionality not configured");
        return;
      }

      try {
        const success = await onCopy(value);
        if (success) {
          // Could add visual feedback here
        }
      } catch (error) {
        console.error("Copy failed:", error);
      }
    },
    [onCopy]
  );

  // Render a data node
  const renderNode = (
    key: string,
    value: any,
    path: string,
    depth: number = 0
  ): React.ReactNode => {
    const type = getValueType(value);
    const color = getTypeColor(type);

    // Filter by type if active
    if (activeFilter && type !== activeFilter) {
      return null;
    }

    const isExpandable =
      (type === "object" && value !== null) || type === "array";
    const isExpanded = expandedPaths.has(path);
    const itemCount =
      type === "array"
        ? value.length
        : type === "object"
        ? Object.keys(value).length
        : 0;

    return (
      <View
        key={path}
        style={[styles.nodeContainer, { marginLeft: depth * 16 }]}
      >
        <View style={styles.nodeHeader}>
          <TouchableOpacity
            style={styles.nodeInfo}
            onPress={isExpandable ? () => toggleExpanded(path) : undefined}
            disabled={!isExpandable}
          >
            {isExpandable && (
              <View style={styles.chevronContainer}>
                {isExpanded ? (
                  <ChevronDown size={14} color="#9CA3AF" />
                ) : (
                  <ChevronRight size={14} color="#9CA3AF" />
                )}
              </View>
            )}

            <Text style={styles.nodeKey}>{key}</Text>

            <View style={[styles.typeBadge, { backgroundColor: `${color}15` }]}>
              <Text style={[styles.typeText, { color }]}>{type}</Text>
            </View>

            {itemCount > 0 && (
              <Text style={styles.itemCount}>({itemCount})</Text>
            )}

            {!isExpandable && (
              <Text style={styles.nodeValue} numberOfLines={1}>
                {displayValue(value, false)}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopy(value)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Copy size={14} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {isExpanded && isExpandable && (
          <View style={styles.childrenContainer}>
            {type === "array"
              ? value.map((item: any, index: number) =>
                  renderNode(String(index), item, `${path}.${index}`, depth + 1)
                )
              : Object.entries(value).map(([childKey, childValue]) =>
                  renderNode(
                    childKey,
                    childValue,
                    `${path}.${childKey}`,
                    depth + 1
                  )
                )}
          </View>
        )}
      </View>
    );
  };

  // Initialize with root expanded if defaultExpanded
  useEffect(() => {
    if (defaultExpanded) {
      setExpandedPaths(new Set(["root"]));
    }
  }, [defaultExpanded]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity
          style={styles.copyAllButton}
          onPress={() => handleCopy(data)}
        >
          <Copy size={16} color="#8B5CF6" />
          <Text style={styles.copyAllText}>Copy All</Text>
        </TouchableOpacity>
      </View>

      {showTypeFilter && visibleTypes.length > 0 && (
        <TypeLegend
          types={visibleTypes}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      )}

      <View style={styles.content}>{renderNode(title, data, "root", 0)}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  copyAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 6,
  },
  copyAllText: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "500",
  },
  content: {
    padding: 12,
  },
  nodeContainer: {
    marginVertical: 2,
  },
  nodeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 28,
  },
  nodeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingVertical: 4,
  },
  chevronContainer: {
    width: 20,
    alignItems: "center",
  },
  nodeKey: {
    color: "#F3F4F6",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "monospace",
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  itemCount: {
    color: "#6B7280",
    fontSize: 11,
    marginRight: 8,
  },
  nodeValue: {
    color: "#D1D5DB",
    fontSize: 11,
    flex: 1,
    fontFamily: "monospace",
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  childrenContainer: {
    marginTop: 4,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255, 255, 255, 0.05)",
  },
});
