import React from "react";
import { View, StyleSheet } from "react-native";
import { AppHostProvider } from "./AppHost";
import { FloatingMenu, type FloatingMenuProps } from "./FloatingMenu";
import { AppOverlay } from "./AppHost";

/**
 * Unified floating development tools component.
 *
 * This component combines AppHostProvider, FloatingMenu, and AppOverlay
 * into a single component for simplified setup and better developer experience.
 *
 * The component is absolutely positioned to float on top of your application
 * regardless of where it's placed in the component tree. You can place it
 * anywhere in your app layout and it will work correctly.
 *
 * For advanced use cases requiring custom provider nesting or configuration,
 * the individual components (AppHostProvider, FloatingMenu, AppOverlay)
 * are still available for import.
 *
 * @param props - FloatingMenu props (apps, state, actions, hidden, environment, userRole)
 */
export const FloatingDevTools = (props: FloatingMenuProps) => (
  <View style={styles.container} pointerEvents="box-none">
    <AppHostProvider>
      <FloatingMenu {...props} />
      <AppOverlay />
    </AppHostProvider>
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
});