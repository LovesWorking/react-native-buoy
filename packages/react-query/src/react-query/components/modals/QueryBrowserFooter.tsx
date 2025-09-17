import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "@/rn-better-dev-tools/src/shared/hooks/useSafeAreaInsets";
import QueryStatusCount from "../query-browser/QueryStatusCount";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";

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
  // Use safe area insets with a minimum bottom padding of 16 for docked mode
  // This ensures proper spacing even on resized simulators or devices without home indicator
  const insets = useSafeAreaInsets({ minBottom: 16 });

  return (
    <View
      style={[
        styles.filterFooter,
        { paddingBottom: !isFloatingMode ? insets.bottom : 0 },
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
  filterFooter: {
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: macOSColors.background.base,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  dockedFooter: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  filterContainer: {
    minHeight: 32,
    justifyContent: "center",
  },
});
