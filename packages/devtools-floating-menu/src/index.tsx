import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Export FloatingMenu and its types
export { FloatingMenu } from "./floatingMenu/FloatingMenu";
export * from "./floatingMenu/types";
export {
  DevToolsSettingsModal,
  useDevToolsSettings,
} from "./floatingMenu/DevToolsSettingsModal";
export type { DevToolsSettings } from "./floatingMenu/DevToolsSettingsModal";

// Export AppHost components
export {
  AppHostProvider,
  AppOverlay,
  useAppHost,
} from "./floatingMenu/AppHost";

export const Package1Component = () => {
  return (
    <View>
      <Text style={styles.title}>Package 1 - Counter Demo</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    color: "#333",
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  count: {
    fontSize: 24,
    color: "#007AFF",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
  resetButton: {
    marginTop: 10,
  },
});
