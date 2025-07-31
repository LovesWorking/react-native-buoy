import { useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Pressable,
  Text,
  View,
  Modal,
  TouchableOpacity,
} from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TanstackLogo } from "../../../_components/devtools/svgs";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DragHandle } from "./components/DragHandle";
import { WifiToggle } from "./components/WifiToggle";
import { AdminModal } from "./AdminModal";
import { useBubbleWidth, useDragGesture, useWifiState } from "./hooks";
import DevTools from "../../../DevTools";

const { height: screenHeight } = Dimensions.get("window");

interface ReactQueryDevToolsBubbleProps {
  queryClient: QueryClient;
}

export function ReactQueryDevToolsBubble({
  queryClient,
}: ReactQueryDevToolsBubbleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const insets = useSafeAreaInsets();

  // Calculate available height for modal content
  const { height: screenHeight } = Dimensions.get("window");
  const availableHeight = screenHeight - insets.top;

  // Custom hooks for managing state and logic
  const { bubbleWidth, handleStatusLayout } = useBubbleWidth();
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

  const bubbleLayout = useAnimatedStyle(() => ({
    flexDirection: "row",
    alignItems: "center",
    width: bubbleWidth,
  }));

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
          sentry-label="ignore react query dev tools bubble"
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
            <WifiToggle
              isOnline={isOnline}
              onToggle={handleWifiToggle}
              isDragging={isDragging}
            />
            <Pressable
              onPress={handlePress}
              onLayout={handleStatusLayout}
              style={styles.devToolsButton}
            >
              <View style={styles.logoContainer}>
                <TanstackLogo />
              </View>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}

      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        onRequestClose={handleModalDismiss}
      >
        <View style={styles.container}>
          {/* Backdrop */}
          <View style={styles.backdrop}>
            <TouchableOpacity
              style={styles.backdropTouchable}
              onPress={handleModalDismiss}
              activeOpacity={1}
            />
          </View>

          {/* Modal Content */}
          <View style={styles.fullScreenModalContainer}>
            <View
              style={[
                styles.fullScreenModal,
                {
                  backgroundColor: "#0F0F0F",
                  paddingTop: insets.top,
                },
              ]}
            >
              <View style={styles.directContent}>
                <QueryClientProvider client={queryClient}>
                  <DevTools
                    setShowDevTools={handleModalDismiss}
                    queryClient={queryClient}
                    containerHeight={availableHeight}
                  />
                </QueryClientProvider>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  backdropTouchable: {
    flex: 1,
  },
  fullScreenModalContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: screenHeight,
  },
  fullScreenModal: {
    flex: 1,
    minHeight: screenHeight,
  },
  directContent: {
    flex: 1,
  },
  normalShadow: {
    boxShadow: "0px 4px 8px 0px rgba(0, 0, 0, 0.3)",
  },
  dragShadow: {
    boxShadow: "0px 6px 12px 0px rgba(34, 197, 94, 0.6)",
  },
  devToolsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  logoContainer: {
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
