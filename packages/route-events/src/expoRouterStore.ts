import type { RouteNode } from "expo-router/build/Route";

type ExpoRouterStore = {
  routeNode?: RouteNode | null;
  navigationRef?: {
    isReady?: () => boolean;
  };
};

let cachedStore: ExpoRouterStore | null = null;
let importError: Error | null = null;
let hasLoggedMissingStore = false;
let hasLoggedMissingRouteNode = false;

function logOnce(message: string, error?: unknown) {
  if (__DEV__) {
    if (error) {
      console.error(`[RouteEvents] ${message}`, error);
    } else {
      console.warn(`[RouteEvents] ${message}`);
    }
  }
}

/**
 * Attempt to require the expo-router store from known locations.
 * Returns null (with a logged error in dev) when expo-router is not available.
 */
export function getExpoRouterStore(): ExpoRouterStore | null {
  if (cachedStore) {
    return cachedStore;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require("expo-router/build/global-state/router-store");
    if (module?.store) {
      cachedStore = module.store as ExpoRouterStore;
      importError = null;
      hasLoggedMissingStore = false;
      return cachedStore;
    }
  } catch (error: any) {
    importError = error;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const module = require("expo-router/src/global-state/router-store");
    if (module?.store) {
      cachedStore = module.store as ExpoRouterStore;
      importError = null;
      hasLoggedMissingStore = false;
      return cachedStore;
    }
  } catch (error: any) {
    importError = error;
  }

  if (!hasLoggedMissingStore) {
    logOnce(
      "Unable to load expo-router internals. @react-buoy/route-events requires expo-router >= 2.0.0. Install expo-router and ensure it is configured before using the Routes tab.",
      importError ?? undefined
    );
    hasLoggedMissingStore = true;
  }

  return null;
}

/**
 * Returns the current RouteNode tree (if available).
 * Logs a helpful warning in development when the tree is missing even though
 * the navigation ref is ready.
 */
export function loadRouteNode(): RouteNode | null {
  const store = getExpoRouterStore();
  if (!store) {
    return null;
  }

  if (store.routeNode) {
    hasLoggedMissingRouteNode = false;
    return store.routeNode;
  }

  const isReady = store.navigationRef?.isReady?.();
  if (__DEV__ && !hasLoggedMissingRouteNode && isReady) {
    logOnce(
      "Expo Router route tree is unavailable. Ensure your app directory is configured and that expo-router is initialized before opening the Route Events devtool."
    );
    hasLoggedMissingRouteNode = true;
  }

  return null;
}
