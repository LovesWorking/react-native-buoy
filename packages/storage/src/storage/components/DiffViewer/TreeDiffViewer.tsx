import { View, StyleSheet } from "react-native";
import TreeDiffViewerComponent from "@/dif-viewer/TreeDiffViewer";
import { gameUIColors } from "@/rn-better-dev-tools/src/shared/ui/gameUI";

interface TreeDiffViewerProps {
  oldValue: unknown;
  newValue: unknown;
}

export function TreeDiffViewer({ oldValue, newValue }: TreeDiffViewerProps) {
  return (
    <View style={styles.container}>
      <TreeDiffViewerComponent
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
