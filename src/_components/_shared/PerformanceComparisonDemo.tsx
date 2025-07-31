import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
} from "react-native";
import { VirtualizedDataExplorer } from "./index";

// Generate test data of varying complexity
const generateTestData = (depth: number, breadth: number): any => {
  if (depth === 0) {
    return `Leaf node ${Math.random().toString(36).substr(2, 9)}`;
  }

  const data: any = {};
  for (let i = 0; i < breadth; i++) {
    const key = `item_${i}`;
    if (Math.random() > 0.3) {
      // 70% chance of nested object
      data[key] = generateTestData(depth - 1, Math.max(1, breadth - 1));
    } else {
      // 30% chance of primitive value
      const primitives = [
        `string_${i}`,
        Math.floor(Math.random() * 1000),
        Math.random() > 0.5,
        null,
        undefined,
        new Date(),
        new Error(`Error ${i}`),
        () => `function_${i}`,
        Symbol(`symbol_${i}`),
        BigInt(i),
      ];
      data[key] = primitives[Math.floor(Math.random() * primitives.length)];
    }
  }

  // Add some arrays and special objects
  data.arrayData = Array.from({ length: Math.min(breadth, 50) }, (_, i) => ({
    id: i,
    value: `Array item ${i}`,
    nested: generateTestData(Math.max(0, depth - 2), 2),
  }));

  data.mapData = new Map(
    Array.from({ length: Math.min(breadth, 20) }, (_, i) => [
      `key_${i}`,
      `Map value ${i}`,
    ])
  );

  data.setData = new Set(
    Array.from({ length: Math.min(breadth, 20) }, (_, i) => `Set item ${i}`)
  );

  return data;
};

// Test data configurations
const TEST_CONFIGS = {
  small: { depth: 2, breadth: 5, name: "Small (2 levels, 5 items each)" },
  medium: { depth: 3, breadth: 10, name: "Medium (3 levels, 10 items each)" },
  large: { depth: 4, breadth: 15, name: "Large (4 levels, 15 items each)" },
  xlarge: { depth: 5, breadth: 20, name: "X-Large (5 levels, 20 items each)" },
};

type TestConfigKey = keyof typeof TEST_CONFIGS;
const PerformanceComparisonDemo: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<TestConfigKey>("medium");
  const [renderTime, setRenderTime] = useState<number | null>(null);

  const testData = useMemo(() => {
    const config = TEST_CONFIGS[selectedConfig];
    const startTime = performance.now();
    const data = generateTestData(config.depth, config.breadth);
    const generationTime = performance.now() - startTime;
    console.log(`Data generation took: ${generationTime.toFixed(2)}ms`);
    return data;
  }, [selectedConfig]);

  // Always use VirtualizedDataExplorer since it's the optimized version
  const DataExplorerComponent = VirtualizedDataExplorer;

  const measureRenderTime = () => {
    const startTime = performance.now();

    // Force a re-render and measure time
    setTimeout(() => {
      const endTime = performance.now();
      const time = endTime - startTime;
      setRenderTime(time);

      Alert.alert(
        "Render Performance",
        `Render time: ${time.toFixed(2)}ms\n\nData size: ${
          TEST_CONFIGS[selectedConfig].name
        }`,
        [{ text: "OK" }]
      );
    }, 100);
  };

  const getDataStats = (data: any): string => {
    const getObjectCount = (obj: any, visited = new WeakSet()): number => {
      if (!obj || typeof obj !== "object" || visited.has(obj)) return 0;
      visited.add(obj);

      let count = 1;
      if (Array.isArray(obj)) {
        count += obj.reduce(
          (acc: number, item: any) => acc + getObjectCount(item, visited),
          0
        );
      } else if (obj instanceof Map) {
        for (const [, value] of obj) {
          count += getObjectCount(value, visited);
        }
      } else if (obj instanceof Set) {
        for (const value of obj) {
          count += getObjectCount(value, visited);
        }
      } else {
        count += Object.values(obj).reduce(
          (acc: number, value: any) => acc + getObjectCount(value, visited),
          0
        );
      }

      return count;
    };

    const totalObjects = getObjectCount(data);
    const jsonSize = JSON.stringify(data, null, 2).length;

    return `Objects: ${totalObjects}, JSON size: ${(jsonSize / 1024).toFixed(
      1
    )}KB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerFixed}>
        <Text style={styles.title}>
          FlashList-Powered DataExplorer Performance Test
        </Text>
        <Text style={styles.subtitle}>
          Test the ultra-high-performance FlashList-powered data explorer with
          different data sizes
        </Text>

        <View style={styles.controls}>
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Data Size:</Text>
            <View style={styles.buttonGroup}>
              {(Object.keys(TEST_CONFIGS) as TestConfigKey[]).map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.configButton,
                    selectedConfig === key && styles.selectedButton,
                  ]}
                  onPress={() => setSelectedConfig(key)}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      selectedConfig === key && styles.selectedButtonText,
                    ]}
                  >
                    {key.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={styles.measureButton}
            onPress={measureRenderTime}
          >
            <Text style={styles.measureButtonText}>Measure Render Time</Text>
          </TouchableOpacity>

          {renderTime !== null && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>
                Last render: {renderTime.toFixed(2)}ms
              </Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Current Configuration:</Text>
            <Text style={styles.infoText}>
              Size: {TEST_CONFIGS[selectedConfig].name}
            </Text>
            <Text style={styles.infoText}>
              Version: Ultra-high-performance FlashList-powered explorer
            </Text>
            <Text style={styles.infoText}>Stats: {getDataStats(testData)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.explorerContainer}>
        <DataExplorerComponent
          title={`Performance Test - ${TEST_CONFIGS[selectedConfig].name}`}
          data={testData}
          maxDepth={6}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  headerFixed: {
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    padding: 16,
    backgroundColor: "#1E293B",
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#F1F5F9",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
  },
  controls: {
    paddingTop: 12,
  },
  controlGroup: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  configButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#334155",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#475569",
  },
  versionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#334155",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#475569",
    minWidth: 80,
  },
  selectedButton: {
    backgroundColor: "#3B82F6",
    borderColor: "#2563EB",
  },
  buttonText: {
    fontSize: 12,
    color: "#E2E8F0",
    textAlign: "center",
  },
  selectedButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  measureButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  measureButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  resultContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#059669",
    borderRadius: 6,
  },
  resultText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  infoContainer: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  explorerContainer: {
    flex: 1,
    margin: 16,
  },
});

export default PerformanceComparisonDemo;
