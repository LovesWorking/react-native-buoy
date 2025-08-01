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

import { X, ChevronLeft, Maximize2, Minimize2 } from "lucide-react-native";
import Explorer from "../../../devtools/Explorer";
import { QueryBrowser } from "../../../devtools/index";
import useAllQueries from "../../../_hooks/useAllQueries";
import ActionButton from "../../../devtools/ActionButton";
import triggerLoading from "../../../_util/actions/triggerLoading";
import refetch from "../../../_util/actions/refetch";
import triggerError from "../../../_util/actions/triggerError";
import { getQueryStatusLabel } from "../../../_util/getQueryStatusLabel";

// Stable constants moved to module scope to prevent re-renders
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const MIN_HEIGHT = 150;
const MIN_WIDTH = 300;
const DEFAULT_HEIGHT = 400; // Smaller default height for bottom sheet
const DEFAULT_WIDTH = SCREEN_WIDTH - 40; // Leave 20px margin on each side
const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

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

// Custom corner resize handle component with drag feedback
const CornerResizeHandle = ({
  handler,
}: {
  handler: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}) => {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <View
      style={[
        cornerHandleStyles.cornerHandle,
        cornerHandleStyles[handler],
        isDragging && cornerHandleStyles.cornerHandleDragging,
      ]}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchCancel={() => setIsDragging(false)}
      hitSlop={HIT_SLOP}
    />
  );
};

// Updated render function to return the component
const renderCornerHandle = ({
  handler,
}: {
  handler: "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}) => {
  return <CornerResizeHandle handler={handler} />;
};

interface FloatingDataEditorProps {
  visible: boolean;
  selectedQuery?: Query<any, any, any, any>;
  onQuerySelect: (query: Query<any, any, any, any> | undefined) => void;
  onClose: () => void;
}

export function FloatingDataEditor({
  visible,
  selectedQuery,
  onQuerySelect,
  onClose,
}: FloatingDataEditorProps) {
  const [isFloatingMode, setIsFloatingMode] = useState(false);
  const insets = useSafeAreaInsets();
  const allQueries = useAllQueries(); // For stats display

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

  // Header-based resize gesture for bottom sheet mode
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
  const createActionButtons = (selectedQuery: Query<any, any, any, any>) => {
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
        onPress: () => triggerError({ query: selectedQuery }),
      },
    ];
  };

  if (!visible) return null;

  // Helper function to render the common content
  const renderPanelContent = () => (
    <>
      <View style={styles.header}>
        {/* Drag indicator at top of header for visual feedback */}
        {!isFloatingMode && (
          <View style={styles.dragIndicator}>
            <View style={styles.resizeGrip} />
          </View>
        )}
        <View style={styles.headerContent}>
          <View style={styles.mainHeaderRow}>
            {selectedQuery && (
              <Pressable
                onPress={() => onQuerySelect(undefined)}
                style={styles.backButton}
                hitSlop={HIT_SLOP}
              >
                <ChevronLeft color="#E5E7EB" size={20} />
              </Pressable>
            )}

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
                  {createActionButtons(selectedQuery).map((action, index) => (
                    <ActionButton
                      key={index}
                      onClick={action.onPress}
                      text={action.label}
                      bgColorClass={action.bgColorClass}
                      textColorClass={action.textColorClass}
                      disabled={action.disabled}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          // Query Browser Mode
          <>
            <View style={styles.queryListContainer}>
              <QueryBrowser
                selectedQuery={selectedQuery}
                onQuerySelect={onQuerySelect}
                emptyStateMessage="No React Query queries are currently active.

To see queries here:
• Make API calls using useQuery
• Ensure queries are within QueryClientProvider
• Check console for debugging info"
                contentContainerStyle={styles.queryListContent}
              />
            </View>
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
    <>
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
            renderHandler={renderCornerHandle}
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
            {/* Header as resize handle for bottom sheet */}
            <GestureDetector gesture={resizeGesture}>
              <View style={styles.headerResizeArea}>
                {renderPanelContent()}
              </View>
            </GestureDetector>
          </Animated.View>
        </View>
      )}
    </>
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

  // Drag indicator at top of header (like DevToolsHeader)
  dragIndicator: {
    height: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#171717",
  },

  // Header resize area for bottom sheet mode
  headerResizeArea: {
    flex: 1,
  },

  // Header content matching DevToolsHeader patterns but single row for floating
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)", // Exact match with DevToolsHeader
    backgroundColor: "#171717",
  },

  // Main header row layout
  mainHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 32, // Ensure minimum height for buttons
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
  },

  // Breadcrumb navigation
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12, // Space after back button
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
    flex: 1, // Take available space when no back button
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

// Corner handle styles for custom resize handles
const cornerHandleStyles = StyleSheet.create({
  cornerHandle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10, // Perfect circle (width/height / 2)
    zIndex: 1000,
    // Invisible by default - no background or border
  },
  topLeft: {
    top: 4,
    left: 4,
  },
  topRight: {
    top: 4,
    right: 4,
  },
  bottomLeft: {
    bottom: 4,
    left: 4,
  },
  bottomRight: {
    bottom: 4,
    right: 4,
  },
  cornerHandleDragging: {
    backgroundColor: "rgba(34, 197, 94, 0.1)", // Same green as FloatingStatusBubble
    borderColor: "rgba(34, 197, 94, 1)", // Same green border as FloatingStatusBubble
    borderWidth: 2,
    // Add subtle shadow like the bubble
    shadowColor: "rgba(34, 197, 94, 0.6)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
