import { View, StyleSheet } from "react-native";
import { Mutation } from "@tanstack/react-query";
import MutationsList from "./query-browser/MutationsList";

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
  // Convert function to React.Dispatch compatible format
  const handleMutationSelect: React.Dispatch<
    React.SetStateAction<Mutation | undefined>
  > = (action) => {
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
    backgroundColor: "#171717", // Match container background to content background
  },
  mutationListContent: {
    padding: 8,
    backgroundColor: "#171717",
  },
});
