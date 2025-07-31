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

// Pre-computed indent styles with reduced indentation [[memory:4875251]]
const INDENT_STYLES = Array.from(
  { length: MAX_DEPTH_LIMIT + 1 },
  (_, depth) =>
    StyleSheet.create({
      container: { paddingLeft: depth === 0 ? 0 : 8 + depth * 12 }, // Start at 0 for root, then 8 + 12*depth
    }).container
);

// Enhanced type color cache with distinct colors for better differentiation [[memory:4875251]]
const TYPE_COLOR_CACHE = new Map([
  ["string", "#22D3EE"], // Cyan for strings
  ["number", "#3B82F6"], // Blue for numbers
  ["bigint", "#8B5CF6"], // Purple for bigint (distinct from number)
  ["boolean", "#F59E0B"], // Orange for booleans
  ["null", "#6B7280"], // Gray for null
  ["undefined", "#9CA3AF"], // Light gray for undefined (distinct from null)
  ["function", "#A855F7"], // Magenta for functions
  ["symbol", "#D946EF"], // Hot pink for symbols (distinct from function)
  ["date", "#EC4899"], // Pink for dates
  ["error", "#EF4444"], // Red for errors
  ["array", "#10B981"], // Green for arrays
  ["object", "#F97316"], // Orange-red for objects (distinct from array)
  ["map", "#06B6D4"], // Teal for maps (distinct from object/array)
  ["set", "#84CC16"], // Lime for sets (distinct from map/array/object)
  ["circular", "#F59E0B"], // Amber for circular references
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

// Pre-computed stable styles with React Query-inspired design
const STABLE_STYLES = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.03)", // bg-white/[0.03]
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)", // border-white/[0.08]
    // Remove flex: 1 and minHeight to allow natural sizing
  },
  header: {
    flexDirection: "column",
    paddingHorizontal: 16, // Increased padding like dev tools
    paddingVertical: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    color: "#FFFFFF", // text-white
    fontSize: 14,
    fontWeight: "500", // font-medium
  },
  description: {
    color: "#9CA3AF", // text-gray-400
    fontSize: 12,
    marginTop: 2,
  },
  typeLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.08)", // border-white/[0.08]
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  typeColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  typeName: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF", // text-gray-400
  },
  itemContainer: {
    minHeight: ITEM_HEIGHT,
    backgroundColor: "transparent",
  },
  itemTouchable: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 12,
    paddingRight: 50, // Reduced from 60 since copy button is closer
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)", // border-white/[0.05]
  },
  itemTouchablePressed: {
    backgroundColor: "rgba(255, 255, 255, 0.02)", // bg-white/[0.02]
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
    color: "#FFFFFF", // text-white
    fontSize: 12,
    fontWeight: "500", // font-medium
    fontFamily: "monospace",
    marginRight: 8,
  },
  valueText: {
    fontSize: 12,
    fontFamily: "monospace",
    flex: 1,
    color: "#D1D5DB", // text-gray-300
  },
  copyButton: {
    padding: 6,
    borderRadius: 4,
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -12 }],
    backgroundColor: "rgba(107, 114, 128, 0.1)", // bg-gray-500/10
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    color: "#9CA3AF", // text-gray-400
    fontSize: 12,
  },
  noDataContainer: {
    padding: 16,
    alignItems: "center",
  },
  noDataText: {
    color: "#9CA3AF", // text-gray-400
    fontSize: 12,
  },
  listContent: {
    paddingBottom: 8,
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
            stroke="#9CA3AF" // text-gray-400
            fill="none"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  )
);

// Type legend component to replace inline type indicators
const TypeLegend = React.memo(
  ({ visibleTypes }: { visibleTypes: string[] }) => {
    const uniqueTypes = Array.from(new Set(visibleTypes)).slice(0, 8); // Limit to 8 most common types

    return (
      <View style={STABLE_STYLES.typeLegend}>
        {uniqueTypes.map((type) => {
          const color = getTypeColor(type);
          return (
            <View
              key={type}
              style={[
                STABLE_STYLES.typeBadge,
                {
                  backgroundColor: `${color}10`,
                  borderColor: `${color}30`,
                },
              ]}
            >
              <View
                style={[STABLE_STYLES.typeColor, { backgroundColor: color }]}
              />
              <Text style={STABLE_STYLES.typeName}>{type}</Text>
            </View>
          );
        })}
      </View>
    );
  }
);

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

// Optimized virtualized item renderer with full-row clickability [[memory:4875251]]
const VirtualizedItem = React.memo(
  ({
    item,
    onToggleExpanded,
  }: {
    item: FlatDataItem;
    onToggleExpanded: (id: string) => void;
  }) => {
    const [isPressed, setIsPressed] = useState(false);

    // Use pre-computed styles to avoid inline calculations [[memory:4875251]]
    const indentStyle =
      INDENT_STYLES[Math.min(item.depth, MAX_DEPTH_LIMIT)] || INDENT_STYLES[0];
    const color = getTypeColor(item.valueType);

    // Use inline handler since component is already memoized [[memory:4875251]]
    const handlePress = () => {
      if (item.isExpandable) {
        onToggleExpanded(item.id);
      }
    };

    return (
      <View style={[STABLE_STYLES.itemContainer, indentStyle]}>
        <TouchableOpacity
          style={[
            STABLE_STYLES.itemTouchable,
            isPressed && STABLE_STYLES.itemTouchablePressed,
          ]}
          onPress={handlePress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          activeOpacity={item.isExpandable ? 0.7 : 1}
          disabled={!item.isExpandable}
        >
          {item.isExpandable ? (
            <Expander expanded={item.isExpanded} onPress={() => {}} />
          ) : (
            <View style={STABLE_STYLES.expanderContainer} />
          )}

          <View style={STABLE_STYLES.labelContainer}>
            <Text style={STABLE_STYLES.labelText}>{item.key}:</Text>

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
        </TouchableOpacity>
        <CopyButton value={item.value} />
      </View>
    );
  }
);

// Main virtualized data explorer component
interface VirtualizedDataExplorerProps {
  title: string;
  description?: string;
  data: unknown;
  maxDepth?: number;
  rawMode?: boolean; // When true, shows data directly without container/header/badges
}

export const VirtualizedDataExplorer: React.FC<
  VirtualizedDataExplorerProps
> = ({ title, description, data, maxDepth = 10, rawMode = false }) => {
  const [isExpanded, setIsExpanded] = useState(rawMode); // Auto-expand in raw mode
  const { flatData, isProcessing, toggleExpanded } = useDataFlattening(
    data,
    maxDepth
  );

  // Calculate visible types for the legend
  const visibleTypes = useMemo(() => {
    return flatData.map((item) => item.valueType);
  }, [flatData]);

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

  // Raw mode: render data directly without header/container
  if (rawMode) {
    if (!hasData) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={STABLE_STYLES.noDataText}>No data available</Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        {isProcessing ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
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
      </View>
    );
  }

  // Standard mode: render with header and container
  if (!hasData) {
    return (
      <View style={STABLE_STYLES.container}>
        <View style={STABLE_STYLES.header}>
          <View style={STABLE_STYLES.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={STABLE_STYLES.title}>{title}</Text>
              {description && (
                <Text style={STABLE_STYLES.description}>{description}</Text>
              )}
            </View>
          </View>
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
        <View style={STABLE_STYLES.headerRow}>
          <TouchableOpacity
            onPress={toggleMainExpanded}
            hitSlop={HIT_SLOP_10}
            style={STABLE_STYLES.headerTouchable}
          >
            <View style={{ flex: 1 }}>
              <Text style={STABLE_STYLES.title}>{title}</Text>
              {description && (
                <Text style={STABLE_STYLES.description}>{description}</Text>
              )}
            </View>
            <View style={STABLE_STYLES.expanderMargin}>
              <Expander expanded={isExpanded} onPress={toggleMainExpanded} />
            </View>
          </TouchableOpacity>
          <CopyButton value={data} />
        </View>

        {isExpanded && visibleTypes.length > 0 && (
          <TypeLegend visibleTypes={visibleTypes} />
        )}
      </View>

      {isExpanded && (
        <>
          {isProcessing ? (
            <View style={STABLE_STYLES.loadingContainer}>
              <Text style={STABLE_STYLES.loadingText}>Processing data...</Text>
            </View>
          ) : (
            <View
              style={{ height: Math.min(flatData.length * ITEM_HEIGHT, 400) }}
            >
              <FlashList
                data={flatData}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                estimatedItemSize={ITEM_HEIGHT}
                getItemType={(item) => item.type}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={STABLE_STYLES.listContent}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};

export default VirtualizedDataExplorer;
