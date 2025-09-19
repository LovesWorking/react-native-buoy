import { safeSetItem, safeGetItem } from "@monorepo/shared";

// Helper functions for persisting panel state using shared storage wrapper
const setItem = async (key: string, value: string) => {
  await safeSetItem(key, value);
};

const getItem = async (key: string): Promise<string | null> => {
  return safeGetItem(key);
};

export interface PanelDimensions {
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface PanelState {
  dimensions: PanelDimensions | null;
  height: number | null;
  isFloating: boolean | null;
}

export interface ModalVisibilityState {
  isModalOpen: boolean;
  isDebugModalOpen: boolean;
  isEnvModalOpen?: boolean;
  isSentryModalOpen?: boolean;
  isStorageModalOpen?: boolean;
  isNetworkModalOpen?: boolean;
  selectedQueryKey?: string; // JSON stringified QueryKey
  selectedSection?: string; // For DevTools sections
  activeFilter?: string | null; // React Query filter state: "fresh", "stale", "fetching", "paused", "inactive"
  activeTab?: "queries" | "mutations";
  selectedMutationId?: string;
}

// Storage operations
export const savePanelDimensions = async (
  storagePrefix: string,
  dimensions: PanelDimensions,
) => {
  try {
    await setItem(
      `${storagePrefix}_panel_dimensions`,
      JSON.stringify(dimensions),
    );
  } catch {
    // Silently fail - persistence is optional
  }
};

export const savePanelHeight = async (
  storagePrefix: string,
  height: number,
) => {
  try {
    await setItem(`${storagePrefix}_panel_height`, height.toString());
  } catch {
    // Silently fail - persistence is optional
  }
};

export const saveFloatingMode = async (
  storagePrefix: string,
  isFloating: boolean,
) => {
  try {
    await setItem(`${storagePrefix}_is_floating_mode`, isFloating.toString());
  } catch {
    // Silently fail - persistence is optional
  }
};

export const loadPanelState = async (
  storagePrefix: string,
): Promise<PanelState> => {
  try {
    const [dimensionsStr, heightStr, floatingModeStr] = await Promise.all([
      getItem(`${storagePrefix}_panel_dimensions`),
      getItem(`${storagePrefix}_panel_height`),
      getItem(`${storagePrefix}_is_floating_mode`),
    ]);

    const dimensions = dimensionsStr ? JSON.parse(dimensionsStr) : null;
    const height = heightStr ? parseInt(heightStr, 10) : null;
    const isFloating = floatingModeStr ? floatingModeStr === "true" : null;

    return { dimensions, height, isFloating };
  } catch {
    // Return defaults on error
    return { dimensions: null, height: null, isFloating: null };
  }
};

// Modal visibility state operations
export const saveModalVisibilityState = async (
  storagePrefix: string,
  state: ModalVisibilityState,
) => {
  try {
    const stateJson = JSON.stringify(state);
    // storagePrefix already contains the full key, don't append _modal_state
    const key = storagePrefix;
    await setItem(key, stateJson);
  } catch {
    // Silently fail - persistence is a nice-to-have feature
  }
};

export const loadModalVisibilityState = async (
  storagePrefix: string,
): Promise<ModalVisibilityState | null> => {
  try {
    // storagePrefix already contains the full key, don't append _modal_state
    const key = storagePrefix;
    const stateStr = await getItem(key);
    if (stateStr && stateStr !== "") {
      const parsed = JSON.parse(stateStr);
      return parsed;
    }
    return null;
  } catch {
    // Silently fail - persistence is a nice-to-have feature
    return null;
  }
};

export const clearModalVisibilityState = async (storagePrefix: string) => {
  try {
    // storagePrefix already contains the full key, don't append _modal_state
    const key = storagePrefix;
    await setItem(key, "");
  } catch {
    // Silently fail - persistence is a nice-to-have feature
  }
};
