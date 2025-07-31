import React, { useState, useMemo } from "react";
import Svg, { Path } from "react-native-svg";
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Copy } from "lucide-react-native";
import { useCopy } from "../../context/CopyContext";
import { displayValue } from "../devtools/displayValue";

function isIterable(x: any): x is Iterable<unknown> {
  return x != null && typeof x === "object" && Symbol.iterator in x;
}

/**
 * Enhanced type detection that handles all JavaScript types
 */
function getValueType(value: any): string {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  if (value instanceof Error) return "error";
  if (value instanceof Map) return "map";
  if (value instanceof Set) return "set";
  if (value instanceof WeakMap) return "weakmap";
  if (value instanceof WeakSet) return "weakset";
  if (value instanceof RegExp) return "regexp";
  if (typeof value === "function") return "function";
  if (typeof value === "symbol") return "symbol";
  if (typeof value === "bigint") return "bigint";
  if (value && typeof value === "object" && isIterable(value))
    return "iterable";
  if (typeof value === "object") return "object";
  return typeof value; // string, number, boolean
}

/**
 * Format values appropriately based on their type
 */
function formatValue(value: any, valueType: string): string {
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
      return value.toString();
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
}

/**
 * Get type indicator for display
 */
function getTypeIndicator(valueType: string, count?: number): string {
  const countStr = count !== undefined ? `${count}` : "";
  switch (valueType) {
    case "object":
      return `{${countStr}}`;
    case "array":
      return `[${countStr}]`;
    case "map":
      return `Map(${countStr})`;
    case "set":
      return `Set(${countStr})`;
    case "iterable":
      return `(${countStr})`;
    case "error":
      return `Error{}`;
    default:
      return "";
  }
}

/**
 * Get styling for different value types
 */
function getValueTypeStyle(valueType: string) {
  switch (valueType) {
    case "string":
      return { color: "#22D3EE" }; // cyan
    case "number":
    case "bigint":
      return { color: "#3B82F6" }; // blue
    case "boolean":
      return { color: "#F59E0B" }; // amber
    case "null":
    case "undefined":
      return { color: "#9CA3AF" }; // gray
    case "function":
    case "symbol":
      return { color: "#A855F7" }; // purple
    case "date":
      return { color: "#EC4899" }; // pink
    case "error":
      return { color: "#EF4444" }; // red
    default:
      return { color: "#10B981" }; // emerald
  }
}

/**
 * Generate intelligent ranges for large collections (inspired by Redux DevTools)
 */
function getRanges(from: number, to: number, limit: number) {
  const ranges = [];
  while (to - from > limit * limit) {
    limit = limit * limit;
  }
  for (let i = from; i <= to; i += limit) {
    ranges.push({ from: i, to: Math.min(to, i + limit - 1) });
  }
  return ranges;
}

/**
 * Smart collection entry processing with intelligent chunking
 */
function getSmartCollectionEntries<T extends { label: string; value: unknown }>(
  entries: Array<T>,
  limit: number
): Array<T | { from: number; to: number; isRange: true }> {
  if (entries.length <= limit || limit < 7) {
    return entries;
  }

  // Show first few items, ranges for middle, and last few items
  const result: Array<T | { from: number; to: number; isRange: true }> = [];

  // First items
  result.push(...entries.slice(0, Math.min(4, limit - 4)));

  // Middle ranges
  if (entries.length > limit) {
    const ranges = getRanges(limit - 4, entries.length - 5, limit);
    result.push(...ranges.map((r) => ({ ...r, isRange: true as const })));
  }

  // Last items
  result.push(...entries.slice(Math.max(4, entries.length - 4)));

  return result;
}

/**
 * Legacy chunk function for backward compatibility
 */
function chunkArray<T extends { label: string; value: unknown }>(
  array: Array<T>,
  size: number
): Array<Array<T>> {
  if (size < 1) return [];
  let i = 0;
  const result: Array<Array<T>> = [];
  while (i < array.length) {
    result.push(array.slice(i, i + size));
    i = i + size;
  }
  return result;
}

// Memoized leaf component with stable props - only re-renders when expanded state changes
const Expander = React.memo(({ expanded }: { expanded: boolean }) => (
  <View
    style={[styles.expanderIcon, expanded ? styles.expanded : styles.collapsed]}
  >
    <Svg width={12} height={12} viewBox="0 0 16 16" fill="#6B7280">
      <Path d="M6 12l4-4-4-4" strokeWidth={2} stroke="#6B7280" />
    </Svg>
  </View>
));

type CopyState = "NoCopy" | "SuccessCopy" | "ErrorCopy";

// Stable constants to avoid inline object creation
const STABLE_EMPTY_ARRAY: object[] = [];
const STABLE_EMPTY_KEY_PATH: string[] = [];
const HIT_SLOP_10 = 10;

// Stable style objects to avoid inline style creation
const STABLE_BASE_TYPE_STYLE = {
  fontSize: 9,
  fontWeight: "600" as const,
  fontFamily: "monospace" as const,
  opacity: 0.7,
  minWidth: 24,
  textAlign: "center" as const,
  backgroundColor: "rgba(255, 255, 255, 0.02)",
  paddingHorizontal: 3,
  paddingVertical: 1,
  borderRadius: 2,
  borderWidth: 0.5,
};

// Module-scope functions to avoid recreation on every render
const getTypeIcon = (type: string): string => {
  switch (type) {
    case "string":
      return "Aa";
    case "number":
      return "123";
    case "bigint":
      return "123n";
    case "boolean":
      return "bool";
    case "null":
      return "null";
    case "undefined":
      return "?";
    case "function":
      return "f()";
    case "symbol":
      return "§";
    case "date":
      return "📅";
    case "error":
      return "⚠";
    case "regexp":
      return "/.*/";
    case "array":
      return "[]";
    case "object":
      return "{}";
    case "map":
      return "Map";
    case "set":
      return "Set";
    case "iterable":
      return "⟲";
    default:
      return "○";
  }
};

const getTypeColor = (type: string): string => {
  switch (type) {
    case "string":
      return "#22D3EE";
    case "number":
    case "bigint":
      return "#3B82F6";
    case "boolean":
      return "#F59E0B";
    case "null":
    case "undefined":
      return "#9CA3AF";
    case "function":
    case "symbol":
      return "#A855F7";
    case "date":
      return "#EC4899";
    case "error":
      return "#EF4444";
    default:
      return "#10B981";
  }
};

// Memoized leaf component - only re-renders when valueType changes
const TypeIndicator = React.memo(({ valueType }: { valueType: string }) => {
  const color = getTypeColor(valueType);
  return (
    <Text
      style={{
        ...STABLE_BASE_TYPE_STYLE,
        color,
        borderColor: `${color}20`,
      }}
    >
      {getTypeIcon(valueType)}
    </Text>
  );
});

// Memoized value display component to avoid style recalculation
const ValueDisplay = React.memo(
  ({
    value,
    valueType,
    valueRenderer,
    currentKeyPath,
  }: {
    value: any;
    valueType: string;
    valueRenderer?: ValueRenderer;
    currentKeyPath: string[];
  }) => (
    <Text style={[styles.displayValueText, getValueTypeStyle(valueType)]}>
      {valueRenderer
        ? valueRenderer(value, value, currentKeyPath)
        : formatValue(value, valueType)}
    </Text>
  )
);

// Memoized toggle button that only re-renders when showTypes changes
const TypeToggleButton = React.memo(
  ({ showTypes, onToggle }: { showTypes: boolean; onToggle: () => void }) => (
    <TouchableOpacity
      style={[
        styles.typeToggleButton,
        showTypes && styles.typeToggleButtonActive,
      ]}
      onPress={onToggle}
      accessibilityLabel={`${showTypes ? "Hide" : "Show"} type indicators`}
      accessibilityRole="button"
      hitSlop={HIT_SLOP_10}
    >
      <Text
        style={[
          styles.typeToggleText,
          showTypes && styles.typeToggleTextActive,
        ]}
      >
        Aa
      </Text>
    </TouchableOpacity>
  )
);

const CopyButton = ({ value }: { value: any }) => {
  const [copyState, setCopyState] = useState<CopyState>("NoCopy");
  const { onCopy } = useCopy();

  const handleCopy = async () => {
    if (!onCopy) {
      Alert.alert(
        "Warning",
        "Copy functionality is not configured. Please add a copy function to DevToolsBubble. See documentation for setup instructions."
      );
      return;
    }

    try {
      const copied = await onCopy(JSON.stringify(value, null, 2));
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
  };

  return (
    <TouchableOpacity
      style={styles.copyButton}
      onPress={copyState === "NoCopy" ? handleCopy : undefined}
      accessibilityLabel={
        copyState === "NoCopy"
          ? "Copy object to clipboard"
          : copyState === "SuccessCopy"
          ? "Object copied to clipboard"
          : "Error copying object to clipboard"
      }
      hitSlop={HIT_SLOP_10}
    >
      <Copy
        size={16}
        color={
          copyState === "SuccessCopy"
            ? "#22C55E"
            : copyState === "ErrorCopy"
            ? "#EF4444"
            : "#9CA3AF"
        }
      />
      {copyState !== "NoCopy" && (
        <Text
          style={[
            styles.copyFeedback,
            copyState === "ErrorCopy" && styles.copyError,
          ]}
        >
          {copyState === "SuccessCopy" ? "Copied!" : "Error"}
        </Text>
      )}
    </TouchableOpacity>
  );
};

// Range component for displaying collapsed ranges
const RangeComponent: React.FC<{
  from: number;
  to: number;
  entries: Array<{ label: string; value: unknown }>;
  depth: number;
  maxDepth: number;
  chunkSize: number;
  ancestors: object[];
  keyPath: string[];
  valueRenderer?: ValueRenderer;
  labelRenderer?: LabelRenderer;
  sortObjectKeys?: SortObjectKeys;
  theme?: "dark" | "light" | "auto";
  defaultExpanded?: boolean;
  showTypeIndicators?: boolean;
  onToggleTypeIndicators?: () => void;
  isExternallyControlled?: boolean;
}> = ({
  from,
  to,
  entries,
  depth,
  maxDepth,
  chunkSize,
  ancestors,
  keyPath,
  valueRenderer,
  labelRenderer,
  sortObjectKeys,
  theme,
  defaultExpanded,
  showTypeIndicators,
  onToggleTypeIndicators,
  isExternallyControlled,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const rangeEntries = entries.slice(from, to + 1);

  return (
    <View style={styles.rangeContainer}>
      <TouchableOpacity
        style={styles.rangeButton}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${
          isExpanded ? "Collapse" : "Expand"
        } range ${from} to ${to}`}
      >
        <Expander expanded={isExpanded} />
        <Text style={styles.rangeText}>
          {from} ... {to}
        </Text>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.rangeContent}>
          {rangeEntries.map((entry, index) => (
            <InternalExplorer
              key={entry.label + index}
              defaultExpanded={defaultExpanded}
              label={entry.label}
              value={entry.value}
              depth={depth + 1}
              maxDepth={maxDepth}
              chunkSize={chunkSize}
              ancestors={ancestors}
              keyPath={keyPath}
              valueRenderer={valueRenderer}
              labelRenderer={labelRenderer}
              sortObjectKeys={sortObjectKeys}
              theme={theme}
              showTypeIndicators={showTypeIndicators}
              onToggleTypeIndicators={onToggleTypeIndicators}
              isExternallyControlled={isExternallyControlled}
            />
          ))}
        </View>
      )}
    </View>
  );
};

type ValueRenderer = (
  value: unknown,
  originalValue: unknown,
  keyPath: string[]
) => string;
type LabelRenderer = (
  keyPath: string[],
  nodeType: string,
  expanded: boolean,
  expandable: boolean
) => string;
type SortObjectKeys = ((a: string, b: string) => number) | boolean;

interface DataExplorerProps {
  title: string;
  data: unknown;
  defaultExpanded?: boolean;
  maxDepth?: number;
  chunkSize?: number;
  valueRenderer?: ValueRenderer;
  labelRenderer?: LabelRenderer;
  sortObjectKeys?: SortObjectKeys;
  theme?: "dark" | "light" | "auto";
  showTypeIndicators?: boolean;
}

interface InternalExplorerProps {
  label: string;
  value: any;
  defaultExpanded?: boolean;
  depth?: number;
  maxDepth?: number;
  chunkSize?: number;
  ancestors?: object[];
  keyPath?: string[];
  valueRenderer?: ValueRenderer;
  labelRenderer?: LabelRenderer;
  sortObjectKeys?: SortObjectKeys;
  theme?: "dark" | "light" | "auto";
  showTypeIndicators?: boolean;
  onToggleTypeIndicators?: () => void;
  isExternallyControlled?: boolean;
}

const InternalExplorer: React.FC<InternalExplorerProps> = ({
  label,
  value,
  defaultExpanded = false,
  depth = 0,
  maxDepth = 10,
  chunkSize = 100,
  ancestors = STABLE_EMPTY_ARRAY,
  keyPath = STABLE_EMPTY_KEY_PATH,
  valueRenderer,
  labelRenderer,
  sortObjectKeys = false,
  theme = "dark",
  showTypeIndicators = false,
  onToggleTypeIndicators,
  isExternallyControlled = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded && depth < 2);

  const toggleExpanded = () => setIsExpanded((old) => !old);

  // Check for circular references by looking for this value in ancestors
  const isCircularRef =
    value && typeof value === "object" && ancestors.includes(value);

  // Create new ancestors array including current value
  const newAncestors =
    value && typeof value === "object" && !isCircularRef
      ? [...ancestors, value]
      : ancestors;

  // Get enhanced type information
  // useMemo justified: Type detection involves complex recursive checks and instanceof operations
  // that are more expensive than memoization overhead, especially during deep object traversal
  const valueType = useMemo(() => getValueType(value), [value]);

  // Flattens data to label and value properties for easy rendering.
  const subEntries = (() => {
    if (isCircularRef) {
      return []; // Don't render children for circular references
    }

    switch (valueType) {
      case "array":
        return value.map((d: any, i: number) => ({
          label: i.toString(),
          value: d,
        }));

      case "map":
        return Array.from(value, ([key, val]: [any, any]) => ({
          label: key.toString(),
          value: val,
        }));

      case "set":
        return Array.from(value, (val: any, i: number) => ({
          label: i.toString(),
          value: val,
        }));

      case "iterable":
        return Array.from(value, (val: any, i: number) => ({
          label: i.toString(),
          value: val,
        }));

      case "object":
        let objectEntries = Object.entries(value);

        // Apply object key sorting if specified
        if (sortObjectKeys) {
          if (typeof sortObjectKeys === "function") {
            objectEntries.sort(([a], [b]) => sortObjectKeys(a, b));
          } else {
            objectEntries.sort(([a], [b]) => a.localeCompare(b));
          }
        }

        return objectEntries.map(([key, val]) => ({
          label: key,
          value: val,
        }));

      case "error":
        // Show error properties
        const errorEntries = Object.getOwnPropertyNames(value).map((key) => ({
          label: key,
          value: (value as any)[key],
        }));
        // Add stack if it exists and isn't already included
        if (value.stack && !errorEntries.some((e) => e.label === "stack")) {
          errorEntries.push({ label: "stack", value: value.stack });
        }
        return errorEntries;

      default:
        return [];
    }
  })();

  // Smart chunking with ranges for large collections
  const smartEntries = getSmartCollectionEntries(subEntries, chunkSize);

  // Current key path for this node
  const currentKeyPath = [...keyPath, label];

  // Handle circular references
  if (isCircularRef) {
    return (
      <View style={styles.circularContainer}>
        <Text style={styles.text344054}>{label}:</Text>
        <Text style={styles.circularText}>[Circular Reference]</Text>
      </View>
    );
  }

  // Don't render if we've exceeded max depth
  if (depth >= maxDepth) {
    return (
      <View style={styles.maxDepthContainer}>
        <Text style={styles.text344054}>{label}:</Text>
        <Text style={styles.maxDepthText}>
          [Max depth reached: {formatValue(value, valueType)}]
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.minWidthWrapper}>
      <View style={styles.fullWidthMarginRight}>
        {smartEntries.length > 0 && (
          <>
            <View style={styles.flexRowItemsCenterGap}>
              <TouchableOpacity
                style={styles.expanderButton}
                onPress={toggleExpanded}
                accessibilityRole="button"
                accessibilityLabel={`${
                  isExpanded ? "Collapse" : "Expand"
                } ${label}`}
              >
                <Expander expanded={isExpanded} />
                <Text style={styles.labelText}>{label}</Text>
                <Text style={styles.typeIndicator}>
                  {getTypeIndicator(valueType, subEntries.length)}
                </Text>
                <Text style={styles.textGray500}>
                  {`${subEntries.length} ${
                    valueType === "object"
                      ? subEntries.length > 1
                        ? "keys"
                        : "key"
                      : valueType === "map"
                      ? subEntries.length > 1
                        ? "entries"
                        : "entry"
                      : valueType === "set"
                      ? subEntries.length > 1
                        ? "items"
                        : "item"
                      : subEntries.length > 1
                      ? "items"
                      : "item"
                  }`}
                </Text>
              </TouchableOpacity>
              {depth === 0 &&
                label === "root" &&
                !isExternallyControlled &&
                onToggleTypeIndicators && (
                  <TypeToggleButton
                    showTypes={showTypeIndicators}
                    onToggle={onToggleTypeIndicators}
                  />
                )}
              <CopyButton value={value} />
            </View>
            {isExpanded && (
              <>
                <View style={styles.singleEntryContainer}>
                  {smartEntries.map((entry: any, index: number) => {
                    if ("isRange" in entry && entry.isRange) {
                      // Render range component
                      return (
                        <RangeComponent
                          key={`range-${entry.from}-${entry.to}`}
                          from={entry.from}
                          to={entry.to}
                          entries={subEntries}
                          depth={depth}
                          maxDepth={maxDepth}
                          chunkSize={chunkSize}
                          ancestors={newAncestors}
                          keyPath={currentKeyPath}
                          valueRenderer={valueRenderer}
                          labelRenderer={labelRenderer}
                          sortObjectKeys={sortObjectKeys}
                          theme={theme}
                          defaultExpanded={defaultExpanded}
                          showTypeIndicators={showTypeIndicators}
                          onToggleTypeIndicators={onToggleTypeIndicators}
                          isExternallyControlled={isExternallyControlled}
                        />
                      );
                    }

                    return (
                      <InternalExplorer
                        key={entry.label + index}
                        defaultExpanded={defaultExpanded}
                        label={entry.label}
                        value={entry.value}
                        depth={depth + 1}
                        maxDepth={maxDepth}
                        chunkSize={chunkSize}
                        ancestors={newAncestors}
                        keyPath={currentKeyPath}
                        valueRenderer={valueRenderer}
                        labelRenderer={labelRenderer}
                        sortObjectKeys={sortObjectKeys}
                        theme={theme}
                        showTypeIndicators={showTypeIndicators}
                        onToggleTypeIndicators={onToggleTypeIndicators}
                        isExternallyControlled={isExternallyControlled}
                      />
                    );
                  })}
                </View>
              </>
            )}
          </>
        )}
        {smartEntries.length === 0 && (
          <View style={styles.flexRowGapFullWidth}>
            <Text
              style={[
                styles.text344054,
                /^\d+$/.test(label) && styles.arrayIndexLabel,
              ]}
            >
              {labelRenderer
                ? labelRenderer(currentKeyPath, valueType, false, false)
                : `${label}:`}
            </Text>
            <View style={styles.valueWithTypeContainer}>
              {showTypeIndicators && <TypeIndicator valueType={valueType} />}
              <ValueDisplay
                value={value}
                valueType={valueType}
                valueRenderer={valueRenderer}
                currentKeyPath={currentKeyPath}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export const DataExplorer: React.FC<DataExplorerProps> = ({
  title,
  data,
  defaultExpanded = false,
  maxDepth = 10,
  chunkSize = 100,
  valueRenderer,
  labelRenderer,
  sortObjectKeys = false,
  theme = "dark",
  showTypeIndicators: externalShowTypeIndicators,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isLoaded, setIsLoaded] = useState(defaultExpanded);
  const [internalShowTypeIndicators, setInternalShowTypeIndicators] =
    useState(false);

  // Use external prop if provided, otherwise use internal state
  const showTypeIndicators =
    externalShowTypeIndicators !== undefined
      ? externalShowTypeIndicators
      : internalShowTypeIndicators;

  const toggleExpanded = () => {
    if (!isLoaded && !isExpanded) {
      // Defer loading until first expansion
      setIsLoaded(true);
    }
    setIsExpanded(!isExpanded);
  };

  const hasData =
    data &&
    (typeof data === "object" || Array.isArray(data)) &&
    (Array.isArray(data)
      ? data.length > 0
      : Object.keys(data as object).length > 0);

  if (!hasData) {
    return (
      <View style={styles.section}>
        <Text style={styles.noDataText}>No data available for {title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={HIT_SLOP_10}
          style={styles.expandButton}
          onPress={toggleExpanded}
          accessibilityRole="button"
          accessibilityLabel={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
          accessibilityHint={`${isExpanded ? "Hide" : "Show"} ${title} details`}
        >
          <Text style={styles.sectionLabel}>{title}</Text>
          <Expander expanded={isExpanded} />
        </TouchableOpacity>

        <View style={styles.copyContainer}>
          <CopyButton value={data} />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.jsonContainer}>
          {isLoaded ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.jsonContent}>
                <InternalExplorer
                  label="root"
                  value={data}
                  defaultExpanded={true}
                  depth={0}
                  maxDepth={maxDepth}
                  chunkSize={chunkSize}
                  ancestors={STABLE_EMPTY_ARRAY}
                  keyPath={STABLE_EMPTY_KEY_PATH}
                  valueRenderer={valueRenderer}
                  labelRenderer={labelRenderer}
                  sortObjectKeys={sortObjectKeys}
                  theme={theme}
                  showTypeIndicators={showTypeIndicators}
                  onToggleTypeIndicators={() =>
                    setInternalShowTypeIndicators(!internalShowTypeIndicators)
                  }
                  isExternallyControlled={
                    externalShowTypeIndicators !== undefined
                  }
                />
              </View>
            </ScrollView>
          ) : (
            <Text style={styles.loadingText}>Loading...</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  expandButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  copyContainer: {
    position: "relative",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  copyButton: {
    padding: 8,
    borderRadius: 4,
    position: "relative",
  },
  copyFeedback: {
    position: "absolute",
    top: -12,
    color: "#22C55E",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    minWidth: 50,
  },
  copyError: {
    color: "#EF4444",
  },
  typeToggleButton: {
    padding: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  typeToggleButtonActive: {
    borderColor: "rgba(34, 211, 238, 0.5)",
    backgroundColor: "rgba(34, 211, 238, 0.1)",
  },
  typeToggleText: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  typeToggleTextActive: {
    color: "#22D3EE",
  },
  sectionLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
  },
  jsonContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  jsonContent: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingText: {
    color: "#9CA3AF",
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  noDataText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 8,
  },
  // Explorer styles
  expanderIcon: {
    width: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  expanded: {
    transform: [{ rotate: "90deg" }],
  },
  collapsed: {
    transform: [{ rotate: "0deg" }],
  },
  minWidthWrapper: {
    minWidth: 200,
    fontSize: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
  },
  fullWidthMarginRight: {
    position: "relative",
    width: "100%",
    marginRight: 1,
  },
  flexRowItemsCenterGap: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 1,
    paddingHorizontal: 2,
    marginVertical: 1,
    gap: 6,
  },
  expanderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 2,
    gap: 4,
    borderWidth: 0,
    minHeight: 24,
  },
  labelText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  textGray500: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "400",
  },
  pageRangeText: {
    color: "#F9FAFB",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  flexRowGapItemsCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 4,
  },
  singleEntryContainer: {
    marginLeft: 8,
    marginTop: 2,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  multiEntryContainer: {
    marginLeft: 8,
    marginTop: 2,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  relativeOutlineNone: {
    position: "relative",
  },
  pageExpanderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 4,
    gap: 6,
    borderWidth: 0,
    marginBottom: 4,
    minHeight: 24,
  },
  entriesContainer: {
    marginLeft: 8,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginTop: 2,
  },
  flexRowGapFullWidth: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginVertical: 1,
    gap: 6,
  },
  text344054: {
    color: "#F9FAFB",
    fontWeight: "500",
    fontSize: 12,
    minWidth: 50,
  },
  arrayIndexLabel: {
    minWidth: 20,
    textAlign: "right",
  },
  displayValueText: {
    color: "#10B981",
    fontWeight: "500",
    fontFamily: "monospace",
    fontSize: 12,
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: "rgba(16, 185, 129, 0.03)",
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: "rgba(16, 185, 129, 0.15)",
    flexShrink: 1,
  },
  valueWithTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  maxDepthContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginVertical: 1,
    gap: 6,
  },
  maxDepthText: {
    flex: 1,
    color: "#F59E0B",
    fontWeight: "500",
    fontFamily: "monospace",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(245, 158, 11, 0.05)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.1)",
    fontStyle: "italic",
  },
  circularContainer: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginVertical: 1,
    gap: 6,
  },
  circularText: {
    flex: 1,
    color: "#EF4444",
    fontWeight: "500",
    fontFamily: "monospace",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(239, 68, 68, 0.05)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.1)",
    fontStyle: "italic",
  },
  typeIndicator: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "monospace",
    marginRight: 6,
  },
  rangeContainer: {
    marginVertical: 2,
  },
  rangeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 2,
    gap: 4,
    borderWidth: 0,
    minHeight: 24,
  },
  rangeText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  rangeContent: {
    marginLeft: 8,
    marginTop: 2,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
});
