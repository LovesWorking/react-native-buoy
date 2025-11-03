/**
 * Pre-configured route events tool for FloatingDevTools
 *
 * This preset provides a zero-config way to add route tracking to your dev tools.
 * Just import and spread it into your apps array!
 *
 * @example
 * ```tsx
 * import { routeEventsToolPreset } from '@react-buoy/route-events';
 *
 * const installedApps = [
 *   routeEventsToolPreset, // That's it!
 *   // ...other tools
 * ];
 * ```
 */

import { Route } from "@react-buoy/shared-ui";
import { RouteEventsModalWithTabs } from "./components/RouteEventsModalWithTabs";

/**
 * Pre-configured route events tool for FloatingDevTools.
 * Includes:
 * - Route sitemap browser
 * - Event timeline with filtering
 * - Navigation stack visualization
 * - Automatic route tracking (no setup needed)
 */
export const routeEventsToolPreset = {
  id: "route-events",
  name: "ROUTES",
  description: "Route tracking & navigation inspector",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => <Route size={size} color="#f59e0b" />,
  component: RouteEventsModalWithTabs,
  props: {},
};

/**
 * Create a custom route events tool configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createRouteEventsTool } from '@react-buoy/route-events';
 *
 * const myRouteTool = createRouteEventsTool({
 *   name: "MY ROUTES",
 *   color: "#a78bfa",
 *   enableSharedModalDimensions: true,
 * });
 * ```
 */
export function createRouteEventsTool(options?: {
  /** Tool name (default: "ROUTES") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color (default: "#f59e0b") */
  color?: string;
  /** Custom tool ID (default: "route-events") */
  id?: string;
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}) {
  return {
    id: options?.id || "route-events",
    name: options?.name || "ROUTES",
    description:
      options?.description || "Route tracking & navigation inspector",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <Route size={size} color={options?.color || "#f59e0b"} />
    ),
    component: RouteEventsModalWithTabs,
    props: {
      enableSharedModalDimensions: options?.enableSharedModalDimensions,
    },
  };
}
