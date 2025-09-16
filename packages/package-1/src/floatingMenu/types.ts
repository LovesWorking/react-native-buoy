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
  onPress: (ctx: { state?: FloatingMenuState; actions?: FloatingMenuActions }) => void | Promise<void>;
  slot?: AppSlot; // default "both"
  color?: string;
}
