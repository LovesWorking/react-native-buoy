import { Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { TanstackLogo } from "../../../devtools/svgs";

import { Divider } from "./Divider";
import { WifiToggle } from "./WifiToggle";
import {
  type Environment,
  EnvironmentIndicator,
} from "../../bubble/EnvironmentIndicator";
import { type UserRole, UserStatus } from "./UserStatus";

interface RnBetterDevToolsBubbleContentProps {
  environment: Environment;
  userRole: UserRole;
  isDragging: boolean;
  onStatusPress: () => void;
  onQueryPress: () => void;
}

export function RnBetterDevToolsBubbleContent({
  environment,
  userRole,
  isDragging,
  onStatusPress,
  onQueryPress,
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

  return (
    <Animated.View style={contentLayout}>
      {/* Environment Indicator */}
      <EnvironmentIndicator environment={environment} />

      <Divider />

      {/* User Status */}
      <UserStatus
        userRole={userRole}
        onPress={onStatusPress}
        isDragging={isDragging}
      />

      <Divider />

      {/* RN Better Dev Tools Status Button */}
      <Pressable onPress={onQueryPress} style={styles.queryButton} hitSlop={8}>
        <TanstackLogo />
      </Pressable>

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
