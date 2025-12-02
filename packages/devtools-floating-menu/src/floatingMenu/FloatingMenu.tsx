import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
} from "react-native";
import { FloatingTools, UserRole, UserStatus } from "./floatingTools";
import type {
  InstalledApp,
  FloatingMenuActions,
  FloatingMenuState,
} from "./types";
import type { DefaultFloatingConfig, DefaultDialConfig } from "./defaultConfig";
import { DialDevTools } from "./dial/DialDevTools";
import type { Environment } from "@react-buoy/shared-ui";
import {
  EnvironmentIndicator,
  gameUIColors,
  safeGetItem,
  safeSetItem,
  useHintsDisabled,
} from "@react-buoy/shared-ui";
import { useDevToolsSettings } from "./DevToolsSettingsModal";
import { useAppHost } from "./AppHost";
import { useDevToolsVisibility } from "./DevToolsVisibilityContext";
import { toggleStateManager } from "./ToggleStateManager";
import { OnboardingTooltip } from "./dial/OnboardingTooltip";

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
  /** Default tools to enable in the floating bubble when no user settings exist. */
  defaultFloatingTools?: DefaultFloatingConfig;
  /** Default tools to enable in the dial menu when no user settings exist (max 6). */
  defaultDialTools?: DefaultDialConfig;
}

/**
 * FloatingMenu renders the persistent developer tools entry point. It handles visibility,
 * integrates with the AppHost, and presents available tools as floating shortcuts and a dial.
 */
const FLOATING_MENU_ONBOARDING_KEY = "@react_buoy_floating_menu_tooltip_shown";
const ONBOARDING_STEP_KEY = "@react_buoy_onboarding_step";
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type OnboardingStep = "positioning" | "opening" | "complete";

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
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep | null>(
    null
  );
  const [, forceUpdate] = useState(0); // Used to force re-render when toggle states change
  const onboardingDismissedRef = useRef(false); // Track if onboarding was dismissed
  const hintsDisabled = useHintsDisabled();

  const { isAnyOpen, open, registerApps } = useAppHost();
  const wasAppOpenRef = useRef(isAnyOpen);
  const { setDialOpen, setToolOpen } = useDevToolsVisibility();

  // Check onboarding status on first load
  useEffect(() => {
    // Skip onboarding if hints are disabled
    if (hintsDisabled) {
      return;
    }

    const checkOnboarding = async () => {
      try {
        const hasSeenOnboarding = await safeGetItem(
          FLOATING_MENU_ONBOARDING_KEY
        );
        if (!hasSeenOnboarding) {
          // Small delay to let the UI settle before showing tooltip
          setTimeout(() => {
            setOnboardingStep("positioning");
          }, 1000);
        }
      } catch (error) {
        // If there's an error reading storage, don't show onboarding
      }
    };

    checkOnboarding();
  }, [hintsDisabled]);

  // Subscribe to toggle state changes to update icon colors
  useEffect(() => {
    const unsubscribe = toggleStateManager.subscribe(() => {
      forceUpdate((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  // Sync dial state with visibility context
  useEffect(() => {
    setDialOpen(showDial);
  }, [showDial, setDialOpen]);

  // Sync tool open state with visibility context
  useEffect(() => {
    setToolOpen(isAnyOpen);
  }, [isAnyOpen, setToolOpen]);

  // When an app is open or dial is shown, push the menu to the side instead of hiding completely
  const shouldPushToSide = useMemo(
    () => Boolean(showDial || isAnyOpen),
    [showDial, isAnyOpen]
  );

  // Use external hidden prop or internal hidden state for complete hiding
  const isCompletelyHidden = useMemo(
    () => Boolean(hidden ?? internalHidden),
    [hidden, internalHidden]
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
      notifyToggleChange: () => forceUpdate((prev) => prev + 1),
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
    if (!devToolsSettings) return false;
    // Default to disabled for tools without explicit preferences
    return devToolsSettings.floatingTools[id] ?? false;
  };

  // Dial is the default/only layout

  const handlePress = (app: InstalledApp) => {
    // Call the app's onPress callback if provided, passing actions for toggle tools
    app?.onPress?.(mergedActions);

    // Only open modal if not a toggle-only tool
    if (app.launchMode !== "toggle-only") {
      // Resolve the icon for minimize stack display
      // IMPORTANT: Use React.createElement for function components to preserve hooks
      const resolvedIcon =
        typeof app.icon === "function"
          ? React.createElement(app.icon, { slot: "dial", size: 20 })
          : app.icon;

      open({
        id: app.id,
        title: app.name,
        component: app.component,
        props: app.props,
        launchMode: app.launchMode ?? "self-modal",
        singleton: app.singleton ?? true,
        icon: resolvedIcon,
        color: app.color,
      });
    }
  };

  const handleOnboardingDismiss = () => {
    // Mark as dismissed immediately in ref (synchronous, no re-render needed)
    onboardingDismissedRef.current = true;

    // Update state to hide tooltip
    setOnboardingStep(null);

    // Save to storage asynchronously in the background
    safeSetItem(FLOATING_MENU_ONBOARDING_KEY, "true").catch((error) => {
      // Silently fail - user already saw onboarding, just won't persist
      console.warn("Failed to save onboarding state:", error);
    });
  };

  const handleDialOpen = () => {
    // If user opens dial during onboarding, mark onboarding as complete
    if (isOnboarding) {
      handleOnboardingDismiss();
    }
    setShowDial(true);
  };

  // Determine if we're in onboarding mode (only when explicitly set to positioning AND not dismissed AND hints not disabled)
  const isOnboarding = onboardingStep === "positioning" && !onboardingDismissedRef.current && !hintsDisabled;

  // During onboarding, disable position persistence and use centered position
  const shouldEnablePositionPersistence = !isOnboarding;

  return (
    <>
      {/* Onboarding Tooltips - Render outside and before floating menu for proper z-index */}
      {isOnboarding && !showDial && !isAnyOpen && (
        <View style={styles.onboardingContainer}>
          {/* Dark backdrop */}
          <View style={styles.onboardingBackdrop} />

          {/* Single onboarding tooltip */}
          <OnboardingTooltip
            visible={true}
            onDismiss={handleOnboardingDismiss}
            title="Welcome to Buoy Dev Tools!"
            message="Grab and position this menu wherever you want, then tap the icon to open your dev tools."
          />
        </View>
      )}

      <View
        nativeID="floating-devtools-root"
        pointerEvents={isCompletelyHidden ? "none" : "box-none"}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: isOnboarding ? 10001 : 9999, // Higher z-index during onboarding to show above backdrop
          opacity: isCompletelyHidden ? 0 : 1,
        }}
      >
        <FloatingTools
          enablePositionPersistence={shouldEnablePositionPersistence}
          pushToSide={shouldPushToSide}
          centerOnboarding={isOnboarding}
        >
          {/* Environment badge (if enabled in settings) */}
          {devToolsSettings?.floatingTools?.environment && environment ? (
            <EnvironmentIndicator environment={environment} />
          ) : null}

          {/* Preferred: UserStatus as the dial launcher when a userRole is provided */}
          {userRole ? (
            <UserStatus userRole={userRole} onPress={handleDialOpen} />
          ) : (
            // Fallback: small launcher icon to ensure settings are always accessible
            <TouchableOpacity
              accessibilityLabel="Open Dev Tools Menu"
              onPress={handleDialOpen}
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
  {/*
                   * ⚠️ IMPORTANT - DO NOT CHANGE THIS RENDERING PATTERN ⚠️
                   * Icons MUST be rendered as JSX components (<IconComponent />),
                   * NOT called as functions (app.icon({...})).
                   *
                   * This allows icon components to use React hooks (useState, useEffect)
                   * for subscribing to state changes (e.g., WiFi toggle subscribing to onlineManager).
                   *
                   * If you change this to call icons as functions, hooks will break and
                   * dynamic icon updates (like WiFi color changing) will stop working.
                   */}
                {(() => {
                  if (typeof app.icon === "function") {
                    const IconComponent = app.icon;
                    return (
                      <IconComponent
                        slot="row"
                        size={16}
                        state={state}
                        actions={mergedActions}
                      />
                    );
                  }
                  return app.icon;
                })()}
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
  onboardingContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10000,
  },
  onboardingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
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
