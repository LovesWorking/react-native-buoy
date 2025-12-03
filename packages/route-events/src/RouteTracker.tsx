/**
 * RouteTracker - A component to place inside your navigation tree
 *
 * This component calls useRouteObserver() which uses expo-router hooks
 * (usePathname, useSegments, etc.) to track navigation changes.
 *
 * IMPORTANT: This component MUST be placed inside your navigation tree
 * (as a child of Stack, Tabs, or Slot) for route tracking to work.
 *
 * @example
 * ```tsx
 * // In your _layout.tsx
 * import { RouteTracker } from '@react-buoy/route-events';
 *
 * export default function RootLayout() {
 *   return (
 *     <>
 *       <Stack>
 *         <Stack.Screen name="(tabs)" />
 *       </Stack>
 *       <RouteTracker />
 *       <FloatingDevTools ... />
 *     </>
 *   );
 * }
 * ```
 */

import { useRouteObserver } from "./useRouteObserver";

export function RouteTracker(): null {
  useRouteObserver();
  return null;
}
