import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { BackHandler, Modal, StyleSheet, View } from "react-native";

type LaunchMode = "self-modal" | "host-modal" | "inline";

type AppInstance = {
  instanceId: string;
  id: string;
  title?: string;
  component: React.ComponentType<any>;
  props?: Record<string, unknown>;
  launchMode: LaunchMode;
  singleton?: boolean;
};

type AppHostContextValue = {
  openApps: AppInstance[];
  isAnyOpen: boolean;
  open: (def: Omit<AppInstance, "instanceId">) => string;
  close: (instanceId?: string) => void;
  closeAll: () => void;
};

const AppHostContext = createContext<AppHostContextValue | null>(null);

export const AppHostProvider = ({ children }: { children: ReactNode }) => {
  const [openApps, setOpenApps] = useState<AppInstance[]>([]);

  const open: AppHostContextValue["open"] = useCallback((def) => {
    const instanceId = `${def.id}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
    setOpenApps((s) => {
      if (def.singleton) {
        const already = s.find((a) => a.id === def.id);
        if (already) return s;
      }
      return [...s, { ...def, instanceId }];
    });
    return instanceId;
  }, []);

  const close: AppHostContextValue["close"] = useCallback((instanceId) => {
    setOpenApps((s) => {
      if (!s.length) return s;
      if (!instanceId) return s.slice(0, -1);
      return s.filter((a) => a.instanceId !== instanceId);
    });
  }, []);

  const closeAll = useCallback(() => setOpenApps([]), []);

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
      isAnyOpen: openApps.length > 0,
      open,
      close,
      closeAll
    }),
    [openApps, open, close, closeAll]
  );

  return (
    <AppHostContext.Provider value={value}>{children}</AppHostContext.Provider>
  );
};

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
    };
  }
  return ctx;
};

export const AppOverlay = () => {
  const { openApps, close } = useAppHost();
  if (openApps.length === 0) return null;

  const top = openApps[openApps.length - 1];
  const Comp = top.component as any;

  if (top.launchMode === "self-modal") {
    return (
      <Comp
        {...(top.props ?? {})}
        visible={true}
        onClose={() => close(top.instanceId)}
        onRequestClose={() => close(top.instanceId)}
      />
    );
  }

  if (top.launchMode === "inline") {
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        <Comp {...(top.props ?? {})} onClose={() => close(top.instanceId)} />
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
          <Comp {...(top.props ?? {})} onClose={() => close(top.instanceId)} />
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