import type { Dispatch, SetStateAction } from "react";
import { View, StyleSheet } from "react-native";
import { Mutation } from "@tanstack/react-query";
import MutationsList from "./query-browser/MutationsList";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";
import { macOSColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI/constants/macOSDesignSystemColors";

interface MutationBrowserModeProps {
  selectedMutation: Mutation | undefined;
  onMutationSelect: (mutation: Mutation | undefined) => void;
  activeFilter: string | null;
}

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
