import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import DragResizable from "../../../_shared/DragResizable";

import { Query, QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  X,
  ChevronLeft,
  Activity,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Maximize2,
  Minimize2,
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
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MIN_HEIGHT = 150;
const MIN_WIDTH = 300;
const DEFAULT_HEIGHT = 400; // Smaller default height for bottom sheet
const DEFAULT_WIDTH = SCREEN_WIDTH - 40; // Leave 20px margin on each side
const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// Enhanced status color mapping - moved to module scope to prevent re-creation
const STATUS_COLOR_MAP: Record<string, string> = {
  blue: "#3B82F6",
  gray: "#6B7280",
  purple: "#8B5CF6",
  yellow: "#F59E0B",
  green: "#10B981",
  red: "#EF4444",
};

// Stable callbacks moved to module scope to prevent re-renders
const RESIZE_HANDLERS: Array<
  "bottomLeft" | "bottomRight" | "topLeft" | "topRight"
> = ["bottomLeft", "bottomRight", "topLeft", "topRight"];

// Simplified breadcrumb without complex mapping
const getQueryBreadcrumb = (query: Query<any, any, any, any>) => {
  const queryKey = Array.isArray(query.queryKey)
    ? query.queryKey
    : [query.queryKey];
  return queryKey.join(" › ");
};

// Optimized QueryListItem component matching main dev tools QueryRow styling
const QueryListItem = React.memo(
  ({
    query,
    onQuerySelect,
  }: {
    query: Query<any, any, any, any>;
    onQuerySelect: (query: Query<any, any, any, any>) => void;
  }) => {
    const displayName = Array.isArray(query.queryKey)
      ? query.queryKey.join(" - ")
      : String(query.queryKey);

    const status = getQueryStatusLabel(query);
    const observerCount = query.getObserversCount();
    const isDisabled = query.isDisabled();

    // Get status color matching main dev tools exactly
    const getStatusHexColor = (status: string): string => {
      switch (status) {
        case "fresh":
          return "#10B981"; // Green
        case "stale":
        case "inactive":
          return "#F59E0B"; // Orange
        case "fetching":
          return "#3B82F6"; // Blue
        case "paused":
          return "#8B5CF6"; // Purple
        default:
          return "#6B7280"; // Gray
      }
    };

    const statusColor = getStatusHexColor(status);

    // Use stable callback pattern
    const handlePress = useRef(() => {
      onQuerySelect(query);
    });

    // Update ref to latest query while keeping callback stable
    handlePress.current = () => {
      onQuerySelect(query);
    };

    return (
      <TouchableOpacity
        style={styles.queryItem}
        onPress={handlePress.current}
        activeOpacity={0.8}
        accessibilityLabel={`Query key ${displayName}`}
      >
        {/* Row content matching main dev tools QueryRow */}
        <View style={styles.rowContent}>
          <View style={styles.statusSection}>
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <View style={styles.statusInfo}>
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
              <Text style={styles.observerText}>
                {observerCount} observer{observerCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>

          <View style={styles.querySection}>
            <Text
              style={styles.queryHash}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {displayName}
            </Text>
            {isDisabled && <Text style={styles.disabledText}>Disabled</Text>}
          </View>

          <View style={styles.badgeSection}>
            <Text style={[styles.statusBadge, { color: statusColor }]}>
              {observerCount}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

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
  const [isFloatingMode, setIsFloatingMode] = useState(false);
  const allQueries = useSafeQueries();
  const insets = useSafeAreaInsets();

  // State for drag/resize container bounds
  const [containerBounds, setContainerBounds] = useState({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - insets.top - insets.bottom,
  });

  // State for panel dimensions
  const [panelDimensions, setPanelDimensions] = useState({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    top: 100,
    left: 20,
  });

  // Update container bounds when screen orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      setContainerBounds({
        width: window.width,
        height: window.height - insets.top - insets.bottom,
      });
    });
    return () => subscription?.remove();
  }, [insets.top, insets.bottom]);

  // Simple callback functions for drag/resize events
  const handleDragEnd = (dimensions: any) => {
    setPanelDimensions((prev) => ({
      ...prev,
      top: dimensions.top,
      left: dimensions.left,
    }));
  };

  const handleResizeEnd = (dimensions: any) => {
    setPanelDimensions(dimensions);
  };

  // Toggle between floating and bottom sheet modes
  const toggleFloatingMode = () => {
    setIsFloatingMode(!isFloatingMode);
  };

  // Bottom sheet height management (for non-floating mode)
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const MAX_HEIGHT = SCREEN_HEIGHT - insets.top;

  // Reanimated shared values for smooth resizing
  const sharedHeight = useSharedValue(DEFAULT_HEIGHT);
  const offsetHeight = useSharedValue(0);

  // Update shared value when state changes
  useEffect(() => {
    sharedHeight.value = panelHeight;
  }, [panelHeight]);

  // Smooth resize gesture using Reanimated (like the working drag hook)
  const resizeGesture = Gesture.Pan()
    .enabled(!isFloatingMode)
    .onBegin(() => {
      "worklet";
      offsetHeight.value = sharedHeight.value;
    })
    .onUpdate((event) => {
      "worklet";
      // Bottom sheet: dragging up (negative dy) increases height
      const newHeight = offsetHeight.value - event.translationY;
      const clampedHeight = clamp(newHeight, MIN_HEIGHT, MAX_HEIGHT);
      sharedHeight.value = clampedHeight;

      // Update React state on JS thread
      runOnJS(setPanelHeight)(clampedHeight);
    })
    .onEnd(() => {
      "worklet";
      // Final height is already set via runOnJS
    });

  // Animated style for smooth height transitions
  const animatedPanelStyle = useAnimatedStyle(() => ({
    height: sharedHeight.value,
  }));

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

  // Helper function to render the common content
  const renderPanelContent = () => (
    <>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {selectedQuery && (
            <Pressable
              onPress={() => onQuerySelect(undefined)}
              style={styles.backButton}
              hitSlop={HIT_SLOP}
            >
              <ChevronLeft color="#E5E7EB" size={20} />
            </Pressable>
          )}

          <View style={styles.compactHeaderRow}>
            {selectedQuery ? (
              <View style={styles.breadcrumbContainer}>
                <Text style={styles.breadcrumbItem} numberOfLines={1}>
                  {getQueryBreadcrumb(selectedQuery)}
                </Text>
              </View>
            ) : (
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{allQueries.length}</Text>
                  <Text style={styles.statLabel}>
                    {allQueries.length === 1 ? "query" : "queries"}
                  </Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {
                      allQueries.filter((q) => q.state.status === "success")
                        .length
                    }
                  </Text>
                  <Text style={styles.statLabel}>active</Text>
                </View>
              </View>
            )}

            <View style={styles.headerControls}>
              <Pressable
                onPress={toggleFloatingMode}
                style={[styles.controlButton, styles.controlButtonSecondary]}
                hitSlop={HIT_SLOP}
              >
                {isFloatingMode ? (
                  <Minimize2 color="#E5E7EB" size={16} />
                ) : (
                  <Maximize2 color="#E5E7EB" size={16} />
                )}
              </Pressable>

              <Pressable
                onPress={onClose}
                style={[styles.controlButton, styles.controlButtonDanger]}
                hitSlop={HIT_SLOP}
              >
                <X color="#FFFFFF" size={16} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>

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
                      <Text style={styles.emptyTitle}>No Data Available</Text>
                      <Text style={styles.emptyDescription}>
                        This query has no data to edit. Try refetching the query
                        first.
                      </Text>
                    </>
                  )}
                </View>
              )}
            </ScrollView>
            {/* Action Footer with Safe Area */}
            <View
              style={[
                styles.actionFooter,
                !isFloatingMode && { paddingBottom: insets.bottom + 8 },
              ]}
            >
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
          <>
            <ScrollView
              style={styles.queryListContainer}
              contentContainerStyle={styles.queryListContent}
            >
              {allQueries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No Queries Found</Text>
                  <Text style={styles.emptyDescription}>
                    No React Query queries are currently active.{"\n\n"}
                    To see queries here:{"\n"}• Make API calls using useQuery
                    {"\n"}• Ensure queries are within QueryClientProvider
                    {"\n"}• Check console for debugging info
                  </Text>
                </View>
              ) : (
                allQueries.map((query, index) => (
                  <QueryListItem
                    key={`${query.queryHash}-${index}`}
                    query={query}
                    onQuerySelect={onQuerySelect}
                  />
                ))
              )}
            </ScrollView>
            {/* Query Browser safe area */}
            {!isFloatingMode && (
              <View
                style={[styles.queryBrowserSafeArea, { height: insets.bottom }]}
              />
            )}
          </>
        )}
      </View>
    </>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {isFloatingMode ? (
        // Floating Mode - Draggable and resizable
        <View
          style={styles.container}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            setContainerBounds({ width, height });
          }}
          pointerEvents="box-none"
        >
          <DragResizable
            heightBound={containerBounds.height}
            widthBound={containerBounds.width}
            left={panelDimensions.left}
            top={panelDimensions.top}
            width={panelDimensions.width}
            height={panelDimensions.height}
            minWidth={MIN_WIDTH}
            minHeight={MIN_HEIGHT}
            isDraggable={true}
            isResizable={true}
            resizeHandlers={RESIZE_HANDLERS}
            onDragEnd={handleDragEnd}
            onResizeEnd={handleResizeEnd}
            style={styles.dragResizableContainer}
          >
            <View style={[styles.panel, styles.panelFloating]}>
              {renderPanelContent()}
            </View>
          </DragResizable>
        </View>
      ) : (
        // Bottom Sheet Mode - Traditional modal
        <View
          style={[styles.overlay, { paddingTop: insets.top }]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.panel, styles.panelBottomSheet, animatedPanelStyle]}
          >
            {/* Resize handle for bottom sheet */}
            <GestureDetector gesture={resizeGesture}>
              <View style={styles.resizeHandle}>
                <View style={styles.resizeGrip} />
              </View>
            </GestureDetector>

            {renderPanelContent()}
          </Animated.View>
        </View>
      )}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  // Container for DragResizable component
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },

  // Base overlay for bottom sheet mode
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
    pointerEvents: "box-none",
  },

  // Style for the DragResizable wrapper
  dragResizableContainer: {
    backgroundColor: "transparent",
  },
  panel: {
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)", // Match main dev tools border
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  // Floating mode panel should flex
  panelFloating: {
    flex: 1,
  },

  // Bottom sheet specific styles
  panelBottomSheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    borderBottomWidth: 0,
    shadowOffset: { width: 0, height: -4 },
  },

  // Resize handle for bottom sheet
  resizeHandle: {
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)", // Match main dev tools surface
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },

  resizeGrip: {
    width: 32,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // Match DevToolsHeader drag indicator
    borderRadius: 1.5,
  },

  // Header matching DevToolsHeader exactly
  header: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
    backgroundColor: "#171717", // Exact match with main dev tools
  },

  // Header content matching DevToolsHeader patterns
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)", // Exact match with DevToolsHeader
    flexDirection: "column",
    gap: 12,
    backgroundColor: "#171717",
  },

  // New compact single-row layout
  compactHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flex: 1,
  },

  // Header controls container
  headerControls: {
    flexDirection: "row",
    gap: 6,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)", // Match main dev tools button
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)", // Match main dev tools button
    marginRight: 12,
  },

  // Breadcrumb navigation
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginTop: 4,
  },
  breadcrumbItem: {
    color: "#E5E7EB", // Exact match with main dev tools text
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
    flex: 1,
  },
  breadcrumbSeparator: {
    color: "#9CA3AF", // Exact match with main dev tools tertiary text
    fontSize: 12,
    fontWeight: "400",
  },

  // Stats display matching main dev tools patterns
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  statNumber: {
    color: "#0EA5E9", // Exact match with DevToolsHeader toggle active color
    fontSize: 14,
    fontWeight: "600",
  },
  statLabel: {
    color: "#9CA3AF", // Exact match with DevToolsHeader inactive text
    fontSize: 11,
    fontWeight: "500",
  },
  statSeparator: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.1)", // Match main dev tools border
  },

  // Control buttons matching DevToolsHeader exactly
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)", // Exact match with DevToolsHeader
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)", // Exact match with DevToolsHeader
  },
  controlButtonSecondary: {
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    borderColor: "rgba(156, 163, 175, 0.2)",
  },
  controlButtonDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },

  // Explorer section
  explorerScrollContainer: {
    flex: 1,
  },
  explorerScrollContent: {
    padding: 16,
    flexGrow: 1,
  },

  // Empty states matching main dev tools
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#FFFFFF", // Match main dev tools primary text
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#9CA3AF", // Match main dev tools tertiary text
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Query list matching main dev tools exactly
  queryListContainer: {
    flex: 1,
  },
  queryListContent: {
    padding: 8, // Reduced to match main dev tools
    flexGrow: 1,
  },
  queryItem: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 8,
    marginVertical: 3,
    padding: 12,
    transform: [{ scale: 1 }],
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  observerText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 1,
  },
  querySection: {
    flex: 2,
    paddingHorizontal: 12,
  },
  queryHash: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 16,
  },
  badgeSection: {
    alignItems: "flex-end",
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  disabledText: {
    fontSize: 10,
    color: "#EF4444",
    fontWeight: "500",
    marginTop: 2,
  },

  // Action footer matching main dev tools exactly
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)", // Match DevToolsHeader border
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#171717", // Match main dev tools primary background
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6, // Reduced from 8
    justifyContent: "space-between",
  },

  // Query browser safe area with matching background
  queryBrowserSafeArea: {
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },
});
