import { Pressable, LayoutChangeEvent, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Query } from "@tanstack/react-query";
import { TanstackLogo } from "../../../devtools/svgs";

import { Divider } from "./Divider";
import { WifiToggle } from "./WifiToggle";
import {
  type Environment,
  EnvironmentIndicator,
} from "../../bubble/EnvironmentIndicator";
import { type UserRole, UserStatus } from "./UserStatus";
import { getQueryStatusColor } from "../../../_util/getQueryStatusColor";

interface RnBetterDevToolsBubbleContentProps {
  environment: Environment;
  userRole: UserRole;
  isOnline: boolean;
  isDragging: boolean;
  selectedQuery?: Query;
  onEnvironmentLayout: (event: LayoutChangeEvent) => void;
  onStatusLayout: (event: LayoutChangeEvent) => void;
  onQueryLayout: (event: LayoutChangeEvent) => void;
  onStatusPress: () => void;
  onQueryPress: () => void;
  onWifiToggle: () => void;
}

export function RnBetterDevToolsBubbleContent({
  environment,
  userRole,
  isOnline,
  isDragging,
  selectedQuery,
  onEnvironmentLayout,
  onStatusLayout,
  onQueryLayout,
  onStatusPress,
  onQueryPress,
  onWifiToggle,
}: RnBetterDevToolsBubbleContentProps) {
  const contentLayout = useAnimatedStyle(() => {
    return {
      flexDirection: "row", // Always keep content in the same order
      flex: 1,
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 6,
      gap: 6,
    };
  });

  const getQueryIndicator = () => {
    if (selectedQuery) {
      try {
        const statusColor = getQueryStatusColor({
          queryState: selectedQuery.state,
          observerCount: selectedQuery.getObserversCount(),
          isStale: selectedQuery.isStale(),
        });

        const colorMap: Record<string, string> = {
          blue: "#3B82F6",
          gray: "#6B7280",
          purple: "#8B5CF6",
          yellow: "#F59E0B",
          green: "#10B981",
        };

        return (
          <Text
            style={[
              styles.statusIndicator,
              { color: colorMap[statusColor] || "#9CA3AF" },
            ]}
          >
            ●
          </Text>
        );
      } catch (err) {
        return <TanstackLogo />;
      }
    }

    return <TanstackLogo />;
  };

  return (
    <Animated.View style={contentLayout}>
      {/* Environment Indicator */}
      <EnvironmentIndicator
        environment={environment}
        onLayout={onEnvironmentLayout}
      />

      <Divider />

      {/* User Status */}
      <UserStatus
        userRole={userRole}
        onPress={onStatusPress}
        isDragging={isDragging}
        onLayout={onStatusLayout}
      />

      <Divider />

      {/* React Query Status Button */}
      <Animated.View onLayout={onQueryLayout}>
        <Pressable
          onPress={onQueryPress}
          style={styles.queryButton}
          hitSlop={8}
        >
          {getQueryIndicator()}
        </Pressable>
      </Animated.View>

      <Divider />

      {/* WiFi Toggle */}
      <WifiToggle isDragging={isDragging} />
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
  statusIndicator: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
