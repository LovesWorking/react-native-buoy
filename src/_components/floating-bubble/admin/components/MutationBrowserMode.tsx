import { View, StyleSheet } from "react-native";
import { Mutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MutationsList from "../../../devtools/MutationsList";

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
  const insets = useSafeAreaInsets();

  return (
    <>
      <View style={styles.mutationListContainer}>
        <MutationsList
          selectedMutation={selectedMutation}
          setSelectedMutation={onMutationSelect as any}
          activeFilter={activeFilter}
          hideInfoPanel={true}
          contentContainerStyle={styles.mutationListContent}
        />
      </View>
      {/* Safe area */}
      <View style={[styles.safeArea, { height: insets.bottom }]} />
    </>
  );
}

const styles = StyleSheet.create({
  mutationListContainer: {
    flex: 1,
  },
  mutationListContent: {
    padding: 8,
    backgroundColor: "#171717",
  },
  safeArea: {
    backgroundColor: "#2A2A2A",
  },
});
