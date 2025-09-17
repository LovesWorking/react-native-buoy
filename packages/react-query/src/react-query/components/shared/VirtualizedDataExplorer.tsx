import { JsonValue } from "../../types/types";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  memo,
  FC,
  ReactElement,
} from "react";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  FlatList,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { displayValue } from "@/rn-better-dev-tools/src/shared/utils/displayValue";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/gameUIColors";
import { CopyButton } from "@/rn-better-dev-tools/src/shared/ui/components/CopyButton";
import { IndentGuidesOverlay } from "./IndentGuidesOverlay";

// Stable constants to prevent re-renders [[memory:4875251]]
const HIT_SLOP_10 = { top: 10, bottom: 10, left: 10, right: 10 };
const ITEM_HEIGHT = 24; // Fixed height per row for crisp guides
const LONG_ITEM_HEIGHT = 24; // Keep uniform height to match VS Code tree
const CHUNK_SIZE = 50; // Process data in chunks to avoid blocking UI
const MAX_DEPTH_LIMIT = 15; // Prevent excessive nesting
const MAX_ITEMS_PER_LEVEL = 500; // Limit items to prevent memory issues
const LONG_KEY_THRESHOLD = 30; // Keys longer than this use vertical layout

// Pre-computed indent styles (VS Code-style width)
const INDENT_WIDTH = 16;
const INDENT_STYLES = Array.from(
  { length: MAX_DEPTH_LIMIT + 1 },
  (_, depth) =>
    StyleSheet.create({
      container: {
        marginLeft: depth * INDENT_WIDTH,
      },
    }).container
);

// Enhanced type color cache using centralized theme colors [[memory:4875251]]
const TYPE_COLOR_CACHE = new Map([
  ["string", gameUIColors.dataTypes.string],
  ["number", gameUIColors.dataTypes.number],
  ["bigint", gameUIColors.optional], // Purple for bigint (distinct from number)
  ["boolean", gameUIColors.dataTypes.boolean],
  ["null", gameUIColors.dataTypes.null],
  ["undefined", gameUIColors.dataTypes.undefined],
  ["function", gameUIColors.dataTypes.function],
  ["symbol", gameUIColors.critical], // Pink for symbols (distinct from function)
  ["date", gameUIColors.critical], // Pink for dates
  ["error", gameUIColors.error], // Red for errors
  ["array", gameUIColors.dataTypes.array],
  ["object", gameUIColors.dataTypes.object],
  ["map", gameUIColors.info], // Cyan for maps (distinct from object/array)
  ["set", gameUIColors.success], // Green for sets (distinct from map/array/object)
  ["circular", gameUIColors.warning], // Yellow for circular references
]);

// Pre-computed stable styles with React Query-inspired design
const STABLE_STYLES = StyleSheet.create({
  container: {
    backgroundColor: gameUIColors.primary + "08", // bg-white/[0.03]
    borderRadius: 8,
    borderWidth: 1,
    borderColor: gameUIColors.primary + "14", // border-white/[0.08]
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
    color: gameUIColors.primary, // text-white
    fontSize: 14,
    fontWeight: "500", // font-medium
  },
  description: {
    color: gameUIColors.secondary, // text-gray-400
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
    borderTopColor: gameUIColors.primary + "14", // border-white/[0.08]
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
    color: gameUIColors.secondary, // text-gray-400
  },
  itemContainer: {
    minHeight: ITEM_HEIGHT,
    backgroundColor: "transparent",
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start", // Align items to top for better alignment with expand arrows
  },
  itemTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start", // Changed from center to align expand arrow with first line of text
    paddingLeft: 0, // Remove padding to align with tree lines
    paddingRight: 16,
    paddingVertical: 2, // Further reduced for even tighter spacing
    minHeight: 24, // Match ITEM_HEIGHT for consistency
  },
  itemTouchablePressed: {
    backgroundColor: gameUIColors.primary + "0A", // slightly more visible on press
  },
  itemSelected: {
    backgroundColor: gameUIColors.primary + "14", // selected row highlight (subtle)
  },
  expanderContainer: {
    width: 16, // Reduced to minimize space
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4, // Align with text baseline
  },
  expanderIcon: {
    width: 12,
    height: 12,
  },
  labelContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingLeft: 2,
  },
  labelContainerVertical: {
    flex: 1,
    flexDirection: "column",
    paddingLeft: 2, // Reduced padding for tighter alignment
    paddingVertical: 2,
  },
  labelContainerVerticalRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  labelText: {
    color: gameUIColors.primary, // text-white
    fontSize: 12,
    fontWeight: "500", // font-medium
    fontFamily: "monospace",
    marginRight: 8,
    flexShrink: 1,
  },
  labelTextTruncated: {
    color: gameUIColors.primary, // text-white
    fontSize: 12,
    fontWeight: "500", // font-medium
    fontFamily: "monospace",
    flexShrink: 1,
  },
  valueText: {
    fontSize: 12,
    fontFamily: "monospace",
    flex: 1,
    color: gameUIColors.primaryLight, // text-gray-300
  },
  loadingContainer: {
    padding: 16,
    alignItems: "center",
  },
  loadingText: {
    color: gameUIColors.secondary, // text-gray-400
    fontSize: 12,
  },
  noDataContainer: {
    padding: 16,
    alignItems: "center",
  },
  noDataText: {
    color: gameUIColors.secondary, // text-gray-400
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
  value: JsonValue;
  valueType: string;
  depth: number;
  isExpandable: boolean;
  isExpanded: boolean;
  parentId?: string;
  hasChildren: boolean;
  childCount: number;
  path: string[];
  type: string; // For FlatList optimization
  isLastChild?: boolean; // Track if this is the last child of its parent
  parentHasMoreSiblings?: boolean[]; // Track which parent levels have more siblings
  siblingIndex?: number; // Index among siblings
  totalSiblings?: number; // Total number of siblings
}

// Enhanced type detection optimized for performance
const getValueType = (value: JsonValue): string => {
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
const getValueCount = (value: JsonValue, valueType: string): number => {
  if (value === null) return 0;

  switch (valueType) {
    case "array":
      return Array.isArray(value) ? value.length : 0;
    case "object":
      return typeof value === "object" &&
        !(value instanceof Date) &&
        !(value instanceof Error) &&
        !(value instanceof RegExp) &&
        !(value instanceof Map) &&
        !(value instanceof Set)
        ? Object.keys(value).length
        : 0;
    case "map":
      return value instanceof Map ? value.size : 0;
    case "set":
      return value instanceof Set ? value.size : 0;
    default:
      return 0;
  }
};

// Format value for display
const formatValue = (value: JsonValue, valueType: string): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  switch (valueType) {
    case "string":
      return `"${String(value)}"`;
    case "boolean":
      return value === true ? "true" : "false";
    case "function":
      return typeof value === "function"
        ? value.toString().slice(0, 50) + "..."
        : "undefined";
    case "symbol":
      return typeof value === "symbol" ? String(value) : "undefined";
    case "date":
      return value instanceof Date ? value.toISOString() : "undefined";
    case "regexp":
      return value instanceof RegExp ? value.toString() : "undefined";
    case "bigint":
      return typeof value === "bigint" ? value.toString() + "n" : "undefined";
    case "error":
      return value instanceof Error
        ? `${value.name}: ${value.message}`
        : "undefined";
    default:
      return displayValue(value);
  }
};

// Optimized type color lookup using cache [[memory:4875251]]
const getTypeColor = (valueType: string): string => {
  return TYPE_COLOR_CACHE.get(valueType) || gameUIColors.dataTypes.array;
};

// Memoized components for performance
const ExpanderComponent = ({
  expanded,
  onPress,
}: {
  expanded: boolean;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity
      sentry-label="ignore devtools data explorer expander"
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
            stroke={gameUIColors.secondary} // text-gray-400
            fill="none"
          />
        </Svg>
      </View>
    </TouchableOpacity>
  );
};
ExpanderComponent.displayName = "Expander";
const Expander = memo(ExpanderComponent);

// Type legend component to replace inline type indicators
const TypeLegendComponent = ({
  visibleTypes,
}: {
  visibleTypes: string[];
}): ReactElement => {
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
};
TypeLegendComponent.displayName = "TypeLegend";
const TypeLegend = memo(TypeLegendComponent);


// Optimized data flattening with chunked processing to prevent UI blocking [[memory:4875251]]
const useDataFlattening = (
  data: JsonValue,
  maxDepth = 10,
  autoExpandFirstLevel = false
) => {
  const [flatData, setFlatData] = useState<FlatDataItem[]>([]);
  const flatDataMapRef = useRef<
    Map<string, { item: FlatDataItem; index: number }>
  >(new Map());

  // Initialize with root expanded and optionally first level
  const getInitialExpanded = useCallback(() => {
    const initial = new Set(["root"]);
    if (autoExpandFirstLevel && data && typeof data === "object") {
      if (Array.isArray(data)) {
        data.forEach((_, index) => {
          initial.add(`root.${index}`);
        });
      } else {
        Object.keys(data).forEach((key) => {
          initial.add(`root.${key}`);
        });
      }
    }
    return initial;
  }, [autoExpandFirstLevel, data]);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(() =>
    getInitialExpanded()
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug logging - commented out for less noise
  // Store circular cache outside of re-renders to prevent reset
  const circularCacheRef = useRef<WeakSet<object>>(new WeakSet<object>());
  const processingRef = useRef(false);
  const dataVersionRef = useRef<number>(0);
  const lastActionRef = useRef<
    { type: "expand" | "collapse" | "init"; itemId?: string } | undefined
  >(undefined);

  // Stable flattenData function that doesn't depend on expandedItems
  const flattenDataStable = useCallback(
    (
      value: JsonValue,
      expandedSet: Set<string>,
      circularCache: WeakSet<object>,
      key = "root",
      depth = 0,
      parentId?: string,
      path: string[] = [],
      siblingIndex = 0,
      totalSiblings = 1,
      parentHasMoreSiblings: boolean[] = []
    ): FlatDataItem[] => {
      // Early termination for performance [[memory:4875251]]
      if (depth > Math.min(maxDepth, MAX_DEPTH_LIMIT)) return [];

      const currentPath = [...path, key];
      const id = currentPath.join(".");
      const valueType = getValueType(value);
      const isExpandable =
        ["object", "array", "map", "set"].includes(valueType) && value !== null;
      const rawChildCount = isExpandable ? getValueCount(value, valueType) : 0;
      // Limit child count to prevent performance issues [[memory:4875251]]
      const childCount = Math.min(rawChildCount, MAX_ITEMS_PER_LEVEL);

      // Check for circular references
      if (value && typeof value === "object") {
        if (circularCache.has(value)) {
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
              isLastChild: siblingIndex === totalSiblings - 1,
              parentHasMoreSiblings: [...parentHasMoreSiblings],
              siblingIndex,
              totalSiblings,
            },
          ];
        }
        circularCache.add(value);
      }

      const currentItem: FlatDataItem = {
        id,
        key,
        value,
        valueType,
        depth,
        isExpandable,
        isExpanded: expandedSet.has(id),
        parentId,
        hasChildren: childCount > 0,
        childCount,
        path: currentPath,
        type: isExpandable ? "expandable" : valueType,
        isLastChild: siblingIndex === totalSiblings - 1,
        parentHasMoreSiblings: [...parentHasMoreSiblings],
        siblingIndex,
        totalSiblings,
      };

      const result = [currentItem];

      // Only add children if expanded and not too deep [[memory:4875251]]
      if (
        isExpandable &&
        expandedSet.has(id) &&
        depth < Math.min(maxDepth, MAX_DEPTH_LIMIT)
      ) {
        try {
          let entries: [string, JsonValue][] = [];

          switch (valueType) {
            case "array":
              entries = Array.isArray(value)
                ? value.map((item, index): [string, JsonValue] => [
                    index.toString(),
                    item,
                  ])
                : [];
              break;
            case "object":
              entries =
                typeof value === "object" &&
                value !== null &&
                !(value instanceof Date) &&
                !(value instanceof Error) &&
                !(value instanceof RegExp) &&
                !(value instanceof Map) &&
                !(value instanceof Set)
                  ? Object.entries(value)
                  : [];
              break;
            case "map":
              entries =
                value instanceof Map
                  ? Array.from(value.entries()).map(([k, v]) => [
                      String(k),
                      v as JsonValue,
                    ])
                  : [];
              break;
            case "set":
              entries =
                value instanceof Set
                  ? Array.from(value.values()).map((v, index) => [
                      index.toString(),
                      v as JsonValue,
                    ])
                  : [];
              break;
          }

          // Aggressively limit children for performance [[memory:4875251]]
          const limitedEntries = entries.slice(0, childCount);
          const totalChildCount = limitedEntries.length;

          // Update parent's sibling tracking for children
          const newParentHasMoreSiblings = [...parentHasMoreSiblings];
          if (depth > 0) {
            // Current item has more siblings if it's not the last child
            newParentHasMoreSiblings[depth - 1] = !currentItem.isLastChild;
          }

          // Process children in smaller batches to avoid blocking
          for (let i = 0; i < limitedEntries.length; i += CHUNK_SIZE) {
            const chunk = limitedEntries.slice(i, i + CHUNK_SIZE);
            let chunkIndex = i;
            for (const [childKey, childValue] of chunk) {
              result.push(
                ...flattenDataStable(
                  childValue,
                  expandedSet,
                  circularCache,
                  childKey,
                  depth + 1,
                  id,
                  currentPath,
                  chunkIndex,
                  totalChildCount,
                  newParentHasMoreSiblings
                )
              );
              chunkIndex++;
            }

            // Yield to main thread periodically for large datasets
            if (i > 0 && i % (CHUNK_SIZE * 2) === 0) {
              break; // Let InteractionManager handle the rest
            }
          }
        } catch (error) {
          console.error(error);
          // Skip malformed data
        }
      }

      return result;
    },
    [maxDepth] // Only depend on maxDepth, not expandedItems
  );

  // Only process full data when data changes (not on expand/collapse)
  useEffect(() => {
    // Skip if this was just an expand/collapse action
    if (
      lastActionRef.current &&
      (lastActionRef.current.type === "expand" ||
        lastActionRef.current.type === "collapse")
    ) {
      // Make sure processing flag is cleared for incremental updates
      if (isProcessing) {
        setIsProcessing(false);
        processingRef.current = false;
      }
      lastActionRef.current = undefined;
      return;
    }

    // Prevent concurrent processing
    if (processingRef.current) {
      return;
    }

    let isCancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    processingRef.current = true;
    setIsProcessing(true);

    const processData = async () => {
      // Failsafe timeout to prevent stuck processing
      timeoutId = setTimeout(() => {
        if (processingRef.current && !isCancelled) {
          setIsProcessing(false);
          processingRef.current = false;
        }
      }, 5000);
      // Small delay to debounce rapid changes
      // Small delay to batch rapid changes
      await new Promise((resolve) => setTimeout(resolve, 10));

      if (isCancelled) {
        processingRef.current = false;
        return;
      }

      try {
        // Initialize circular cache for new data
        circularCacheRef.current = new WeakSet();
        dataVersionRef.current = Date.now();

        const newFlatData = flattenDataStable(
          data,
          expandedItems,
          circularCacheRef.current,
          "root",
          0,
          undefined,
          [],
          0,
          1,
          []
        );

        // Build the map for incremental updates
        const newMap = new Map<string, { item: FlatDataItem; index: number }>();
        newFlatData.forEach((item, index) => {
          newMap.set(item.id, { item, index });
        });
        flatDataMapRef.current = newMap;

        if (!isCancelled) {
          setFlatData(newFlatData);
          setIsProcessing(false);
          processingRef.current = false;
          if (timeoutId) clearTimeout(timeoutId);
        } else {
          if (timeoutId) clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error(error);
        // Reset to empty data on error
        if (!isCancelled) {
          setFlatData([]);
          flatDataMapRef.current = new Map();
          setIsProcessing(false);
          processingRef.current = false;
          if (timeoutId) clearTimeout(timeoutId);
        } else {
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    processData();

    return () => {
      isCancelled = true;
      processingRef.current = false;
      if (timeoutId) clearTimeout(timeoutId);
    };

    // isProcessing is not used in the dependency array because it is not needed - DONT ADD IT TO THE DEPENDENCY ARRAY
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, expandedItems, flattenDataStable, maxDepth]);

  // Incremental update function for expand/collapse
  const updateFlatDataIncremental = useCallback(
    (itemId: string, isExpanding: boolean) => {
      // Clear processing flag since we're doing incremental update
      setIsProcessing(false);
      processingRef.current = false;

      setFlatData((prevFlatData) => {
        const itemEntry = flatDataMapRef.current.get(itemId);
        if (!itemEntry) {
          return prevFlatData;
        }

        const { item, index } = itemEntry;

        if (isExpanding && item.isExpandable && item.hasChildren) {
          // Expand: insert children after the item
          const newItems = [...prevFlatData];

          // Create a new circular cache for this subtree
          const subCircularCache = new WeakSet<object>();
          if (item.value && typeof item.value === "object") {
            subCircularCache.add(item.value);
          }

          // We need to get the actual children, not re-process the parent
          // So we process each child entry individually
          const childrenItems: FlatDataItem[] = [];

          try {
            let entries: [string, JsonValue][] = [];
            const valueType = item.valueType;

            switch (valueType) {
              case "array":
                entries = Array.isArray(item.value)
                  ? item.value.map((childValue, index): [string, JsonValue] => [
                      index.toString(),
                      childValue,
                    ])
                  : [];
                break;
              case "object":
                entries =
                  typeof item.value === "object" &&
                  item.value !== null &&
                  !(item.value instanceof Date) &&
                  !(item.value instanceof Error) &&
                  !(item.value instanceof RegExp) &&
                  !(item.value instanceof Map) &&
                  !(item.value instanceof Set)
                    ? Object.entries(item.value)
                    : [];
                break;
              case "map":
                entries =
                  item.value instanceof Map
                    ? Array.from(item.value.entries()).map(([k, v]) => [
                        String(k),
                        v as JsonValue,
                      ])
                    : [];
                break;
              case "set":
                entries =
                  item.value instanceof Set
                    ? Array.from(item.value.values()).map((v, index) => [
                        index.toString(),
                        v as JsonValue,
                      ])
                    : [];
                break;
            }

            // Process each child with sibling tracking
            const totalEntries = entries.length;
            const parentHasMoreSiblings = item.parentHasMoreSiblings || [];
            const newParentHasMoreSiblings = [...parentHasMoreSiblings];
            if (item.depth > 0) {
              newParentHasMoreSiblings[item.depth - 1] = !item.isLastChild;
            }

            entries.forEach(([childKey, childValue], index) => {
              const childItems = flattenDataStable(
                childValue,
                new Set(), // Children start collapsed
                subCircularCache,
                childKey,
                item.depth + 1,
                itemId,
                item.path,
                index,
                totalEntries,
                newParentHasMoreSiblings
              );
              childrenItems.push(...childItems);
            });
          } catch (error) {
            console.error(error);
          }

          const childrenToInsert = childrenItems;

          if (childrenToInsert.length > 0) {
            // Children are ready to insert
          }

          // Update the parent item to show it's expanded
          newItems[index] = { ...item, isExpanded: true };

          // Insert children after the parent
          newItems.splice(index + 1, 0, ...childrenToInsert);

          // Rebuild the map
          const newMap = new Map<
            string,
            { item: FlatDataItem; index: number }
          >();
          newItems.forEach((item, index) => {
            newMap.set(item.id, { item, index });
          });
          flatDataMapRef.current = newMap;

          return newItems;
        } else if (!isExpanding) {
          // Collapse: remove all descendants
          const itemsToRemove = new Set<string>();
          const findDescendants = (parentId: string, depth: number) => {
            prevFlatData.forEach((child) => {
              if (
                child.parentId === parentId ||
                (child.id.startsWith(parentId + ".") && child.depth > depth)
              ) {
                itemsToRemove.add(child.id);
                if (child.hasChildren) {
                  findDescendants(child.id, child.depth);
                }
              }
            });
          };

          findDescendants(itemId, item.depth);

          // Filter out descendants and update the parent
          const newItems = prevFlatData
            .map((it) => {
              if (it.id === itemId) {
                return { ...it, isExpanded: false };
              }
              return it;
            })
            .filter((it) => !itemsToRemove.has(it.id));

          // Rebuild the map
          const newMap = new Map<
            string,
            { item: FlatDataItem; index: number }
          >();
          newItems.forEach((item, index) => {
            newMap.set(item.id, { item, index });
          });
          flatDataMapRef.current = newMap;

          return newItems;
        }

        return prevFlatData;
      });
    },
    [flattenDataStable]
  );

  const toggleExpanded = useCallback(
    (itemId: string) => {
      setExpandedItems((prev) => {
        const newSet = new Set(prev);
        const isExpanding = !newSet.has(itemId);

        if (isExpanding) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }

        // Store the action for the effect to use
        lastActionRef.current = {
          type: isExpanding ? "expand" : "collapse",
          itemId,
        };

        // Perform incremental update
        updateFlatDataIncremental(itemId, isExpanding);

        return newSet;
      });
    },
    [updateFlatDataIncremental]
  );

  return { flatData, isProcessing, toggleExpanded };
};

// Optimized virtualized item renderer with full-row clickability [[memory:4875251]]
const VirtualizedItemComponent = ({
  item,
  onToggleExpanded,
  data,
  index,
  onSelect,
  isSelected,
}: {
  item: FlatDataItem;
  onToggleExpanded: (id: string) => void;
  data?: JsonValue;
  index: number;
  onSelect: (index: number) => void;
  isSelected: boolean;
}): ReactElement => {
  const [isPressed, setIsPressed] = useState(false);
  const [showFullKey, setShowFullKey] = useState(false);

  // Use pre-computed styles to avoid inline calculations [[memory:4875251]]
  const indentStyle =
    INDENT_STYLES[Math.min(item.depth, MAX_DEPTH_LIMIT)] || INDENT_STYLES[0];
  const color = getTypeColor(item.valueType);

  // Uniform row layout: single-line like VS Code tree
  const isLongKey = false;

  // Use inline handler since component is already memoized [[memory:4875251]]
  const handlePress = () => {
    if (item.isExpandable) {
      onToggleExpanded(item.id);
    }
    onSelect(index);
  };

  const handleKeyPress = () => {};

  // Always show full key for better identification
  const displayKey = item.key;

  return (
    <View style={[STABLE_STYLES.itemContainer, indentStyle]}>
      <TouchableOpacity
        sentry-label="ignore devtools data explorer item"
        style={[
          STABLE_STYLES.itemTouchable,
          isPressed && STABLE_STYLES.itemTouchablePressed,
          isSelected && STABLE_STYLES.itemSelected,
          isLongKey && { minHeight: LONG_ITEM_HEIGHT, paddingVertical: 2 },
        ]}
        onPress={handlePress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        activeOpacity={item.isExpandable ? 0.7 : 1}
        disabled={!item.isExpandable}
      >
        {item.isExpandable ? (
          <Expander expanded={item.isExpanded} onPress={handlePress} />
        ) : (
          <View style={STABLE_STYLES.expanderContainer} />
        )}
        {/* Horizontal layout for all keys (single-line) */}
        <View style={STABLE_STYLES.labelContainer}>
          <Text style={STABLE_STYLES.labelText} numberOfLines={1}>
            {item.key}:
          </Text>

          {item.isExpandable ? (
            <>
              <Text
                style={[STABLE_STYLES.valueText, { color: gameUIColors.secondary }]}
                numberOfLines={1}
              >
                {item.valueType} ({item.childCount}{" "}
                {item.childCount === 1 ? "item" : "items"})
              </Text>
              {item.id === "root" && data && (
                <CopyButton
                  value={data}
                  size={16}
                  buttonStyle={{ marginLeft: 8 }}
                />
              )}
            </>
          ) : (
            <Text style={[STABLE_STYLES.valueText, { color }]} numberOfLines={1}>
              {formatValue(item.value, item.valueType)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};
VirtualizedItemComponent.displayName = "VirtualizedItem";
const VirtualizedItem = memo(VirtualizedItemComponent);

// Main virtualized data explorer component
interface VirtualizedDataExplorerProps {
  title: string;
  description?: string;
  data: JsonValue;
  maxDepth?: number;
  rawMode?: boolean; // When true, shows data directly without container/header/badges
  initialExpanded?: boolean; // When true, auto-expands the first level of data
}

export const VirtualizedDataExplorer: FC<VirtualizedDataExplorerProps> = ({
  title,
  description,
  data,
  maxDepth = 10,
  rawMode = false,
  initialExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(rawMode); // Auto-expand in raw mode
  const { flatData, isProcessing, toggleExpanded } = useDataFlattening(
    data,
    maxDepth,
    initialExpanded
  );

  // Track visible range for overlay rendering
  const listRef = useRef<FlatList>(null);
  const [visibleRange, setVisibleRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: Math.min(flatData.length - 1, Math.max(0, Math.ceil(400 / ITEM_HEIGHT) - 1)),
  });
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 1 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      const idx = viewableItems
        .map((v) => v.index)
        .filter((n): n is number => typeof n === 'number');
      if (idx.length) {
        setVisibleRange({ start: Math.min(...idx), end: Math.max(...idx) });
      }
    }
  ).current;
  useEffect(() => {
    // When data changes, reset the presumed visible window
    setVisibleRange({
      start: 0,
      end: Math.min(flatData.length - 1, Math.max(0, Math.ceil(400 / ITEM_HEIGHT) - 1)),
    });
  }, [flatData.length]);
  

  // Calculate visible types for the legend with single pass deduplication
  // Performance: Avoiding array.map() + Array.from(new Set()), using single loop for unique types
  const visibleTypes = useMemo(() => {
    const typeSet = new Set<string>();
    for (const item of flatData) {
      typeSet.add(item.valueType);
      // Early exit if we have enough types for the legend (max 8 as per TypeLegend component)
      if (typeSet.size >= 8) break;
    }
    return Array.from(typeSet);
  }, [flatData]);

  // Remove unnecessary useCallback - not passed to memoized components [[memory:4875251]]
  const toggleMainExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Stable renderItem using module-scope function [[memory:4875251]]
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const activeDepth = selectedIndex != null ? flatData[selectedIndex]?.depth : undefined;

  const renderItem = ({ item, index }: { item: FlatDataItem; index: number }) => (
    <VirtualizedItem
      item={item}
      index={index}
      onToggleExpanded={toggleExpanded}
      data={data}
      onSelect={setSelectedIndex}
      isSelected={selectedIndex === index}
    />
  );

  // Uniform row height for crisp guide geometry
  const averageItemSize = ITEM_HEIGHT;

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
            <Text style={STABLE_STYLES.loadingText}>
              Processing data... (raw mode, isProcessing={String(isProcessing)})
            </Text>
          </View>
        ) : (
          <View style={{ position: 'relative', height: flatData.length * ITEM_HEIGHT }}>
            <IndentGuidesOverlay
              items={flatData}
              visibleRange={{ start: 0, end: Math.max(0, flatData.length - 1) }}
              itemHeight={ITEM_HEIGHT}
              indentWidth={INDENT_WIDTH}
              activeDepth={activeDepth}
            />
            <FlatList
              ref={listRef}
              sentry-label="ignore devtools data explorer list"
              data={flatData}
              renderItem={renderItem}
              keyExtractor={keyExtractor}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={STABLE_STYLES.listContent}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={10}
              scrollEnabled={false}
            />
          </View>
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
            sentry-label="ignore devtools data explorer header toggle"
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
        </View>

        {isExpanded && visibleTypes.length > 0 && !rawMode && (
          <TypeLegend visibleTypes={visibleTypes} />
        )}
      </View>

      {isExpanded && (
        <>
          {isProcessing ? (
            <View style={STABLE_STYLES.loadingContainer}>
              <Text style={STABLE_STYLES.loadingText}>
                Processing data... (isProcessing={String(isProcessing)})
              </Text>
            </View>
          ) : (
            <View
              style={{
                height: Math.min(flatData.length * ITEM_HEIGHT, 400),
                position: 'relative',
              }}
            >
              <IndentGuidesOverlay
                items={flatData}
                visibleRange={visibleRange}
                itemHeight={ITEM_HEIGHT}
                indentWidth={INDENT_WIDTH}
                activeDepth={activeDepth}
              />
              <FlatList
                ref={listRef}
                sentry-label="ignore devtools data explorer collapsed list"
                data={flatData}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                showsVerticalScrollIndicator={true}
                contentContainerStyle={STABLE_STYLES.listContent}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={10}
                scrollEnabled={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfigRef.current}
              />
            </View>
          )}
        </>
      )}
    </View>
  );
};
