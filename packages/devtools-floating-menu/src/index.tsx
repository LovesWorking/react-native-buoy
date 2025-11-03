// Export unified component - primary interface
export { FloatingDevTools } from "./floatingMenu/FloatingDevTools";
export type {
  FloatingDevToolsProps,
  EnvVarConfig,
  StorageKeyConfig,
} from "./floatingMenu/FloatingDevTools";

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
// These are runtime-only exports to avoid TypeScript build errors
// Types are available when packages are installed
// =============================================================================

// Runtime re-exports - TypeScript will find types from installed packages
export {
  createEnvTool,
  createEnvVarConfig,
  envVar,
  envToolPreset,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/env";
export type {
  RequiredEnvVar,
  Environment,
  UserRole,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/env";

export {
  createNetworkTool,
  networkToolPreset,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/network";

export {
  createStorageTool,
  storageToolPreset,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/storage";
export type {
  RequiredStorageKey,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/storage";

export {
  createReactQueryTool,
  reactQueryToolPreset,
  createWifiToggleTool,
  wifiTogglePreset,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/react-query";

export {
  createRouteEventsTool,
  routeEventsToolPreset,
  // @ts-expect-error - Optional peer dependency
} from "@react-buoy/route-events";
