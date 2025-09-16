// Main floating menu export (minimal, generic)
export { FloatingMenu } from "./floatingMenu/FloatingMenu";

// Types
export type { UserRole } from "./floatingMenu/floatingTools";
export type { Environment, RequiredEnvVar } from "./features/env";
export type { RequiredStorageKey } from "./features/storage";
export type { InstalledApp, AppSlot } from "./floatingMenu/types";
export type {
  FloatingMenuActions,
  FloatingMenuState,
  FloatingMenuRenderCtx,
} from "./floatingMenu/types";

// Modal components
export { JsModal } from "./components/modals/jsModal/JsModal";

// Optional: expose dial menu for standalone usage
export { DialDevTools } from "./floatingMenu/dial/DialDevTools";
export { useDevToolsVisibility } from "./floatingMenu/useDevToolsVisibility";
