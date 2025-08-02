import { useEffect, useState } from "react";
import { Dimensions, StyleSheet, ScrollView } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileText, Settings, FlaskConical } from "lucide-react-native";
import { getSentryEvents } from "../sentry/sentryEventListeners";
import { formatRelativeTime } from "./sections/log-dump/utils";
import { useDynamicEnv } from "./hooks/useDynamicEnv";

import {
  ReactQueryBubbleContent,
  DragHandle,
  ErrorBoundary,
  FloatingDataEditor,
  ReusableDebugModal,
  type Environment,
  type UserRole,
  type DebugSection,
} from "./components";
import { useBubbleWidth, useDragGesture, useWifiState } from "./hooks";
import useSelectedQuery from "../../_hooks/useSelectedQuery";
import { SentryEventLogDumpModalContent } from "./sections/log-dump/SentryEventLogDumpModalContent";
import { EnvVarsContent, useEnvVarsSubtitle } from "./sections/env-vars";
import DevTools from "../../../DevTools";
import {
  CopyContext,
  type ClipboardFunction,
} from "../../../context/CopyContext";
import { safeStringify } from "../../_util/safeStringify";

const { width: screenWidth } = Dimensions.get("window");

interface ReactQueryDevToolsBubbleProps {
  queryClient: QueryClient;
  userRole: UserRole;
  environment: Environment;
  requiredEnvVars?: string[];
  onCopy?: ClipboardFunction;
}

export function ReactQueryDevToolsBubble({
  queryClient,
  userRole,
  environment,
  requiredEnvVars = [],
  onCopy,
}: ReactQueryDevToolsBubbleProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedQueryKey, setSelectedQueryKey] = useState<any[] | undefined>(
    undefined
  );
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);

  // Use our custom hook to get live, fresh query data
  const selectedQuery = useSelectedQuery(queryClient, selectedQueryKey);

  // State for dynamic subtitles
  const [sentryEntries, setSentryEntries] = useState(() => getSentryEvents());

  // Get dynamic env vars subtitle
  const envVarsSubtitle = useEnvVarsSubtitle(requiredEnvVars);

  // Update sentry entries periodically for dynamic subtitle
  useEffect(() => {
    const updateSentryEntries = () => {
      const rawEntries = getSentryEvents();
      // Remove duplicates based on ID
      const uniqueEntries = rawEntries.reduce((acc: any[], entry: any) => {
        if (!acc.some((existing: any) => existing.id === entry.id)) {
          acc.push(entry);
        }
        return acc;
      }, [] as any[]);
      setSentryEntries(
        uniqueEntries.sort((a: any, b: any) => b.timestamp - a.timestamp)
      );
    };

    updateSentryEntries();
    const interval = setInterval(updateSentryEntries, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Get dynamic subtitles
  const getSentrySubtitle = () => {
    return `${sentryEntries.length} events • Last ${
      sentryEntries.length > 0
        ? formatRelativeTime(sentryEntries[0]?.timestamp)
        : "never"
    }`;
  };

  const getReactQuerySubtitle = () => {
    try {
      const allQueries = queryClient.getQueryCache().getAll();
      const allMutations = queryClient.getMutationCache().getAll();
      return `${allQueries.length} queries • ${allMutations.length} mutations`;
    } catch (error) {
      return "Data management & cache inspector";
    }
  };

  // Custom hooks for managing state and logic - with query button support
  const { bubbleWidth, handleEnvLabelLayout, handleStatusLayout } =
    useBubbleWidth({ hasQueryButton: true });
  const { isOnline, handleWifiToggle } = useWifiState();
  const { panGesture, translateX, translateY } = useDragGesture({
    bubbleWidth,
    onDraggingChange: setIsDragging,
    storageKey: "react_query_bubble", // Unique storage key for React Query bubble
  });

  const handleQueryPress = () => {
    if (!isDragging) {
      setIsModalOpen(true);
    }
  };

  const handleStatusPress = () => {
    // Open the debug modal with all sections
    if (!isDragging) {
      setIsDebugModalOpen(true);
    }
  };

  const handleQueryLayout = () => {
    // Layout handler for the query button - can be empty for now
  };

  const handleModalDismiss = () => {
    setIsModalOpen(false);
  };

  const handleDebugModalDismiss = () => {
    setIsDebugModalOpen(false);
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
        {!isModalOpen && !isDebugModalOpen && (
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
                    environment={environment}
                    userRole={userRole}
                    isOnline={isOnline}
                    isDragging={isDragging}
                    selectedQuery={selectedQuery}
                    onEnvironmentLayout={handleEnvLabelLayout}
                    onStatusLayout={handleStatusLayout}
                    onQueryLayout={handleQueryLayout}
                    onStatusPress={handleStatusPress}
                    onQueryPress={handleQueryPress}
                    onWifiToggle={handleWifiToggle}
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
          />
        </ErrorBoundary>

        <CopyContext.Provider
          value={{
            onCopy: async (value: any) => {
              try {
                // If it's already a string, use it directly
                const textToCopy =
                  typeof value === "string"
                    ? value
                    : safeStringify(value, 2, {
                        depthLimit: 100,
                        edgesLimit: 1000,
                      }); // Pretty print with limits

                return onCopy ? onCopy(textToCopy) : false;
              } catch (error) {
                console.error(
                  "Copy failed in ReactQueryDevToolsBubble:",
                  error
                );
                console.error("Value type:", typeof value);
                console.error("Value constructor:", value?.constructor?.name);
                return false;
              }
            },
          }}
        >
          <ReusableDebugModal
            visible={isDebugModalOpen}
            onClose={handleDebugModalDismiss}
            sections={[
              {
                id: "sentry-logs",
                title: "Sentry Logs",
                subtitle: getSentrySubtitle(),
                icon: FileText,
                iconColor: "#8B5CF6",
                iconBackgroundColor: "rgba(139, 92, 246, 0.1)",
                content: (onClose) => (
                  <SentryEventLogDumpModalContent onClose={onClose} />
                ),
              },
              {
                id: "env-vars",
                title: "Environment Variables",
                subtitle: envVarsSubtitle,
                icon: Settings,
                iconColor: "#10B981",
                iconBackgroundColor: "rgba(16, 185, 129, 0.1)",
                content: (onClose) => (
                  <ScrollView
                    style={{ flex: 1, backgroundColor: "#2A2A2A" }}
                    contentContainerStyle={{ padding: 24 }}
                  >
                    <EnvVarsContent requiredEnvVars={requiredEnvVars} />
                  </ScrollView>
                ),
                onClose: () => {
                  // Clean up any state when leaving the env vars section
                },
              },
              {
                id: "react-query",
                title: "React Query Dev Tools",
                subtitle: getReactQuerySubtitle(),
                icon: FlaskConical,
                iconColor: "#F59E0B",
                iconBackgroundColor: "rgba(245, 158, 11, 0.1)",
                content: (onClose) => (
                  <QueryClientProvider client={queryClient}>
                    <DevTools
                      setShowDevTools={onClose}
                      containerHeight={600} // Default height
                    />
                  </QueryClientProvider>
                ),
              },
            ]}
            modalTitle="Dev Tools Console"
          />
        </CopyContext.Provider>
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
