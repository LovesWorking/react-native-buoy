import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Query } from "@tanstack/react-query";
import { BackButton } from "../admin/components/BackButton";
import { Mutation } from "@tanstack/react-query";
import { displayValue } from "../../devtools/displayValue";

interface ReactQueryModalHeaderProps {
  selectedQuery?: Query;
  selectedMutation?: Mutation;
  activeTab: "queries" | "mutations" | "storage";
  onTabChange: (tab: "queries" | "mutations" | "storage") => void;
  onBack: () => void;
}

export function ReactQueryModalHeader({
  selectedQuery,
  selectedMutation,
  activeTab,
  onTabChange,
  onBack,
}: ReactQueryModalHeaderProps) {
  // Simple function to get query display text
  const getQueryText = (query: Query) => {
    if (!query?.queryKey) return "Unknown Query";
    const keys = Array.isArray(query.queryKey)
      ? query.queryKey
      : [query.queryKey];
    return (
      keys
        .filter((k) => k != null)
        .map((k) => String(k))
        .join(" › ") || "Unknown Query"
    );
  };

  const getItemText = (item: Query | Mutation) => {
    if ("queryKey" in item) {
      return getQueryText(item);
    } else {
      return item.options.mutationKey
        ? (Array.isArray(item.options.mutationKey)
            ? item.options.mutationKey
            : [item.options.mutationKey]
          )
            .filter((k) => k != null)
            .map((k) => String(k))
            .join(" › ") || `Mutation #${item.mutationId}`
        : `Mutation #${item.mutationId}`;
    }
  };

  return (
    <View style={styles.container}>
      {selectedQuery || selectedMutation ? (
        <View style={styles.detailsView}>
          <BackButton
            onPress={onBack}
            color="#FFFFFF"
            size={16}
            accessibilityLabel="Back to list"
            accessibilityHint="Return to list view"
          />
          <Text style={styles.queryText} numberOfLines={1}>
            {getItemText(selectedQuery ?? selectedMutation!)}
          </Text>
        </View>
      ) : (
        <View style={styles.browserView}>
          <View style={styles.tabNavigationContainer}>
            <TouchableOpacity
              onPress={() => onTabChange("queries")}
              style={[
                styles.tabButton,
                activeTab === "queries"
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "queries"
                    ? styles.tabButtonTextActive
                    : styles.tabButtonTextInactive,
                ]}
              >
                Queries
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onTabChange("mutations")}
              style={[
                styles.tabButton,
                activeTab === "mutations"
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "mutations"
                    ? styles.tabButtonTextActive
                    : styles.tabButtonTextInactive,
                ]}
              >
                Mutations
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onTabChange("storage")}
              style={[
                styles.tabButton,
                activeTab === "storage"
                  ? styles.tabButtonActive
                  : styles.tabButtonInactive,
              ]}
            >
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === "storage"
                    ? styles.tabButtonTextActive
                    : styles.tabButtonTextInactive,
                ]}
              >
                Storage
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 32, // Match FloatingModalHeader minHeight exactly
    justifyContent: "center",
    // Remove horizontal padding - let content handle its own spacing
  },

  detailsView: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
    minHeight: 32, // Match FloatingModalHeader minHeight
    paddingLeft: 4, // Only left padding for consistent spacing
    paddingRight: 0, // No right padding - buttons handle their own spacing
  },

  browserView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "stretch", // Let navigation use full width
    minHeight: 32, // Match FloatingModalHeader minHeight
    paddingLeft: 4, // Consistent left spacing
    paddingRight: 4, // Minimal right padding to match left
  },

  tabNavigationContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    justifyContent: "space-evenly", // Evenly distribute tabs
  },

  tabButton: {
    paddingHorizontal: 8, // Reduced padding for better fit
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flex: 1, // Use flex to evenly distribute space
    marginHorizontal: 1, // Small margin between buttons
  },

  tabButtonActive: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
  },

  tabButtonInactive: {
    backgroundColor: "transparent",
  },

  tabButtonText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },

  tabButtonTextActive: {
    color: "#0EA5E9",
  },

  tabButtonTextInactive: {
    color: "#9CA3AF",
  },

  queryText: {
    flex: 1,
    color: "#E5E7EB",
    fontSize: 14,
    fontWeight: "500",
    fontFamily: "monospace",
    paddingHorizontal: 4,
  },
});
