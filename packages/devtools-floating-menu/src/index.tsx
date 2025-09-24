// Export unified component - primary interface
export { FloatingDevTools } from "./floatingMenu/FloatingDevTools";

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

// Type alias for unified component
export type { FloatingMenuProps as FloatingDevToolsProps } from "./floatingMenu/FloatingMenu";
