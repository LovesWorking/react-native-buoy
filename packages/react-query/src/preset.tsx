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

import { ReactQueryIcon, Wifi } from "@react-buoy/shared-ui";
import { ReactQueryDevToolsModal } from "./react-query/components/ReactQueryDevToolsModal";
import { onlineManager } from "@tanstack/react-query";
import { devToolsStorageKeys, safeSetItem } from "@react-buoy/shared-ui";

// Empty component for toggle-only mode
const EmptyComponent = () => null;

// Save WiFi state to storage
const saveWifiState = async (enabled: boolean) => {
  try {
    await safeSetItem(
      devToolsStorageKeys.settings.wifiEnabled(),
      enabled.toString()
    );
  } catch (error) {
    // Failed to save WiFi state
  }
};

import { useState, useEffect } from "react";

/**
 * WiFi icon component - uses hooks to subscribe to onlineManager changes.
 *
 * ⚠️ IMPORTANT - DO NOT MODIFY THIS COMPONENT ⚠️
 * This component MUST use useState and useEffect hooks to subscribe to onlineManager.
 * It is rendered as a JSX component (<IconComponent />) in FloatingMenu and DialIcon,
 * which allows hooks to work properly.
 *
 * If you remove the hooks or change this to read onlineManager.isOnline() directly,
 * the icon color will NOT update when the WiFi toggle is pressed.
 *
 * See: FloatingMenu.tsx (renders as <IconComponent />)
 * See: DialIcon.tsx (renders as <icon.iconComponent />)
 */
function WifiIcon({ size }: { size: number }) {
  const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
    });
    return unsubscribe;
  }, []);

  const color = isOnline ? "#10B981" : "#DC2626";
  return <Wifi size={size} color={color} />;
}

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
    description: options?.description || "React Query inspector",
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
      enableSharedModalDimensions:
        options?.enableSharedModalDimensions !== undefined
          ? options.enableSharedModalDimensions
          : true,
    },
  };
}

/**
 * Pre-configured WiFi toggle tool for FloatingDevTools.
 * Allows toggling React Query's online state to simulate offline scenarios.
 * Simple toggle - no modal needed!
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
  description: "Toggle React Query online/offline state",
  slot: "row" as const,
  icon: WifiIcon,
  component: EmptyComponent,
  props: {},
  launchMode: "toggle-only" as const,
  onPress: () => {
    const newState = !onlineManager.isOnline();
    onlineManager.setOnline(newState);
    saveWifiState(newState);
  },
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
 *   onColor: "#10B981",
 *   offColor: "#DC2626",
 * });
 * ```
 */
export function createWifiToggleTool(options?: {
  /** Tool name (default: "WIFI") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color when online (default: "#10B981" - green) */
  onColor?: string;
  /** Icon color when offline (default: "#DC2626" - red) */
  offColor?: string;
  /** Custom tool ID (default: "query-wifi-toggle") */
  id?: string;
}) {
  const onColor = options?.onColor || "#10B981";
  const offColor = options?.offColor || "#DC2626";

  /**
   * Custom WiFi icon component with hooks - rendered as JSX component.
   *
   * ⚠️ IMPORTANT - DO NOT MODIFY THIS COMPONENT ⚠️
   * This component MUST use useState and useEffect hooks to subscribe to onlineManager.
   * See the comment on WifiIcon above for full explanation.
   */
  const CustomWifiIcon = ({ size }: { size: number }) => {
    const [isOnline, setIsOnline] = useState(() => onlineManager.isOnline());

    useEffect(() => {
      const unsubscribe = onlineManager.subscribe((online) => {
        setIsOnline(online);
      });
      return unsubscribe;
    }, []);

    return <Wifi size={size} color={isOnline ? onColor : offColor} />;
  };

  return {
    id: options?.id || "query-wifi-toggle",
    name: options?.name || "WIFI",
    description:
      options?.description || "Toggle React Query online/offline state",
    slot: "row" as const,
    icon: CustomWifiIcon,
    component: EmptyComponent,
    props: {},
    launchMode: "toggle-only" as const,
    onPress: () => {
      const newState = !onlineManager.isOnline();
      onlineManager.setOnline(newState);
      saveWifiState(newState);
    },
  };
}
