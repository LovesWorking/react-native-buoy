import type { Dispatch, SetStateAction } from "react";
import { View, StyleSheet } from "react-native";
import { Mutation } from "@tanstack/react-query";
import MutationsList from "./query-browser/MutationsList";
import { gameUIColors } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";

interface MutationBrowserModeProps {
  selectedMutation: Mutation | undefined;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  activeFilter: string | null;
}

/**
 * Layout wrapper that renders the mutation list alongside selection handling glue logic used by
 * the React Query modal.
 */
export function MutationBrowserMode({
  selectedMutation,
  onMutationSelect,
  activeFilter,
}: MutationBrowserModeProps) {
  // Convert function to Dispatch compatible format
  const handleMutationSelect: Dispatch<SetStateAction<Mutation | undefined>> = (
    action: SetStateAction<Mutation | undefined>
  ) => {
    if (typeof action === "function") {
      onMutationSelect(action(selectedMutation));
    } else {
      onMutationSelect(action);
    }
  };

  return (
    <View style={styles.mutationListContainer}>
      <MutationsList
        selectedMutation={selectedMutation}
        setSelectedMutation={handleMutationSelect}
        activeFilter={activeFilter}
        hideInfoPanel={true}
        contentContainerStyle={styles.mutationListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  mutationListContainer: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },
  mutationListContent: {
    padding: 8,
    backgroundColor: macOSColors.background.base,
  },
});
