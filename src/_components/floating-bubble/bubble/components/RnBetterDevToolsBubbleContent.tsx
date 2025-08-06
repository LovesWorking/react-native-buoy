import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  TanstackLogo,
  SentryLogo,
} from "../../../../_sections/react-query/components/query-browser/svgs";
import { Settings, Database } from "lucide-react-native";

import { Divider } from "../../../../_shared/ui/components/Divider";
import { WifiToggle } from "../../../../_sections/react-query/components/WifiToggle";
import {
  type Environment,
  EnvironmentIndicator,
} from "../../../../_sections/env";
import { type UserRole, UserStatus } from "./UserStatus";

export interface BubbleConfig {
  showEnvironment?: boolean;
  showUserStatus?: boolean;
  showQueryButton?: boolean;
  showWifiToggle?: boolean;
  showEnvButton?: boolean;
  showSentryButton?: boolean;
  showStorageButton?: boolean;
}

interface RnBetterDevToolsBubbleContentProps {
  environment?: Environment;
  userRole?: UserRole;
  isDragging: boolean;
  onStatusPress?: () => void;
  onQueryPress?: () => void;
  onEnvPress?: () => void;
  onSentryPress?: () => void;
  onStoragePress?: () => void;
  config?: BubbleConfig;
}

export function RnBetterDevToolsBubbleContent({
  environment,
  userRole,
  isDragging,
  onStatusPress,
  onQueryPress,
  onEnvPress,
  onSentryPress,
  onStoragePress,
  config = {},
}: RnBetterDevToolsBubbleContentProps) {
  // Determine which components should be shown based on props and config
  // Treat config values as truthy/falsy - true shows, false/undefined hides
  const shouldShowEnvironment =
    !!config.showEnvironment && environment !== undefined;
  const shouldShowUserStatus =
    !!config.showUserStatus && userRole !== undefined;
  const shouldShowQueryButton =
    !!config.showQueryButton && onQueryPress !== undefined;
  const shouldShowWifiToggle = !!config.showWifiToggle;
  const shouldShowEnvButton =
    !!config.showEnvButton && onEnvPress !== undefined;
  const shouldShowSentryButton =
    !!config.showSentryButton && onSentryPress !== undefined;
  const shouldShowStorageButton =
    !!config.showStorageButton && onStoragePress !== undefined;

  // Create array of visible components for smart divider logic
  const visibleComponents = [
    shouldShowEnvironment && "environment",
    shouldShowUserStatus && "userStatus",
    shouldShowQueryButton && "queryButton",
    shouldShowEnvButton && "envButton",
    shouldShowSentryButton && "sentryButton",
    shouldShowStorageButton && "storageButton",
    shouldShowWifiToggle && "wifiToggle",
  ].filter(Boolean);

  const contentLayout = useAnimatedStyle(() => {
    return {
      flexDirection: "row", // Always keep content in the same order
      alignItems: "center",
      gap: 6,
      // Removed flex: 1 and justifyContent: "space-between" to allow natural sizing
    };
  });

  // Helper function to render divider only between components
  const renderDividerAfter = (componentName: string) => {
    const currentIndex = visibleComponents.indexOf(componentName);
    const isLastComponent = currentIndex === visibleComponents.length - 1;
    return !isLastComponent ? (
      <Divider key={`divider-after-${componentName}`} />
    ) : null;
  };

  return (
    <Animated.View style={contentLayout}>
      {/* Environment Indicator */}
      {shouldShowEnvironment && (
        <>
          <EnvironmentIndicator environment={environment!} />
          {renderDividerAfter("environment")}
        </>
      )}

      {/* User Status */}
      {shouldShowUserStatus && (
        <>
          <UserStatus
            userRole={userRole!}
            onPress={onStatusPress!}
            isDragging={isDragging}
          />
          {renderDividerAfter("userStatus")}
        </>
      )}

      {/* RN Better Dev Tools Status Button */}
      {shouldShowQueryButton && (
        <>
          <Pressable
            accessibilityLabel="RN Better Dev Tools"
            accessibilityHint="View RN Better Dev Tools"
            sentry-label="ignore user interaction"
            onPress={onQueryPress}
            style={styles.queryButton}
            hitSlop={8}
          >
            <TanstackLogo />
          </Pressable>
          {renderDividerAfter("queryButton")}
        </>
      )}

      {/* Environment Button */}
      {shouldShowEnvButton && (
        <>
          <Pressable
            accessibilityLabel="Environment Variables"
            accessibilityHint="View Environment Variables"
            sentry-label="ignore user interaction"
            onPress={onEnvPress}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Settings size={16} color="#10B981" />
          </Pressable>
          {renderDividerAfter("envButton")}
        </>
      )}

      {/* Sentry Button */}
      {shouldShowSentryButton && (
        <>
          <Pressable
            accessibilityLabel="Sentry Events"
            accessibilityHint="View Sentry Events"
            sentry-label="ignore user interaction"
            onPress={onSentryPress}
            style={styles.iconButton}
            hitSlop={8}
          >
            <SentryLogo />
          </Pressable>
          {renderDividerAfter("sentryButton")}
        </>
      )}

      {/* Storage Button */}
      {shouldShowStorageButton && (
        <>
          <Pressable
            accessibilityLabel="Storage Browser"
            accessibilityHint="Browse AsyncStorage data"
            sentry-label="ignore user interaction"
            onPress={onStoragePress}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Database size={16} color="#3B82F6" />
          </Pressable>
          {renderDividerAfter("storageButton")}
        </>
      )}

      {/* WiFi Toggle */}
      {shouldShowWifiToggle && (
        <>
          <WifiToggle isDragging={isDragging} />
          {renderDividerAfter("wifiToggle")}
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  queryButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  iconButton: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIndicator: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
