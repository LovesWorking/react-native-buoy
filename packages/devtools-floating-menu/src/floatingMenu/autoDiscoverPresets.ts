import type { InstalledApp } from "./types";

/**
 * Automatically discovers and loads dev tool presets from installed packages.
 *
 * This function attempts to import presets from known dev tool packages.
 * If a package is installed, its preset will be automatically loaded.
 * If a package is not installed, it will be silently skipped.
 *
 * This enables zero-config setup - just install the packages you want
 * and they'll automatically appear in your dev tools!
 *
 * @returns Array of automatically discovered preset configurations
 *
 * @example
 * ```tsx
 * import { FloatingDevTools, autoDiscoverPresets } from '@react-buoy/core';
 *
 * // Automatically discover and load all installed dev tool presets
 * const autoPresets = autoDiscoverPresets();
 *
 * function App() {
 *   return (
 *     <FloatingDevTools
 *       apps={autoPresets} // That's it! All installed tools load automatically
 *       environment="local"
 *       userRole="admin"
 *     />
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Combine auto-discovery with custom tools
 * const autoPresets = autoDiscoverPresets();
 * const customTools = [
 *   {
 *     id: "my-custom-tool",
 *     name: "CUSTOM",
 *     // ... custom config
 *   },
 * ];
 *
 * const allTools = [...autoPresets, ...customTools];
 *
 * <FloatingDevTools apps={allTools} />
 * ```
 */
export function autoDiscoverPresets(): InstalledApp[] {
  const discoveredPresets: InstalledApp[] = [];

  // Try to load each known preset
  // These will only succeed if the package is actually installed
  const presetLoaders = [
    // ENV Tools
    {
      name: "@react-buoy/env",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const { envToolPreset } = require("@react-buoy/env");
          return envToolPreset;
        } catch {
          return null;
        }
      },
    },
    // Network Tools
    {
      name: "@react-buoy/network",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const { networkToolPreset } = require("@react-buoy/network");
          return networkToolPreset;
        } catch {
          return null;
        }
      },
    },
    // Storage Tools
    {
      name: "@react-buoy/storage",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const { storageToolPreset } = require("@react-buoy/storage");
          return storageToolPreset;
        } catch {
          return null;
        }
      },
    },
    // React Query Tools
    {
      name: "@react-buoy/react-query",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const {
            reactQueryToolPreset,
            wifiTogglePreset,
          } = require("@react-buoy/react-query");
          return [reactQueryToolPreset, wifiTogglePreset];
        } catch {
          return null;
        }
      },
    },
    // Route Events
    {
      name: "@react-buoy/route-events",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const { routeEventsToolPreset } = require("@react-buoy/route-events");
          return routeEventsToolPreset;
        } catch {
          return null;
        }
      },
    },
    // Debug Borders
    {
      name: "@react-buoy/debug-borders",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const {
            debugBordersToolPreset,
          } = require("@react-buoy/debug-borders");
          return debugBordersToolPreset;
        } catch {
          return null;
        }
      },
    },
    // Highlight Updates
    {
      name: "@react-buoy/highlight-updates",
      loader: () => {
        try {
          // @ts-ignore - Dynamic import that may not exist
          const {
            highlightUpdatesPreset,
          } = require("@react-buoy/highlight-updates");
          return highlightUpdatesPreset;
        } catch {
          return null;
        }
      },
    },
  ];

  // Attempt to load each preset
  for (const { name, loader } of presetLoaders) {
    try {
      const preset = loader();
      if (preset) {
        if (Array.isArray(preset)) {
          discoveredPresets.push(...preset);
        } else {
          discoveredPresets.push(preset);
        }
      }
    } catch (error) {
      // Silently skip packages that aren't installed
      // This is expected behavior - not all packages will be installed
    }
  }

  return discoveredPresets;
}

/**
 * Merges auto-discovered presets with custom tools, ensuring no duplicates.
 * Custom tools take precedence over auto-discovered ones with the same ID.
 *
 * @param customTools - Array of custom tool configurations
 * @returns Combined array of tools with custom tools taking precedence
 *
 * @example
 * ```tsx
 * import { FloatingDevTools, autoDiscoverPresetsWithCustom } from '@react-buoy/core';
 * import { createEnvTool } from '@react-buoy/env';
 *
 * const customTools = [
 *   // Override the env preset with custom config
 *   createEnvTool({
 *     requiredEnvVars: myRequiredVars,
 *   }),
 * ];
 *
 * const allTools = autoDiscoverPresetsWithCustom(customTools);
 *
 * <FloatingDevTools apps={allTools} />
 * ```
 */
export function autoDiscoverPresetsWithCustom(
  customTools: InstalledApp[]
): InstalledApp[] {
  const autoPresets = autoDiscoverPresets();

  // Create a map of custom tool IDs for quick lookup
  const customToolIds = new Set(customTools.map((tool) => tool.id));

  // Filter out auto-discovered presets that have custom overrides
  const filteredAutoPresets = autoPresets.filter(
    (preset) => !customToolIds.has(preset.id)
  );

  // Custom tools first (higher priority), then auto-discovered
  return [...customTools, ...filteredAutoPresets];
}
