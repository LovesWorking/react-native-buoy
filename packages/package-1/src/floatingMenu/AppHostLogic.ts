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
