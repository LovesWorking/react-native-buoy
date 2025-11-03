// Export route events modal (primary export - everything you need!)
export { RouteEventsModalWithTabs } from "./components/RouteEventsModalWithTabs";
export type { RouteEventsModalWithTabsProps } from "./components/RouteEventsModalWithTabs";

// Export preset configuration (easiest way to add to FloatingDevTools!)
export { routeEventsToolPreset, createRouteEventsTool } from "./preset";

// Export individual components for advanced usage
export { RoutesSitemap } from "./components/RoutesSitemap";
export type { RoutesSitemapProps } from "./components/RoutesSitemap";
export { NavigationStack } from "./components/NavigationStack";
export type { NavigationStackProps } from "./components/NavigationStack";

// Export advanced/optional utilities
// Note: Most users won't need these - the modal handles everything automatically
export { RouteObserver, routeObserver } from "./RouteObserver";
export { useRouteObserver } from "./useRouteObserver";
export type { RouteChangeEvent } from "./RouteObserver";

// Export route parser utilities for advanced use cases
export { RouteParser } from "./RouteParser";
export type {
  RouteInfo,
  RouteType,
  RouteGroup,
  RouteStats,
} from "./RouteParser";

// Export route sitemap hooks for advanced use cases
export { useRouteSitemap, useRoute, useParentRoutes } from "./useRouteSitemap";
export type {
  UseRouteSitemapOptions,
  UseRouteSitemapResult,
} from "./useRouteSitemap";

// Export navigation stack utilities for advanced use cases
export { useNavigationStack } from "./useNavigationStack";
export type {
  UseNavigationStackResult,
  StackDisplayItem,
} from "./useNavigationStack";
