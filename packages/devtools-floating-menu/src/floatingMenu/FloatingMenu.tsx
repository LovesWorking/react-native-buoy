import { FC, useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, StyleSheet, View, Text } from "react-native";
import { FloatingTools, UserRole, UserStatus } from "./floatingTools";
import type {
  InstalledApp,
  FloatingMenuActions,
  FloatingMenuState,
} from "./types";
import { DialDevTools } from "./dial/DialDevTools";
import type { Environment } from "@react-buoy/shared-ui";
import { EnvironmentIndicator, gameUIColors } from "@react-buoy/shared-ui";
import { useDevToolsSettings } from "./DevToolsSettingsModal";
import { useAppHost } from "./AppHost";

/**
 * Props for the floating developer tools launcher. Controls which apps are shown and
 * how the menu integrates with the current host environment.
 */
export interface FloatingMenuProps {
  /** Dev tool apps that can be opened from the floating menu. */
  apps: InstalledApp[];
  /** Shared state object passed to app renderers (e.g. icons) and the dial. */
  state?: FloatingMenuState;
  /** Shared action callbacks exposed to app renderers for interacting with the menu. */
  actions?: FloatingMenuActions;
  /** When true, hides the floating row (used when another dev app takes focus). */
  hidden?: boolean;
  /** Active environment metadata displayed via the environment indicator, if enabled. */
  environment?: Environment;
  /** Optional role that determines which user status badge is rendered. */
  userRole?: UserRole;
}

/**
 * FloatingMenu renders the persistent developer tools entry point. It handles visibility,
 * integrates with the AppHost, and presents available tools as floating shortcuts and a dial.
 */
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

  const { isAnyOpen, open, registerApps } = useAppHost();
  const wasAppOpenRef = useRef(isAnyOpen);

  const isHidden = useMemo(
    () => Boolean(hidden ?? (internalHidden || showDial || isAnyOpen)),
    [hidden, internalHidden, showDial, isAnyOpen]
  );
  const { settings: devToolsSettings } = useDevToolsSettings();

  // Register apps with AppHost for persistence
  useEffect(() => {
    if (registerApps) {
      registerApps(apps);
    }
  }, [apps, registerApps]);

  const mergedActions = useMemo(() => {
    return {
      ...(actions ?? {}),
      closeMenu: () => setShowDial(false),
      hideFloatingRow: () => setInternalHidden(true),
      showFloatingRow: () => setInternalHidden(false),
    } as FloatingMenuActions;
  }, [actions]);

  useEffect(() => {
    if (wasAppOpenRef.current && !isAnyOpen) {
      setInternalHidden(false);
      setShowDial(false);
    }
    wasAppOpenRef.current = isAnyOpen;
  }, [isAnyOpen]);

  // Filter function for floating tools based on settings
  const isFloatingEnabled = (id: string) => {
    if (!devToolsSettings) return true;
    // Default to enabled for new tools not in settings
    return devToolsSettings.floatingTools[id] ?? true;
  };

  // Dial is the default/only layout

  const handlePress = (app: InstalledApp) => {
    open({
      id: app.id,
      title: app.name,
      component: app.component,
      props: app.props,
      launchMode: app.launchMode ?? "self-modal",
      singleton: app.singleton ?? true,
    });
  };

  return (
    <>
      <View
        pointerEvents={isHidden ? "none" : "auto"}
        style={{ opacity: isHidden ? 0 : 1 }}
      >
        <FloatingTools enablePositionPersistence>
          {/* Environment badge (if enabled in settings) */}
          {devToolsSettings?.floatingTools?.environment && environment ? (
            <EnvironmentIndicator environment={environment} />
          ) : null}

          {/* Preferred: UserStatus as the dial launcher when a userRole is provided */}
          {userRole ? (
            <UserStatus userRole={userRole} onPress={() => setShowDial(true)} />
          ) : (
            // Fallback: small launcher icon to ensure settings are always accessible
            <TouchableOpacity
              accessibilityLabel="Open Dev Tools Menu"
              onPress={() => setShowDial(true)}
              style={styles.fab}
            >
              <View style={styles.menuButton}>
                <MenuLauncherIcon size={14} />
              </View>
            </TouchableOpacity>
          )}

          {apps
            .filter(
              (a) => (a.slot ?? "both") !== "dial" && isFloatingEnabled(a.id)
            )
            .map((app) => (
              <TouchableOpacity
                key={`row-${app.id}`}
                accessibilityLabel={app.name}
                onPress={() => handlePress(app)}
                style={styles.fab}
              >
                {typeof app.icon === "function"
                  ? app.icon({
                      slot: "row",
                      size: 16,
                      state,
                      actions: mergedActions,
                    })
                  : app.icon}
              </TouchableOpacity>
            ))}
        </FloatingTools>
      </View>

      {showDial && (
        <DialDevTools
          apps={apps}
          state={state}
          actions={mergedActions}
          onClose={() => {
            setShowDial(false);
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    minHeight: 0,
    backgroundColor: "transparent",
  },
  menuButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  menuDots: {
    color: "#8CA2C8",
    fontSize: 14,
    fontWeight: "900",
  },
});

interface MenuLauncherIconProps {
  /** Pixel width/height of the square icon. */
  size?: number;
  /** Custom color applied to each dot. */
  color?: string;
}

/** Minimal 3x3 dot icon used when the user status badge is unavailable. */
const MenuLauncherIcon: FC<MenuLauncherIconProps> = ({
  size = 14,
  color = gameUIColors.info,
}) => {
  const dotSize = Math.max(2, Math.floor(size / 4));
  const gap = Math.max(1, Math.floor(size / 16));
  const items = Array.from({ length: 9 });
  return (
    <View
      style={{
        width: size,
        height: size,
        flexDirection: "row",
        flexWrap: "wrap",
        alignContent: "center",
        justifyContent: "center",
      }}
    >
      {items.map((_, i) => (
        <View
          key={i}
          style={{
            width: dotSize,
            height: dotSize,
            margin: gap,
            borderRadius: 2,
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
};
