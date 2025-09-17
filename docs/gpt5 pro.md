You’re right—the current pattern forces every app to accept `visible` and `onClose`, which creates boilerplate and leaks the menu’s orchestration concerns into each tool.

Below is a small, composable **App Host** layer that lives inside your dev menu package. It lets apps manage themselves. The Floating Menu just launches them, auto‑hides while any app is open, and reappears when the last app closes.

**What you get:**

- **Zero `isVisible/onClose` in app code.** The host mounts the app when launched and unmounts on close.
- **Back‑compatible:** old `onPress` launchers still work.
- **Simple registration:** add `component` and (optional) `props` to your `InstalledApp` entry.
- **Auto‑hide:** the menu hides whenever there’s at least one open app.
- **Stack-aware:** open multiple apps (like tabs); host closes the topmost first (Android back button supported).

---

## 1) Add a tiny App Host (new file)

**`packages/package-1/src/floatingMenu/AppHost.tsx`**

```tsx
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
  close: (instanceId?: string) => void; // closes top if omitted
  closeAll: () => void;
};

const AppHostContext = createContext<AppHostContextValue | null>(null);

export const AppHostProvider = ({ children }: { children: ReactNode }) => {
  const [openApps, setOpenApps] = useState<AppInstance[]>([]);

  const open: AppHostContextValue["open"] = useCallback(
    (def) => {
      // prevent duplicate if singleton
      if (def.singleton) {
        const already = openApps.find((a) => a.id === def.id);
        if (already) return already.instanceId;
      }
      const instanceId = `${def.id}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      setOpenApps((s) => [...s, { ...def, instanceId }]);
      return instanceId;
    },
    [openApps]
  );

  const close: AppHostContextValue["close"] = useCallback((instanceId) => {
    setOpenApps((s) => {
      if (!s.length) return s;
      if (!instanceId) return s.slice(0, -1); // close top
      return s.filter((a) => a.instanceId !== instanceId);
    });
  }, []);

  const closeAll = useCallback(() => setOpenApps([]), []);

  // Android back button closes topmost app if any
  React.useEffect(() => {
    const handler = () => {
      if (openApps.length > 0) {
        close(); // close top
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handler);
    return () => sub.remove();
  }, [openApps.length, close]);

  const value = useMemo<AppHostContextValue>(
    () => ({ openApps, isAnyOpen: openApps.length > 0, open, close, closeAll }),
    [openApps, open, close, closeAll]
  );

  return (
    <AppHostContext.Provider value={value}>{children}</AppHostContext.Provider>
  );
};

export const useAppHost = () => {
  const ctx = useContext(AppHostContext);
  if (!ctx) throw new Error("useAppHost must be used within AppHostProvider");
  return ctx;
};

/**
 * Renders the topmost app instance as an overlay.
 * - "self-modal": app is already a modal component, we just pass visible/onClose.
 * - "host-modal": we wrap app in a basic RN Modal.
 * - "inline": we absolutely fill the screen; the app can choose its own layout.
 */
export const AppOverlay = () => {
  const { openApps, close } = useAppHost();
  if (openApps.length === 0) return null;

  const top = openApps[openApps.length - 1];
  const Comp = top.component as any;

  if (top.launchMode === "self-modal") {
    // App component already manages its own modal presentation.
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

  // Default: host-modal
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
```

---

## 2) Extend your `InstalledApp` type (non‑breaking)

**`packages/package-1/src/floatingMenu/types.ts`** (add the new optional fields)

```ts
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
  onPress?: (ctx: {
    state?: FloatingMenuState;
    actions?: FloatingMenuActions;
  }) => void | Promise<void>;
  slot?: AppSlot; // default "both"
  color?: string;

  /** NEW: Plug-and-play launching without visible/onClose boilerplate */
  component?: React.ComponentType<any>;
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
```

> Back-compat: Existing apps using `onPress` continue to work.
> New plug‑and‑play apps simply supply `component` (+ optional `props`, `launchMode`, `singleton`).

---

## 3) Teach the Floating Menu to open apps & auto‑hide

**`packages/package-1/src/floatingMenu/FloatingMenu.tsx`** (key changes only)

- Import and use the host.
- Hide the menu whenever any app is open.
- If an item declares `component`, use the host to launch it; otherwise fall back to old `onPress`.

```tsx
import { FC, useEffect, useMemo, useState } from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { FloatingTools, UserRole, UserStatus } from "./floatingTools";
import type {
  InstalledApp,
  FloatingMenuActions,
  FloatingMenuState,
} from "./types";
import { DialDevTools } from "./dial/DialDevTools";
import { Environment } from "@monorepo/shared/lib/typescript/types/types";
import { EnvironmentIndicator, gameUIColors } from "@monorepo/shared";
import { useDevToolsSettings } from "./DevToolsSettingsModal";
import { useAppHost } from "./AppHost"; // NEW

export const FloatingMenu: FC<FloatingMenuProps> = ({
  apps,
  state,
  actions,
  hidden,
  environment,
  userRole,
}) => {
  const [internalHidden, setInternalHidden] = useState(false);
  const [showDial, setShowDial] = useState(false);

  const { isAnyOpen, open } = useAppHost(); // NEW

  // Auto-hide when any app is open OR the dial is shown
  const isHidden = useMemo(
    () => Boolean(hidden ?? (internalHidden || showDial || isAnyOpen)),
    [hidden, internalHidden, showDial, isAnyOpen]
  );

  const { settings: devToolsSettings } = useDevToolsSettings();

  const mergedActions = useMemo(() => {
    return {
      ...(actions ?? {}),
      closeMenu: () => setShowDial(false),
      hideFloatingRow: () => setInternalHidden(true),
      showFloatingRow: () => setInternalHidden(false),
    } as FloatingMenuActions;
  }, [actions]);

  const isFloatingEnabled = (id: string) => {
    if (!devToolsSettings) return true;
    return devToolsSettings.floatingTools[id] ?? true;
  };

  // ...
  // When rendering an app tile/button, update the press handler:
  const handleLaunch = (app: InstalledApp) => async () => {
    // New plug-and-play path:
    if (app.component) {
      open({
        id: app.id,
        title: app.name,
        component: app.component,
        props: app.props,
        launchMode: app.launchMode ?? "self-modal",
        singleton: app.singleton ?? true,
      });
      return;
    }
    // Back-compat path:
    if (app.onPress) {
      await app.onPress({ state, actions: mergedActions });
    }
  };

  // ...use `handleLaunch(app)` wherever you previously used `app.onPress`
  // and keep the rest of your FloatingMenu layout code as-is.
};
```

> Minimal change: swap the old `onPress={...}` with `onPress={handleLaunch(app)}` where your menu renders app entries.

---

## 4) Export the App Host (so app roots can include it)

**`packages/package-1/src/index.tsx`**

```ts
export { FloatingMenu } from "./floatingMenu/FloatingMenu";
export * from "./floatingMenu/types";

// NEW: AppHost exports
export {
  AppHostProvider,
  AppOverlay,
  useAppHost,
} from "./floatingMenu/AppHost";
```

---

## 5) Make the example plug‑and‑play (no `isEnvOpen`/`onClose`)

**`example/App.tsx`** (only the important parts)

```tsx
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import {
  FloatingMenu,
  type InstalledApp,
  AppHostProvider, // NEW
  AppOverlay, // NEW
} from "@monorepo/package-1";
import {
  createEnvVarConfig,
  envVar,
  type UserRole,
  type Environment,
  EnvVarsModal,
} from "@monorepo/package-2";
import { EnvLaptopIcon } from "@monorepo/shared";
// ❌ remove useState for isEnvOpen/envCloseResolver

export default function App() {
  const userRole: UserRole = "admin";
  const environment: Environment = "development";

  const requiredEnvVars = createEnvVarConfig([
    // ...your existing config...
  ]);

  // NEW: simple, plug-and-play definition — no visible/onClose in app code
  const installedApps: InstalledApp[] = [
    {
      id: "env",
      name: "ENV",
      slot: "both",
      icon: ({ size }) => (
        <EnvLaptopIcon size={size} color="#9f6" glowColor="#9f6" noBackground />
      ),
      component: EnvVarsModal, // <— host will mount this for you
      launchMode: "self-modal", // it already manages a modal internally
      singleton: true,
      props: {
        requiredEnvVars,
        enableSharedModalDimensions: true,
        // host will inject: visible={true}, onClose={() => ...}
      },
    },
  ];

  return (
    <AppHostProvider>
      {" "}
      {/* NEW provider */}
      <View style={styles.container}>
        <FloatingMenu
          apps={installedApps}
          actions={{}}
          environment={environment}
          userRole={userRole}
        />

        {/* NEW: renders the currently-open app as an overlay (top of stack) */}
        <AppOverlay />

        <Text style={styles.title}>Monorepo Test App</Text>
        <ScrollView style={styles.scrollView}>
          {/* ...rest unchanged... */}
        </ScrollView>
        <StatusBar style="auto" />
      </View>
    </AppHostProvider>
  );
}
```

Now authors of tools like `EnvVarsModal` **don’t implement** `isVisible` state outside, and **don’t wire** `onClose` themselves in `App.tsx`. They just export a component; the menu launches it; the app can close itself via its own UI (it will call the injected `onClose`) and the host unmounts it, causing the Floating Menu to reappear.

---

## 6) What this changes for app/tool authors

**Before**

```tsx
<EnvVarsModal
  visible={isEnvOpen}
  onClose={...}
  requiredEnvVars={requiredEnvVars}
/>
```

**After**

```ts
const apps: InstalledApp[] = [
  {
    id: "env",
    name: "ENV",
    icon: EnvLaptopIcon,
    component: EnvVarsModal,
    launchMode: "self-modal",
    props: { requiredEnvVars },
  },
];
```

That’s it. No extra state, no close resolvers in the app shell.

---

## Notes & options

- **Launch modes**

  - `self-modal` — for components like `EnvVarsModal` that already wrap with `JsModal`. The host passes `visible` and `onClose`.
  - `host-modal` — for simple components you want shown in a stock modal without modifying the component.
  - `inline` — for full-screen overlays (debug panels, etc.).

- **Singletons** prevent duplicate instances (enabled by default here).
- **Back button** on Android will close the topmost open app automatically.
- **Back-compat**: existing `onPress`‑based tools continue to work; you can migrate app‑by‑app.

---

## Why this solves your pain

- **Menu “just knows” when an app is open** via the App Host’s `openApps` stack — it automatically hides itself then.
- **Apps manage themselves**: each app can decide when to close (call `onClose`) and whether it’s modal/full‑screen.
- **Plug‑and‑play**: adding a new tool is now simply adding `component` (+ `props`), with **zero orchestration state** leaking into the app shell.

If you’d like, I can also sketch a variant that uses routing (e.g., React Navigation) instead of an overlay, but for dev tools the overlay host tends to be simpler and keeps everything in one package.
