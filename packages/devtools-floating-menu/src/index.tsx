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

// Export default configuration types and utilities
export {
  createDefaultConfig,
  validateDialConfig,
  isFloatingToolId,
  isDialToolId,
  MAX_DIAL_TOOLS,
} from "./floatingMenu/defaultConfig";
export type {
  BuiltInToolId,
  FloatingToolId,
  FloatingOnlyToolId,
  DialToolId,
  DefaultFloatingConfig,
  DefaultDialConfig,
} from "./floatingMenu/defaultConfig";

// Export FloatingMenu and its types
export { FloatingMenu } from "./floatingMenu/FloatingMenu";
export * from "./floatingMenu/types";
export {
  DevToolsSettingsModal,
  useDevToolsSettings,
} from "./floatingMenu/DevToolsSettingsModal";
export type { DevToolsSettings, GlobalDevToolsSettings } from "./floatingMenu/DevToolsSettingsModal";

// Export AppHost components for advanced use cases
export {
  AppHostProvider,
  AppOverlay,
  useAppHost,
} from "./floatingMenu/AppHost";

// Export DevTools visibility tracking
export {
  DevToolsVisibilityProvider,
  useDevToolsVisibility,
} from "./floatingMenu/DevToolsVisibilityContext";

// Export toggle state manager
export { toggleStateManager } from "./floatingMenu/ToggleStateManager";

// Export minimized tools components
export {
  MinimizedToolsProvider,
  useMinimizedTools,
  getIconPosition,
  getIconSize,
} from "./floatingMenu/MinimizedToolsContext";
export type {
  MinimizedTool,
  ModalRestoreState,
  IconPosition,
} from "./floatingMenu/MinimizedToolsContext";
export { MinimizedToolsStack } from "./floatingMenu/MinimizedToolsStack";
