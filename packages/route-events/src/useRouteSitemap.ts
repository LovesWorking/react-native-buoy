/**
 * useRouteSitemap - React hooks for accessing parsed route information
 *
 * Provides access to the Expo Router route tree with parsing, filtering,
 * and search capabilities.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RouteParser,
  type RouteInfo,
  type RouteGroup,
  type RouteStats,
} from "./RouteParser";
import { getRouteNodeMetadata, loadRouteNode } from "./expoRouterStore";

// Type-only definition to avoid Metro resolution issues
type RouteNode = any;

/**
 * Extract all routes from the navigation state recursively
 * This builds a RouteNode-like structure from React Navigation's state
 */
function buildRouteNodeFromNavigationState(state: any): RouteNode | null {
  if (!state || !state.routes) return null;

  // Find the app directory structure from the navigation state
  // The root route usually contains the file-based routing structure
  const rootRoute = state.routes?.[0];

  if (!rootRoute) return null;

  // Build a simple route node structure
  // This will work with the RouteParser
  const routeNode = {
    type: 'route',
    route: '',
    dynamic: null,
    children: [] as any[],
    contextKey: '_app',
  };

  // Recursively collect all routes from the state
  function collectRoutes(navState: any, parent: any, pathPrefix: string = '') {
    if (!navState || !navState.routes) return;

    navState.routes.forEach((route: any) => {
      const routeName = route.name;

      // Skip internal routes
      if (routeName.startsWith('__') || routeName.includes('_layout') || routeName.startsWith('+not-found')) {
        return;
      }

      // Create a route node
      const node = {
        type: routeName === 'index' ? 'route' : 'route',
        route: routeName === 'index' ? '' : routeName,
        dynamic: routeName.includes('[') ? [routeName.match(/\[([^\]]+)\]/)?.[1] || ''] : null,
        children: [],
        contextKey: `app/${routeName}`,
      };

      parent.children.push(node);

      // If this route has nested state, recurse
      if (route.state) {
        collectRoutes(route.state, node, `${pathPrefix}/${routeName}`);
      }
    });
  }

  collectRoutes(state, routeNode);

  return routeNode.children.length > 0 ? routeNode : null;
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

  /**
   * Timestamp of the most recent successful load
   */
  lastUpdatedAt: number | null;

  /**
   * Which expo-router path provided the route store ("build" or "src")
   */
  source: "build" | "src" | null;
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

  const [routeTreeState, setRouteTreeState] = useState<{
    node: RouteNode | null;
    version: number;
    lastUpdatedAt: number | null;
    source: "build" | "src" | null;
  }>(() => {
    const node = loadRouteNode();
    const metadata = getRouteNodeMetadata();
    return {
      node,
      version: 0,
      lastUpdatedAt: metadata.lastLoadedAt,
      source: metadata.source,
    };
  });

  const routeNode = routeTreeState.node;
  const routeNodeVersion = routeTreeState.version;
  const lastUpdatedAt = routeTreeState.lastUpdatedAt;
  const source = routeTreeState.source;

  const refresh = useCallback(() => {
    setRouteTreeState((previous) => {
      const node = loadRouteNode();
      const metadata = getRouteNodeMetadata();
      return {
        node,
        version: previous.version + 1,
        lastUpdatedAt: metadata.lastLoadedAt,
        source: metadata.source,
      };
    });
  }, []);

  // When the route tree isn't available yet (e.g., Expo Router still mounting),
  // poll until it becomes ready. Use a more aggressive retry since the store
  // is a singleton that gets populated asynchronously.
  useEffect(() => {
    if (routeNode) {
      return;
    }

    let retryCount = 0;
    const maxRetries = 100; // 10 seconds max
    let hasLoggedWaiting = false;

    const poll = () => {
      retryCount++;

      // Log once when we start waiting
      if (__DEV__ && !hasLoggedWaiting && retryCount > 5) {
        console.log("[useRouteSitemap] Waiting for route tree...");
        hasLoggedWaiting = true;
      }

      refresh();

      if (retryCount < maxRetries) {
        timeoutRef = setTimeout(poll, 100);
      }
    };

    let timeoutRef = setTimeout(poll, 100);
    return () => clearTimeout(timeoutRef);
  }, [routeNode, refresh]);

  // Optional auto-refresh hook for callers that want periodic updates
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refresh, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  const isLoaded = !!routeNode;

  // Parse routes
  const routes = useMemo(() => {
    if (!routeNode) return [];
    return RouteParser.parseRouteTree(routeNode);
  }, [routeNode, routeNodeVersion]);

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
    lastUpdatedAt,
    source,
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
