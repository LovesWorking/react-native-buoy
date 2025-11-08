/**
 * useRouteSitemap - React hooks for accessing parsed route information
 *
 * Provides access to the Expo Router route tree with parsing, filtering,
 * and search capabilities.
 */

import { useState, useEffect, useMemo } from "react";
import {
  RouteParser,
  type RouteInfo,
  type RouteGroup,
  type RouteStats,
} from "./RouteParser";

// Type-only definition to avoid Metro resolution issues
type RouteNode = any;

/**
 * Access expo-router's internal store
 * Using the source path as documented in Expo Router interception guides
 */
function getRouterStore() {
  try {
    // Import from source path (not build path) as per documentation
    // @ts-ignore - Dynamic require for runtime resolution
    const routerStore = require("expo-router/src/global-state/router-store");

    // The store is exported directly
    const store = routerStore.store;

    // Validate that we have the expected properties
    if (store && typeof store === 'object' && 'routeNode' in store) {
      return store;
    }

    if (__DEV__) {
      console.warn('[useRouteSitemap] Store object missing expected properties');
    }
    return null;
  } catch (error) {
    // Log error in development for debugging
    if (__DEV__) {
      console.error('[useRouteSitemap] Failed to access expo-router store:', error);
    }
    return null;
  }
}

/**
 * Get the current RouteNode from expo-router
 */
function getRouteNode(): RouteNode | null {
  try {
    const store = getRouterStore();
    if (!store) {
      if (__DEV__) {
        console.warn('[useRouteSitemap] Router store not available');
      }
      return null;
    }

    // The routeNode is available independently of navigation state
    // It's set during the initial app setup via getRoutes()
    const routeNode = store.routeNode;
    if (!routeNode) {
      if (__DEV__) {
        console.warn('[useRouteSitemap] Route node not available in store');
      }
      return null;
    }

    if (__DEV__) {
      console.log('[useRouteSitemap] Successfully loaded route node');
    }

    return routeNode;
  } catch (error) {
    if (__DEV__) {
      console.error('[useRouteSitemap] Error getting route node:', error);
    }
    return null;
  }
}

// ============================================================================
// Hook Options & Return Types
// ============================================================================

export interface UseRouteSitemapOptions {
  /**
   * Search query to filter routes
   */
  searchQuery?: string;

  /**
   * How to sort routes
   */
  sortBy?: "path" | "type" | "name";

  /**
   * Auto-refresh when route tree changes
   * @default false
   */
  autoRefresh?: boolean;

  /**
   * Refresh interval in milliseconds (when autoRefresh is true)
   * @default 1000
   */
  refreshInterval?: number;
}

export interface UseRouteSitemapResult {
  /**
   * All parsed routes (nested structure)
   */
  routes: RouteInfo[];

  /**
   * Routes organized into groups
   */
  groups: RouteGroup[];

  /**
   * Route statistics
   */
  stats: RouteStats;

  /**
   * Filtered routes based on search query
   */
  filteredRoutes: RouteInfo[];

  /**
   * Is route data loaded
   */
  isLoaded: boolean;

  /**
   * Manually refresh route data
   */
  refresh: () => void;

  /**
   * Find a route by path
   */
  findRoute: (path: string) => RouteInfo | null;

  /**
   * Get parent routes for a path
   */
  getParents: (path: string) => RouteInfo[];
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Hook to access and parse Expo Router's route tree
 *
 * @example
 * ```tsx
 * const { routes, groups, stats, filteredRoutes } = useRouteSitemap({
 *   searchQuery: 'pokemon',
 *   sortBy: 'path',
 *   autoRefresh: true
 * });
 * ```
 */
export function useRouteSitemap(
  options: UseRouteSitemapOptions = {}
): UseRouteSitemapResult {
  const {
    searchQuery = "",
    sortBy = "path",
    autoRefresh = false,
    refreshInterval = 1000,
  } = options;

  const [routeNode, setRouteNode] = useState<RouteNode | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load route tree initially and on refresh
  const refresh = () => {
    const node = getRouteNode();
    setRouteNode(node);
    setIsLoaded(node !== null);
  };

  // Initial load with retries
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;
    const retryDelay = 500; // ms

    const attemptLoad = () => {
      const node = getRouteNode();
      if (node) {
        setRouteNode(node);
        setIsLoaded(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        if (__DEV__) {
          console.log(`[useRouteSitemap] Retry attempt ${attempts}/${maxAttempts}`);
        }
        setTimeout(attemptLoad, retryDelay);
      } else {
        if (__DEV__) {
          console.error('[useRouteSitemap] Failed to load routes after maximum retries');
        }
        // Set isLoaded to true anyway to show an error state rather than loading forever
        setIsLoaded(true);
      }
    };

    // Start initial attempt after a small delay
    const timeout = setTimeout(attemptLoad, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Parse routes
  const routes = useMemo(() => {
    if (!routeNode) return [];
    return RouteParser.parseRouteTree(routeNode);
  }, [routeNode]);

  // Sort routes
  const sortedRoutes = useMemo(() => {
    return RouteParser.sortRoutes(routes, sortBy);
  }, [routes, sortBy]);

  // Filter routes by search query
  const filteredRoutes = useMemo(() => {
    if (!searchQuery) return sortedRoutes;
    return RouteParser.filterRoutes(sortedRoutes, searchQuery);
  }, [sortedRoutes, searchQuery]);

  // Organize into groups
  const groups = useMemo(() => {
    return RouteParser.organizeRoutes(filteredRoutes);
  }, [filteredRoutes]);

  // Calculate stats
  const stats = useMemo(() => {
    return RouteParser.getRouteStats(routes);
  }, [routes]);

  // Helper functions
  const findRoute = (path: string) => RouteParser.findRouteByPath(routes, path);
  const getParents = (path: string) =>
    RouteParser.getParentRoutes(routes, path);

  return {
    routes: sortedRoutes,
    groups,
    stats,
    filteredRoutes,
    isLoaded,
    refresh,
    findRoute,
    getParents,
  };
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Get a specific route by path
 *
 * @example
 * ```tsx
 * const pokemonRoute = useRoute('/pokemon/[id]');
 * ```
 */
export function useRoute(path: string): RouteInfo | null {
  const { findRoute } = useRouteSitemap();
  return useMemo(() => findRoute(path), [findRoute, path]);
}

/**
 * Get all parent routes for a given path
 *
 * @example
 * ```tsx
 * const parents = useParentRoutes('/pokemon/[id]');
 * // Returns: [{ path: '/pokemon', ... }]
 * ```
 */
export function useParentRoutes(path: string): RouteInfo[] {
  const { getParents } = useRouteSitemap();
  return useMemo(() => getParents(path), [getParents, path]);
}
