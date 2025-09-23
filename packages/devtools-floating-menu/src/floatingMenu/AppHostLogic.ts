import type { ComponentType } from "react";

export type LaunchMode = "self-modal" | "host-modal" | "inline";

export type AppInstance = {
  instanceId: string;
  id: string;
  title?: string;
  component: ComponentType<any>;
  props?: Record<string, unknown>;
  launchMode: LaunchMode;
  singleton?: boolean;
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
): { apps: AppInstance[]; instanceId: string } => {
  if (def.singleton) {
    const existing = current.find((app) => app.id === def.id);
    if (existing) {
      return {
        instanceId: existing.instanceId,
        apps: [
          ...current.filter((app) => app.instanceId !== existing.instanceId),
          existing,
        ],
      };
    }
  }

  const instanceId = generateId();
  return {
    instanceId,
    apps: [...current, { ...def, instanceId }],
  };
};
