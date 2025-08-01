import { useState } from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  ReactQueryBubbleContent,
  DragHandle,
  ErrorBoundary,
  FloatingDataEditor,
} from "./components";
import { useBubbleWidth, useDragGesture, useWifiState } from "./hooks";
import useSelectedQuery from "../../_hooks/useSelectedQuery";

const { width: screenWidth } = Dimensions.get("window");

interface ReactQueryDevToolsBubbleProps {
  queryClient: QueryClient;
}

export function ReactQueryDevToolsBubble({
  queryClient,
}: ReactQueryDevToolsBubbleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedQueryKey, setSelectedQueryKey] = useState<any[] | undefined>(
    undefined
  );

  // Use our custom hook to get live, fresh query data
  const selectedQuery = useSelectedQuery(queryClient, selectedQueryKey);

  // Custom hooks for managing state and logic - matching FloatingStatusBubble exactly
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

  const handleQuerySelect = (query: Query<any, any, any, any> | undefined) => {
    setSelectedQueryKey(query?.queryKey);
  };

  // Animated styles - matching FloatingStatusBubble exactly
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {!isModalOpen && (
          <ErrorBoundary>
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

                <ErrorBoundary>
                  <ReactQueryBubbleContent
                    isOnline={isOnline}
                    isDragging={isDragging}
                    selectedQuery={selectedQuery}
                    onPress={handlePress}
                    onWifiToggle={handleWifiToggle}
                    onEnvLabelLayout={handleEnvLabelLayout}
                    onStatusLayout={handleStatusLayout}
                  />
                </ErrorBoundary>
              </Animated.View>
            </Animated.View>
          </ErrorBoundary>
        )}

        <ErrorBoundary>
          <FloatingDataEditor
            visible={isModalOpen}
            selectedQuery={selectedQuery}
            onQuerySelect={handleQuerySelect}
            onClose={handleModalDismiss}
            queryClient={queryClient}
          />
        </ErrorBoundary>
      </QueryClientProvider>
    </ErrorBoundary>
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
