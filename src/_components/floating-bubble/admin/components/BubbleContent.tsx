import { LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { Divider } from "./Divider";
import {
  type Environment,
  EnvironmentIndicator,
} from "../../bubble/EnvironmentIndicator";
import { type UserRole, UserStatus } from "./UserStatus";
import { WifiToggle } from "./WifiToggle";

interface BubbleContentProps {
  environment: Environment;
  userRole: UserRole;
  isOnline: boolean;
  isDragging: boolean;
  onEnvironmentLayout: (event: LayoutChangeEvent) => void;
  onStatusLayout: (event: LayoutChangeEvent) => void;
  onStatusPress: () => void;
  onWifiToggle: () => void;
}

export function BubbleContent({
  environment,
  userRole,
  isOnline,
  isDragging,
  onEnvironmentLayout,
  onStatusLayout,
  onStatusPress,
  onWifiToggle,
}: BubbleContentProps) {
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
      <EnvironmentIndicator
        environment={environment}
        onLayout={onEnvironmentLayout}
      />

      <Divider />

      <UserStatus
        userRole={userRole}
        onPress={onStatusPress}
        isDragging={isDragging}
        onLayout={onStatusLayout}
      />

      <Divider />

      <WifiToggle
        isOnline={isOnline}
        onToggle={onWifiToggle}
        isDragging={isDragging}
      />
    </Animated.View>
  );
}
