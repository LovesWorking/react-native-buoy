import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { Filter, X, Plus, Check } from "lucide-react-native";
import { useState } from "react";
import { devToolsStorageKeys } from "../../../_shared/storage/devToolsStorageKeys";

interface StorageFilterViewProps {
  ignoredPatterns: Set<string>;
  onTogglePattern: (pattern: string) => void;
  onAddPattern: (pattern: string) => void;
  onBack: () => void;
}

export function StorageFilterView({
  ignoredPatterns,
  onTogglePattern,
  onAddPattern,
  onBack,
}: StorageFilterViewProps) {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newPattern, setNewPattern] = useState("");

  const handleAddPattern = () => {
    if (newPattern.trim()) {
      onAddPattern(newPattern.trim());
      setNewPattern("");
      setShowAddInput(false);
    }
  };

  const handleShowAddInput = () => {
    setShowAddInput(true);
  };

  const defaultFilter = devToolsStorageKeys.base;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        sentry-label="ignore-scrollview"
      >
        {/* Default Filters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Filters</Text>
          <Text style={styles.sectionDescription}>
            These patterns are filtered by default but can be disabled
          </Text>

          <TouchableOpacity
            onPress={() => onTogglePattern(defaultFilter)}
            style={[
              styles.filterItem,
              ignoredPatterns.has(defaultFilter) && styles.filterItemActive,
            ]}
            sentry-label="ignore-touchable-opacity"
          >
            <View style={styles.filterItemLeft}>
              <Text
                style={[
                  styles.filterItemText,
                  ignoredPatterns.has(defaultFilter) &&
                    styles.filterItemTextActive,
                ]}
              >
                {defaultFilter}
              </Text>
              <Text style={styles.filterItemHint}>
                Dev tools internal storage
              </Text>
            </View>
            <View style={styles.filterItemRight}>
              {ignoredPatterns.has(defaultFilter) && (
                <Check size={14} color="#10B981" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Custom Filters Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Custom Filters</Text>
              <Text style={styles.sectionDescription}>
                Add patterns to filter out storage keys
              </Text>
            </View>
            {!showAddInput && (
              <TouchableOpacity
                onPress={handleShowAddInput}
                style={styles.addButton}
                sentry-label="ignore-touchable-opacity"
              >
                <Plus size={16} color="#3B82F6" />
              </TouchableOpacity>
            )}
          </View>

          {showAddInput && (
            <View style={styles.addInputContainer}>
              <TextInput
                sentry-label="ignore-textinput"
                style={styles.addInput}
                value={newPattern}
                onChangeText={setNewPattern}
                placeholder="Enter pattern to filter (e.g., @temp)"
                placeholderTextColor="#6B7280"
                autoFocus
                onSubmitEditing={handleAddPattern}
                accessibilityLabel="ignore-textinput"
              />
              <TouchableOpacity
                onPress={handleAddPattern}
                style={styles.addInputButton}
                sentry-label="ignore-touchable-opacity"
              >
                <Check size={16} color="#10B981" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setShowAddInput(false);
                  setNewPattern("");
                }}
                style={styles.cancelInputButton}
                sentry-label="ignore-touchable-opacity"
              >
                <X size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.filterGrid}>
            {Array.from(ignoredPatterns)
              .filter((pattern) => pattern !== defaultFilter)
              .map((pattern) => (
                <TouchableOpacity
                  key={pattern}
                  onPress={() => onTogglePattern(pattern)}
                  style={styles.filterBadge}
                  sentry-label="ignore-touchable-opacity"
                >
                  <Text style={styles.filterBadgeText}>{pattern}</Text>
                  <X size={12} color="#EF4444" />
                </TouchableOpacity>
              ))}
            {Array.from(ignoredPatterns).filter((p) => p !== defaultFilter)
              .length === 0 && (
              <Text style={styles.emptyText}>No custom filters added</Text>
            )}
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <Filter size={16} color="#6B7280" />
          <Text style={styles.infoText}>
            Filtered keys will not appear in the storage events list. Patterns
            match if the key contains the text.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E5E7EB",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 12,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
  },
  filterItemActive: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  filterItemLeft: {
    flex: 1,
  },
  filterItemText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
    marginBottom: 2,
  },
  filterItemTextActive: {
    color: "#10B981",
  },
  filterItemHint: {
    fontSize: 11,
    color: "#6B7280",
  },
  filterItemRight: {
    marginLeft: 12,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  addInputContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  addInput: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    paddingHorizontal: 12,
    fontSize: 13,
    color: "#E5E7EB",
  },
  addInputButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelInputButton: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  filterBadgeText: {
    fontSize: 12,
    color: "#E5E7EB",
    fontWeight: "500",
  },
  emptyText: {
    fontSize: 12,
    color: "#6B7280",
    fontStyle: "italic",
  },
  infoSection: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: "#6B7280",
    lineHeight: 16,
  },
});
