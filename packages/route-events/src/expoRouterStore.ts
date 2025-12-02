import type { RouteNode } from "expo-router/build/Route";

type ExpoRouterStore = {
  routeNode?: RouteNode | null;
  navigationRef?: {
    isReady?: () => boolean;
  };
};

let cachedStore: ExpoRouterStore | null = null;
let cachedStoreSource: "build" | "src" | null = null;
let importError: Error | null = null;
let hasLoggedMissingStore = false;
let hasLoggedMissingRouteNode = false;
let lastRouteNodeTimestamp: number | null = null;

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
 *
 * Note: The store uses getters that read from an internal storeRef.
 * The storeRef gets populated when Expo Router's useStore() hook runs.
 * So we cache the store reference but its property values update over time.
 */
export function getExpoRouterStore(): ExpoRouterStore | null {
  if (cachedStore) {
    return cachedStore;
  }

  const loadFromBuild = () => {
    try {
      const module = require("expo-router/build/global-state/router-store");
      if (module?.store) {
        cachedStore = module.store as ExpoRouterStore;
        cachedStoreSource = "build";
        importError = null;
        hasLoggedMissingStore = false;
        if (__DEV__) {
          console.log("[expoRouterStore] Loaded store from build path");
        }
        return true;
      }
    } catch (error: any) {
      importError = error;
    }
    return false;
  };

  const loadFromSrc = () => {
    try {
      const module = require("expo-router/src/global-state/router-store");
      if (module?.store) {
        cachedStore = module.store as ExpoRouterStore;
        cachedStoreSource = "src";
        importError = null;
        hasLoggedMissingStore = false;
        if (__DEV__) {
          console.log("[expoRouterStore] Loaded store from src path");
        }
        return true;
      }
    } catch (error: any) {
      importError = error;
    }
    return false;
  };

  if (loadFromBuild() || loadFromSrc()) {
    return cachedStore;
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
    lastRouteNodeTimestamp = Date.now();
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

export function getRouteNodeMetadata(): {
  source: "build" | "src" | null;
  lastLoadedAt: number | null;
} {
  return {
    source: cachedStoreSource,
    lastLoadedAt: lastRouteNodeTimestamp,
  };
}
