/**
 * NavigationStack - Visual representation of current navigation stack
 *
 * Shows all screens currently mounted in memory, which one is visible,
 * and provides controls to manipulate the stack.
 */

import { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import {
  macOSColors,
  ChevronDown,
  ChevronRight,
  Info,
  InlineCopyButton,
} from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
import { useNavigationStack } from "../useNavigationStack";
import { useRouter } from "expo-router";

// ============================================================================
// Types
// ============================================================================

export interface NavigationStackProps {
  style?: any;
}

// ============================================================================
// Main Component
// ============================================================================

export function NavigationStack({ style }: NavigationStackProps) {
  const {
    stack,
    focusedRoute,
    stackDepth,
    isAtRoot,
    isLoaded,
    error,
    navigateToIndex,
    goBack,
    popToTop,
  } = useNavigationStack();

  const router = useRouter();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  // ✅ All hooks must be called BEFORE any conditional returns
  // Prepare stack data for copying
  const stackDataForCopy = useMemo(() => {
    const stackData = stack.map((item) => ({
      pathname: item.pathname,
      name: item.name,
      params: item.params,
      isFocused: item.isFocused,
    }));
    return JSON.stringify(stackData, null, 2);
  }, [stack]);

  // Determine which route actions should operate on
  // If a stack item is expanded, actions target that route
  // Otherwise, actions target the focused (visible) route
  const selectedRoute = useMemo(() => {
    if (expandedIndex !== null && stack[expandedIndex]) {
      return stack[expandedIndex];
    }
    return focusedRoute;
  }, [expandedIndex, stack, focusedRoute]);

  const isNonFocusedSelected = useMemo(() => {
    return (
      expandedIndex !== null &&
      stack[expandedIndex] &&
      !stack[expandedIndex].isFocused
    );
  }, [expandedIndex, stack]);

  // Loading state
  if (!isLoaded) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading navigation stack...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading stack</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (stack.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No navigation stack</Text>
          <Text style={styles.emptySubtext}>
            Navigate to a route to see the stack
          </Text>
        </View>
      </View>
    );
  }

  // Handlers
  const handleGoBack = () => {
    if (isAtRoot) {
      Alert.alert("Cannot Go Back", "Already at the root of the stack");
      return;
    }
    goBack();
  };

  const handlePopToTop = () => {
    if (isAtRoot) {
      Alert.alert("Already at Top", "Stack only has one screen");
      return;
    }

    Alert.alert(
      "Pop to Top",
      "This will remove all screens except the root screen.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Pop to Top", style: "destructive", onPress: popToTop },
      ]
    );
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleGo = () => {
    if (!selectedRoute) return;

    // If the selected route is already focused, do nothing
    if (selectedRoute.isFocused) {
      Alert.alert("Already There", "This route is already visible");
      return;
    }

    // Navigate to the selected route
    navigateToIndex(selectedRoute.index);
  };

  const handlePopTo = () => {
    if (!selectedRoute) return;

    // If selected route is the focused one, we can't pop to it
    if (selectedRoute.isFocused) {
      Alert.alert("Cannot Pop", "Selected route is already visible");
      return;
    }

    // If selected route is at the top of stack, nothing to pop
    if (selectedRoute.index === stackDepth - 1) {
      Alert.alert("Cannot Pop", "No screens above selected route");
      return;
    }

    const screensToRemove = stackDepth - 1 - selectedRoute.index;

    Alert.alert(
      "Pop to Route",
      `Remove ${screensToRemove} screen${
        screensToRemove !== 1 ? "s" : ""
      } above ${selectedRoute.pathname}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Pop",
          style: "destructive",
          onPress: () => {
            // Navigate to the selected route, which effectively pops everything above it
            navigateToIndex(selectedRoute.index);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Compact header with copy and info buttons */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.iconButton, showHelp && styles.iconButtonActive]}
          onPress={() => setShowHelp(!showHelp)}
        >
          <Info
            size={16}
            color={
              showHelp ? macOSColors.semantic.info : macOSColors.text.secondary
            }
          />
        </TouchableOpacity>
        <InlineCopyButton
          value={stackDataForCopy}
          buttonStyle={styles.iconButton}
        />
      </View>

      {/* Stack visualization */}
      <ScrollView
        style={styles.stackScroll}
        contentContainerStyle={styles.stackContent}
      >
        {/* Render in reverse order (top of stack first) */}
        {[...stack].reverse().map((item, reverseIndex) => {
          const actualIndex = stack.length - 1 - reverseIndex;
          const isExpanded = expandedIndex === actualIndex;
          const hasParams = Object.keys(item.params).length > 0;

          return (
            <View
              key={`stack-${actualIndex}-${item.key}`}
              style={styles.stackItemWrapper}
            >
              {/* Compact Stack Item Card */}
              <View
                style={[
                  styles.stackItem,
                  isExpanded && styles.stackItemSelected,
                ]}
              >
                {/* Compact Header - Always Visible */}
                <TouchableOpacity
                  style={styles.stackItemHeader}
                  onPress={() => toggleExpand(actualIndex)}
                  activeOpacity={0.7}
                >
                  {/* Expand/Collapse Indicator */}
                  <View style={styles.expandIndicator}>
                    {isExpanded ? (
                      <ChevronDown
                        size={14}
                        color={macOSColors.text.secondary}
                      />
                    ) : (
                      <ChevronRight
                        size={14}
                        color={macOSColors.text.secondary}
                      />
                    )}
                  </View>

                  {/* Route Path */}
                  <Text style={styles.stackItemPath} numberOfLines={1}>
                    {item.pathname}
                  </Text>

                  {/* Copy Route Button */}
                  <InlineCopyButton
                    value={item.pathname}
                    buttonStyle={styles.copyRouteButton}
                  />

                  {/* Status Badge */}
                  {item.isFocused ? (
                    <View style={styles.focusedBadge}>
                      <Text style={styles.focusedBadgeText}>VISIBLE</Text>
                    </View>
                  ) : (
                    <View style={styles.memoryBadge}>
                      <Text style={styles.memoryBadgeText}>MEMORY</Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Expanded Details */}
                {isExpanded && (
                  <View style={styles.expandedContent}>
                    {/* Route Details */}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Route Name:</Text>
                      <Text style={styles.detailValue}>{item.name}</Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Position:</Text>
                      <Text style={styles.detailValue}>
                        {actualIndex} / {stackDepth - 1}
                      </Text>
                    </View>

                    {/* Params display */}
                    {hasParams && (
                      <View style={styles.dataViewerContainer}>
                        <DataViewer
                          title="Parameters"
                          data={item.params}
                          showTypeFilter={false}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Navigation action buttons */}
      <View style={styles.actionsContainer}>
        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <View style={styles.actionWrapper}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isAtRoot && styles.actionButtonDisabled,
              ]}
              onPress={handleGoBack}
              disabled={isAtRoot}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  isAtRoot && styles.actionButtonTextDisabled,
                ]}
              >
                Back
              </Text>
            </TouchableOpacity>
            {showHelp && (
              <Text style={styles.helpText}>Go back one screen</Text>
            )}
          </View>

          <View style={styles.actionWrapper}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                selectedRoute?.isFocused && styles.actionButtonDisabled,
              ]}
              onPress={handleGo}
              disabled={selectedRoute?.isFocused}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  selectedRoute?.isFocused && styles.actionButtonTextDisabled,
                ]}
              >
                Go
              </Text>
            </TouchableOpacity>
            {showHelp && (
              <Text style={styles.helpText}>Navigate to selected route</Text>
            )}
          </View>

          <View style={styles.actionWrapper}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                (selectedRoute?.isFocused ||
                  selectedRoute?.index === stackDepth - 1) &&
                  styles.actionButtonDisabled,
              ]}
              onPress={handlePopTo}
              disabled={
                selectedRoute?.isFocused ||
                selectedRoute?.index === stackDepth - 1
              }
            >
              <Text
                style={[
                  styles.actionButtonText,
                  (selectedRoute?.isFocused ||
                    selectedRoute?.index === stackDepth - 1) &&
                    styles.actionButtonTextDisabled,
                ]}
              >
                Pop To
              </Text>
            </TouchableOpacity>
            {showHelp && (
              <Text style={styles.helpText}>Remove screens above selected</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  loadingText: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: "monospace",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  errorText: {
    color: macOSColors.semantic.error,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "monospace",
    marginBottom: 8,
  },

  errorDetail: {
    color: macOSColors.text.secondary,
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },

  emptyText: {
    color: macOSColors.text.primary,
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "monospace",
    marginBottom: 8,
  },

  emptySubtext: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  iconButton: {
    padding: 6,
    borderRadius: 4,
  },

  iconButtonActive: {
    backgroundColor: macOSColors.background.input,
  },

  stackScroll: {
    flex: 1,
  },

  stackContent: {
    padding: 8,
  },

  stackItemWrapper: {
    marginBottom: 6,
  },

  stackItem: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    overflow: "hidden",
  },

  stackItemSelected: {
    borderColor: macOSColors.semantic.info,
    borderWidth: 2,
  },

  stackItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 8,
  },

  expandIndicator: {
    width: 20,
    alignItems: "center",
  },

  stackItemPath: {
    fontSize: 13,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    flex: 1,
  },

  copyRouteButton: {
    padding: 4,
    marginLeft: 4,
  },

  focusedBadge: {
    backgroundColor: macOSColors.semantic.success,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },

  focusedBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: macOSColors.background.base,
    fontFamily: "monospace",
  },

  memoryBadge: {
    backgroundColor: macOSColors.background.input,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },

  memoryBadgeText: {
    fontSize: 9,
    fontWeight: "600",
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
  },

  expandedContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },

  detailRow: {
    marginBottom: 8,
  },

  detailLabel: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginBottom: 2,
  },

  detailValue: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },

  dataViewerContainer: {
    marginTop: 4,
    marginHorizontal: -12,
    marginBottom: 8,
  },

  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },

  actionsRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },

  actionWrapper: {
    flex: 1,
  },

  actionButton: {
    backgroundColor: macOSColors.background.input,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: "center",
  },

  actionButtonDisabled: {
    opacity: 0.5,
  },

  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.text.primary,
    fontFamily: "monospace",
  },

  actionButtonTextDisabled: {
    color: macOSColors.text.muted,
  },

  helpText: {
    fontSize: 9,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 12,
  },
});
