import { ComponentType } from "react";

/** Where a tool should render within the floating menu surface. */
export type AppSlot = "row" | "dial" | "both";

/** Generic, dynamic context shared with floating tools. */
export type FloatingMenuState = Record<string, unknown>;
/** Named callbacks that floating tools can invoke. */
export type FloatingMenuActions = Record<string, (...args: any[]) => void>;

/**
 * Runtime details provided to tool icon renderers so they can adapt to the menu slot
 * and size they are rendered within.
 */
export type FloatingMenuRenderCtx = {
  /** Slot where the icon is being rendered (row or dial). */
  slot: AppSlot;
  /** Pixel size that the icon should try to fit within. */
  size: number;
  /** Optional shared state object supplied by the host. */
  state?: FloatingMenuState;
  /** Optional shared action callbacks supplied by the host. */
  actions?: FloatingMenuActions;
};

/** Declarative description of an app that can be launched from the floating menu. */
export interface InstalledApp {
  /** Unique identifier used for persistence and settings. */
  id: string;
  /** Human readable name shown in accessibility labels and modal headers. */
  name: string;
  /** Brief description of what this tool does, shown in settings. */
  description?: string;
  /** Visual or functional icon to render in the floating menu. */
  icon: React.ReactNode | ((ctx: FloatingMenuRenderCtx) => React.ReactNode);
  /** Preferred layout slot; defaults to `"both"` when unspecified. */
  slot?: AppSlot;
  /** Optional accent color for the tool. */
  color?: string;

  /** Plug-and-play launching component handled by the AppHost. */
  component: ComponentType<any>;
  /** Props to pass to the launched component (e.g. requiredEnvVars). */
  props?: Record<string, unknown>;
  /**
   * How to render the component:
   * - self-modal: component expects visible/onClose; we supply them.
   * - host-modal: we wrap your component in a simple RN Modal.
   * - inline: full-screen overlay, absolutely positioned.
   */
  launchMode?: "self-modal" | "host-modal" | "inline";
  /** Prevent more than one instance of this app at a time. */
  singleton?: boolean;
  /** Optional callback invoked when the app icon is pressed. */
  onPress?: () => void;
}
