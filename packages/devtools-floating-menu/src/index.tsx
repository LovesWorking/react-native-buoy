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
