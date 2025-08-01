import React, { useRef, useState, useEffect } from "react";
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
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MIN_HEIGHT = 150;
const DEFAULT_HEIGHT = 500;
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

// Enhanced status color mapping
const STATUS_COLOR_MAP: Record<string, string> = {
  blue: THEME_COLORS.status.fetching,
  gray: THEME_COLORS.status.inactive,
  purple: THEME_COLORS.status.stale,
  yellow: THEME_COLORS.status.pending,
  green: THEME_COLORS.status.success,
  red: THEME_COLORS.status.error,
};

// Helper component for animated status indicator
const StatusIndicator = ({ query }: { query: Query<any, any, any, any> }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const status = query.state.status;
  const isFetching = getQueryStatusLabel(query) === "fetching";

  useEffect(() => {
    if (isFetching || status === "pending") {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isFetching, status, pulseAnim]);

  const getStatusIcon = () => {
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

  return (
    <Animated.View style={[styles.statusIndicator, { opacity: pulseAnim }]}>
      {getStatusIcon()}
    </Animated.View>
  );
};

// Enhanced breadcrumb component
const QueryBreadcrumb = ({ query }: { query: Query<any, any, any, any> }) => {
  const queryKey = Array.isArray(query.queryKey)
    ? query.queryKey
    : [query.queryKey];

  return (
    <View style={styles.breadcrumbContainer}>
      <Database color={THEME_COLORS.text.tertiary} size={14} />
      <Text style={styles.breadcrumbSeparator}>›</Text>
      {queryKey.map((key, index) => (
        <React.Fragment key={index}>
          <Text style={styles.breadcrumbItem} numberOfLines={1}>
            {String(key)}
          </Text>
          {index < queryKey.length - 1 && (
            <Text style={styles.breadcrumbSeparator}>›</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
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
                  <View style={styles.resizeGrip} />
                </View>
              )}

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
                    {selectedQuery && <StatusIndicator query={selectedQuery} />}
                  </View>

                  {selectedQuery ? (
                    <QueryBreadcrumb query={selectedQuery} />
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
                    onPress={toggleModalPosition}
                    style={[
                      styles.controlButton,
                      styles.controlButtonSecondary,
                    ]}
                    hitSlop={HIT_SLOP}
                  >
                    {isTopMode ? (
                      <ArrowDownToLine
                        color={THEME_COLORS.text.secondary}
                        size={16}
                      />
                    ) : (
                      <ArrowUpToLine
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
  // Base overlay without background - allows app interaction
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent", // No background overlay for dev tool usage
  },
  overlayTop: {
    justifyContent: "flex-start",
  },
  panel: {
    backgroundColor: THEME_COLORS.background.secondary, // #2A2A2A
    borderWidth: 1,
    borderColor: THEME_COLORS.border.medium,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  panelBottom: {
    borderTopLeftRadius: 14, // Matches ActionMenu radius
    borderTopRightRadius: 14,
    borderBottomWidth: 0,
    shadowOffset: { width: 0, height: -4 },
  },
  panelTop: {
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopWidth: 0,
    shadowOffset: { width: 0, height: 4 },
  },

  // Compact header matching DevToolsHeader
  header: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
    backgroundColor: THEME_COLORS.background.primary, // #171717
  },
  resizeHandle: {
    height: 16, // Smaller like DevToolsHeader drag indicator
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME_COLORS.surface.light,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  resizeGrip: {
    width: 32,
    height: 3,
    backgroundColor: THEME_COLORS.border.strong, // Matches drag indicator
    borderRadius: 1.5,
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
