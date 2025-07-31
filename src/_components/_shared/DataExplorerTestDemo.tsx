import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { VirtualizedDataExplorer } from "./VirtualizedDataExplorer";

// Simple test data
const generateSimpleTestData = () => ({
  users: Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
    settings: {
      theme: i % 2 === 0 ? "dark" : "light",
      notifications: i % 3 === 0,
      privacy: {
        showEmail: i % 4 === 0,
        showProfile: i % 5 === 0,
      },
    },
    posts: Array.from({ length: Math.min(10, i + 1) }, (_, j) => ({
      id: j + 1,
      title: `Post ${j + 1} by User ${i + 1}`,
      content: `This is the content of post ${j + 1}`,
      likes: Math.floor(Math.random() * 100),
      comments: Array.from(
        { length: Math.floor(Math.random() * 5) },
        (_, k) => ({
          id: k + 1,
          author: `Commenter ${k + 1}`,
          text: `Comment ${k + 1} on post ${j + 1}`,
        })
      ),
    })),
  })),
  metadata: {
    total: 100,
    generated: new Date().toISOString(),
    version: "1.0.0",
  },
});

const DataExplorerTestDemo: React.FC = () => {
  const [testData] = useState(generateSimpleTestData);
  const [showDemo, setShowDemo] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VirtualizedDataExplorer Test</Text>
        <Text style={styles.subtitle}>
          Test the virtualized data explorer without ScrollView nesting issues
        </Text>

        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowDemo(!showDemo)}
        >
          <Text style={styles.toggleButtonText}>
            {showDemo ? "Hide" : "Show"} Demo Data
          </Text>
        </TouchableOpacity>
      </View>

      {showDemo && (
        <View style={styles.explorerContainer}>
          <VirtualizedDataExplorer
            title="Test Data (100 Users with Nested Objects)"
            data={testData}
            maxDepth={5}
          />
        </View>
      )}

      {!showDemo && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Instructions:</Text>
          <Text style={styles.instructionText}>
            • This demo uses VirtualizedDataExplorer without ScrollView nesting
          </Text>
          <Text style={styles.instructionText}>
            • The component should render smoothly with large datasets
          </Text>
          <Text style={styles.instructionText}>
            • No "VirtualizedLists should never be nested" warnings
          </Text>
          <Text style={styles.instructionText}>
            • Click "Show Demo Data" to test with 100 users
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    backgroundColor: "#1E293B",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F1F5F9",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 16,
  },
  toggleButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  explorerContainer: {
    flex: 1,
    margin: 16,
  },
  instructionsContainer: {
    flex: 1,
    padding: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F1F5F9",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: "#94A3B8",
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default DataExplorerTestDemo;
