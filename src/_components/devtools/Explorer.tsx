import React, { useState, useMemo } from "react";
import { Query, QueryKey, useQueryClient } from "@tanstack/react-query";
import { Check, CopiedCopier, Copier, ErrorCopier, List, Trash } from "./svgs";
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

function isIterable(x: any): x is Iterable<unknown> {
  return Symbol.iterator in x;
}
/**
 * Chunk elements in the array by size
 *
 * when the array cannot be chunked evenly by size, the last chunk will be
 * filled with the remaining elements
 *
 * @example
 * chunkArray(['a','b', 'c', 'd', 'e'], 2) // returns [['a','b'], ['c', 'd'], ['e']]
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
const Expander = ({ expanded }: { expanded: boolean }) => {
  return (
    <View
      style={[
        styles.expanderIcon,
        expanded ? styles.expanded : styles.collapsed,
      ]}
    >
      <Svg width={12} height={12} viewBox="0 0 16 16" fill="#6B7280">
        <Path d="M6 12l4-4-4-4" strokeWidth={2} stroke="#6B7280" />
      </Svg>
    </View>
  );
};
type CopyState = "NoCopy" | "SuccessCopy" | "ErrorCopy";
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
      const copied = await onCopy(JSON.stringify(value));
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
      style={styles.buttonStyle}
      aria-label={
        copyState === "NoCopy"
          ? "Copy object to clipboard"
          : copyState === "SuccessCopy"
          ? "Object copied to clipboard"
          : "Error copying object to clipboard"
      }
      onPress={copyState === "NoCopy" ? handleCopy : undefined}
    >
      {copyState === "NoCopy" && <Copier />}
      {copyState === "SuccessCopy" && <CopiedCopier theme="light" />}
      {copyState === "ErrorCopy" && <ErrorCopier />}
    </TouchableOpacity>
  );
};
const DeleteItemButton = ({
  dataPath,
  activeQuery,
}: {
  dataPath: Array<string>;
  activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
}) => {
  const queryClient = useQueryClient();
  if (!activeQuery) return null;
  return (
    <TouchableOpacity
      onPress={() => {
        deleteItem({
          queryClient,
          activeQuery,
          dataPath,
        });
      }}
      style={styles.buttonStyle1}
      accessibilityLabel="Delete item"
    >
      <Trash />
    </TouchableOpacity>
  );
};
const ClearArrayButton = ({
  dataPath,
  activeQuery,
}: {
  dataPath: Array<string>;
  activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
}) => {
  const queryClient = useQueryClient();
  if (!activeQuery) return null;

  const handleClear = () => {
    const oldData = activeQuery.state.data;
    const newData = updateNestedDataByPath(oldData, dataPath, []);
    queryClient.setQueryData(activeQuery.queryKey, newData);
  };

  return (
    <TouchableOpacity
      style={styles.buttonStyle2}
      aria-label="Remove all items"
      onPress={handleClear}
    >
      <List />
    </TouchableOpacity>
  );
};
const ToggleValueButton = ({
  dataPath,
  activeQuery,
  value,
}: {
  dataPath: Array<string>;
  activeQuery: Query<unknown, Error, unknown, QueryKey> | undefined;
  value: any;
}) => {
  const queryClient = useQueryClient();
  if (!activeQuery) return null;

  const handleClick = () => {
    const oldData = activeQuery.state.data;
    const newData = updateNestedDataByPath(oldData, dataPath, !value);
    queryClient.setQueryData(activeQuery.queryKey, newData);
  };

  return (
    <TouchableOpacity style={styles.modernToggleButton} onPress={handleClick}>
      <View style={styles.toggleIconContainer}>
        <View
          style={[
            styles.toggleIconSmall,
            { backgroundColor: value ? "#22C55E" : "#6B7280" },
          ]}
        />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.toggleLabel}>{displayValue(value)}</Text>
      </View>
      <View
        style={[
          styles.toggleBadge,
          {
            backgroundColor: value
              ? "rgba(34, 197, 94, 0.1)"
              : "rgba(107, 114, 128, 0.1)",
            borderColor: value
              ? "rgba(34, 197, 94, 0.2)"
              : "rgba(107, 114, 128, 0.2)",
          },
        ]}
      >
        <Text
          style={[
            styles.toggleBadgeText,
            { color: value ? "#22C55E" : "#6B7280" },
          ]}
        >
          {value ? "TRUE" : "FALSE"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
type Props = {
  editable?: boolean; // true
  label: string; //Data
  value: any; //unknown; // activeQueryStateData()
  defaultExpanded?: Array<string>; // {['Data']} // Label for Data Explorer
  activeQuery?: Query<unknown, Error, unknown, QueryKey> | undefined; // activeQuery()
  dataPath?: Array<string>;
  itemsDeletable?: boolean;
};
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
  const toggleExpanded = () => setIsExpanded((old) => !old);
  const [expandedPages, setExpandedPages] = useState<Array<number>>([]);

  // Flattens data to label and value properties for easy rendering.
  const subEntries = useMemo(() => {
    if (Array.isArray(value)) {
      // Handle if array
      return value.map((d, i) => ({
        label: i.toString(),
        value: d,
      }));
    } else if (
      value !== null &&
      typeof value === "object" &&
      isIterable(value)
    ) {
      // Handle if object
      if (value instanceof Map) {
        return Array.from(value, ([key, val]) => ({
          label: key.toString(),
          value: val,
        }));
      }
      return Array.from(value, (val, i) => ({
        label: i.toString(),
        value: val,
      }));
    } else if (typeof value === "object" && value !== null) {
      return Object.entries(value).map(([key, val]) => ({
        label: key,
        value: val,
      }));
    }
    return [];
  }, [value]);

  // Identifies the data type of the value prop (e.g., 'array', 'Iterable', 'object')
  const valueType = useMemo(() => {
    if (Array.isArray(value)) {
      return "array";
    } else if (
      value !== null &&
      typeof value === "object" &&
      isIterable(value) &&
      typeof value[Symbol.iterator] === "function"
    ) {
      return "Iterable";
    } else if (typeof value === "object" && value !== null) {
      return "object";
    }
    return typeof value;
  }, [value]);

  // Takes a long list of items and divides it into smaller groups or 'chunks'.
  const subEntryPages = useMemo(() => {
    return chunkArray(subEntries, 100);
  }, [subEntries]);

  const currentDataPath = dataPath ?? []; // NOT USED FOR DATA EXPLORER

  const handleChange = (isNumber: boolean, newValue: string) => {
    if (!activeQuery) return null;
    const oldData = activeQuery.state.data;
    // If isNumber and newValue is not a number, return
    if (isNumber && isNaN(Number(newValue))) return;
    const updatedValue = valueType === "number" ? Number(newValue) : newValue;
    const newData = updateNestedDataByPath(
      oldData,
      currentDataPath,
      updatedValue
    );
    queryClient.setQueryData(activeQuery.queryKey, newData);
  };

  return (
    <View style={styles.minWidthWrapper}>
      <View style={styles.fullWidthMarginRight}>
        {subEntryPages.length > 0 && (
          <>
            <View style={styles.flexRowItemsCenterGap}>
              <TouchableOpacity
                style={styles.expanderButton}
                onPress={() => toggleExpanded()}
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
                          >
                            <Expander
                              expanded={expandedPages.includes(index)}
                            />
                            <Text style={styles.pageRangeText}>
                              [{index * 100}...{index * 100 + 99}]
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
                            onPressIn={() => {
                              // Increment function
                              const oldData = activeQuery.state.data;
                              const newData = updateNestedDataByPath(
                                oldData,
                                currentDataPath,
                                value + 1
                              );
                              queryClient.setQueryData(
                                activeQuery.queryKey,
                                newData
                              );
                            }}
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
                            onPressIn={() => {
                              // Decrement function
                              const oldData = activeQuery.state.data;
                              const newData = updateNestedDataByPath(
                                oldData,
                                currentDataPath,
                                value - 1
                              );
                              queryClient.setQueryData(
                                activeQuery.queryKey,
                                newData
                              );
                            }}
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
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginVertical: 2,
  },
  expanderButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    padding: 4,
    gap: 6,
    borderWidth: 0,
    minHeight: 28,
  },
  labelText: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 8,
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
    gap: 8,
    paddingLeft: 8,
  },
  singleEntryContainer: {
    marginLeft: 20,
    marginTop: 4,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  multiEntryContainer: {
    marginLeft: 20,
    marginTop: 4,
    paddingLeft: 12,
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
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginTop: 4,
  },
  flexRowGapFullWidth: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginVertical: 3,
    gap: 8,
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
});
