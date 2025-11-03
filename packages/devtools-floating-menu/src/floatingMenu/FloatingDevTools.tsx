import React, { useMemo } from "react";
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
 * Environment variable configuration
 * Can be a simple string (just check existence) or an object with validation rules
 */
export type EnvVarConfig =
  | string
  | {
      key: string;
      expectedValue?: string;
      expectedType?: "string" | "number" | "boolean" | "object" | "array";
      description?: string;
    };

/**
 * Storage key configuration for monitoring
 */
export interface StorageKeyConfig {
  key: string;
  expectedType?: "string" | "number" | "boolean" | "object";
  expectedValue?: string;
  description?: string;
  storageType: "async" | "secure" | "mmkv";
}

/**
 * Props for FloatingDevTools component.
 * Apps prop is optional - if not provided, all installed dev tools are auto-discovered.
 */
export interface FloatingDevToolsProps extends Omit<FloatingMenuProps, "apps"> {
  /**
   * Optional array of custom dev tool apps or overrides.
   * Use this ONLY for custom tools or to override built-in tool behavior.
   * Auto-discovered tools will be merged with these apps.
   * Apps with matching IDs will override auto-discovered ones.
   */
  apps?: InstalledApp[];

  /**
   * Optional environment variables to validate.
   * Just pass the array directly - no wrapper function needed!
   *
   * @example
   * ```tsx
   * <FloatingDevTools
   *   requiredEnvVars={[
   *     "API_URL",  // Just check if exists
   *     { key: "DEBUG_MODE", expectedType: "boolean" },
   *     { key: "ENVIRONMENT", expectedValue: "development" },
   *   ]}
   * />
   * ```
   */
  requiredEnvVars?: EnvVarConfig[];

  /**
   * Optional storage keys to monitor.
   * Just pass the array directly!
   *
   * @example
   * ```tsx
   * <FloatingDevTools
   *   requiredStorageKeys={[
   *     { key: "@app/session", expectedType: "string", storageType: "async" },
   *   ]}
   * />
   * ```
   */
  requiredStorageKeys?: StorageKeyConfig[];
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
 * **With Validation (Super Simple!):**
 * ```tsx
 * <FloatingDevTools
 *   requiredEnvVars={[
 *     "API_URL",  // Just check existence
 *     { key: "DEBUG_MODE", expectedType: "boolean" },
 *   ]}
 *   requiredStorageKeys={[
 *     { key: "@app/session", storageType: "async" },
 *   ]}
 *   environment="local"
 *   userRole="admin"
 * />
 * ```
 *
 * **With Custom Tools:**
 * ```tsx
 * <FloatingDevTools
 *   apps={[myCustomTool]}
 *   environment="local"
 *   userRole="admin"
 * />
 * ```
 *
 * The component is absolutely positioned to float on top of your application
 * regardless of where it's placed in the component tree.
 *
 * @param props - FloatingDevTools props
 */
export const FloatingDevTools = ({
  apps,
  requiredEnvVars,
  requiredStorageKeys,
  ...props
}: FloatingDevToolsProps) => {
  // Build config overrides if requiredEnvVars or requiredStorageKeys are provided
  const configOverrides = useMemo(() => {
    const overrides: InstalledApp[] = [];

    // If requiredEnvVars provided, create ENV tool config
    if (requiredEnvVars && requiredEnvVars.length > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const {
          createEnvTool,
          createEnvVarConfig,
        } = require("@react-buoy/env");
        // Convert simple format to the internal format
        overrides.push(
          createEnvTool({
            requiredEnvVars: createEnvVarConfig(requiredEnvVars),
          })
        );
      } catch (error) {
        // Package not installed, skip
      }
    }

    // If requiredStorageKeys provided, create Storage tool config
    if (requiredStorageKeys && requiredStorageKeys.length > 0) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { createStorageTool } = require("@react-buoy/storage");
        overrides.push(createStorageTool({ requiredStorageKeys }));
      } catch (error) {
        // Package not installed, skip
      }
    }

    return overrides;
  }, [requiredEnvVars, requiredStorageKeys]);

  // Combine user apps with config overrides
  const userApps = useMemo(() => {
    if (!apps && configOverrides.length === 0) return undefined;
    return [...(apps || []), ...configOverrides];
  }, [apps, configOverrides]);

  // Always auto-discover, then merge with any user-provided apps or config overrides
  // User-provided apps and config overrides take precedence (by ID)
  const finalApps = userApps
    ? autoDiscoverPresetsWithCustom(userApps)
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
