import React from "react";
import { Pressable, LayoutChangeEvent, Text, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Query, QueryClient } from "@tanstack/react-query";
import { TanstackLogo } from "../../../devtools/svgs";
import { Database } from "lucide-react-native";

import { Divider } from "./Divider";
import { WifiToggle } from "./WifiToggle";
import { getQueryStatusColor } from "../../../_util/getQueryStatusColor";

interface ReactQueryBubbleContentProps {
  isOnline: boolean;
  isDragging: boolean;
  selectedQuery?: Query<any, any, any, any>;
  onPress: () => void;
  onWifiToggle: () => void;
  onEnvLabelLayout: (event: LayoutChangeEvent) => void;
  onStatusLayout: (event: LayoutChangeEvent) => void;
}

export function ReactQueryBubbleContent({
  isOnline,
  isDragging,
  selectedQuery,
  onPress,
  onWifiToggle,
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
        return <Database color="#EF4444" size={14} />;
      }
    }

    return <Database color="#9CA3AF" size={14} />;
  };

  return (
    <Animated.View style={contentLayout}>
      {/* TanStack Logo Button */}
      <Pressable
        onPress={onPress}
        style={styles.logoButton}
        hitSlop={8}
        onLayout={onEnvLabelLayout}
      >
        <TanstackLogo />
      </Pressable>

      <Divider />

      {/* Unified Query/Data Button */}
      <Animated.View onLayout={onStatusLayout}>
        <Pressable onPress={onPress} style={styles.queryButton} hitSlop={8}>
          {getQueryIndicator()}
        </Pressable>
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

const styles = StyleSheet.create({
  logoButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
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
