import { View, StyleSheet } from "react-native";
import { gameUIColors } from "@monorepo/shared";
import { TreeDiffViewer as SharedTreeDiffViewer } from "@monorepo/shared/dataViewer";

interface TreeDiffViewerProps {
  oldValue: unknown;
  newValue: unknown;
}

export function TreeDiffViewer({ oldValue, newValue }: TreeDiffViewerProps) {
  return (
    <View style={styles.container}>
      <SharedTreeDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        theme="dark"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: gameUIColors.background,
  },
});
