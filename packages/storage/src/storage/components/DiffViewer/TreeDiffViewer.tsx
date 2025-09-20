import { View, StyleSheet } from "react-native";
import { gameUIColors } from "@react-buoy/shared-ui";
import { TreeDiffViewer as SharedTreeDiffViewer } from "@react-buoy/shared-ui/dataViewer";

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
