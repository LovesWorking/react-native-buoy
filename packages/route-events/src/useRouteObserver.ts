/**
 * useRouteObserver - React hook for observing route changes
 *
 * Uses public Expo Router hooks to track route changes and emits them
 * to the global RouteObserver singleton.
 *
 * IMPORTANT: This hook must be called from a component that is inside
 * the Expo Router navigation tree (a child of Stack, Tabs, or Slot).
 */

import { useEffect, useRef } from "react";
import { usePathname, useSegments, useGlobalSearchParams } from "expo-router";
import { routeObserver, type RouteChangeEvent } from "./RouteObserver";

/**
 * Hook to observe route changes in Expo Router
 * Automatically emits events to the global RouteObserver
 *
 * @param callback - Optional function to call on route changes (in addition to the observer)
 *
 * @example
 * ```tsx
 * // Just track routes (no custom callback)
 * useRouteObserver();
 *
 * // Track routes with custom callback
 * useRouteObserver((event) => {
 *   // Handle route change
 *   analytics.trackPageView(event.pathname);
 * });
 * ```
 */
export function useRouteObserver(callback?: (event: RouteChangeEvent) => void) {
  const pathname = usePathname();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const callbackRef = useRef(callback);
  const previousPathnameRef = useRef<string | undefined>(undefined);
  const previousTimestampRef = useRef<number | undefined>(undefined);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Trigger observer and callback whenever route changes
  useEffect(() => {
    const now = Date.now();
    const timeSincePrevious = previousTimestampRef.current
      ? now - previousTimestampRef.current
      : undefined;

    const event: RouteChangeEvent = {
      pathname,
      params: params as Record<string, string | string[]>,
      segments: segments as string[],
      timestamp: now,
      previousPathname: previousPathnameRef.current,
      timeSincePrevious,
    };

    // Update refs for next navigation
    previousPathnameRef.current = pathname;
    previousTimestampRef.current = now;

    // Emit to the global observer (this notifies the modal)
    routeObserver.emit(event);

    // Also call the custom callback if provided
    if (callbackRef.current) {
      callbackRef.current(event);
    }
  }, [pathname, segments, params]);
}
