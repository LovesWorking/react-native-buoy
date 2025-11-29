import React, { useMemo, useCallback, ReactNode } from "react";
import { View, StyleSheet } from "react-native";
import { AppHostProvider } from "./AppHost";
import { FloatingMenu, type FloatingMenuProps } from "./FloatingMenu";
import { AppOverlay } from "./AppHost";
import {
  autoDiscoverPresets,
  autoDiscoverPresetsWithCustom,
} from "./autoDiscoverPresets";
import type { InstalledApp } from "./types";
import { DevToolsVisibilityProvider } from "./DevToolsVisibilityContext";
import { HintsProvider } from "@react-buoy/shared-ui";
import { MinimizedToolsProvider } from "./MinimizedToolsContext";

/**
 * Environment variable configuration
 *
 * This type is compatible with RequiredEnvVar from @react-buoy/env
 *
 * @example
 * ```tsx
 * // Simple string (just check existence)
 * "API_URL"
 *
 * // Check for specific type
 * { key: "DEBUG_MODE", expectedType: "boolean" }
 *
 * // Check for specific value
 * { key: "ENVIRONMENT", expectedValue: "development" }
 * ```
 */
export type EnvVarConfig =
  | string
  | {
      key: string;
      expectedValue: string;
      description?: string;
    }
  | {
      key: string;
      expectedType:
        | "string"
        | "number"
        | "boolean"
        | "object"
        | "array"
        | "url";
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

  /**
   * Optional children to render within the DevToolsVisibilityProvider context.
   * Useful for tools that need to react to DevTools visibility (like DebugBordersStandaloneOverlay).
   *
   * @example
   * ```tsx
   * <FloatingDevTools>
   *   <DebugBordersStandaloneOverlay />
   * </FloatingDevTools>
   * ```
   */
  children?: React.ReactNode;

  /**
   * Disable all onboarding hints and tooltips.
   * Set to true if you don't want to show any first-time user hints.
   *
   * @default false
   * @example
   * ```tsx
   * <FloatingDevTools disableHints />
   * ```
   */
  disableHints?: boolean;
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
  children,
  disableHints = false,
  ...props
}: FloatingDevToolsProps) => {
  // Build config overrides if requiredEnvVars or requiredStorageKeys are provided
  const configOverrides = useMemo(() => {
    const overrides: InstalledApp[] = [];

    // If requiredEnvVars provided, create ENV tool config
    if (requiredEnvVars && requiredEnvVars.length > 0) {
      try {
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

  // Check if debug-borders is installed and auto-render the overlay
  const DebugBordersOverlay = useMemo(() => {
    try {
      // @ts-ignore - Dynamic import that may not exist
      const {
        DebugBordersStandaloneOverlay,
      } = require("@react-buoy/debug-borders");
      return DebugBordersStandaloneOverlay;
    } catch {
      return null;
    }
  }, []);

  // Check if highlight-updates is installed and auto-render the overlay
  const HighlightUpdatesOverlay = useMemo(() => {
    try {
      // @ts-ignore - Dynamic import that may not exist
      const {
        HighlightUpdatesOverlay: Overlay,
      } = require("@react-buoy/highlight-updates");
      return Overlay;
    } catch {
      return null;
    }
  }, []);

  // Get tool icon helper for the MinimizedToolsProvider
  const getToolIcon = useCallback(
    (id: string): ReactNode => {
      const tool = finalApps.find((app) => app.id === id);
      if (!tool) return null;
      if (typeof tool.icon === "function") {
        return tool.icon({ slot: "dial", size: 20 });
      }
      return tool.icon;
    },
    [finalApps]
  );

  return (
    <HintsProvider disableHints={disableHints}>
      <View style={styles.container} pointerEvents="box-none">
        <DevToolsVisibilityProvider>
          <AppHostProvider>
            <MinimizedToolsProvider getToolIcon={getToolIcon}>
              <FloatingMenu {...props} apps={finalApps} />
              <AppOverlay />
              {/* MinimizedToolsStack is now integrated into FloatingTools */}
            </MinimizedToolsProvider>
          </AppHostProvider>
          {children}
          {DebugBordersOverlay && <DebugBordersOverlay />}
          {HighlightUpdatesOverlay && <HighlightUpdatesOverlay />}
        </DevToolsVisibilityProvider>
      </View>
    </HintsProvider>
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
