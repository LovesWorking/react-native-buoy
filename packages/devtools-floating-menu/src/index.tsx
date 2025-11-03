// Export unified component - primary interface
export { FloatingDevTools } from "./floatingMenu/FloatingDevTools";
export type { FloatingDevToolsProps } from "./floatingMenu/FloatingDevTools";

// Export auto-discovery utilities
export {
  autoDiscoverPresets,
  autoDiscoverPresetsWithCustom,
} from "./floatingMenu/autoDiscoverPresets";

// Export FloatingMenu and its types
export { FloatingMenu } from "./floatingMenu/FloatingMenu";
export * from "./floatingMenu/types";
export {
  DevToolsSettingsModal,
  useDevToolsSettings,
} from "./floatingMenu/DevToolsSettingsModal";
export type { DevToolsSettings } from "./floatingMenu/DevToolsSettingsModal";

// Export AppHost components for advanced use cases
export {
  AppHostProvider,
  AppOverlay,
  useAppHost,
} from "./floatingMenu/AppHost";

// =============================================================================
// Re-export all dev tool configuration helpers from packages
// This allows users to import everything from @react-buoy/core
// =============================================================================

// ENV Tools
export {
  createEnvTool,
  createEnvVarConfig,
  envVar,
  envToolPreset,
} from "@react-buoy/env";
export type {
  RequiredEnvVar,
  EnvVarRule,
  Environment,
  UserRole,
} from "@react-buoy/env";

// Network Tools
export {
  createNetworkTool,
  networkToolPreset,
} from "@react-buoy/network";

// Storage Tools
export {
  createStorageTool,
  storageToolPreset,
} from "@react-buoy/storage";
export type { RequiredStorageKey } from "@react-buoy/storage";

// React Query Tools
export {
  createReactQueryTool,
  reactQueryToolPreset,
  createWifiToggleTool,
  wifiTogglePreset,
} from "@react-buoy/react-query";

// Route Events Tools
export {
  createRouteEventsTool,
  routeEventsToolPreset,
} from "@react-buoy/route-events";
