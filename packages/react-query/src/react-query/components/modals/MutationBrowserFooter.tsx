import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "@/rn-better-dev-tools/src/shared/hooks/useSafeAreaInsets";
import MutationStatusCount from "../query-browser/MutationStatusCount";
import { useMemo } from "react";
import { ModalMode } from "@/rn-better-dev-tools/src/components/modals/jsModal/JsModal";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";

interface MutationBrowserFooterProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
  modalMode: ModalMode;
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
  modalMode,
}: MutationBrowserFooterProps) {
  const isFloatingMode = modalMode === "floating";
  const insets = useSafeAreaInsets({ minBottom: 16 });

  // Use useMemo to ensure paddingBottom is recalculated when isFloatingMode changes
  const paddingBottom = useMemo(() => {
    return !isFloatingMode ? insets.bottom : 0;
  }, [isFloatingMode, insets.bottom]);

  return (
    <View
      key={`footer-${isFloatingMode ? "floating" : "docked"}`} // Force re-render with key change
      style={[
        styles.filterFooter,
        { paddingBottom },
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
  filterFooter: {
    borderTopWidth: 1,
    borderTopColor: gameUIColors.border + "40",
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: gameUIColors.background,
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
