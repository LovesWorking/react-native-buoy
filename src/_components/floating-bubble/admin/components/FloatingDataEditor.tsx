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
import DragResizable from "../../../_shared/DragResizable";

import {
  Query,
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";

import {
  X,
  ArrowUpToLine,
  ArrowDownToLine,
  GripHorizontal,
  ChevronLeft,
  Database,
  Activity,
  Zap,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
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
const DEFAULT_HEIGHT = 500;
const DEFAULT_WIDTH = SCREEN_WIDTH - 40; // Leave 20px margin on each side
const HIT_SLOP = { top: 12, bottom: 12, left: 12, right: 12 };

// Project-consistent color system matching existing dev tools
const THEME_COLORS = {
  // Background colors matching project patterns
  background: {
    primary: "#171717", // Matches DevToolsHeader
    secondary: "#2A2A2A", // Matches ActionMenu containers
    glass: "rgba(42, 42, 42, 0.95)", // Slightly transparent version
  },
  // Status colors exactly matching existing components
  status: {
    success: "#10B981", // Green - matches all status components
    pending: "#F59E0B", // Yellow - matches warning states
    error: "#EF4444", // Red - matches error states
    stale: "#8B5CF6", // Purple - matches stale states
    fetching: "#3B82F6", // Blue - matches fetching states
    inactive: "#6B7280", // Gray - matches inactive states
  },
  // Text colors matching project standards
  text: {
    primary: "#FFFFFF",
    secondary: "#E5E7EB", // Matches ActionMenu text
    tertiary: "#9CA3AF", // Matches subtitle text
    disabled: "#6B7280", // Matches disabled states
    accent: "#0EA5E9", // Blue accent matching toggle buttons
  },
  // Border and surface patterns from existing components
  border: {
    subtle: "rgba(255, 255, 255, 0.06)", // Matches DevToolsHeader
    medium: "rgba(255, 255, 255, 0.1)", // Standard border
    strong: "rgba(255, 255, 255, 0.2)", // Drag indicator
  },
  surface: {
    subtle: "rgba(255, 255, 255, 0.02)", // Disabled states
    light: "rgba(255, 255, 255, 0.05)", // Hover states
    medium: "rgba(255, 255, 255, 0.1)", // Active states
  },
};

// Enhanced status color mapping - moved to module scope to prevent re-creation
const STATUS_COLOR_MAP: Record<string, string> = {
  blue: THEME_COLORS.status.fetching,
  gray: THEME_COLORS.status.inactive,
  purple: THEME_COLORS.status.stale,
  yellow: THEME_COLORS.status.pending,
  green: THEME_COLORS.status.success,
  red: THEME_COLORS.status.error,
};

// Stable callbacks moved to module scope to prevent re-renders
const RESIZE_HANDLERS: Array<
  "bottomLeft" | "bottomRight" | "topLeft" | "topRight"
> = ["bottomLeft", "bottomRight", "topLeft", "topRight"];

// Simplified status indicator without animations
const getStatusIcon = (query: Query<any, any, any, any>) => {
  const status = query.state.status;
  const isFetching = getQueryStatusLabel(query) === "fetching";

  if (isFetching)
    return <RefreshCw color={THEME_COLORS.status.fetching} size={16} />;
  if (status === "pending")
    return <Clock color={THEME_COLORS.status.pending} size={16} />;
  if (status === "error")
    return <AlertTriangle color={THEME_COLORS.status.error} size={16} />;
  if (status === "success")
    return <CheckCircle color={THEME_COLORS.status.success} size={16} />;
  return <Activity color={THEME_COLORS.status.inactive} size={16} />;
};

// Simplified breadcrumb without complex mapping
const getQueryBreadcrumb = (query: Query<any, any, any, any>) => {
  const queryKey = Array.isArray(query.queryKey)
    ? query.queryKey
    : [query.queryKey];
  return queryKey.join(" › ");
};

// Optimized QueryListItem component to prevent unnecessary re-renders
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

    const statusColorName = getQueryStatusColor({
      queryState: query.state,
      observerCount: query.getObserversCount(),
      isStale: query.isStale(),
    });

    const statusColor = STATUS_COLOR_MAP[statusColorName] || "#6B7280";

    // Use stable callback pattern
    const handlePress = useRef(() => {
      onQuerySelect(query);
    });

    // Update ref to latest query while keeping callback stable
    handlePress.current = () => {
      onQuerySelect(query);
    };

    return (
      <TouchableOpacity style={styles.queryItem} onPress={handlePress.current}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={styles.queryText} numberOfLines={1}>
          {displayName}
        </Text>
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
  const [isMinimized, setIsMinimized] = useState(false);
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

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
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
    <QueryClientProvider client={queryClient}>
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
          height={isMinimized ? 60 : panelDimensions.height}
          minWidth={MIN_WIDTH}
          minHeight={MIN_HEIGHT}
          isDraggable={true}
          isResizable={!isMinimized} // Disable resize when minimized
          resizeHandlers={RESIZE_HANDLERS}
          onDragEnd={handleDragEnd}
          onResizeEnd={handleResizeEnd}
          style={styles.dragResizableContainer}
        >
          <View
            style={[
              styles.panel,
              { height: isMinimized ? 60 : panelDimensions.height },
            ]}
          >
            <View style={styles.header}>
              <View style={styles.headerContent}>
                {selectedQuery && (
                  <Pressable
                    onPress={() => onQuerySelect(undefined)}
                    style={styles.backButton}
                    hitSlop={HIT_SLOP}
                  >
                    <ChevronLeft
                      color={THEME_COLORS.text.secondary}
                      size={20}
                    />
                  </Pressable>
                )}

                <View style={styles.titleSection}>
                  <View style={styles.titleRow}>
                    <View style={styles.titleWithIcon}>
                      {selectedQuery ? (
                        <>
                          <Zap color={THEME_COLORS.text.accent} size={16} />
                          <Text style={styles.title}>Data Editor</Text>
                        </>
                      ) : (
                        <>
                          <Server color={THEME_COLORS.text.accent} size={16} />
                          <Text style={styles.title}>Query Browser</Text>
                        </>
                      )}
                    </View>
                    {selectedQuery && (
                      <View style={styles.statusIndicator}>
                        {getStatusIcon(selectedQuery)}
                      </View>
                    )}
                  </View>

                  {selectedQuery ? (
                    <View style={styles.breadcrumbContainer}>
                      <Database color={THEME_COLORS.text.tertiary} size={14} />
                      <Text style={styles.breadcrumbSeparator}>›</Text>
                      <Text style={styles.breadcrumbItem} numberOfLines={1}>
                        {getQueryBreadcrumb(selectedQuery)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.statsRow}>
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {allQueries.length}
                        </Text>
                        <Text style={styles.statLabel}>
                          {allQueries.length === 1 ? "query" : "queries"}
                        </Text>
                      </View>
                      <View style={styles.statSeparator} />
                      <View style={styles.statItem}>
                        <Text style={styles.statNumber}>
                          {
                            allQueries.filter(
                              (q) => q.state.status === "success"
                            ).length
                          }
                        </Text>
                        <Text style={styles.statLabel}>active</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.controls}>
                  <Pressable
                    onPress={toggleMinimize}
                    style={[
                      styles.controlButton,
                      styles.controlButtonSecondary,
                    ]}
                    hitSlop={HIT_SLOP}
                  >
                    {isMinimized ? (
                      <ArrowUpToLine
                        color={THEME_COLORS.text.secondary}
                        size={16}
                      />
                    ) : (
                      <ArrowDownToLine
                        color={THEME_COLORS.text.secondary}
                        size={16}
                      />
                    )}
                  </Pressable>

                  <Pressable
                    onPress={onClose}
                    style={[styles.controlButton, styles.controlButtonDanger]}
                    hitSlop={HIT_SLOP}
                  >
                    <X color={THEME_COLORS.text.primary} size={16} />
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
                      allQueries.map((query, index) => (
                        <QueryListItem
                          key={`${query.queryHash}-${index}`}
                          query={query}
                          onQuerySelect={onQuerySelect}
                        />
                      ))
                    )}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
        </DragResizable>
      </View>
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

  // Style for the DragResizable wrapper
  dragResizableContainer: {
    backgroundColor: "transparent",
  },
  panel: {
    flex: 1,
    backgroundColor: THEME_COLORS.background.secondary, // #2A2A2A
    borderWidth: 1,
    borderColor: THEME_COLORS.border.medium,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
    shadowOffset: { width: 0, height: 4 },
    overflow: "hidden",
  },

  // Compact header matching DevToolsHeader
  header: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
    backgroundColor: THEME_COLORS.background.primary, // #171717
  },

  // Compact header content matching DevToolsHeader
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12, // Matches DevToolsHeader
    paddingVertical: 8, // Smaller padding for compact header
    borderBottomWidth: 1,
    borderBottomColor: THEME_COLORS.border.subtle,
    backgroundColor: THEME_COLORS.background.primary,
  },
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: THEME_COLORS.surface.light,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME_COLORS.border.medium,
    marginRight: 12,
  },

  // Compact title section
  titleSection: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: THEME_COLORS.text.primary,
    fontSize: 16, // Smaller title
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  // Compact status indicator
  statusIndicator: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: THEME_COLORS.surface.light,
    borderWidth: 1,
    borderColor: THEME_COLORS.border.medium,
  },

  // Breadcrumb navigation
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  breadcrumbItem: {
    color: THEME_COLORS.text.secondary,
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
    maxWidth: 120,
  },
  breadcrumbSeparator: {
    color: THEME_COLORS.text.tertiary,
    fontSize: 12,
    fontWeight: "400",
  },

  // Compact stats display
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
    color: THEME_COLORS.text.accent, // Blue accent like toggle buttons
    fontSize: 14,
    fontWeight: "600",
  },
  statLabel: {
    color: THEME_COLORS.text.tertiary,
    fontSize: 11,
    fontWeight: "500",
  },
  statSeparator: {
    width: 1,
    height: 12,
    backgroundColor: THEME_COLORS.border.medium,
  },

  // Compact control buttons matching DevToolsHeader
  controls: {
    flexDirection: "row",
    gap: 6,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: THEME_COLORS.surface.light,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME_COLORS.border.medium,
  },
  controlButtonSecondary: {
    backgroundColor: THEME_COLORS.surface.light,
  },
  controlButtonDanger: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: THEME_COLORS.background.secondary,
  },

  // Explorer section
  explorerScrollContainer: {
    flex: 1,
  },
  explorerScrollContent: {
    padding: 16,
    flexGrow: 1,
  },

  // Improved empty states
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    color: THEME_COLORS.text.primary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: THEME_COLORS.text.tertiary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Query list matching project patterns
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
    backgroundColor: THEME_COLORS.surface.light,
    borderWidth: 1,
    borderColor: THEME_COLORS.border.medium,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  queryText: {
    color: THEME_COLORS.text.secondary,
    fontSize: 14,
    flex: 1,
    fontFamily: "monospace",
    fontWeight: "400",
  },

  // Action footer matching project style
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: THEME_COLORS.border.subtle,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: THEME_COLORS.background.primary,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
});
