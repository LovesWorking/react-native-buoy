import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  PanResponder,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Query,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";

import {
  X,
  Minimize2,
  Maximize2,
  GripHorizontal,
  ChevronLeft,
} from "lucide-react-native";
import Explorer from "../../../devtools/Explorer";
import { useSafeQueries } from "../hooks/useSafeQueries";
import { getQueryStatusColor } from "../../../_util/getQueryStatusColor";
import { getQueryStatusLabel } from "../../../_util/getQueryStatusLabel";
import ActionButton from "../../../devtools/ActionButton";
import triggerLoading from "../../../_util/actions/triggerLoading";
import refetch from "../../../_util/actions/refetch";
import triggerError from "../../../_util/actions/triggerError";

// Stable constants moved to module scope to prevent re-renders
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_HEIGHT = 150;
const DEFAULT_HEIGHT = 400;
const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

// Stable color map to prevent object recreation
const STATUS_COLOR_MAP: Record<string, string> = {
  blue: "#3B82F6",
  gray: "#6B7280",
  purple: "#8B5CF6",
  yellow: "#F59E0B",
  green: "#10B981",
};

interface FloatingDataEditorProps {
  visible: boolean;
  selectedQuery?: Query<any, any, any, any>;
  onQuerySelect: (query: Query<any, any, any, any> | undefined) => void;
  onClose: () => void;
  queryClient: QueryClient;
}

export function FloatingDataEditor({
  visible,
  selectedQuery,
  onQuerySelect,
  onClose,
  queryClient,
}: FloatingDataEditorProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTopMode, setIsTopMode] = useState(false); // false = bottom sheet, true = top sheet
  const allQueries = useSafeQueries();
  const insets = useSafeAreaInsets();

  // Calculate max height based on screen height minus safe area insets
  const MAX_HEIGHT = SCREEN_HEIGHT - insets.top;

  // Height management using Animated.Value for smooth resizing
  const panelHeightAnim = useRef(new Animated.Value(DEFAULT_HEIGHT)).current;
  const [currentPanelHeight, setCurrentPanelHeight] = useState(DEFAULT_HEIGHT);
  const currentPanelHeightRef = useRef(DEFAULT_HEIGHT);

  // Simple height calculation with animation support
  const currentHeight = isMinimized ? 60 : currentPanelHeight;

  // PanResponder for resizing (only enabled for bottom mode)
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isTopMode, // Only allow resize in bottom mode
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (isTopMode) return false; // Disable resize in top mode
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 10
        );
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        if (isTopMode) return; // No resize in top mode
        panelHeightAnim.stopAnimation((value) => {
          setCurrentPanelHeight(value);
          currentPanelHeightRef.current = value;
          panelHeightAnim.setValue(value);
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        if (isTopMode) return; // No resize in top mode
        // Bottom mode: dragging up (negative dy) increases height
        const newHeight = currentPanelHeightRef.current - gestureState.dy;
        const clampedHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, newHeight)
        );
        panelHeightAnim.setValue(clampedHeight);
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (isTopMode) return; // No resize in top mode
        // Bottom mode: dragging up (negative dy) increases height
        const finalHeight = currentPanelHeightRef.current - gestureState.dy;
        const clampedFinalHeight = Math.max(
          MIN_HEIGHT,
          Math.min(MAX_HEIGHT, finalHeight)
        );
        setCurrentPanelHeight(clampedFinalHeight);
        currentPanelHeightRef.current = clampedFinalHeight;

        Animated.timing(panelHeightAnim, {
          toValue: clampedFinalHeight,
          duration: 200,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const toggleModalPosition = () => {
    setIsTopMode(!isTopMode);
  };

  // Moved to module scope to prevent re-creation on every render
  const createActionButtons = (
    selectedQuery: Query<any, any, any, any>,
    queryClient: QueryClient
  ) => {
    const queryStatus = selectedQuery.state.status;
    const isFetching = getQueryStatusLabel(selectedQuery) === "fetching";

    return [
      {
        label: "Refetch",
        bgColorClass: "btnRefetch" as const,
        textColorClass: "btnRefetch" as const,
        disabled: isFetching,
        onPress: () => refetch({ query: selectedQuery }),
      },
      {
        label: selectedQuery.state.data === undefined ? "Restore" : "Loading",
        bgColorClass: "btnTriggerLoading" as const,
        textColorClass: "btnTriggerLoading" as const,
        disabled: false,
        onPress: () => triggerLoading({ query: selectedQuery }),
      },
      {
        label: queryStatus === "error" ? "Restore" : "Error",
        bgColorClass: "btnTriggerLoadiError" as const,
        textColorClass: "btnTriggerLoadiError" as const,
        disabled: queryStatus === "pending",
        onPress: () => triggerError({ query: selectedQuery, queryClient }),
      },
    ];
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <QueryClientProvider client={queryClient}>
        <View
          style={[
            styles.overlay,
            isTopMode && { ...styles.overlayTop, paddingTop: insets.top },
          ]}
        >
          <Animated.View
            style={[
              styles.panel,
              isTopMode ? styles.panelTop : styles.panelBottom,
              {
                height: isMinimized
                  ? 60
                  : isTopMode
                  ? panelHeightAnim
                  : panelHeightAnim,
              },
            ]}
          >
            <View style={styles.header}>
              {!isTopMode && (
                <View
                  {...resizePanResponder.panHandlers}
                  style={styles.resizeHandle}
                >
                  <GripHorizontal color="#6B7280" size={20} />
                </View>
              )}

              <View style={styles.headerContent}>
                {selectedQuery && (
                  <Pressable
                    onPress={() => onQuerySelect(undefined)}
                    style={styles.backButton}
                    hitSlop={HIT_SLOP}
                  >
                    <ChevronLeft color="#9CA3AF" size={20} />
                  </Pressable>
                )}

                <View style={styles.titleSection}>
                  <Text style={styles.title}>
                    {selectedQuery ? "Data Editor" : "Query Browser"}
                  </Text>
                  {selectedQuery ? (
                    <Text style={styles.subtitle}>
                      {Array.isArray(selectedQuery.queryKey)
                        ? selectedQuery.queryKey.join(" › ")
                        : String(selectedQuery.queryKey)}
                    </Text>
                  ) : (
                    <Text style={styles.subtitle}>
                      {allQueries.length}{" "}
                      {allQueries.length === 1 ? "query" : "queries"} available
                    </Text>
                  )}
                </View>

                <View style={styles.controls}>
                  <Pressable
                    onPress={toggleModalPosition}
                    style={styles.controlButton}
                    hitSlop={HIT_SLOP}
                  >
                    {isTopMode ? (
                      <Minimize2 color="#9CA3AF" size={16} />
                    ) : (
                      <Maximize2 color="#9CA3AF" size={16} />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={onClose}
                    style={styles.controlButton}
                    hitSlop={HIT_SLOP}
                  >
                    <X color="#9CA3AF" size={16} />
                  </Pressable>
                </View>
              </View>
            </View>

            {!isMinimized && (
              <View style={styles.content}>
                {selectedQuery ? (
                  // Data Editor Mode
                  <>
                    <ScrollView
                      style={styles.explorerScrollContainer}
                      contentContainerStyle={styles.explorerScrollContent}
                    >
                      {selectedQuery.state.data ? (
                        <Explorer
                          key={selectedQuery?.queryHash}
                          editable={true}
                          label="Data"
                          value={selectedQuery?.state.data}
                          defaultExpanded={["Data"]}
                          activeQuery={selectedQuery}
                        />
                      ) : (
                        <View style={styles.emptyState}>
                          {selectedQuery.state.status === "pending" ||
                          getQueryStatusLabel(selectedQuery) === "fetching" ? (
                            <>
                              <Text style={styles.emptyTitle}>
                                {selectedQuery.state.status === "pending"
                                  ? "Loading..."
                                  : "Refetching..."}
                              </Text>
                              <Text style={styles.emptyDescription}>
                                Please wait while the query is being executed.
                              </Text>
                            </>
                          ) : selectedQuery.state.status === "error" ? (
                            <>
                              <Text style={styles.emptyTitle}>Query Error</Text>
                              <Text style={styles.emptyDescription}>
                                {selectedQuery.state.error?.message ||
                                  "An error occurred while fetching data."}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={styles.emptyTitle}>
                                No Data Available
                              </Text>
                              <Text style={styles.emptyDescription}>
                                This query has no data to edit. Try refetching
                                the query first.
                              </Text>
                            </>
                          )}
                        </View>
                      )}
                    </ScrollView>
                    {/* Action Footer */}
                    <View style={styles.actionFooter}>
                      {selectedQuery && (
                        <View style={styles.actionsGrid}>
                          {createActionButtons(selectedQuery, queryClient).map(
                            (action, index) => (
                              <ActionButton
                                key={index}
                                onClick={action.onPress}
                                text={action.label}
                                bgColorClass={action.bgColorClass}
                                textColorClass={action.textColorClass}
                                disabled={action.disabled}
                              />
                            )
                          )}
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  // Query Browser Mode
                  <ScrollView
                    style={styles.queryListContainer}
                    contentContainerStyle={styles.queryListContent}
                  >
                    {allQueries.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>No Queries Found</Text>
                        <Text style={styles.emptyDescription}>
                          No React Query queries are currently active.{"\n\n"}
                          To see queries here:{"\n"}• Make API calls using
                          useQuery
                          {"\n"}• Ensure queries are within QueryClientProvider
                          {"\n"}• Check console for debugging info
                        </Text>
                      </View>
                    ) : (
                      allQueries.map((query, index) => {
                        const displayName = Array.isArray(query.queryKey)
                          ? query.queryKey.join(" - ")
                          : String(query.queryKey);

                        const statusColorName = getQueryStatusColor({
                          queryState: query.state,
                          observerCount: query.getObserversCount(),
                          isStale: query.isStale(),
                        });

                        const statusColor =
                          STATUS_COLOR_MAP[statusColorName] || "#6B7280";

                        return (
                          <TouchableOpacity
                            key={`${query.queryHash}-${index}`}
                            style={styles.queryItem}
                            onPress={() => onQuerySelect(query)}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: statusColor },
                              ]}
                            />
                            <Text style={styles.queryText} numberOfLines={1}>
                              {displayName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                )}
              </View>
            )}

            {/* No resize handle for top mode - resize disabled */}
          </Animated.View>
        </View>
      </QueryClientProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent", // Allows interaction with app behind
  },
  overlayTop: {
    justifyContent: "flex-start",
  },
  panel: {
    backgroundColor: "#1F1F1F",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  panelBottom: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 0,
    shadowOffset: {
      width: 0,
      height: -4,
    },
  },
  panelTop: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderTopWidth: 0,
    shadowOffset: {
      width: 0,
      height: 4,
    },
  },
  header: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  resizeHandle: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  resizeHandleBottom: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 12,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    color: "#9CA3AF",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "monospace",
  },
  controls: {
    flexDirection: "row",
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  content: {
    flex: 1,
    overflow: "hidden",
  },
  explorerScrollContainer: {
    flex: 1,
  },
  explorerScrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  explorerContainer: {
    flex: 1,
    padding: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptyDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  queryListContainer: {
    flex: 1,
  },
  queryListContent: {
    padding: 16,
    flexGrow: 1,
  },
  queryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  queryText: {
    color: "#E5E7EB",
    fontSize: 14,
    flex: 1,
    fontFamily: "monospace",
  },
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: "#1F1F1F",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
});
