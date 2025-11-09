/**
 * useRouteSitemap - React hooks for accessing parsed route information
 *
 * Provides access to the Expo Router route tree with parsing, filtering,
 * and search capabilities.
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigationState } from "@react-navigation/native";
import {
  RouteParser,
  type RouteInfo,
  type RouteGroup,
  type RouteStats,
} from "./RouteParser";

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

  console.log('[useRouteSitemap] Built route node from nav state, children:', routeNode.children.length);

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

  // Get navigation state using React Navigation's hook
  // This is the same approach that makes the Stack tab work!
  const navigationState = useNavigationState((state) => state);

  // TEMPORARY: Create a mock route node to test if the UI works
  const routeNode = useMemo(() => {
    console.log('[useRouteSitemap] Creating MOCK route node for testing');

    // Return a hardcoded mock route structure
    return {
      type: 'route',
      route: '',
      dynamic: null,
      children: [
        {
          type: 'route',
          route: 'index',
          dynamic: null,
          children: [],
          contextKey: 'app/index.tsx',
        },
        {
          type: 'route',
          route: 'pokemon/[id]',
          dynamic: ['id'],
          children: [],
          contextKey: 'app/pokemon/[id].tsx',
        },
        {
          type: 'route',
          route: 'settings',
          dynamic: null,
          children: [],
          contextKey: 'app/settings.tsx',
        },
        {
          type: 'route',
          route: 'about',
          dynamic: null,
          children: [],
          contextKey: 'app/about.tsx',
        },
      ],
      contextKey: 'app',
    };
  }, []);

  const isLoaded = true; // Always loaded since we're using navigation state

  // Refresh function (no-op since nav state updates automatically)
  const refresh = () => {
    // Navigation state updates automatically
  };

  // Auto-refresh effect (kept for API compatibility)
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
