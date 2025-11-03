/**
 * Pre-configured React Query devtools for FloatingDevTools
 *
 * This preset provides a zero-config way to add React Query inspection to your dev tools.
 * Just import and add it to your apps array!
 *
 * @example
 * ```tsx
 * import { reactQueryToolPreset } from '@react-buoy/react-query';
 *
 * const installedApps = [
 *   reactQueryToolPreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */

import { ReactQueryIcon, WifiCircuitIcon } from "@react-buoy/shared-ui";
import { ReactQueryDevToolsModal } from "./react-query/components/ReactQueryDevToolsModal";
import { WifiToggleModal } from "./react-query/components/WifiToggleModal";

/**
 * Pre-configured React Query devtools for FloatingDevTools.
 * Includes:
 * - Query browser and inspector
 * - Mutation tracking
 * - Cache inspection
 * - Query invalidation
 * - Performance monitoring
 */
export const reactQueryToolPreset = {
  id: "query",
  name: "QUERY",
  description: "React Query inspector",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => (
    <ReactQueryIcon size={size} colorPreset="red" noBackground />
  ),
  component: ReactQueryDevToolsModal,
  props: {
    enableSharedModalDimensions: true,
  },
};

/**
 * Create a custom React Query devtools configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createReactQueryTool } from '@react-buoy/react-query';
 *
 * const myQueryTool = createReactQueryTool({
 *   name: "TANSTACK",
 *   colorPreset: "purple",
 *   enableSharedModalDimensions: true,
 * });
 * ```
 */
export function createReactQueryTool(options?: {
  /** Tool name (default: "QUERY") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "red") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "red";
  /** Custom tool ID (default: "query") */
  id?: string;
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}) {
  return {
    id: options?.id || "query",
    name: options?.name || "QUERY",
    description:
      options?.description || "React Query inspector",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <ReactQueryIcon
        size={size}
        colorPreset={options?.colorPreset || "red"}
        noBackground
      />
    ),
    component: ReactQueryDevToolsModal,
    props: {
      enableSharedModalDimensions: options?.enableSharedModalDimensions !== undefined 
        ? options.enableSharedModalDimensions 
        : true,
    },
  };
}

/**
 * Pre-configured WiFi toggle tool for FloatingDevTools.
 * Allows toggling React Query's online state to simulate offline scenarios.
 *
 * @example
 * ```tsx
 * import { wifiTogglePreset } from '@react-buoy/react-query';
 *
 * const installedApps = [
 *   wifiTogglePreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */
export const wifiTogglePreset = {
  id: "query-wifi-toggle",
  name: "WIFI",
  description: "React Query WiFi toggle",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => (
    <WifiCircuitIcon
      size={size}
      colorPreset="cyan"
      strength={4}
      noBackground
    />
  ),
  component: WifiToggleModal,
  props: {},
};

/**
 * Create a custom WiFi toggle tool configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createWifiToggleTool } from '@react-buoy/react-query';
 *
 * const myWifiTool = createWifiToggleTool({
 *   name: "OFFLINE",
 *   colorPreset: "purple",
 * });
 * ```
 */
export function createWifiToggleTool(options?: {
  /** Tool name (default: "WIFI") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "cyan") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  /** Custom tool ID (default: "query-wifi-toggle") */
  id?: string;
}) {
  return {
    id: options?.id || "query-wifi-toggle",
    name: options?.name || "WIFI",
    description:
      options?.description || "React Query WiFi toggle",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <WifiCircuitIcon
        size={size}
        colorPreset={options?.colorPreset || "cyan"}
        strength={4}
        noBackground
      />
    ),
    component: WifiToggleModal,
    props: {},
  };
}

