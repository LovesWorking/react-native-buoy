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
 * Access expo-router's internal store using dynamic require
 * to avoid Metro bundler resolution issues with internal paths
 */
function getRouterStore() {
  try {
    // Try the build path first (more reliable)
    // @ts-ignore - Dynamic require for runtime resolution
    const routerStore = require("expo-router/build/global-state/router-store");
    return routerStore?.store || null;
  } catch (error) {
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
      return null;
    }

    // Check if navigation is ready
    const navRef = store.navigationRef?.current;
    if (!navRef || !navRef.isReady()) {
      return null;
    }

    return store.routeNode || null;
  } catch (error) {
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

  // Initial load
  useEffect(() => {
    // Delay initial load to ensure router is ready
    const timeout = setTimeout(refresh, 100);
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
