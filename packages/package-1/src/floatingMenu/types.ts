import { ComponentType } from "react";

export type AppSlot = "row" | "dial" | "both";

// Generic, dynamic context — no predefined tool actions
export type FloatingMenuState = Record<string, unknown>;
export type FloatingMenuActions = Record<string, (...args: any[]) => void>;

export type FloatingMenuRenderCtx = {
  slot: AppSlot;
  size: number;
  state?: FloatingMenuState;
  actions?: FloatingMenuActions;
};

export interface InstalledApp {
  id: string;
  name: string;
  icon: React.ReactNode | ((ctx: FloatingMenuRenderCtx) => React.ReactNode);
  slot?: AppSlot; // default "both"
  color?: string;

  /** Plug-and-play launching component handled by the AppHost */
  component: ComponentType<any>;
  /** Props to pass to component (e.g. requiredEnvVars). */
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
}
