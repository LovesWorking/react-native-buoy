import React from "react";
import { View, StyleSheet } from "react-native";
import { DataExplorer } from "./DataExplorer";

// Create test data with all edge cases
const createTestData = () => {
  const obj: any = {
    // Primitives
    string: "Hello World",
    number: 42,
    boolean: true,
    nullValue: null,
    undefinedValue: undefined,
    bigint: BigInt(9007199254740991),
    symbol: Symbol("test"),

    // Date
    date: new Date("2023-01-01"),

    // Function
    func: function testFunction() {
      return "test";
    },

    // RegExp
    regex: /test.*pattern/gi,

    // Error
    error: new Error("Test error message"),

    // Collections
    array: [1, 2, 3, "four", true],
    map: new Map([
      ["key1", "value1"],
      ["key2", "value2"],
    ]),
    set: new Set([1, 2, 3, "unique"]),

    // Nested objects
    nested: {
      level1: {
        level2: {
          level3: "deep value",
        },
      },
    },

    // Large array for pagination testing
    largeArray: Array.from({ length: 250 }, (_, i) => ({
      id: i,
      value: `item-${i}`,
    })),
  };

  // Create circular reference
  obj.circular = obj;
  obj.nested.circularRef = obj;

  return obj;
};

export const DataExplorerDemo: React.FC = () => {
  const testData = createTestData();

  // Custom value renderer that adds special formatting
  const customValueRenderer = (
    value: unknown,
    originalValue: unknown,
    keyPath: string[]
  ): string => {
    if (typeof value === "string" && value.includes("item-")) {
      return `🎯 ${value}`;
    }
    if (typeof value === "number" && keyPath.includes("id")) {
      return `#${value}`;
    }
    return String(value);
  };

  // Custom label renderer that adds icons
  const customLabelRenderer = (
    keyPath: string[],
    nodeType: string,
    expanded: boolean,
    expandable: boolean
  ): string => {
    const label = keyPath[keyPath.length - 1];
    if (label === "error") return "❌ error:";
    if (label === "date") return "📅 date:";
    if (label === "func") return "🔧 func:";
    if (label === "largeArray") return "📊 largeArray:";
    return `${label}:`;
  };

  return (
    <View style={styles.container}>
      <DataExplorer
        title="🚀 ENHANCED DATA EXPLORER DEMO"
        data={testData}
        defaultExpanded={true}
        maxDepth={5}
        chunkSize={10} // Small chunk size to show range functionality
        valueRenderer={customValueRenderer}
        labelRenderer={customLabelRenderer}
        sortObjectKeys={true} // Sort object keys alphabetically
        theme="dark"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#1a1a1a",
  },
});
