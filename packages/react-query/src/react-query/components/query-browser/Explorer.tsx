import { useState, useMemo, useCallback, useRef, useEffect, memo } from "react";
import { JsonValue } from "../../types/types";
import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";
import { updateNestedDataByPath } from "../../utils/updateNestedDataByPath";
import { displayValue } from "@react-buoy/shared-ui";
import deleteItem from "../../utils/actions/deleteItem";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { CopyButton as SharedCopyButton } from "@react-buoy/shared-ui";
import { gameUIColors } from "@react-buoy/shared-ui";
import { ChevronRight, ChevronDown, Trash } from "@react-buoy/shared-ui";
import { CyberpunkInput } from "@react-buoy/shared-ui/dataViewer";

// Stable constants to prevent re-renders [[memory:4875251]]
const CHUNK_SIZE = 100;
const HIT_SLOP_OPTIMIZED = { top: 8, bottom: 8, left: 8, right: 8 };

const EXPANDER_SIZE = 12;

// Optimized chunking function moved to module scope [[memory:4875251]]
const chunkArray = <T extends { label: string; value: JsonValue }>(
  array: T[],
  size: number = CHUNK_SIZE
): T[][] => {
  if (size < 1 || array.length === 0) return [];
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
// Memoized Expander component for performance [[memory:4875251]]
const Expander = memo(
  ({
    expanded,
    isFocused = false,
    isMain = false,
  }: {
    expanded: boolean;
    isFocused?: boolean;
    isMain?: boolean;
  }) => {
    return (
      <View
        style={[
          styles.expanderIcon,
          isMain && styles.expanderIconMain,
          expanded ? styles.expanded : styles.collapsed,
        ]}
      >
        {expanded ? (
          <ChevronDown
            size={isMain ? 14 : EXPANDER_SIZE}
            color={
              isFocused
                ? gameUIColors.info
                : isMain
                ? gameUIColors.primaryLight
                : gameUIColors.secondary
            }
            strokeWidth={2.5}
          />
        ) : (
          <ChevronRight
            size={isMain ? 14 : EXPANDER_SIZE}
            color={
              isFocused
                ? gameUIColors.info
                : isMain
                ? gameUIColors.primaryLight
                : gameUIColors.secondary
            }
            strokeWidth={2.5}
          />
        )}
      </View>
    );
  }
);
Expander.displayName = "Expander";
// Local wrapper for the shared CopyButton to maintain backward compatibility
const CopyButton = memo(
  ({ value, isFocused = false }: { value: JsonValue; isFocused?: boolean }) => {
    return (
      <SharedCopyButton
        value={value}
        isFocused={isFocused}
        buttonStyle={
          isFocused
            ? { ...styles.buttonStyle, ...styles.buttonStyleFocused }
            : styles.buttonStyle
        }
      />
    );
  }
);
CopyButton.displayName = "CopyButton";

// Memoized DeleteItemButton component [[memory:4875251]]
const DeleteItemButton = memo(
  ({
    dataPath,
    activeQuery,
    isFocused = false,
  }: {
    dataPath: string[];
    activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
    isFocused?: boolean;
  }) => {
    const queryClient = useQueryClient();

    const handleDelete = useCallback(() => {
      if (!activeQuery) return;
      deleteItem({
        queryClient,
        activeQuery: activeQuery,
        dataPath: dataPath,
      });
    }, [queryClient, activeQuery, dataPath]);

    if (!activeQuery) return null;

    return (
      <TouchableOpacity
        sentry-label="ignore devtools explorer delete button"
        onPress={handleDelete}
        style={[styles.deleteButton, isFocused && styles.deleteButtonFocused]}
        accessibilityLabel="Delete item"
        hitSlop={HIT_SLOP_OPTIMIZED}
        activeOpacity={0.7}
      >
        <Trash
          size={14}
          strokeWidth={2}
          color={isFocused ? gameUIColors.error : gameUIColors.error + "CC"}
        />
      </TouchableOpacity>
    );
  }
);
DeleteItemButton.displayName = "DeleteItemButton";
// Memoized ClearArrayButton component [[memory:4875251]]
const ClearArrayButton = memo(
  ({
    dataPath,
    activeQuery,
    isFocused = false,
  }: {
    dataPath: string[];
    activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
    isFocused?: boolean;
  }) => {
    const queryClient = useQueryClient();

    const handleClear = useCallback(() => {
      if (!activeQuery) return;
      const oldData = activeQuery.state.data as unknown as JsonValue;
      const newData = updateNestedDataByPath(oldData, dataPath, []);
      queryClient.setQueryData(activeQuery.queryKey, newData);
    }, [queryClient, activeQuery, dataPath]);

    if (!activeQuery) return null;

    return (
      <TouchableOpacity
        sentry-label="ignore devtools explorer clear button"
        style={[styles.clearButton, isFocused && styles.clearButtonFocused]}
        aria-label="Remove all items"
        onPress={handleClear}
        hitSlop={HIT_SLOP_OPTIMIZED}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.clearButtonText,
            {
              color: isFocused
                ? gameUIColors.warning
                : gameUIColors.warning + "CC",
            },
          ]}
        >
          []
        </Text>
      </TouchableOpacity>
    );
  }
);
ClearArrayButton.displayName = "ClearArrayButton";
// Memoized ToggleValueButton with pre-computed styles [[memory:4875251]]
const ToggleValueButton = memo(
  ({
    dataPath,
    activeQuery,
    value,
    itemsDeletable,
  }: {
    dataPath: string[];
    activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
    value: JsonValue;
    itemsDeletable?: boolean;
  }) => {
    const queryClient = useQueryClient();

    const handleClick = useCallback(() => {
      if (!activeQuery) return;
      const oldData = activeQuery.state.data as unknown as JsonValue;
      const currentValue = typeof value === "boolean" ? value : false;
      const newData = updateNestedDataByPath(oldData, dataPath, !currentValue);
      queryClient.setQueryData(activeQuery.queryKey, newData);
    }, [queryClient, activeQuery, dataPath, value]);

    const handleDelete = useCallback(() => {
      if (!activeQuery) return;
      deleteItem({
        queryClient,
        activeQuery: activeQuery,
        dataPath: dataPath,
      });
    }, [queryClient, activeQuery, dataPath]);

    if (!activeQuery) return null;

    // Pre-compute styles based on value state [[memory:4875251]]
    const iconStyle = value ? styles.toggleIconTrue : styles.toggleIconFalse;
    const badgeStyle = value ? styles.toggleBadgeTrue : styles.toggleBadgeFalse;
    const textStyle = value ? styles.toggleTextTrue : styles.toggleTextFalse;

    return (
      <TouchableOpacity
        sentry-label="ignore devtools explorer toggle button"
        style={styles.modernToggleButton}
        onPress={handleClick}
        hitSlop={HIT_SLOP_OPTIMIZED}
        activeOpacity={0.8}
      >
        <View style={[styles.toggleBadge, badgeStyle]}>
          <Text style={[styles.toggleBadgeText, textStyle]}>
            {value ? "TRUE" : "FALSE"}
          </Text>
        </View>
        {itemsDeletable && (
          <TouchableOpacity
            sentry-label="ignore devtools explorer delete button in toggle"
            onPress={handleDelete}
            style={styles.deleteButtonInToggle}
            accessibilityLabel="Delete item"
            hitSlop={HIT_SLOP_OPTIMIZED}
            activeOpacity={0.7}
          >
            <Trash
              size={14}
              strokeWidth={2}
              color={gameUIColors.error + "CC"}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }
);
ToggleValueButton.displayName = "ToggleValueButton";
type Props = {
  editable?: boolean;
  label: string;
  value: JsonValue;
  defaultExpanded?: string[];
  activeQuery?: Query<unknown, Error, unknown, QueryKey> | undefined;
  dataPath?: string[];
  itemsDeletable?: boolean;
  dataVersion?: number;
};
// Optimized Explorer component following rule2 guidelines [[memory:4875251]]
/**
 * Recursive data explorer component used for both editable and read-only JSON trees inside the
 * React Query dev tools.
 */
export default function Explorer({
  editable,
  label,
  value,
  defaultExpanded,
  activeQuery,
  dataPath,
  itemsDeletable,
  dataVersion = 0,
}: Props) {
  const queryClient = useQueryClient();
  const [isRowFocused, setIsRowFocused] = useState(false);

  // Local state for input value to handle typing properly
  const [localInputValue, setLocalInputValue] = useState<string>("");

  // Sync local state with prop value
  // ⚠️ CRITICAL: Do NOT add localInputValue to the dependency array!
  // Adding localInputValue causes a race condition where user edits get reverted:
  // 1. User types "5101" → setLocalInputValue("5101")
  // 2. Cache updates
  // 3. useEffect fires because localInputValue changed
  // 4. At this moment, value prop is still old (5100)
  // 5. Syncs back to 5100, reverting user's change ❌
  // Only sync when EXTERNAL changes happen (value, label, dataVersion)
  useEffect(() => {
    if (
      value !== null &&
      value !== undefined &&
      (typeof value === "string" || typeof value === "number")
    ) {
      const newValue = value.toString();
      setLocalInputValue(newValue);
    }
  }, [value, label, dataVersion]); // ⚠️ DO NOT add localInputValue here!

  // Determine if this is a main section
  const isMainSection = useMemo(() => {
    const upperLabel = label.toUpperCase();
    return [
      "DATA",
      "QUERY",
      "QUERYKEY",
      "TYPES",
      "STATS",
      "OPTIONS",
      "OBSERVERS",
    ].includes(upperLabel);
  }, [label]);

  // Explorer's section is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(
    (defaultExpanded || []).includes(label)
  );
  // Remove unnecessary useCallback - simple state setter [[memory:4875251]]
  const toggleExpanded = () => setIsExpanded((old) => !old);
  const [expandedPages, setExpandedPages] = useState<number[]>([]);

  // Optimized subEntries computation with early returns and limited processing [[memory:4875251]]
  const subEntries = useMemo(() => {
    // Early return for primitive values to avoid unnecessary computation
    if (value === null || value === undefined || typeof value !== "object") {
      return [];
    }

    if (Array.isArray(value)) {
      // Limit array processing for performance [[memory:4875251]]
      const limitedValue = (
        value.length > 1000 ? value.slice(0, 1000) : value
      ) as JsonValue[];
      return limitedValue.map(
        (d: JsonValue, i): { label: string; value: JsonValue } => ({
          label: i.toString(),
          value: d,
        })
      );
    }

    if (value instanceof Map) {
      // Limit Map entries for performance
      const entries = Array.from(value.entries()).slice(0, 1000);
      return entries.map(([key, val]): { label: string; value: JsonValue } => ({
        label: key.toString(),
        value: val,
      }));
    }

    if (value instanceof Set) {
      // Limit Set entries for performance
      const entries = Array.from(value).slice(0, 1000);
      return entries.map((val, i): { label: string; value: JsonValue } => ({
        label: i.toString(),
        value: val,
      }));
    }

    // Handle regular objects with key limiting
    const entries = Object.entries(value as Record<string, JsonValue>).slice(
      0,
      1000
    );
    return entries.map(([key, val]): { label: string; value: JsonValue } => ({
      label: key,
      value: val,
    }));
  }, [value]);

  // Optimized valueType computation with early returns [[memory:4875251]]
  const valueType = useMemo(() => {
    if (Array.isArray(value)) return "array";
    if (value === null || typeof value !== "object") return typeof value;
    if (value instanceof Map || value instanceof Set) return "Iterable";
    return "object";
  }, [value]);

  // Optimized chunking with stable chunk size [[memory:4875251]]
  const subEntryPages = useMemo(() => {
    return chunkArray(subEntries, CHUNK_SIZE);
  }, [subEntries]);

  const currentDataPath = dataPath ?? [];

  // Optimize handleChange using refs to avoid dependency arrays [[memory:4875251]]
  const activeQueryRef = useRef(activeQuery);
  const dataPathRef = useRef(currentDataPath);
  const valueTypeRef = useRef(valueType);
  activeQueryRef.current = activeQuery;
  dataPathRef.current = currentDataPath;
  valueTypeRef.current = valueType;

  const handleChange = useCallback(
    (isNumber: boolean, newValue: string) => {
      // Update local state immediately for responsive typing
      setLocalInputValue(newValue);

      if (!activeQueryRef.current) return;
      const oldData = activeQueryRef.current.state.data as unknown as JsonValue;
      if (isNumber && isNaN(Number(newValue))) return;
      const updatedValue =
        valueTypeRef.current === "number" ? Number(newValue) : newValue;

      const newData = updateNestedDataByPath(
        oldData,
        dataPathRef.current,
        updatedValue
      );

      queryClient.setQueryData(activeQueryRef.current.queryKey, newData);
    },
    [queryClient, setLocalInputValue]
  );

  return (
    <View style={styles.minWidthWrapper}>
      <View style={styles.fullWidthMarginRight}>
        {subEntryPages.length > 0 && (
          <>
            <View
              style={[
                styles.flexRowItemsCenterGap,
                isMainSection && styles.flexRowItemsCenterGapMain,
              ]}
            >
              <TouchableOpacity
                sentry-label="ignore devtools explorer expander button"
                style={styles.expanderButton}
                onPress={toggleExpanded}
                hitSlop={HIT_SLOP_OPTIMIZED}
                activeOpacity={0.6}
              >
                <Expander
                  expanded={isExpanded}
                  isFocused={isRowFocused}
                  isMain={isMainSection}
                />
                <Text
                  style={[
                    styles.labelText,
                    isRowFocused && styles.labelTextFocused,
                    isMainSection && styles.labelTextMain,
                  ]}
                >
                  {label}
                </Text>
                <Text style={styles.textGray500}>{`${
                  String(valueType).toLowerCase() === "iterable"
                    ? "(Iterable) "
                    : ""
                }${subEntries.length} ${
                  subEntries.length > 1 ? `items` : `item`
                }`}</Text>
              </TouchableOpacity>
              {editable && (
                <View style={styles.flexRowGapItemsCenter}>
                  <CopyButton value={value} isFocused={isRowFocused} />
                  {itemsDeletable && activeQuery !== undefined && (
                    <DeleteItemButton
                      activeQuery={activeQuery}
                      dataPath={currentDataPath}
                      isFocused={isRowFocused}
                    />
                  )}
                  {valueType === "array" && activeQuery !== undefined && (
                    <ClearArrayButton
                      activeQuery={activeQuery}
                      dataPath={currentDataPath}
                      isFocused={isRowFocused}
                    />
                  )}
                </View>
              )}
            </View>
            {isExpanded && (
              <>
                {subEntryPages.length === 1 && (
                  <View
                    style={[
                      styles.singleEntryContainer,
                      isMainSection && styles.singleEntryContainerMain,
                    ]}
                  >
                    {subEntries.map((entry, index) => (
                      <Explorer
                        key={entry.label + index}
                        defaultExpanded={defaultExpanded}
                        label={entry.label}
                        value={entry.value}
                        editable={editable}
                        dataPath={[...currentDataPath, entry.label]}
                        activeQuery={activeQuery}
                        itemsDeletable={
                          valueType === "array" ||
                          valueType === "Iterable" ||
                          valueType === "object"
                        }
                        dataVersion={dataVersion}
                      />
                    ))}
                  </View>
                )}
                {subEntryPages.length > 1 && (
                  <View style={styles.multiEntryContainer}>
                    {subEntryPages.map((entries, index) => (
                      <View key={index}>
                        <View style={styles.relativeOutlineNone}>
                          <TouchableOpacity
                            sentry-label="ignore devtools explorer page toggle"
                            onPress={() =>
                              setExpandedPages((old) =>
                                old.includes(index)
                                  ? old.filter((d) => d !== index)
                                  : [...old, index]
                              )
                            }
                            style={styles.pageExpanderButton}
                            hitSlop={HIT_SLOP_OPTIMIZED}
                          >
                            <Expander
                              expanded={expandedPages.includes(index)}
                            />
                            <Text style={styles.pageRangeText}>
                              [{index * CHUNK_SIZE}...
                              {index * CHUNK_SIZE + CHUNK_SIZE - 1}]
                            </Text>
                          </TouchableOpacity>
                          {expandedPages.includes(index) && (
                            <View style={styles.entriesContainer}>
                              {entries.map((entry) => (
                                <Explorer
                                  key={entry.label}
                                  defaultExpanded={defaultExpanded}
                                  label={entry.label}
                                  value={entry.value}
                                  editable={editable}
                                  dataPath={[...currentDataPath, entry.label]}
                                  activeQuery={activeQuery}
                                  dataVersion={dataVersion}
                                />
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}
        {subEntryPages.length === 0 && (
          <View style={styles.flexRowGapFullWidth}>
            {editable &&
            activeQuery !== undefined &&
            (valueType === "string" ||
              valueType === "number" ||
              valueType === "boolean") ? (
              <>
                {editable &&
                  activeQuery &&
                  (valueType === "string" || valueType === "number") && (
                    <View style={styles.nebulaInputWrapper}>
                      <CyberpunkInput
                        label={label}
                        accessibilityLabel="Data input field for editing values"
                        style={[
                          valueType === "number"
                            ? styles.textNumber
                            : styles.textString,
                        ]}
                        keyboardType={
                          valueType === "number" ? "numeric" : "default"
                        }
                        value={localInputValue}
                        onChangeText={(newValue) =>
                          handleChange(valueType === "number", newValue)
                        }
                        onFocus={() => setIsRowFocused(true)}
                        onBlur={() => setIsRowFocused(false)}
                        showNumberControls={valueType === "number"}
                        onIncrement={() => {
                          const currentNum = Number(localInputValue) || 0;
                          handleChange(true, String(currentNum + 1));
                        }}
                        onDecrement={() => {
                          const currentNum = Number(localInputValue) || 0;
                          handleChange(true, String(currentNum - 1));
                        }}
                        showDeleteButton={itemsDeletable}
                        onDelete={() => {
                          deleteItem({
                            queryClient,
                            activeQuery,
                            dataPath: currentDataPath,
                          });
                        }}
                      />
                    </View>
                  )}
                {valueType === "boolean" && (
                  <View style={styles.booleanRowContainer}>
                    <Text style={styles.booleanLabel}>{label}</Text>
                    <View style={styles.booleanToggleWrapper}>
                      <ToggleValueButton
                        activeQuery={activeQuery}
                        dataPath={currentDataPath}
                        value={value}
                        itemsDeletable={itemsDeletable}
                      />
                    </View>
                  </View>
                )}
              </>
            ) : (
              <>
                <Text style={styles.text344054}>{label}</Text>
                <Text style={styles.displayValueText}>
                  {displayValue(value)}
                </Text>
              </>
            )}
            {editable &&
              itemsDeletable &&
              activeQuery !== undefined &&
              valueType !== "string" &&
              valueType !== "number" &&
              valueType !== "boolean" && (
                <DeleteItemButton
                  activeQuery={activeQuery}
                  dataPath={currentDataPath}
                  isFocused={isRowFocused}
                />
              )}
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  buttonStyle: {
    backgroundColor: gameUIColors.panel + "E6",
    borderWidth: 1,
    borderColor: gameUIColors.secondary + "33",
    borderRadius: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonStyleFocused: {
    borderColor: gameUIColors.info + "CC",
    backgroundColor: gameUIColors.info + "26",
    shadowColor: gameUIColors.info,
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteButton: {
    backgroundColor: gameUIColors.error + "1A",
    borderColor: gameUIColors.error + "4D",
    borderWidth: 1,
    borderRadius: 6,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    position: "relative",
    shadowColor: gameUIColors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  deleteButtonFocused: {
    borderColor: gameUIColors.error + "CC",
    backgroundColor: gameUIColors.error + "33",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  deleteButtonInToggle: {
    backgroundColor: gameUIColors.error + "1A",
    borderColor: gameUIColors.error + "4D",
    borderWidth: 1,
    borderRadius: 6,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    shadowColor: gameUIColors.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  clearButton: {
    backgroundColor: gameUIColors.warning + "1A",
    borderWidth: 1,
    borderColor: gameUIColors.warning + "4D",
    borderRadius: 6,
    flexDirection: "row",
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    position: "relative",
    zIndex: 10,
    shadowColor: gameUIColors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  clearButtonFocused: {
    borderColor: gameUIColors.warning + "CC",
    backgroundColor: gameUIColors.warning + "33",
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  expanderIcon: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 1,
    backgroundColor: gameUIColors.secondary + "14",
    borderRadius: 3,
  },
  expanderIconMain: {
    backgroundColor: gameUIColors.info + "1F",
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: gameUIColors.info + "4D",
  },
  expanded: {
    transform: [{ rotate: "0deg" }],
  },
  collapsed: {
    transform: [{ rotate: "0deg" }],
  },
  minWidthWrapper: {
    minWidth: 180,
    fontSize: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    marginVertical: 0.5,
  },
  fullWidthMarginRight: {
    position: "relative",
    width: "100%",
    marginRight: 1,
  },
  flexRowItemsCenterGap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 6,
    marginVertical: 1,
    borderRadius: 4,
    backgroundColor: gameUIColors.panel + "66",
    borderWidth: 0.5,
    borderColor: gameUIColors.secondary + "1A",
  },
  flexRowItemsCenterGapMain: {
    backgroundColor: gameUIColors.panel + "E6",
    borderLeftWidth: 2.5,
    borderLeftColor: gameUIColors.info + "99",
    borderColor: gameUIColors.info + "26",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 3,
    borderWidth: 1,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  expanderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    paddingVertical: 1,
    paddingHorizontal: 2,
    gap: 6,
    borderWidth: 0,
    minHeight: 24,
    flex: 1,
  },
  labelText: {
    color: gameUIColors.secondary,
    fontSize: 10,
    fontWeight: "600",
    marginRight: 4,
    fontFamily: "monospace",
    letterSpacing: 0.4,
  },
  labelTextFocused: {
    color: gameUIColors.info,
  },
  labelTextMain: {
    color: gameUIColors.primaryLight,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  textGray500: {
    color: gameUIColors.muted,
    fontSize: 10,
    fontWeight: "400",
    fontFamily: "monospace",
    opacity: 0.7,
  },
  pageRangeText: {
    color: gameUIColors.secondary,
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  flexRowGapItemsCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 2,
  },
  singleEntryContainer: {
    marginLeft: 2,
    marginTop: 2,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: gameUIColors.secondary + "40",
  },
  singleEntryContainerMain: {
    borderLeftColor: gameUIColors.info + "4D",
    marginLeft: 4,
    paddingLeft: 10,
  },
  multiEntryContainer: {
    marginLeft: 2,
    marginTop: 2,
    paddingLeft: 8,
    borderLeftWidth: 1.5,
    borderLeftColor: gameUIColors.secondary + "40",
  },
  multiEntryContainerMain: {
    borderLeftColor: gameUIColors.info + "4D",
    marginLeft: 4,
    paddingLeft: 10,
  },
  relativeOutlineNone: {
    position: "relative",
  },
  pageExpanderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: gameUIColors.panel + "66",
    paddingVertical: 3,
    paddingHorizontal: 6,
    gap: 6,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: gameUIColors.secondary + "1A",
    marginBottom: 2,
    minHeight: 24,
  },
  entriesContainer: {
    marginLeft: 2,
    paddingLeft: 8,
    marginTop: 2,
    borderLeftWidth: 1.5,
    borderLeftColor: gameUIColors.secondary + "40",
  },
  textNumber: {
    color: gameUIColors.info,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  textString: {
    color: gameUIColors.primaryLight,
    fontFamily: "monospace",
  },
  flexRowGapFullWidth: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginVertical: 1,
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  text344054: {
    color: gameUIColors.secondary,
    fontWeight: "600",
    fontSize: 9,
    minWidth: 50,
    fontFamily: "monospace",
    letterSpacing: 0.4,
    opacity: 0.8,
  },
  numberInputButtons: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -18 }],
    flexDirection: "row",
    gap: 4,
    zIndex: 10,
  },
  touchableButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: gameUIColors.panel + "E6",
    borderWidth: 1,
    borderColor: gameUIColors.secondary + "33",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  touchableButtonFocused: {
    borderColor: gameUIColors.info + "CC",
    backgroundColor: gameUIColors.info + "26",
    shadowColor: gameUIColors.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  nebulaInputWrapper: {
    flex: 1,
    width: "100%",
    position: "relative",
  },
  displayValueText: {
    flex: 1,
    color: gameUIColors.primaryLight,
    fontWeight: "400",
    fontFamily: "monospace",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.muted + "99",
    minHeight: 34,
  },
  // New redesigned styles (kept for future use)
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 44,
    gap: 12,
  },
  dataLabel: {
    color: gameUIColors.secondary,
    fontSize: 13,
    fontWeight: "500",
    minWidth: 80,
    flexShrink: 0,
  },
  dataValueContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  inputWithActions: {
    flex: 1,
    position: "relative",
  },
  numberControls: {
    position: "absolute",
    right: 8,
    top: "50%",
    transform: [{ translateY: -16 }],
    flexDirection: "column",
    gap: 2,
  },
  numberButton: {
    width: 32,
    height: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: gameUIColors.primary + "0F",
  },
  readOnlyValue: {
    color: gameUIColors.primaryLight,
    fontSize: 13,
    fontFamily: "monospace",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.primary + "0D",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 6,
    paddingLeft: 8,
  },
  booleanContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.primary + "1A",
    flex: 1,
  },
  booleanText: {
    marginLeft: 8,
    color: gameUIColors.warning,
    fontWeight: "500",
    fontFamily: "monospace",
  },
  modernToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: gameUIColors.muted + "99",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 2,
    minHeight: 34,
    gap: 8,
  },
  toggleIconContainer: {
    marginRight: 6,
  },
  toggleIcon: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
  },
  toggleIconSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toggleContent: {
    flex: 1,
    minWidth: 0,
  },
  toggleLabel: {
    color: "#E5E7EB",
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.3,
  },
  toggleStatus: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  toggleBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
  },
  toggleBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "monospace",
  },
  // Pre-computed toggle icon styles to avoid inline objects [[memory:4875251]]
  toggleIconTrue: {
    backgroundColor: gameUIColors.info,
  },
  toggleIconFalse: {
    backgroundColor: gameUIColors.muted,
  },
  // Pre-computed toggle badge styles [[memory:4875251]]
  toggleBadgeTrue: {
    backgroundColor: gameUIColors.info + "1A",
    borderColor: gameUIColors.info + "4D",
  },
  toggleBadgeFalse: {
    backgroundColor: gameUIColors.muted + "1A",
    borderColor: gameUIColors.muted + "4D",
  },
  // Pre-computed toggle text styles [[memory:4875251]]
  toggleTextTrue: {
    color: gameUIColors.info,
    fontWeight: "600",
  },
  toggleTextFalse: {
    color: gameUIColors.secondary,
    fontWeight: "500",
  },
  // Boolean row container styles
  booleanRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 8,
    paddingVertical: 2,
  },
  booleanLabel: {
    color: gameUIColors.secondary,
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.4,
    minWidth: 60,
    flexShrink: 0,
  },
  booleanToggleWrapper: {
    flex: 1,
  },
});
