import React, { useState, useMemo, useCallback, useRef } from "react";
import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";
import { CopiedCopier, Copier, ErrorCopier, List, Trash } from "./svgs";
import { updateNestedDataByPath } from "../_util/updateNestedDataByPath";
import { displayValue } from "./displayValue";
import deleteItem from "../_util/actions/deleteItem";
import Svg, { Path } from "react-native-svg";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  Alert,
} from "react-native";
import { useCopy } from "../../context/CopyContext";

// Stable constants to prevent re-renders [[memory:4875251]]
const CHUNK_SIZE = 100;
const HIT_SLOP_OPTIMIZED = { top: 8, bottom: 8, left: 8, right: 8 };

const EXPANDER_SIZE = 16;

function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x;
}
// Optimized chunking function moved to module scope [[memory:4875251]]
const chunkArray = <T extends { label: string; value: unknown }>(
  array: Array<T>,
  size: number = CHUNK_SIZE
): Array<Array<T>> => {
  if (size < 1 || array.length === 0) return [];
  const result: Array<Array<T>> = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
};
// Memoized Expander component for performance [[memory:4875251]]
const Expander = React.memo(({ expanded }: { expanded: boolean }) => {
  return (
    <View
      style={[
        styles.expanderIcon,
        expanded ? styles.expanded : styles.collapsed,
      ]}
    >
      <Svg
        width={EXPANDER_SIZE}
        height={EXPANDER_SIZE}
        viewBox="0 0 16 16"
        fill="#6B7280"
      >
        <Path d="M6 12l4-4-4-4" strokeWidth={2} stroke="#6B7280" />
      </Svg>
    </View>
  );
});
type CopyState = "NoCopy" | "SuccessCopy" | "ErrorCopy";

// Memoized CopyButton component optimized with ref pattern [[memory:4875251]]
const CopyButton = React.memo(({ value }: { value: any }) => {
  const [copyState, setCopyState] = useState<CopyState>("NoCopy");
  const { onCopy } = useCopy();
  const valueRef = useRef(value);
  valueRef.current = value;

  const handleCopy = useCallback(async () => {
    if (!onCopy) {
      Alert.alert(
        "Warning",
        "Copy functionality is not configured. Please add a copy function to DevToolsBubble. See documentation for setup instructions."
      );
      return;
    }

    try {
      // Use ref to avoid stale closures [[memory:4875251]]
      const copied = await onCopy(valueRef.current);
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
  }, [onCopy]); // Only depend on onCopy, use ref for value

  return (
    <TouchableOpacity
      style={styles.buttonStyle}
      aria-label={
        copyState === "NoCopy"
          ? "Copy object to clipboard"
          : copyState === "SuccessCopy"
            ? "Object copied to clipboard"
            : "Error copying object to clipboard"
      }
      onPress={copyState === "NoCopy" ? handleCopy : undefined}
      hitSlop={HIT_SLOP_OPTIMIZED}
    >
      {copyState === "NoCopy" && <Copier />}
      {copyState === "SuccessCopy" && <CopiedCopier theme="light" />}
      {copyState === "ErrorCopy" && <ErrorCopier />}
    </TouchableOpacity>
  );
});
// Memoized DeleteItemButton component [[memory:4875251]]
const DeleteItemButton = React.memo(
  ({
    dataPath,
    activeQuery,
  }: {
    dataPath: Array<string>;
    activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
  }) => {
    const queryClient = useQueryClient();
    const dataPathRef = useRef(dataPath);
    const activeQueryRef = useRef(activeQuery);
    dataPathRef.current = dataPath;
    activeQueryRef.current = activeQuery;

    const handleDelete = useCallback(() => {
      if (!activeQueryRef.current) return;
      deleteItem({
        queryClient,
        activeQuery: activeQueryRef.current,
        dataPath: dataPathRef.current,
      });
    }, [queryClient]);

    if (!activeQuery) return null;

    return (
      <TouchableOpacity
        onPress={handleDelete}
        style={styles.buttonStyle1}
        accessibilityLabel="Delete item"
        hitSlop={HIT_SLOP_OPTIMIZED}
      >
        <Trash />
      </TouchableOpacity>
    );
  }
);
// Memoized ClearArrayButton component [[memory:4875251]]
const ClearArrayButton = React.memo(
  ({
    dataPath,
    activeQuery,
  }: {
    dataPath: Array<string>;
    activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
  }) => {
    const queryClient = useQueryClient();
    const dataPathRef = useRef(dataPath);
    const activeQueryRef = useRef(activeQuery);
    dataPathRef.current = dataPath;
    activeQueryRef.current = activeQuery;

    const handleClear = useCallback(() => {
      if (!activeQueryRef.current) return;
      const oldData = activeQueryRef.current.state.data;
      const newData = updateNestedDataByPath(oldData, dataPathRef.current, []);
      queryClient.setQueryData(activeQueryRef.current.queryKey, newData);
    }, [queryClient]);

    if (!activeQuery) return null;

    return (
      <TouchableOpacity
        style={styles.buttonStyle2}
        aria-label="Remove all items"
        onPress={handleClear}
        hitSlop={HIT_SLOP_OPTIMIZED}
      >
        <List />
      </TouchableOpacity>
    );
  }
);
// Memoized ToggleValueButton with pre-computed styles [[memory:4875251]]
const ToggleValueButton = React.memo(
  ({
    dataPath,
    activeQuery,
    value,
  }: {
    dataPath: Array<string>;
    activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
    value: any;
  }) => {
    const queryClient = useQueryClient();
    const dataPathRef = useRef(dataPath);
    const activeQueryRef = useRef(activeQuery);
    const valueRef = useRef(value);
    dataPathRef.current = dataPath;
    activeQueryRef.current = activeQuery;
    valueRef.current = value;

    const handleClick = useCallback(() => {
      if (!activeQueryRef.current) return;
      const oldData = activeQueryRef.current.state.data;
      const newData = updateNestedDataByPath(
        oldData,
        dataPathRef.current,
        !valueRef.current
      );
      queryClient.setQueryData(activeQueryRef.current.queryKey, newData);
    }, [queryClient]);

    if (!activeQuery) return null;

    // Pre-compute styles based on value state [[memory:4875251]]
    const iconStyle = value ? styles.toggleIconTrue : styles.toggleIconFalse;
    const badgeStyle = value ? styles.toggleBadgeTrue : styles.toggleBadgeFalse;
    const textStyle = value ? styles.toggleTextTrue : styles.toggleTextFalse;

    return (
      <TouchableOpacity
        style={styles.modernToggleButton}
        onPress={handleClick}
        hitSlop={HIT_SLOP_OPTIMIZED}
      >
        <View style={styles.toggleIconContainer}>
          <View style={[styles.toggleIconSmall, iconStyle]} />
        </View>
        <View style={styles.toggleContent}>
          <Text style={styles.toggleLabel}>{displayValue(value)}</Text>
        </View>
        <View style={[styles.toggleBadge, badgeStyle]}>
          <Text style={[styles.toggleBadgeText, textStyle]}>
            {value ? "TRUE" : "FALSE"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);
type Props = {
  editable?: boolean; // true
  label: string; //Data
  value: any; //unknown; // activeQueryStateData()
  defaultExpanded?: Array<string>; // {['Data']} // Label for Data Explorer
  activeQuery?: Query<unknown, Error, unknown, QueryKey> | undefined; // activeQuery()
  dataPath?: Array<string>;
  itemsDeletable?: boolean;
};
// Optimized Explorer component following rule2 guidelines [[memory:4875251]]
export default function Explorer({
  editable,
  label,
  value,
  defaultExpanded,
  activeQuery,
  dataPath,
  itemsDeletable,
}: Props) {
  const queryClient = useQueryClient();

  // Explorer's section is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(
    (defaultExpanded || []).includes(label)
  );
  // Remove unnecessary useCallback - simple state setter [[memory:4875251]]
  const toggleExpanded = () => setIsExpanded((old) => !old);
  const [expandedPages, setExpandedPages] = useState<Array<number>>([]);

  // Optimized subEntries computation with early returns and limited processing [[memory:4875251]]
  const subEntries = useMemo(() => {
    // Early return for primitive values to avoid unnecessary computation
    if (value === null || value === undefined || typeof value !== "object") {
      return [];
    }

    if (Array.isArray(value)) {
      // Limit array processing for performance [[memory:4875251]]
      const limitedValue = value.length > 1000 ? value.slice(0, 1000) : value;
      return limitedValue.map((d, i) => ({
        label: i.toString(),
        value: d,
      }));
    }

    if (isIterable(value)) {
      if (value instanceof Map) {
        // Limit Map entries for performance
        const entries = Array.from(value.entries()).slice(0, 1000);
        return entries.map(([key, val]) => ({
          label: key.toString(),
          value: val,
        }));
      }
      // Limit other iterables
      const entries = Array.from(value).slice(0, 1000);
      return entries.map((val, i) => ({
        label: i.toString(),
        value: val,
      }));
    }

    // Handle regular objects with key limiting
    const entries = Object.entries(value).slice(0, 1000);
    return entries.map(([key, val]) => ({
      label: key,
      value: val,
    }));
  }, [value]);

  // Optimized valueType computation with early returns [[memory:4875251]]
  const valueType = useMemo(() => {
    if (Array.isArray(value)) return "array";
    if (value === null || typeof value !== "object") return typeof value;
    if (isIterable(value) && typeof value[Symbol.iterator] === "function")
      return "Iterable";
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
      if (!activeQueryRef.current) return;
      const oldData = activeQueryRef.current.state.data;
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
    [queryClient]
  );

  return (
    <View style={styles.minWidthWrapper}>
      <View style={styles.fullWidthMarginRight}>
        {subEntryPages.length > 0 && (
          <>
            <View style={styles.flexRowItemsCenterGap}>
              <TouchableOpacity
                style={styles.expanderButton}
                onPress={toggleExpanded}
                hitSlop={HIT_SLOP_OPTIMIZED}
              >
                <Expander expanded={isExpanded} />
                <Text style={styles.labelText}>{label}</Text>
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
                  <CopyButton value={value} />
                  {itemsDeletable && activeQuery !== undefined && (
                    <DeleteItemButton
                      activeQuery={activeQuery}
                      dataPath={currentDataPath}
                    />
                  )}
                  {valueType === "array" && activeQuery !== undefined && (
                    <ClearArrayButton
                      activeQuery={activeQuery}
                      dataPath={currentDataPath}
                    />
                  )}
                </View>
              )}
            </View>
            {isExpanded && (
              <>
                {subEntryPages.length === 1 && (
                  <View style={styles.singleEntryContainer}>
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
            <Text style={styles.text344054}>{label}:</Text>
            {editable &&
            activeQuery !== undefined &&
            (valueType === "string" ||
              valueType === "number" ||
              valueType === "boolean") ? (
              <>
                {editable &&
                  activeQuery &&
                  (valueType === "string" || valueType === "number") && (
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[
                          styles.textInput,
                          valueType === "number"
                            ? styles.textNumber
                            : styles.textString,
                        ]}
                        keyboardType={
                          valueType === "number" ? "numeric" : "default"
                        }
                        value={value.toString()}
                        onChangeText={(newValue) =>
                          handleChange(valueType === "number", newValue)
                        }
                        placeholderTextColor="#6B7280"
                      />
                      {valueType === "number" && (
                        <View style={styles.numberInputButtons}>
                          <TouchableOpacity
                            style={styles.touchableButton}
                            onPressIn={() =>
                              handleChange(true, String(value + 1))
                            }
                            hitSlop={HIT_SLOP_OPTIMIZED}
                          >
                            <Svg
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#6B7280"
                              width={12}
                              height={12}
                            >
                              <Path
                                d="M4.5 15.75l7.5-7.5 7.5 7.5"
                                strokeWidth={2}
                              />
                            </Svg>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.touchableButton}
                            onPressIn={() =>
                              handleChange(true, String(value - 1))
                            }
                            hitSlop={HIT_SLOP_OPTIMIZED}
                          >
                            <Svg
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="#6B7280"
                              width={12}
                              height={12}
                            >
                              <Path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                              />
                            </Svg>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                {valueType === "boolean" && (
                  <ToggleValueButton
                    activeQuery={activeQuery}
                    dataPath={currentDataPath}
                    value={value}
                  />
                )}
              </>
            ) : (
              <Text style={styles.displayValueText}>{displayValue(value)}</Text>
            )}
            {editable && itemsDeletable && activeQuery !== undefined && (
              <DeleteItemButton
                activeQuery={activeQuery}
                dataPath={currentDataPath}
              />
            )}
          </View>
        )}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  buttonStyle3: {
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 16,
    height: 16,
    position: "relative",
    zIndex: 10,
  },
  buttonStyle2: {
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
    borderRadius: 4,
    flexDirection: "row",
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    position: "relative",
    zIndex: 10,
  },
  buttonStyle1: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderRadius: 4,
    padding: 0,
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    position: "relative",
  },
  buttonStyle: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.2)",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    position: "relative",
  },
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
    justifyContent: "space-between",
    paddingVertical: 1,
    paddingHorizontal: 2,
    marginVertical: 1,
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
    marginLeft: 4,
    marginTop: 2,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  multiEntryContainer: {
    marginLeft: 4,
    marginTop: 2,
    paddingLeft: 4,
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
    gap: 4,
    borderWidth: 0,
    marginBottom: 4,
    minHeight: 24,
  },
  entriesContainer: {
    marginLeft: 4,
    paddingLeft: 4,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginTop: 2,
  },
  flexRowGapFullWidth: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginVertical: 2,
    gap: 6,
  },
  text344054: {
    color: "#F9FAFB",
    fontWeight: "500",
    fontSize: 12,
    minWidth: 50,
  },
  inputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    height: 36,
    margin: 2,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    flex: 1,
  },
  textNumber: {
    color: "#3B82F6",
    fontWeight: "500",
  },
  textInput: {
    flex: 1,
    marginRight: 8,
    paddingBottom: 2,
    paddingTop: 2,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
    fontWeight: "500",
  },
  textString: {},
  numberInputButtons: {
    flexDirection: "row",
  },
  touchableButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(107, 114, 128, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  booleanContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flex: 1,
  },
  booleanText: {
    marginLeft: 8,
    color: "#F59E0B",
    fontWeight: "500",
    fontFamily: "monospace",
  },
  displayValueText: {
    flex: 1,
    color: "#10B981",
    fontWeight: "500",
    fontFamily: "monospace",
    fontSize: 12,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.1)",
  },
  modernToggleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginVertical: 2,
    flex: 1,
    height: 36,
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
    color: "#F9FAFB",
    fontSize: 11,
    fontWeight: "500",
    fontFamily: "monospace",
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
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  // Pre-computed toggle icon styles to avoid inline objects [[memory:4875251]]
  toggleIconTrue: {
    backgroundColor: "#22C55E",
  },
  toggleIconFalse: {
    backgroundColor: "#6B7280",
  },
  // Pre-computed toggle badge styles [[memory:4875251]]
  toggleBadgeTrue: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  toggleBadgeFalse: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    borderColor: "rgba(107, 114, 128, 0.2)",
  },
  // Pre-computed toggle text styles [[memory:4875251]]
  toggleTextTrue: {
    color: "#22C55E",
  },
  toggleTextFalse: {
    color: "#6B7280",
  },
});
