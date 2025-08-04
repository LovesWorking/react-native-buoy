import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MutationStatusCount from "../query-browser/MutationStatusCount";

interface MutationBrowserFooterProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  isFloatingMode?: boolean; // To determine if modal is floating or docked
}

/**
 * Footer component for MutationBrowserModal following composition principles
 *
 * Applied principles:
 * - Decompose by Responsibility: Dedicated footer component for mutation filter controls
 * - Prefer Composition over Configuration: Specialized footer matching DataEditorMode pattern
 * - Extract Reusable Logic: Consistent footer styling across modal types
 */
export function MutationBrowserFooter({
  activeFilter,
  onFilterChange,
  isFloatingMode = true, // Default to floating mode if not specified
}: MutationBrowserFooterProps) {
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
        <MutationStatusCount
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
    minHeight: 32, // Consistent with MutationStatusCount
    justifyContent: "center",
  },
});
