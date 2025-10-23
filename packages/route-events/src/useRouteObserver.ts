/**
 * useRouteObserver - React hook for observing route changes
 *
 * Uses public Expo Router hooks to track route changes
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSegments, useGlobalSearchParams } from 'expo-router';
import type { RouteChangeEvent } from './RouteObserver';

/**
 * Hook to observe route changes in Expo Router
 *
 * @param callback - Function to call on route changes
 *
 * @example
 * ```tsx
 * useRouteObserver((event) => {
 *   console.log('Route changed:', event.pathname);
 * });
 * ```
 */
export function useRouteObserver(
  callback: (event: RouteChangeEvent) => void
) {
  const pathname = usePathname();
  const segments = useSegments();
  const params = useGlobalSearchParams();
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Trigger callback whenever route changes
  useEffect(() => {
    const event: RouteChangeEvent = {
      pathname,
      params: params as Record<string, string | string[]>,
      segments: segments as string[],
      timestamp: Date.now(),
    };

    callbackRef.current(event);
  }, [pathname, segments, params]);
}
