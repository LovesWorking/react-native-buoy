/**
 * Pre-configured AsyncStorage browser tool for FloatingDevTools
 *
 * This preset provides a zero-config way to add AsyncStorage inspection to your dev tools.
 * Just import and add it to your apps array!
 *
 * @example
 * ```tsx
 * import { storageToolPreset } from '@react-buoy/storage';
 *
 * const installedApps = [
 *   storageToolPreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */

import { StorageStackIcon } from "@react-buoy/shared-ui";
import { StorageModalWithTabs } from "./storage/components/StorageModalWithTabs";
import type { RequiredStorageKey } from "./storage/types";

/**
 * Pre-configured AsyncStorage browser tool for FloatingDevTools.
 * Includes:
 * - Browse all AsyncStorage keys and values
 * - Edit, delete, and add storage items
 * - Live storage event monitoring
 * - Required key validation
 */
export const storageToolPreset = {
  id: "storage",
  name: "STORAGE",
  description: "AsyncStorage browser",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => (
    <StorageStackIcon size={size} colorPreset="green" noBackground />
  ),
  component: StorageModalWithTabs,
  props: {
    requiredStorageKeys: [] as RequiredStorageKey[],
    enableSharedModalDimensions: false,
  },
};

/**
 * Create a custom AsyncStorage browser tool configuration.
 * Use this if you want to override default settings or provide required storage keys.
 *
 * @example
 * ```tsx
 * import { createStorageTool } from '@react-buoy/storage';
 *
 * const requiredStorageKeys = [
 *   {
 *     key: "@app/session",
 *     expectedType: "string",
 *     description: "User session token",
 *     storageType: "async",
 *   },
 * ];
 *
 * const myStorageTool = createStorageTool({
 *   requiredStorageKeys,
 *   colorPreset: "purple",
 *   enableSharedModalDimensions: true,
 * });
 * ```
 */
export function createStorageTool(options?: {
  /** Tool name (default: "STORAGE") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "green") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  /** Custom tool ID (default: "storage") */
  id?: string;
  /** Array of required storage keys to validate */
  requiredStorageKeys?: RequiredStorageKey[];
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}) {
  return {
    id: options?.id || "storage",
    name: options?.name || "STORAGE",
    description: options?.description || "AsyncStorage browser",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <StorageStackIcon
        size={size}
        colorPreset={options?.colorPreset || "green"}
        noBackground
      />
    ),
    component: StorageModalWithTabs,
    props: {
      requiredStorageKeys: options?.requiredStorageKeys || [],
      enableSharedModalDimensions:
        options?.enableSharedModalDimensions !== undefined
          ? options.enableSharedModalDimensions
          : false,
    },
  };
}
