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
 * Renders a single app instance. Keeps component mounted even when minimized
 * by passing visible={false} instead of unmounting.
 */
const AppRenderer = ({
  app,
  isTopVisible,
  onClose,
  onMinimize,
  minimizeTargetPosition,
}: {
  app: AppInstance;
  isTopVisible: boolean;
  onClose: () => void;
  onMinimize: (modalState?: ModalRestoreState) => void;
  minimizeTargetPosition: { x: number; y: number };
}) => {
  const Comp = app.component as any;
  const isVisible = !app.minimized && isTopVisible;

  if (app.launchMode === "self-modal") {
    return (
      <Comp
        {...(app.props ?? {})}
        visible={isVisible}
        onClose={onClose}
        onRequestClose={onClose}
        onMinimize={onMinimize}
        minimizeTargetPosition={minimizeTargetPosition}
        initialModalState={app.restoreState}
        instanceId={app.instanceId}
      />
    );
  }

  if (app.launchMode === "inline") {
    if (!isVisible) return null;
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Comp
          {...(app.props ?? {})}
          onClose={onClose}
          onMinimize={onMinimize}
          minimizeTargetPosition={minimizeTargetPosition}
          initialModalState={app.restoreState}
          instanceId={app.instanceId}
        />
      </View>
    );
  }

  // host-modal mode
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Comp
            {...(app.props ?? {})}
            onClose={onClose}
            onMinimize={onMinimize}
            minimizeTargetPosition={minimizeTargetPosition}
            initialModalState={app.restoreState}
            instanceId={app.instanceId}
          />
        </View>
      </View>
    </Modal>
  );
};

/**
 * Renders all dev tool surfaces. Keeps minimized apps mounted but hidden
 * so their state and listeners are preserved (similar to React Navigation screens).
 */
export const AppOverlay = () => {
  const { openApps, close, minimize } = useAppHost();
  const {
    minimize: addToMinimizedStack,
    getNextIconPosition,
  } = useMinimizedTools();

  // Filter to renderable apps (exclude toggle-only)
  const renderableApps = openApps.filter(
    (app) => app.launchMode !== "toggle-only"
  );

  if (renderableApps.length === 0) return null;

  // Find the top visible (non-minimized) app
  const visibleApps = renderableApps.filter((app) => !app.minimized);
  const topVisibleApp = visibleApps[visibleApps.length - 1];

  return (
    <>
      {renderableApps.map((app) => {
        const isTopVisible = topVisibleApp?.instanceId === app.instanceId;
        const minimizeTargetPosition = getNextIconPosition();

        const handleMinimize = (modalState?: ModalRestoreState) => {
          addToMinimizedStack({
            instanceId: app.instanceId,
            id: app.id,
            title: app.title || app.id,
            icon: app.icon,
            color: app.color,
            modalState: modalState,
          });
          minimize(app.instanceId);
        };

        return (
          <AppRenderer
            key={app.instanceId}
            app={app}
            isTopVisible={isTopVisible}
            onClose={() => close(app.instanceId)}
            onMinimize={handleMinimize}
            minimizeTargetPosition={minimizeTargetPosition}
          />
        );
      })}
    </>
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
