import React from "react";
import { View, StyleSheet } from "react-native";
import { AppHostProvider } from "./AppHost";
import { FloatingMenu, type FloatingMenuProps } from "./FloatingMenu";
import { AppOverlay } from "./AppHost";
import {
  autoDiscoverPresets,
  autoDiscoverPresetsWithCustom,
} from "./autoDiscoverPresets";
import type { InstalledApp } from "./types";

/**
 * Props for FloatingDevTools component.
 * Apps prop is optional - if not provided, all installed dev tools are auto-discovered.
 */
export interface FloatingDevToolsProps
  extends Omit<FloatingMenuProps, "apps"> {
  /**
   * Optional array of dev tool apps.
   * If provided, these apps will be merged with auto-discovered presets.
   * Apps with matching IDs will override auto-discovered ones.
   * If not provided, all installed dev tools are auto-discovered.
   */
  apps?: InstalledApp[];
}

/**
 * Unified floating development tools component with automatic preset discovery.
 *
 * This component combines AppHostProvider, FloatingMenu, and AppOverlay
 * into a single component for simplified setup and better developer experience.
 *
 * **Zero-Config Usage:**
 * ```tsx
 * <FloatingDevTools environment="local" userRole="admin" />
 * // All installed dev tools automatically appear!
 * ```
 *
 * **With Custom Configs:**
 * ```tsx
 * <FloatingDevTools
 *   apps={[
 *     createEnvTool({ requiredEnvVars }),
 *     createStorageTool({ requiredStorageKeys }),
 *     // Network, React Query, WiFi, Routes auto-discovered!
 *   ]}
 *   environment="local"
 *   userRole="admin"
 * />
 * ```
 *
 * The component is absolutely positioned to float on top of your application
 * regardless of where it's placed in the component tree.
 *
 * @param props - FloatingDevTools props (apps optional, environment, userRole, etc.)
 */
export const FloatingDevTools = ({
  apps,
  ...props
}: FloatingDevToolsProps) => {
  // Always auto-discover, then merge with any user-provided apps
  // User-provided apps override auto-discovered ones (by ID)
  const finalApps = apps
    ? autoDiscoverPresetsWithCustom(apps)
    : autoDiscoverPresets();

  return (
    <View style={styles.container} pointerEvents="box-none">
      <AppHostProvider>
        <FloatingMenu {...props} apps={finalApps} />
        <AppOverlay />
      </AppHostProvider>
    </View>
  );
};

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