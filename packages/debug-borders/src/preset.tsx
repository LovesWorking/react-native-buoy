/**
 * Pre-configured debug borders tool for FloatingDevTools
 *
 * This preset provides a zero-config way to add visual layout debugging to your dev tools.
 * Just import and add it to your apps array! Tap the icon to toggle borders on/off.
 *
 * @example
 * ```tsx
 * import { debugBordersToolPreset } from '@react-buoy/debug-borders';
 *
 * const installedApps = [
 *   debugBordersToolPreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */

import { Layers } from "@react-buoy/shared-ui";

const DebugBordersManager = require("./debug-borders/utils/DebugBordersManager");

/**
 * Icon component that changes color based on enabled state
 * Uses a simple function that checks state synchronously (no hooks)
 */
function BordersIcon({ size }: { size: number }) {
  const enabled = DebugBordersManager.isEnabled();
  return <Layers size={size} color={enabled ? "#10b981" : "#6b7280"} />;
}

/**
 * Empty component for toggle-only tools (no modal needed)
 */
function EmptyComponent() {
  return null;
}

/**
 * Pre-configured debug borders tool for FloatingDevTools.
 * Tap the icon to toggle borders on/off - no modal needed!
 * 
 * Features:
 * - Visual layout debugging with colored borders
 * - Automatic component tracking
 * - Real-time updates every 2 seconds
 * - Simple direct toggle (no modal)
 * - Icon changes color: gray when off, green when on
 */
export const debugBordersToolPreset = {
  id: "debug-borders",
  name: "BORDERS",
  description: "Visual layout debugger - tap to toggle",
  slot: "both" as const,
  icon: BordersIcon,
  component: EmptyComponent,
  props: {},
  launchMode: "toggle-only" as const,
  onPress: () => {
    console.log('[DebugBorders] Toggle pressed');
    DebugBordersManager.toggle();
  },
};

/**
 * Create a custom debug borders tool configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createDebugBordersTool } from '@react-buoy/debug-borders';
 *
 * const myBordersTool = createDebugBordersTool({
 *   name: "LAYOUT",
 *   enabledColor: "#ec4899",
 *   disabledColor: "#9ca3af",
 * });
 * ```
 */
export function createDebugBordersTool(options?: {
  /** Tool name (default: "BORDERS") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color when enabled (default: "#10b981" - green) */
  enabledColor?: string;
  /** Icon color when disabled (default: "#6b7280" - gray) */
  disabledColor?: string;
  /** Custom tool ID (default: "debug-borders") */
  id?: string;
}) {
  const enabledColor = options?.enabledColor || "#10b981";
  const disabledColor = options?.disabledColor || "#6b7280";

  const CustomBordersIcon = ({ size }: { size: number }) => {
    const enabled = DebugBordersManager.isEnabled();
    return <Layers size={size} color={enabled ? enabledColor : disabledColor} />;
  };

  return {
    id: options?.id || "debug-borders",
    name: options?.name || "BORDERS",
    description: options?.description || "Visual layout debugger - tap to toggle",
    slot: "both" as const,
    icon: CustomBordersIcon,
    component: EmptyComponent,
    props: {},
    launchMode: "toggle-only" as const,
    onPress: () => {
      console.log('[DebugBorders] Toggle pressed');
      DebugBordersManager.toggle();
    },
  };
}

