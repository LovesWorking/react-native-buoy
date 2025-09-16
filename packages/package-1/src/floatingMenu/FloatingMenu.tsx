import { FC, useMemo, useState } from "react";
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

export interface FloatingMenuProps {
  apps: InstalledApp[];
  state?: FloatingMenuState;
  actions?: FloatingMenuActions;
  hidden?: boolean; // hide bubble when another dev app is open
  environment?: Environment;
  userRole?: UserRole;
}

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
  const isHidden = useMemo(
    () => Boolean(hidden ?? (internalHidden || showDial)),
    [hidden, internalHidden, showDial]
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

  // Filter function for floating tools based on settings
  const isFloatingEnabled = (id: string) => {
    if (!devToolsSettings) return true;
    // Default to enabled for new tools not in settings
    return devToolsSettings.floatingTools[id] ?? true;
  };

  // Dial is the default/only layout

  const handlePress = (app: InstalledApp) => {
    try {
      const result = app.onPress({ state, actions: mergedActions });
      if (result && typeof (result as Promise<void>).then === "function") {
        setInternalHidden(true);
        (result as Promise<void>).finally(() => setInternalHidden(false));
      }
    } catch {
      // ignore errors from user handlers; do not hide in this case
    }
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
const MenuLauncherIcon = ({
  size = 14,
  color = gameUIColors.info,
}: {
  size?: number;
  color?: string;
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
