// AsyncStorage import with fallback for when it's not available
let AsyncStorage: {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
} | null = null;
try {
  import("@react-native-async-storage/async-storage").then((module) => {
    AsyncStorage = module.default;
  });
} catch {
  // AsyncStorage not available - will fall back to in-memory storage
  console.warn(
    "AsyncStorage not found. Panel position will not persist across app restarts. To enable persistence, install @react-native-async-storage/async-storage"
  );
}

// Fallback in-memory storage when AsyncStorage is not available
const memoryStorage: Record<string, string> = {};

// Helper functions for persisting panel state with AsyncStorage fallback
const setItem = async (key: string, value: string) => {
  if (AsyncStorage) {
    await AsyncStorage.setItem(key, value);
  } else {
    memoryStorage[key] = value;
  }
};

const getItem = async (key: string): Promise<string | null> => {
  if (AsyncStorage) {
    return await AsyncStorage.getItem(key);
  } else {
    return memoryStorage[key] || null;
  }
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
  selectedQueryKey?: string; // JSON stringified QueryKey
  selectedSection?: string; // For DevTools sections
  activeFilter?: string | null; // React Query filter state: "fresh", "stale", "fetching", "paused", "inactive"
  activeTab?: "queries" | "mutations";
  selectedMutationId?: string;
}

// Storage operations
export const savePanelDimensions = async (
  storagePrefix: string,
  dimensions: PanelDimensions
) => {
  try {
    await setItem(
      `${storagePrefix}_panel_dimensions`,
      JSON.stringify(dimensions)
    );
  } catch {
    console.warn("Failed to save panel dimensions");
  }
};

export const savePanelHeight = async (
  storagePrefix: string,
  height: number
) => {
  try {
    await setItem(`${storagePrefix}_panel_height`, height.toString());
  } catch {
    console.warn("Failed to save panel height");
  }
};

export const saveFloatingMode = async (
  storagePrefix: string,
  isFloating: boolean
) => {
  try {
    await setItem(`${storagePrefix}_is_floating_mode`, isFloating.toString());
  } catch (error) {
    console.warn("Failed to save floating mode:", error);
  }
};

export const loadPanelState = async (
  storagePrefix: string
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
    console.warn("Failed to load panel state");
    return { dimensions: null, height: null, isFloating: null };
  }
};

// Modal visibility state operations
export const saveModalVisibilityState = async (
  storagePrefix: string,
  state: ModalVisibilityState
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
  storagePrefix: string
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
