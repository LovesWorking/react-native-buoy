/**
 * NavigationStack - Visual representation of current navigation stack
 *
 * Shows all screens currently mounted in memory, which one is visible,
 * and provides controls to manipulate the stack.
 */

import { useState } from "react";
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
  Copy,
  copyToClipboard,
} from "@react-buoy/shared-ui";
import { useNavigationStack } from "../useNavigationStack";
import { useRouter } from "expo-router";

// ============================================================================
// Types
// ============================================================================

interface NavigationStackProps {
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
  const handleNavigate = (index: number) => {
    navigateToIndex(index);
  };

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

  const handleCopyStack = async () => {
    const stackData = stack.map((item) => ({
      pathname: item.pathname,
      name: item.name,
      params: item.params,
      isFocused: item.isFocused,
    }));

    const stackText = JSON.stringify(stackData, null, 2);
    const success = await copyToClipboard(stackText);

    if (!success) {
      Alert.alert("Error", "Failed to copy stack to clipboard");
    }
    return success;
  };

  const handleGoHome = () => {
    try {
      router.push("/");
    } catch (error) {
      Alert.alert("Navigation Error", String(error));
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Compact header with just copy button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.copyIconButton}
          onPress={handleCopyStack}
        >
          <Copy size={16} color={macOSColors.text.secondary} />
        </TouchableOpacity>
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
            <View key={`stack-${actualIndex}-${item.key}`} style={styles.stackItemWrapper}>
              {/* Compact Stack Item Card */}
              <View
                style={[
                  styles.stackItem,
                  item.isFocused && styles.stackItemFocused,
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
                      <View style={styles.paramsContainer}>
                        <Text style={styles.paramsLabel}>Parameters:</Text>
                        <Text style={styles.paramsText} numberOfLines={10}>
                          {JSON.stringify(item.params, null, 2)}
                        </Text>
                      </View>
                    )}

                    {/* Navigate Action */}
                    {!item.isFocused && (
                      <TouchableOpacity
                        style={styles.navigateButton}
                        onPress={() => handleNavigate(actualIndex)}
                      >
                        <Text style={styles.navigateButtonText}>
                          Navigate Here
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Compact action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, isAtRoot && styles.actionButtonDisabled]}
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

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleGoHome}
        >
          <Text style={styles.actionButtonText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isAtRoot && styles.actionButtonDisabled]}
          onPress={handlePopToTop}
          disabled={isAtRoot}
        >
          <Text
            style={[
              styles.actionButtonText,
              isAtRoot && styles.actionButtonTextDisabled,
            ]}
          >
            Root
          </Text>
        </TouchableOpacity>
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
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
    alignItems: "flex-end",
  },

  copyIconButton: {
    padding: 6,
    borderRadius: 4,
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

  stackItemFocused: {
    borderColor: macOSColors.semantic.success,
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

  paramsContainer: {
    marginTop: 4,
    marginBottom: 12,
  },

  paramsLabel: {
    fontSize: 10,
    color: macOSColors.text.secondary,
    fontFamily: "monospace",
    marginBottom: 4,
  },

  paramsText: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: "monospace",
    backgroundColor: macOSColors.background.input,
    padding: 8,
    borderRadius: 4,
  },

  navigateButton: {
    backgroundColor: macOSColors.semantic.info,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  navigateButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: macOSColors.background.base,
    fontFamily: "monospace",
  },

  actions: {
    flexDirection: "row",
    padding: 8,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },

  actionButton: {
    flex: 1,
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
});
