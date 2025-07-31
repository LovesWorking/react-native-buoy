import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  InteractionManager,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { Copy } from "lucide-react-native";
import { FlashList } from "@shopify/flash-list";
import { useCopy } from "../../context/CopyContext";
import { displayValue } from "../devtools/displayValue";

// Stable constants to prevent re-renders [[memory:4875251]]
const STABLE_EMPTY_ARRAY: any[] = [];
const HIT_SLOP_10 = { top: 10, bottom: 10, left: 10, right: 10 };
const ITEM_HEIGHT = 32; // Fixed height for better performance
const CHUNK_SIZE = 50; // Process data in chunks to avoid blocking UI
const MAX_DEPTH_LIMIT = 15; // Prevent excessive nesting
const MAX_ITEMS_PER_LEVEL = 500; // Limit items to prevent memory issues

// Pre-computed indent styles to avoid inline calculations [[memory:4875251]]
const INDENT_STYLES = Array.from(
  { length: MAX_DEPTH_LIMIT + 1 },
  (_, depth) =>
    StyleSheet.create({
      container: { paddingLeft: 12 + depth * 16 },
    }).container
);

// Stable type color cache to avoid repeated lookups [[memory:4875251]]
const TYPE_COLOR_CACHE = new Map([
  ["string", "#22D3EE"],
  ["number", "#3B82F6"],
  ["bigint", "#3B82F6"],
  ["boolean", "#F59E0B"],
  ["null", "#9CA3AF"],
  ["undefined", "#9CA3AF"],
  ["function", "#A855F7"],
  ["symbol", "#A855F7"],
  ["date", "#EC4899"],
  ["error", "#EF4444"],
  ["array", "#10B981"],
  ["object", "#10B981"],
  ["map", "#10B981"],
  ["set", "#10B981"],
]);

// Stable type icon cache [[memory:4875251]]
const TYPE_ICON_CACHE = new Map([
  ["string", "Aa"],
  ["number", "123"],
  ["boolean", "bool"],
  ["null", "null"],
  ["undefined", "?"],
  ["function", "f()"],
  ["array", "[]"],
  ["object", "{}"],
  ["map", "Map"],
  ["set", "Set"],
]);

// Pre-computed stable styles
const STABLE_STYLES = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    minHeight: 200, // Ensure minimum height for proper rendering
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  title: {
    color: "#9CA3AF",
    fontSize: 14,
    fontWeight: "600",
  },
  itemContainer: {
    height: ITEM_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.02)",
  },
  expanderContainer: {
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  expanderIcon: {
    width: 12,
    height: 12,
  },
  labelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 4,
  },
  labelText: {
    color: "#F9FAFB",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  valueText: {
    fontSize: 12,
    fontFamily: "monospace",
    paddingHorizontal: 4,
  },
  typeIndicator: {
    fontSize: 10,
    fontFamily: "monospace",
    opacity: 0.7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 0.5,
    marginHorizontal: 4,
    minWidth: 20,
    textAlign: "center",
  },
  copyButton: {
    padding: 4,
    borderRadius: 4,
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontStyle: "italic",
  },
  noDataContainer: {
    padding: 16,
    alignItems: "center",
  },
  noDataText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontStyle: "italic",
  },
  listContent: {
    paddingVertical: 0,
  },
  headerTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  expanderMargin: {
    marginLeft: 8,
  },
});

// Type definitions for flattened data structure
interface FlatDataItem {
  id: string;
  key: string;
  value: any;
  valueType: string;
  depth: number;
  isExpandable: boolean;
  isExpanded: boolean;
  parentId?: string;
  hasChildren: boolean;
  childCount: number;
  path: string[];
  type: string; // For FlashList getItemType optimization
}

type CopyState = "NoCopy" | "SuccessCopy" | "ErrorCopy";

// Enhanced type detection optimized for performance
const getValueType = (value: any): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  if (value instanceof Error) return "error";
  if (value instanceof Map) return "map";
  if (value instanceof Set) return "set";
  if (value instanceof RegExp) return "regexp";
  if (typeof value === "function") return "function";
  if (typeof value === "symbol") return "symbol";
  if (typeof value === "bigint") return "bigint";
  if (typeof value === "object") return "object";
  return typeof value;
};

// Get value count for collections
const getValueCount = (value: any, valueType: string): number => {
  switch (valueType) {
    case "array":
      return value.length;
    case "object":
      return Object.keys(value).length;
    case "map":
    case "set":
      return value.size;
    default:
      return 0;
  }
};

// Format value for display
const formatValue = (value: any, valueType: string): string => {
  switch (valueType) {
    case "string":
      return `"${value}"`;
    case "boolean":
      return value ? "true" : "false";
    case "null":
      return "null";
    case "undefined":
      return "undefined";
    case "function":
      return value.toString().slice(0, 50) + "...";
    case "symbol":
      return value.toString();
    case "date":
      return value.toISOString();
    case "regexp":
      return value.toString();
    case "bigint":
      return value.toString() + "n";
    case "error":
      return `${value.name}: ${value.message}`;
    default:
      return displayValue(value);
  }
};

// Optimized type color lookup using cache [[memory:4875251]]
const getTypeColor = (valueType: string): string => {
  return TYPE_COLOR_CACHE.get(valueType) || "#10B981";
};

// Optimized type icon lookup using cache [[memory:4875251]]
const getTypeIcon = (valueType: string): string => {
  return TYPE_ICON_CACHE.get(valueType) || "○";
};

// Memoized components for performance
const Expander = React.memo(
  ({ expanded, onPress }: { expanded: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={STABLE_STYLES.expanderContainer}
      onPress={onPress}
      hitSlop={HIT_SLOP_10}
    >
      <View style={STABLE_STYLES.expanderIcon}>
        <Svg
          width={12}
          height={12}
          viewBox="0 0 16 16"
          style={{ transform: [{ rotate: expanded ? "90deg" : "0deg" }] }}
        >
          <Path
            d="M6 12l4-4-4-4"
            strokeWidth={2}
            stroke="#6B7280"
            fill="none"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  )
);

const TypeIndicator = React.memo(({ valueType }: { valueType: string }) => {
  const color = getTypeColor(valueType);
  return (
    <Text
      style={[
        STABLE_STYLES.typeIndicator,
        {
          color,
          backgroundColor: `${color}10`,
          borderColor: `${color}30`,
        },
      ]}
    >
      {getTypeIcon(valueType)}
    </Text>
  );
});

const CopyButton = React.memo(({ value }: { value: any }) => {
  const [copyState, setCopyState] = useState<CopyState>("NoCopy");
  const { onCopy } = useCopy();

  const handleCopy = useCallback(async () => {
    if (!onCopy) {
      Alert.alert("Warning", "Copy functionality is not configured.");
      return;
    }

    try {
      // Pass the raw value to onCopy - let the context handle safe stringification
      const copied = await onCopy(value);
      if (copied) {
        setCopyState("SuccessCopy");
        setTimeout(() => setCopyState("NoCopy"), 1500);
      } else {
        setCopyState("ErrorCopy");
        setTimeout(() => setCopyState("NoCopy"), 1500);
      }
    } catch (error) {
      console.error("Copy failed:", error);
      setCopyState("ErrorCopy");
      setTimeout(() => setCopyState("NoCopy"), 1500);
    }
  }, [onCopy, value]);

  return (
    <TouchableOpacity
      style={STABLE_STYLES.copyButton}
      onPress={copyState === "NoCopy" ? handleCopy : undefined}
      hitSlop={HIT_SLOP_10}
    >
      <Copy
        size={14}
        color={
          copyState === "SuccessCopy"
            ? "#22C55E"
            : copyState === "ErrorCopy"
            ? "#EF4444"
            : "#9CA3AF"
        }
      />
    </TouchableOpacity>
  );
});

// Optimized data flattening with chunked processing to prevent UI blocking [[memory:4875251]]
const useDataFlattening = (data: any, maxDepth = 10) => {
  const [flatData, setFlatData] = useState<FlatDataItem[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(["root"])
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const circularCache = useRef(new WeakSet());
  const processingQueue = useRef<Array<() => void>>([]);

  const flattenData = useCallback(
    (
      value: any,
      key = "root",
      depth = 0,
      parentId?: string,
      path: string[] = []
    ): FlatDataItem[] => {
      // Early termination for performance [[memory:4875251]]
      if (depth > Math.min(maxDepth, MAX_DEPTH_LIMIT)) return [];

      const currentPath = [...path, key];
      const id = currentPath.join(".");
      const valueType = getValueType(value);
      const isExpandable =
        ["object", "array", "map", "set"].includes(valueType) && value;
      const rawChildCount = isExpandable ? getValueCount(value, valueType) : 0;
      // Limit child count to prevent performance issues [[memory:4875251]]
      const childCount = Math.min(rawChildCount, MAX_ITEMS_PER_LEVEL);

      // Check for circular references
      if (value && typeof value === "object") {
        if (circularCache.current.has(value)) {
          return [
            {
              id,
              key,
              value: "[Circular Reference]",
              valueType: "circular",
              depth,
              isExpandable: false,
              isExpanded: false,
              parentId,
              hasChildren: false,
              childCount: 0,
              path: currentPath,
              type: "circular",
            },
          ];
        }
        circularCache.current.add(value);
      }

      const currentItem: FlatDataItem = {
        id,
        key,
        value,
        valueType,
        depth,
        isExpandable,
        isExpanded: expandedItems.has(id),
        parentId,
        hasChildren: childCount > 0,
        childCount,
        path: currentPath,
        type: isExpandable ? "expandable" : valueType,
      };

      const result = [currentItem];

      // Only add children if expanded and not too deep [[memory:4875251]]
      if (
        isExpandable &&
        expandedItems.has(id) &&
        depth < Math.min(maxDepth, MAX_DEPTH_LIMIT)
      ) {
        try {
          let entries: [string, any][] = [];

          switch (valueType) {
            case "array":
              entries = (value as any[]).map((item, index) => [
                index.toString(),
                item,
              ]);
              break;
            case "object":
              entries = Object.entries(value);
              break;
            case "map":
              entries = Array.from(value.entries());
              break;
            case "set":
              entries = Array.from(value.entries());
              break;
          }

          // Aggressively limit children for performance [[memory:4875251]]
          const limitedEntries = entries.slice(0, childCount);

          // Process children in smaller batches to avoid blocking
          for (let i = 0; i < limitedEntries.length; i += CHUNK_SIZE) {
            const chunk = limitedEntries.slice(i, i + CHUNK_SIZE);
            for (const [childKey, childValue] of chunk) {
              result.push(
                ...flattenData(childValue, childKey, depth + 1, id, currentPath)
              );
            }

            // Yield to main thread periodically for large datasets
            if (i > 0 && i % (CHUNK_SIZE * 2) === 0) {
              break; // Let InteractionManager handle the rest
            }
          }
        } catch (error) {
          console.warn("Error processing children:", error);
        }
      }

      return result;
    },
    [maxDepth, expandedItems]
  );

  // Progressive data processing
  useEffect(() => {
    let isCancelled = false;
    setIsProcessing(true);

    const processData = () => {
      InteractionManager.runAfterInteractions(() => {
        if (isCancelled) return;

        try {
          // Reset circular cache for fresh processing
          circularCache.current = new WeakSet();
          const newFlatData = flattenData(data);

          if (!isCancelled) {
            setFlatData(newFlatData);
            setIsProcessing(false);
          }
        } catch (error) {
          console.error("Error flattening data:", error);
          if (!isCancelled) {
            setFlatData([]);
            setIsProcessing(false);
          }
        }
      });
    };

    processData();

    return () => {
      isCancelled = true;
    };
  }, [data, flattenData]);

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  return { flatData, isProcessing, toggleExpanded };
};

// Optimized virtualized item renderer with pre-computed styles [[memory:4875251]]
const VirtualizedItem = React.memo(
  ({
    item,
    onToggleExpanded,
  }: {
    item: FlatDataItem;
    onToggleExpanded: (id: string) => void;
  }) => {
    // Use pre-computed styles to avoid inline calculations [[memory:4875251]]
    const indentStyle =
      INDENT_STYLES[Math.min(item.depth, MAX_DEPTH_LIMIT)] || INDENT_STYLES[0];
    const color = getTypeColor(item.valueType);

    // Use inline handler since component is already memoized [[memory:4875251]]
    const handleToggleExpanded = () => {
      if (item.isExpandable) {
        onToggleExpanded(item.id);
      }
    };

    return (
      <View style={[STABLE_STYLES.itemContainer, indentStyle]}>
        {item.isExpandable ? (
          <Expander expanded={item.isExpanded} onPress={handleToggleExpanded} />
        ) : (
          <View style={STABLE_STYLES.expanderContainer} />
        )}

        <View style={STABLE_STYLES.labelContainer}>
          <Text style={STABLE_STYLES.labelText}>{item.key}:</Text>

          <TypeIndicator valueType={item.valueType} />

          {item.isExpandable ? (
            <Text style={[STABLE_STYLES.valueText, { color: "#9CA3AF" }]}>
              {item.valueType} ({item.childCount}{" "}
              {item.childCount === 1 ? "item" : "items"})
            </Text>
          ) : (
            <Text style={[STABLE_STYLES.valueText, { color }]}>
              {formatValue(item.value, item.valueType)}
            </Text>
          )}
        </View>

        <CopyButton value={item.value} />
      </View>
    );
  }
);

// Main virtualized data explorer component
interface VirtualizedDataExplorerProps {
  title: string;
  data: unknown;
  maxDepth?: number;
}

export const VirtualizedDataExplorer: React.FC<
  VirtualizedDataExplorerProps
> = ({ title, data, maxDepth = 10 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { flatData, isProcessing, toggleExpanded } = useDataFlattening(
    data,
    maxDepth
  );

  // Remove unnecessary useCallback - not passed to memoized components [[memory:4875251]]
  const toggleMainExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Stable renderItem using module-scope function [[memory:4875251]]
  const renderItem = ({ item }: { item: FlatDataItem }) => (
    <VirtualizedItem item={item} onToggleExpanded={toggleExpanded} />
  );

  // Simple keyExtractor without useCallback [[memory:4875251]]
  const keyExtractor = (item: FlatDataItem) => item.id;

  const hasData =
    data &&
    (typeof data === "object" || Array.isArray(data)) &&
    (Array.isArray(data)
      ? data.length > 0
      : Object.keys(data as object).length > 0);

  if (!hasData) {
    return (
      <View style={STABLE_STYLES.container}>
        <View style={STABLE_STYLES.header}>
          <Text style={STABLE_STYLES.title}>{title}</Text>
        </View>
        <View style={STABLE_STYLES.noDataContainer}>
          <Text style={STABLE_STYLES.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={STABLE_STYLES.container}>
      <View style={STABLE_STYLES.header}>
        <TouchableOpacity
          onPress={toggleMainExpanded}
          hitSlop={HIT_SLOP_10}
          style={STABLE_STYLES.headerTouchable}
        >
          <Text style={STABLE_STYLES.title}>{title}</Text>
          <View style={STABLE_STYLES.expanderMargin}>
            <Expander expanded={isExpanded} onPress={toggleMainExpanded} />
          </View>
        </TouchableOpacity>
        <CopyButton value={data} />
      </View>

      {isExpanded && (
        <>
          {isProcessing ? (
            <View style={STABLE_STYLES.loadingContainer}>
              <Text style={STABLE_STYLES.loadingText}>Processing data...</Text>
            </View>
          ) : (
            <FlashList
              data={flatData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              estimatedItemSize={ITEM_HEIGHT}
              getItemType={(item) => item.type}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={STABLE_STYLES.listContent}
            />
          )}
        </>
      )}
    </View>
  );
};

export default VirtualizedDataExplorer;
