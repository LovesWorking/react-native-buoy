// Example of how to create a custom section following composition principles
import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { AlertCircle } from "lucide-react-native";
import { ConsoleSection } from "../ConsoleSection";

interface CustomSectionProps {
  onPress: () => void;
  customData: string;
}

/**
 * Example custom section component.
 * Shows how easy it is to create new sections following composition principles.
 */
export function CustomSection({ onPress, customData }: CustomSectionProps) {
  return (
    <ConsoleSection
      id="custom-section"
      title="My Custom Tool"
      subtitle={`Data: ${customData}`}
      icon={AlertCircle}
      iconColor="#EF4444"
      iconBackgroundColor="rgba(239, 68, 68, 0.1)"
      onPress={onPress}
    />
  );
}

/**
 * Example custom content component.
 * Demonstrates how to create section detail views.
 */
export function CustomSectionContent({ 
  customData,
  onClose 
}: { 
  customData: string;
  onClose: () => void;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Custom Section</Text>
      <Text style={styles.content}>Your custom data: {customData}</Text>
      <Text style={styles.instructions}>
        This is an example of how easy it is to add custom sections
        using the new composition-based approach.
      </Text>
    </View>
  );
}

/**
 * Usage example in DevToolsConsole:
 * 
 * // Add to section types
 * type SectionType = "sentry-logs" | "env-vars" | "rn-better-dev-tools" | "custom-section";
 * 
 * // Add to ConsoleSectionList
 * <ConsoleSectionList>
 *   {/* ...existing sections */}
 *   <CustomSection
 *     onPress={() => handleSectionPress("custom-section")}
 *     customData="Hello World"
 *   />
 * </ConsoleSectionList>
 * 
 * // Add to renderSectionContent switch
 * case "custom-section":
 *   return <CustomSectionContent customData="Hello World" onClose={handleCloseModal} />;
 */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: "#2A2A2A",
  },
  title: {
    color: "#E5E7EB",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  content: {
    color: "#9CA3AF",
    fontSize: 14,
    marginBottom: 16,
  },
  instructions: {
    color: "#6B7280",
    fontSize: 12,
    fontStyle: "italic",
  },
});