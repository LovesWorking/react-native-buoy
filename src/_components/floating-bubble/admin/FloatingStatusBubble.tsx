import { ReactNode, useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { QueryClient } from "@tanstack/react-query";

import { BubbleContent } from "./components/BubbleContent";
import { DragHandle } from "./components/DragHandle";
import { EnvVarsSection, RequiredEnvVar } from "./sections/EnvVarsSection";
import { SentryLogDumpSection } from "./sections/SentryLogDumpSection";
import { ReactQuerySection } from "./sections/ReactQuerySection";
import { AdminModal } from "./AdminModal";
import type { Environment, UserRole } from "./components";
import { useBubbleWidth, useDragGesture, useWifiState } from "./hooks";

const { width: screenWidth } = Dimensions.get("window");

type DefaultSection = "sentry-logs" | "env-vars" | "react-query";

interface FloatingStatusBubbleProps {
  userRole: UserRole;
  environment: Environment;
  children?: ReactNode; // Additional admin modal content
  removeSections?: DefaultSection[]; // Array of default sections to disable
  requiredEnvVars?: RequiredEnvVar[]; // List of required environment variables to check
  queryClient?: QueryClient; // React Query client for dev tools
}

export function FloatingStatusBubble({
  userRole,
  environment,
  children,
  removeSections = [],
  requiredEnvVars,
  queryClient,
}: FloatingStatusBubbleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Custom hooks for managing state and logic
  const { bubbleWidth, handleEnvLabelLayout, handleStatusLayout } =
    useBubbleWidth();
  const { isOnline, handleWifiToggle } = useWifiState();
  const { panGesture, translateX, translateY } = useDragGesture({
    bubbleWidth,
    onDraggingChange: setIsDragging,
  });

  const handlePress = () => {
    if (!isDragging) {
      setIsModalOpen(true);
    }
  };

  const handleModalDismiss = () => {
    setIsModalOpen(false);
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const animatedBorderStyle = useAnimatedStyle(() => {
    const normalBorder = "rgba(75, 85, 99, 0.4)";
    const dragBorder = "rgba(34, 197, 94, 1)";

    return {
      borderColor: isDragging ? dragBorder : normalBorder,
      borderWidth: isDragging ? 2 : 1,
      transform: [{ translateY: isDragging ? 1 : 0 }],
    };
  });

  const bubbleLayout = useAnimatedStyle(() => {
    const centerX = translateX.value + bubbleWidth / 2;
    const isOnLeft = centerX < screenWidth / 2;

    return {
      flexDirection: isOnLeft ? "row-reverse" : "row",
      alignItems: "center",
      width: bubbleWidth,
    };
  });

  return (
    <>
      {!isModalOpen && (
        <Animated.View
          style={[
            {
              position: "absolute",
              zIndex: 1001,
            },
            animatedStyle,
          ]}
          sentry-label="ignore floating status bubble"
        >
          <Animated.View
            style={[
              {
                alignItems: "center",
                backgroundColor: "#171717",
                borderRadius: 6,
                elevation: 8,
                overflow: "hidden",
                width: bubbleWidth,
              },
              bubbleLayout,
              isDragging ? styles.dragShadow : styles.normalShadow,
              animatedBorderStyle,
            ]}
          >
            <DragHandle panGesture={panGesture} translateX={translateX} />

            <BubbleContent
              environment={environment}
              userRole={userRole}
              isOnline={isOnline}
              isDragging={isDragging}
              onEnvironmentLayout={handleEnvLabelLayout}
              onStatusLayout={handleStatusLayout}
              onStatusPress={handlePress}
              onWifiToggle={handleWifiToggle}
            />
          </Animated.View>
        </Animated.View>
      )}

      <AdminModal visible={isModalOpen} onDismiss={handleModalDismiss}>
        {/* Default sections (conditionally rendered) */}
        {!removeSections.includes("sentry-logs") && <SentryLogDumpSection />}
        {!removeSections.includes("env-vars") && (
          <EnvVarsSection requiredEnvVars={requiredEnvVars} />
        )}
        {!removeSections.includes("react-query") && (
          <ReactQuerySection queryClient={queryClient} />
        )}

        {/* User-provided additional sections */}
        {children}
      </AdminModal>
    </>
  );
}

const styles = StyleSheet.create({
  normalShadow: {
    boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.3)",
  },
  dragShadow: {
    boxShadow: "0px 6px 12px 0px rgba(34, 197, 94, 0.6)",
  },
});
