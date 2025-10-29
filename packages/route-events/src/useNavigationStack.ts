/**
 * useNavigationStack - Hook to access current navigation stack state
 *
 * Provides real-time access to the navigation stack from Expo Router,
 * showing what screens are currently mounted in memory and which is visible.
 *
 * Data source: @react-navigation/native
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigation, useNavigationState } from '@react-navigation/native';

// ============================================================================
// Type Definitions
// ============================================================================

interface RouteStackItem {
  key: string;
  name: string;
  path?: string;
  params?: Record<string, any>;
  state?: any;
}

export interface StackDisplayItem {
  key: string;
  name: string;
  pathname: string;
  params: Record<string, any>;
  isFocused: boolean;
  index: number;
  canPop: boolean;
}

export interface UseNavigationStackResult {
  // Stack data
  stack: StackDisplayItem[];
  focusedRoute: StackDisplayItem | null;
  stackDepth: number;
  isAtRoot: boolean;

  // Stack info
  isLoaded: boolean;
  error: Error | null;

  // Actions
  refresh: () => void;
  navigateToIndex: (index: number) => void;
  popToIndex: (index: number) => void;
  goBack: () => void;
  popToTop: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get router for imperative navigation
 */
function getRouter() {
  try {
    // @ts-ignore - Dynamic require for runtime resolution
    const expoRouter = require('expo-router');
    return expoRouter.router || null;
  } catch (error) {
    console.warn('Could not access expo-router:', error);
    return null;
  }
}

// ============================================================================
// Main Hook
// ============================================================================

/**
 * Recursively collect all routes from the navigation state tree
 */
function collectRoutesFromState(
  state: any,
  depth: number = 0,
  parentPath: string = ''
): RouteStackItem[] {
  if (!state || !state.routes) return [];

  const routes: RouteStackItem[] = [];

  for (let i = 0; i < state.routes.length; i++) {
    const route = state.routes[i];
    const isFocused = i === state.index;

    // Build the path
    let pathname = route.name;
    if (route.name === 'index') {
      pathname = '/';
    } else if (!pathname.startsWith('/')) {
      pathname = `/${pathname}`;
    }

    // Add parent path
    if (parentPath && parentPath !== '/') {
      pathname = `${parentPath}${pathname}`;
    }

    // Add params to pathname for dynamic routes
    if (route.params) {
      const paramEntries = Object.entries(route.params);
      if (paramEntries.length > 0) {
        pathname = pathname.replace(/\[([^\]]+)\]/g, (match: string, param: string) => {
          return route.params[param] || match;
        });
      }
    }

    routes.push({
      key: route.key,
      name: route.name,
      path: pathname,
      params: route.params || {},
      state: route.state,
    });

    // If this route has nested state and is focused, recurse
    if (isFocused && route.state) {
      const nestedRoutes = collectRoutesFromState(route.state, depth + 1, pathname);
      routes.push(...nestedRoutes);
    }
  }

  return routes;
}

/**
 * Access the current navigation stack from Expo Router
 *
 * @example
 * ```tsx
 * const { stack, focusedRoute, goBack, popToTop } = useNavigationStack();
 *
 * // Display stack
 * stack.map(item => (
 *   <View key={item.key}>
 *     <Text>{item.pathname}</Text>
 *     {item.isFocused && <Text>VISIBLE</Text>}
 *   </View>
 * ));
 * ```
 */
export function useNavigationStack(): UseNavigationStackResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigation = useNavigation();

  // Subscribe to navigation state changes - this will cause re-renders when state updates
  const navigationState = useNavigationState(state => state);

  // Mark as loaded once we have navigation
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Transform navigation state into display items
  const stack = useMemo<StackDisplayItem[]>(() => {
    if (!navigationState) return [];

    try {
      const routes = collectRoutesFromState(navigationState);

      // Filter out internal Expo Router routes (layouts, __root, etc.)
      const filteredRoutes = routes.filter(route => {
        // Remove __root and other internal routes
        if (route.name.startsWith('__')) return false;
        if (route.name.includes('_layout')) return false;
        if (route.name.startsWith('+not-found')) return false;
        return true;
      });

      // If we filtered everything out, just keep the last route
      const finalRoutes = filteredRoutes.length > 0 ? filteredRoutes : routes.slice(-1);

      // The last route in the collected list is the focused one
      return finalRoutes.map((route, index) => {
        // Clean up pathname by removing /__root prefix
        let cleanPath = route.path || `/${route.name}`;
        cleanPath = cleanPath.replace(/^\/__root/, '');
        // Ensure we always have at least a /
        if (!cleanPath || cleanPath === '') {
          cleanPath = '/';
        }

        return {
          key: route.key,
          name: route.name,
          pathname: cleanPath,
          params: route.params || {},
          isFocused: index === finalRoutes.length - 1,
          index,
          canPop: index > 0,
        };
      });
    } catch (err) {
      console.error('Error transforming navigation state:', err);
      return [];
    }
  }, [navigationState]);

  // Get focused route
  const focusedRoute = useMemo(() => {
    return stack.find(item => item.isFocused) || null;
  }, [stack]);

  // Helper properties
  const stackDepth = stack.length;
  const isAtRoot = stackDepth <= 1;

  // Manual refresh (no-op since we're using React Navigation's state)
  const refresh = () => {
    // Navigation state updates automatically via useNavigationState
  };

  // Navigation actions
  const navigateToIndex = (index: number) => {
    if (index >= stack.length || index < 0) {
      console.warn('Invalid stack index:', index);
      return;
    }

    const targetRoute = stack[index];
    if (!targetRoute) {
      console.warn('Route not found at index:', index);
      return;
    }

    const router = getRouter();
    if (!router) {
      console.warn('Router not available');
      return;
    }

    try {
      router.navigate(targetRoute.pathname);
    } catch (err) {
      console.error('Failed to navigate:', err);
    }
  };

  const popToIndex = (index: number) => {
    if (index >= stack.length || index < 0) {
      console.warn('Invalid stack index:', index);
      return;
    }

    const currentIndex = stack.length - 1;
    const popCount = currentIndex - index;

    if (popCount <= 0) {
      console.warn('Cannot pop to higher index');
      return;
    }

    const router = getRouter();
    if (!router) {
      console.warn('Router not available');
      return;
    }

    try {
      // Pop multiple times
      for (let i = 0; i < popCount; i++) {
        router.back();
      }
    } catch (err) {
      console.error('Failed to pop:', err);
    }
  };

  const goBack = () => {
    if (isAtRoot) {
      console.warn('Already at root, cannot go back');
      return;
    }

    const router = getRouter();
    if (!router) {
      console.warn('Router not available');
      return;
    }

    try {
      router.back();
    } catch (err) {
      console.error('Failed to go back:', err);
    }
  };

  const popToTop = () => {
    if (isAtRoot) {
      console.warn('Already at root');
      return;
    }

    // Pop to index 0 (root)
    popToIndex(0);
  };

  return {
    stack,
    focusedRoute,
    stackDepth,
    isAtRoot,
    isLoaded,
    error,
    refresh,
    navigateToIndex,
    popToIndex,
    goBack,
    popToTop,
  };
}
