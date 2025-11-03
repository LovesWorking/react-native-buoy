/**
 * Pre-configured environment variables tool for FloatingDevTools
 *
 * This preset provides a zero-config way to add env var inspection to your dev tools.
 * Just import and add it to your apps array!
 *
 * @example
 * ```tsx
 * import { envToolPreset } from '@react-buoy/env';
 *
 * const installedApps = [
 *   envToolPreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */

import { EnvLaptopIcon } from "@react-buoy/shared-ui";
import { EnvVarsModal } from "./env/components/EnvVarsModal";
import type { RequiredEnvVar } from "./env/types";

/**
 * Pre-configured environment variables tool for FloatingDevTools.
 * Includes:
 * - Automatic env var discovery
 * - Required variable validation
 * - Search and filtering
 * - Copy functionality
 */
export const envToolPreset = {
  id: "env",
  name: "ENV",
  description: "Environment variables debugger",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => (
    <EnvLaptopIcon size={size} colorPreset="green" noBackground />
  ),
  component: EnvVarsModal,
  props: {
    requiredEnvVars: [] as RequiredEnvVar[],
    enableSharedModalDimensions: true,
  },
};

/**
 * Create a custom environment variables tool configuration.
 * Use this if you want to override default settings or provide required env vars.
 *
 * @example
 * ```tsx
 * import { createEnvTool, envVar, createEnvVarConfig } from '@react-buoy/env';
 *
 * const requiredEnvVars = createEnvVarConfig([
 *   envVar("EXPO_PUBLIC_API_URL").exists(),
 *   envVar("EXPO_PUBLIC_DEBUG_MODE").withType("boolean").build(),
 * ]);
 *
 * const myEnvTool = createEnvTool({
 *   requiredEnvVars,
 *   colorPreset: "cyan",
 *   enableSharedModalDimensions: true,
 * });
 * ```
 */
export function createEnvTool(options?: {
  /** Tool name (default: "ENV") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "green") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  /** Custom tool ID (default: "env") */
  id?: string;
  /** Array of required environment variables to validate */
  requiredEnvVars?: RequiredEnvVar[];
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}) {
  return {
    id: options?.id || "env",
    name: options?.name || "ENV",
    description:
      options?.description || "Environment variables debugger",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <EnvLaptopIcon
        size={size}
        colorPreset={options?.colorPreset || "green"}
        noBackground
      />
    ),
    component: EnvVarsModal,
    props: {
      requiredEnvVars: options?.requiredEnvVars || [],
      enableSharedModalDimensions: options?.enableSharedModalDimensions !== undefined
        ? options.enableSharedModalDimensions
        : true,
    },
  };
}

