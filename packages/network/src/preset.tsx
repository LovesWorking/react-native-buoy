/**
 * Pre-configured network monitoring tool for FloatingDevTools
 *
 * This preset provides a zero-config way to add network request monitoring to your dev tools.
 * Just import and add it to your apps array!
 *
 * @example
 * ```tsx
 * import { networkToolPreset } from '@react-buoy/network';
 *
 * const installedApps = [
 *   networkToolPreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */

import { Globe } from "@react-buoy/shared-ui";
import { NetworkModal } from "./network/components/NetworkModal";

/**
 * Pre-configured network monitoring tool for FloatingDevTools.
 * Includes:
 * - Live network request monitoring
 * - Request/response inspection
 * - Filter by status, method, URL
 * - Timing information
 */
export const networkToolPreset = {
  id: "network",
  name: "NET",
  description: "Network request logger",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => <Globe size={size} color="#00D4FF" />,
  component: NetworkModal,
  props: {
    enableSharedModalDimensions: true,
  },
};

/**
 * Create a custom network monitoring tool configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createNetworkTool } from '@react-buoy/network';
 *
 * const myNetworkTool = createNetworkTool({
 *   name: "REQUESTS",
 *   iconColor: "#9945FF", // Purple color
 *   enableSharedModalDimensions: true,
 * });
 * ```
 */
export function createNetworkTool(options?: {
  /** Tool name (default: "NET") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color (default: cyan "#00D4FF") */
  iconColor?: string;
  /** Custom tool ID (default: "network") */
  id?: string;
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}) {
  return {
    id: options?.id || "network",
    name: options?.name || "NET",
    description: options?.description || "Network request logger",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <Globe size={size} color={options?.iconColor || "#00D4FF"} />
    ),
    component: NetworkModal,
    props: {
      enableSharedModalDimensions:
        options?.enableSharedModalDimensions !== undefined
          ? options.enableSharedModalDimensions
          : true,
    },
  };
}
