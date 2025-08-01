import React from "react";
import { Pressable, LayoutChangeEvent } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Query, QueryClient } from "@tanstack/react-query";
import { TanstackLogo } from "../../../devtools/svgs";

import { Divider } from "./Divider";
import { WifiToggle } from "./WifiToggle";
import { ActionMenu } from "./ActionMenu";
import { BubbleQuerySelector } from "./BubbleQuerySelector";

interface ReactQueryBubbleContentProps {
  isOnline: boolean;
  isDragging: boolean;
  selectedQuery?: Query<any, any, any, any>;
  onPress: () => void;
  onWifiToggle: () => void;
  onQuerySelect: (query: Query<any, any, any, any> | undefined) => void;
  onEnvLabelLayout: (event: LayoutChangeEvent) => void;
  onStatusLayout: (event: LayoutChangeEvent) => void;
}

export function ReactQueryBubbleContent({
  isOnline,
  isDragging,
  selectedQuery,
  onPress,
  onWifiToggle,
  onQuerySelect,
  onEnvLabelLayout,
  onStatusLayout,
}: ReactQueryBubbleContentProps) {
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
      {/* TanStack Logo Button (replaces EnvironmentIndicator) */}
      <Pressable
        onPress={onPress}
        style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
        }}
        hitSlop={8}
        onLayout={onEnvLabelLayout}
      >
        <TanstackLogo />
      </Pressable>

      <Divider />

      {/* Query Selector */}
      <BubbleQuerySelector
        selectedQuery={selectedQuery}
        onQuerySelect={onQuerySelect}
      />

      <Divider />

      {/* Action Menu (replaces UserStatus) */}
      <Animated.View onLayout={onStatusLayout}>
        <ActionMenu
          selectedQuery={selectedQuery}
          onQueryChange={onQuerySelect}
        />
      </Animated.View>

      <Divider />

      <WifiToggle
        isOnline={isOnline}
        onToggle={onWifiToggle}
        isDragging={isDragging}
      />
    </Animated.View>
  );
}
