import { safeGetItem, safeSetItem } from "@react-buoy/shared-ui";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { BackHandler, Modal, StyleSheet, View } from "react-native";
import {
  AppInstance,
  LaunchMode,
  OpenDefinition,
  resolveOpenAppsState,
} from "./AppHostLogic";
import {
  useMinimizedTools,
  ModalRestoreState,
} from "./MinimizedToolsContext";

type AppHostContextValue = {
  openApps: AppInstance[];
  isAnyOpen: boolean;
  open: (def: Omit<AppInstance, "instanceId">) => string;
  close: (instanceId?: string) => void;
  closeAll: () => void;
  registerApps?: (apps: any[]) => void;
  /** Minimize a tool - hides the modal but keeps state */
  minimize: (instanceId: string) => void;
  /** Restore a minimized tool to visible state, optionally with saved modal state */
  restore: (instanceId: string, restoreState?: ModalRestoreState) => void;
  /** Check if a specific tool is minimized */
  isMinimized: (instanceId: string) => boolean;
};

const AppHostContext = createContext<AppHostContextValue | null>(null);

const STORAGE_KEY_OPEN_APPS = "@react_buoy_open_apps";
const PERSISTENCE_DELAY = 500;

/**
 * Provides the floating dev tools application host. Tracks open tool instances, restores
 * persisted state, and exposes imperative helpers used by `FloatingMenu` and friends.
 */
export const AppHostProvider = ({ children }: { children: ReactNode }) => {
  const [openApps, setOpenApps] = useState<AppInstance[]>([]);
  const [isRestored, setIsRestored] = useState(false);
  const persistenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const installedAppsRef = useRef<any[]>([]);
  const pendingRestoreRef = useRef<string[] | null>(null);

  const open: AppHostContextValue["open"] = useCallback((def) => {
    let resolvedId = "";

    setOpenApps((current) => {
      const { apps, instanceId } = resolveOpenAppsState(
        current,
        def,
        () => `${def.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`
      );
      resolvedId = instanceId;
      return apps;
    });

    return resolvedId;
  }, []);

  const tryRestorePending = useCallback(() => {
    if (isRestored) return;
    if (!installedAppsRef.current.length) return;

    const pendingIds = pendingRestoreRef.current;
    if (!pendingIds || pendingIds.length === 0) {
      setIsRestored(true);
      return;
    }

    pendingRestoreRef.current = null;

    pendingIds.forEach((appId) => {
      const appDef = installedAppsRef.current.find(
        (app: any) => app.id === appId
      );
      if (appDef) {
        const resolvedIcon =
          typeof appDef.icon === "function"
            ? appDef.icon({ slot: "dial", size: 20 })
            : appDef.icon;
        open({
          id: appDef.id,
          title: appDef.name,
          component: appDef.component,
          props: appDef.props,
          launchMode: appDef.launchMode || "self-modal",
          singleton: appDef.singleton,
          icon: resolvedIcon,
          color: appDef.color,
        });
      }
    });

    setIsRestored(true);
  }, [isRestored, open]);

  // Restore open apps on mount
  useEffect(() => {
    const restoreOpenApps = async () => {
      try {
        const saved = await safeGetItem(STORAGE_KEY_OPEN_APPS);
        if (saved) {
          const savedApps = JSON.parse(saved) as string[];
          if (savedApps.length) {
            pendingRestoreRef.current = savedApps;
            tryRestorePending();
            return;
          }
        }
      } catch (error) {
        // Failed to restore open apps - continue with fresh state
      }

      setIsRestored(true);
    };

    restoreOpenApps();
  }, [tryRestorePending]);

  // Save open apps with debounce
  useEffect(() => {
    if (!isRestored) return;

    // Clear existing timeout
    if (persistenceTimeoutRef.current) {
      clearTimeout(persistenceTimeoutRef.current);
    }

    // Set new timeout to save
    persistenceTimeoutRef.current = setTimeout(() => {
      const appIds = openApps.map((app) => app.id);
      safeSetItem(STORAGE_KEY_OPEN_APPS, JSON.stringify(appIds));
    }, PERSISTENCE_DELAY);

    return () => {
      if (persistenceTimeoutRef.current) {
        clearTimeout(persistenceTimeoutRef.current);
      }
    };
  }, [openApps, isRestored]);

  // Store reference to installed apps for restoration
  const registerApps = useCallback(
    (apps: any[]) => {
      installedAppsRef.current = apps;
      tryRestorePending();
    },
    [tryRestorePending]
  );

  const close: AppHostContextValue["close"] = useCallback((instanceId) => {
    setOpenApps((s) => {
      if (!s.length) return s;
      if (!instanceId) return s.slice(0, -1);
      return s.filter((a) => a.instanceId !== instanceId);
    });
  }, []);

  const closeAll = useCallback(() => setOpenApps([]), []);

  const minimize: AppHostContextValue["minimize"] = useCallback(
    (instanceId) => {
      setOpenApps((s) =>
        s.map((app) =>
          app.instanceId === instanceId ? { ...app, minimized: true } : app
        )
      );
    },
    []
  );

  const restore: AppHostContextValue["restore"] = useCallback(
    (instanceId, restoreState) => {
      setOpenApps((s) =>
        s.map((app) =>
          app.instanceId === instanceId
            ? { ...app, minimized: false, restoreState }
            : app
        )
      );
    },
    []
  );

  const isMinimized: AppHostContextValue["isMinimized"] = useCallback(
    (instanceId) => {
      const app = openApps.find((a) => a.instanceId === instanceId);
      return app?.minimized ?? false;
    },
    [openApps]
  );

  React.useEffect(() => {
    if (openApps.length === 0) return;

    const handler = () => {
      close();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [openApps.length, close]);

  const value = useMemo<AppHostContextValue>(
    () => ({
      openApps,
      // Only count non-toggle-only and non-minimized tools as "open"
      isAnyOpen:
        openApps.filter(
          (app) => app.launchMode !== "toggle-only" && !app.minimized
        ).length > 0,
      open,
      close,
      closeAll,
      registerApps,
      minimize,
      restore,
      isMinimized,
    }),
    [openApps, open, close, closeAll, registerApps, minimize, restore, isMinimized]
  );

  return (
    <AppHostContext.Provider value={value}>{children}</AppHostContext.Provider>
  );
};

/**
 * Accessor hook for the dev tools app host. Components can open/close tools or inspect
 * the active stack. Falls back to a no-op implementation when rendered outside the provider.
 */
export const useAppHost = () => {
  const ctx = useContext(AppHostContext);
  // Return a default value if not in provider (for backwards compatibility)
  if (!ctx) {
    return {
      openApps: [],
      isAnyOpen: false,
      open: () => "",
      close: () => {},
      closeAll: () => {},
      minimize: () => {},
      restore: (_instanceId: string, _restoreState?: ModalRestoreState) => {},
      isMinimized: () => false,
    };
  }
  return ctx;
};

/**
 * Renders the active dev tool surface on top of the host application. Handles all supported
 * launch modes (self-managed modals, host-wrapped modal, or inline overlays).
 */
export const AppOverlay = () => {
  const { openApps, close, minimize } = useAppHost();
  const {
    minimize: addToMinimizedStack,
    getNextIconPosition,
  } = useMinimizedTools();

  // Filter out minimized apps - they shouldn't be rendered
  const visibleApps = openApps.filter(
    (app) => !app.minimized && app.launchMode !== "toggle-only"
  );

  if (visibleApps.length === 0) return null;

  const top = visibleApps[visibleApps.length - 1];

  const Comp = top.component as any;

  // Get target position for minimize animation
  const minimizeTargetPosition = getNextIconPosition();

  // Handler for minimize action - receives modal state from the modal component
  const handleMinimize = (modalState?: ModalRestoreState) => {
    // Add to minimized tools stack with modal state for restoration
    addToMinimizedStack({
      instanceId: top.instanceId,
      id: top.id,
      title: top.title || top.id,
      icon: top.icon,
      color: top.color,
      modalState: modalState,
    });
    // Mark as minimized in AppHost (hides the modal)
    minimize(top.instanceId);
  };

  if (top.launchMode === "self-modal") {
    return (
      <Comp
        {...(top.props ?? {})}
        visible={true}
        onClose={() => close(top.instanceId)}
        onRequestClose={() => close(top.instanceId)}
        onMinimize={handleMinimize}
        minimizeTargetPosition={minimizeTargetPosition}
        initialModalState={top.restoreState}
        instanceId={top.instanceId}
      />
    );
  }

  if (top.launchMode === "inline") {
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Comp
          {...(top.props ?? {})}
          onClose={() => close(top.instanceId)}
          onMinimize={handleMinimize}
          minimizeTargetPosition={minimizeTargetPosition}
          initialModalState={top.restoreState}
          instanceId={top.instanceId}
        />
      </View>
    );
  }

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={() => close(top.instanceId)}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Comp
            {...(top.props ?? {})}
            onClose={() => close(top.instanceId)}
            onMinimize={handleMinimize}
            minimizeTargetPosition={minimizeTargetPosition}
            initialModalState={top.restoreState}
            instanceId={top.instanceId}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    maxHeight: "90%",
    width: "94%",
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
  },
});
