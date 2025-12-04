/**
 * Pre-configured debug borders tool for FloatingDevTools
 *
 * This preset provides a zero-config way to add visual layout debugging to your dev tools.
 * Just import and add it to your apps array! Tap the icon to cycle through modes:
 * - Off (gray icon)
 * - Borders only (green icon)
 * - Borders + Labels (cyan icon)
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

import React, { useState, useEffect } from "react";
import { Layers } from "@react-buoy/shared-ui";

const DebugBordersManager = require("./debug-borders/utils/DebugBordersManager");

type DisplayMode = "off" | "borders" | "labels";

/**
 * Mode colors for the icon
 * - off: gray (disabled)
 * - borders: green (enabled, borders only)
 * - labels: cyan (enabled, with labels)
 */
const MODE_COLORS: Record<DisplayMode, string> = {
  off: "#6b7280",      // Gray
  borders: "#10b981",  // Green
  labels: "#06b6d4",   // Cyan
};

/**
 * Icon component that changes color based on display mode.
 *
 * ⚠️ IMPORTANT - DO NOT MODIFY THIS COMPONENT ⚠️
 * This component MUST use useState and useEffect hooks to subscribe to the manager.
 * It is rendered as a JSX component (<IconComponent />) in FloatingMenu and DialIcon,
 * which allows hooks to work properly.
 *
 * If you remove the hooks or change this to read getMode() directly,
 * the icon color will NOT update when the toggle is pressed.
 */
function BordersIcon({ size }: { size: number }) {
  const [mode, setMode] = useState<DisplayMode>(() => DebugBordersManager.getMode());

  useEffect(() => {
    const unsubscribe = DebugBordersManager.subscribe((newMode: DisplayMode) => {
      setMode(newMode);
    });
    return unsubscribe;
  }, []);

  return <Layers size={size} color={MODE_COLORS[mode]} />;
}

/**
 * Empty component for toggle-only tools (no modal needed)
 */
function EmptyComponent() {
  return null;
}

/**
 * Pre-configured debug borders tool for FloatingDevTools.
 * Tap the icon to cycle through modes: Off → Borders → Labels → Off
 *
 * Features:
 * - Visual layout debugging with colored borders
 * - Optional component labels showing testID, nativeID, component name, etc.
 * - Automatic component tracking
 * - Real-time updates every 2 seconds
 * - Icon changes color: gray (off), green (borders), cyan (labels)
 */
export const debugBordersToolPreset = {
  id: "debug-borders",
  name: "BORDERS",
  description: "Visual layout debugger - tap to cycle modes",
  slot: "menu" as const,
  icon: BordersIcon,
  component: EmptyComponent,
  props: {},
  launchMode: "toggle-only" as const,
  onPress: () => {
    DebugBordersManager.cycle();
    // Icon updates automatically via subscription in BordersIcon component
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
 *   offColor: "#9ca3af",
 *   bordersColor: "#ec4899",
 *   labelsColor: "#8b5cf6",
 * });
 * ```
 */
export function createDebugBordersTool(options?: {
  /** Tool name (default: "BORDERS") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color when off (default: "#6b7280" - gray) */
  offColor?: string;
  /** Icon color in borders mode (default: "#10b981" - green) */
  bordersColor?: string;
  /** Icon color in labels mode (default: "#06b6d4" - cyan) */
  labelsColor?: string;
  /** Custom tool ID (default: "debug-borders") */
  id?: string;
}) {
  const colors: Record<DisplayMode, string> = {
    off: options?.offColor || "#6b7280",
    borders: options?.bordersColor || "#10b981",
    labels: options?.labelsColor || "#06b6d4",
  };

  /**
   * Custom icon component with hooks - rendered as JSX component.
   *
   * ⚠️ IMPORTANT - DO NOT MODIFY THIS COMPONENT ⚠️
   * This component MUST use useState and useEffect hooks to subscribe to the manager.
   * See the comment on BordersIcon above for full explanation.
   */
  const CustomBordersIcon = ({ size }: { size: number }) => {
    const [mode, setMode] = useState<DisplayMode>(() => DebugBordersManager.getMode());

    useEffect(() => {
      const unsubscribe = DebugBordersManager.subscribe((newMode: DisplayMode) => {
        setMode(newMode);
      });
      return unsubscribe;
    }, []);

    return <Layers size={size} color={colors[mode]} />;
  };

  return {
    id: options?.id || "debug-borders",
    name: options?.name || "BORDERS",
    description:
      options?.description || "Visual layout debugger - tap to cycle modes",
    slot: "menu" as const,
    icon: CustomBordersIcon,
    component: EmptyComponent,
    props: {},
    launchMode: "toggle-only" as const,
    onPress: () => {
      DebugBordersManager.cycle();
      // Icon updates automatically via subscription
    },
  };
}

/**
 * Export the standalone overlay for manual integration
 * Use this if you want to control debug borders outside of FloatingDevTools
 */
export { DebugBordersStandaloneOverlay } from "./debug-borders/components/DebugBordersStandaloneOverlay";
