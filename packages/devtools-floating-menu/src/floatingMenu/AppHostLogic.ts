import type { ComponentType, ReactNode } from "react";
import type { ModalRestoreState } from "./MinimizedToolsContext";

export type LaunchMode = "self-modal" | "host-modal" | "inline" | "toggle-only";

export type AppInstance = {
  instanceId: string;
  id: string;
  title?: string;
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  launchMode: LaunchMode;
  singleton?: boolean;
  /** Whether this app instance is currently minimized */
  minimized?: boolean;
  /** Icon to display when minimized */
  icon?: ReactNode;
  /** Accent color for the tool */
  color?: string;
  /** Modal state to restore when un-minimizing */
  restoreState?: ModalRestoreState;
};

export type OpenDefinition = Omit<AppInstance, "instanceId">;

/**
 * Computes the new list of open tool instances when a user launches a dev app. Singleton
 * tools reuse their existing instance while non-singletons create a new entry using the
 * provided `generateId` helper.
 *
 * @param current - Current stack of open app instances.
 * @param def - Descriptor of the tool to launch (without runtime instance id).
 * @param generateId - Callback used to generate a unique instance identifier.
 * @returns Updated instance list alongside the resolved instance id.
 */
export const resolveOpenAppsState = (
  current: AppInstance[],
  def: OpenDefinition,
  generateId: () => string
): { apps: AppInstance[]; instanceId: string; wasMinimized: boolean } => {
  if (def.singleton) {
    const existing = current.find((app) => app.id === def.id);
    if (existing) {
      const wasMinimized = existing.minimized ?? false;
      return {
        instanceId: existing.instanceId,
        wasMinimized,
        apps: [
          ...current.filter((app) => app.instanceId !== existing.instanceId),
          // Un-minimize the existing app when re-opening it
          { ...existing, minimized: false },
        ],
      };
    }
  }

  const instanceId = generateId();
  return {
    instanceId,
    wasMinimized: false,
    apps: [...current, { ...def, instanceId }],
  };
};
