import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import QueryStatusCount from "../query-browser/QueryStatusCount";

interface QueryBrowserFooterProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  isFloatingMode?: boolean; // To determine if modal is floating or docked
}

/**
 * Footer component for QueryBrowserModal following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Dedicated footer component for filter controls
 * - Prefer Composition over Configuration: Specialized footer matching DataEditorMode pattern
 * - Extract Reusable Logic: Consistent footer styling across modal types
 */
export function QueryBrowserFooter({
  activeFilter,
  onFilterChange,
  isFloatingMode = true, // Default to floating mode if not specified
}: QueryBrowserFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.filterFooter,
        { paddingBottom: insets.bottom + 8 },
        // Remove border radius when docked to bottom
        !isFloatingMode && styles.dockedFooter,
      ]}
    >
      <View style={styles.filterContainer}>
        <QueryStatusCount
          activeFilter={activeFilter}
          onFilterChange={onFilterChange}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Footer matching DataEditorMode action footer exactly
  filterFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)", // Match DevToolsHeader border
    paddingVertical: 8,
    paddingHorizontal: 0, // Remove horizontal padding to maximize space
    backgroundColor: "#171717", // Match main dev tools primary background
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  dockedFooter: {
    borderBottomLeftRadius: 0, // Remove border radius when docked
    borderBottomRightRadius: 0,
  },
  filterContainer: {
    minHeight: 32, // Consistent with QueryStatusCount
    justifyContent: "center",
  },
});
