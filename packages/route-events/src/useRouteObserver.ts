/**
 * useRouteObserver - React hook for observing route changes
 *
 * Uses the Expo Router navigationRef to listen for state changes.
 * This approach works regardless of where the hook is rendered in the component tree,
 * unlike hooks like usePathname() which require being inside the navigation context.
 */

import { useEffect, useRef } from "react";
import { routeObserver, type RouteChangeEvent } from "./RouteObserver";
import { getExpoRouterStore } from "./expoRouterStore";

/**
 * Type for the route info returned by the Expo Router store
 */
interface UrlObject {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  searchParams?: URLSearchParams;
}

/**
 * Hook to observe route changes in Expo Router
 * Automatically emits events to the global RouteObserver
 *
 * This hook uses the Expo Router's navigationRef to listen for state changes,
 * which means it works regardless of where it's rendered in the component tree.
 * Unlike usePathname()/useSegments() hooks, this doesn't require being inside
 * the navigation context.
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
  const callbackRef = useRef(callback);
  const previousPathnameRef = useRef<string | undefined>(undefined);
  const previousTimestampRef = useRef<number | undefined>(undefined);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Helper to emit route change event
  const emitRouteChange = (store: any) => {
    let routeInfo: UrlObject | null = null;

    try {
      if (typeof store.getRouteInfo === "function") {
        routeInfo = store.getRouteInfo();
      }
    } catch (error) {
      if (__DEV__) {
        console.log("[useRouteObserver] Error getting route info:", error);
      }
      return;
    }

    if (!routeInfo || !routeInfo.pathname) {
      return;
    }

    const { pathname, params = {}, segments = [] } = routeInfo;

    // Skip if pathname hasn't changed
    if (pathname === previousPathnameRef.current) {
      return;
    }

    if (__DEV__) {
      console.log("[useRouteObserver] New route detected:", pathname);
    }

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
  };

  // Set up the navigation listener
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 100; // 10 seconds max
    let hasLoggedWaiting = false;

    const setupListener = () => {
      const store = getExpoRouterStore() as any;

      if (!store) {
        retryCount++;
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(setupListener, 100);
        }
        return;
      }

      const navigationRef = store.navigationRef;

      if (!navigationRef) {
        if (__DEV__ && !hasLoggedWaiting) {
          console.log("[useRouteObserver] Waiting for Expo Router to initialize...");
          hasLoggedWaiting = true;
        }
        retryCount++;
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(setupListener, 100);
        }
        return;
      }

      // Check if navigation is ready
      const isReady =
        typeof navigationRef.isReady === "function"
          ? navigationRef.isReady()
          : false;

      if (!isReady) {
        retryCount++;
        if (retryCount < maxRetries) {
          retryTimeoutRef.current = setTimeout(setupListener, 100);
        }
        return;
      }

      if (__DEV__) {
        console.log("[useRouteObserver] Connected to Expo Router navigation");
      }

      // Emit initial route
      emitRouteChange(store);

      // Add listener for state changes
      if (typeof navigationRef.addListener === "function") {
        unsubscribeRef.current = navigationRef.addListener(
          "state",
          () => {
            emitRouteChange(store);
          }
        );
      } else if (__DEV__) {
        console.warn(
          "[useRouteObserver] navigationRef.addListener not available"
        );
      }
    };

    setupListener();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);
}
