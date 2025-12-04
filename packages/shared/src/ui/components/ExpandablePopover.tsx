import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { ChevronUp } from "../../icons";
import { gameUIColors } from "../gameUI/constants/gameUIColors";

// ============================================================================
// Types
// ============================================================================

export interface ExpandablePopoverProps {
  /** Whether there are items to show (controls visibility of the whole component) */
  hasItems: boolean;
  /** Number of items to show in the collapsed peek badge (optional) */
  itemCount?: number;
  /** Whether to show the count badge in collapsed state */
  showCount?: boolean;
  /** Width of the popover */
  width?: number;
  /** Content to render when expanded */
  children: React.ReactNode;
  /** Height of the expanded content (required for animation) */
  expandedHeight: number;
  /** Callback when expansion state changes */
  onExpandedChange?: (isExpanded: boolean) => void;
  /** Initial expanded state */
  defaultExpanded?: boolean;
  /** Custom collapsed peek content (replaces default chevron + count) */
  collapsedContent?: React.ReactNode;
  /** Custom label for the collapsed peek button */
  collapsedLabel?: string;
  /** Style for the expanded container */
  expandedStyle?: StyleProp<ViewStyle>;
  /** Whether to persist expanded state (requires storageKey) */
  persistState?: boolean;
  /** Storage key for persisting expanded state */
  storageKey?: string;
  /** Height of the collapsed peek tab */
  peekHeight?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_PEEK_HEIGHT = 28;
const DEFAULT_WIDTH = 44;

// ============================================================================
// Collapsed Peek Component
// ============================================================================

interface CollapsedPeekProps {
  count?: number;
  showCount: boolean;
  onPress: () => void;
  progress: Animated.Value;
  width: number;
  height: number;
  customContent?: React.ReactNode;
  label?: string;
}

function CollapsedPeek({
  count,
  showCount,
  onPress,
  progress,
  width,
  height,
  customContent,
  label,
}: CollapsedPeekProps) {
  // When progress=0 (collapsed): peek is visible (opacity=1, scale=1)
  // When progress=1 (expanded): peek is hidden (opacity=0, scale=0.9)
  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.9],
  });

  return (
    <Animated.View
      style={[
        styles.peekContainer,
        {
          width,
          opacity,
          transform: [{ scale }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[styles.peekButton, { width, height }]}
        accessibilityLabel={label || `Expand options`}
        accessibilityRole="button"
      >
        {customContent || (
          <>
            <ChevronUp size={12} color={gameUIColors.muted} strokeWidth={2} />
            {showCount && count !== undefined && count > 1 && (
              <Text style={styles.peekCount}>{count}</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Expanded Content Wrapper
// ============================================================================

interface ExpandedWrapperProps {
  children: React.ReactNode;
  onCollapse: () => void;
  progress: Animated.Value;
  width: number;
  expandedHeight: number;
  isExpanded: boolean;
  style?: StyleProp<ViewStyle>;
}

function ExpandedWrapper({
  children,
  onCollapse,
  progress,
  width,
  expandedHeight,
  isExpanded,
  style,
}: ExpandedWrapperProps) {
  // Animate height from 0 to full height
  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedHeight],
  });

  return (
    <Animated.View
      style={[
        styles.expandedContainer,
        {
          width,
          height: animatedHeight,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <View style={[styles.expandedInner, { height: expandedHeight }]}>
        {/* Only render children when expanded to prevent unnecessary renders */}
        {isExpanded && children}

        {/* Collapse button at bottom */}
        <TouchableOpacity
          onPress={onCollapse}
          activeOpacity={0.6}
          style={styles.collapseButton}
          accessibilityLabel="Collapse"
          accessibilityRole="button"
        >
          <ChevronUp
            size={12}
            color={gameUIColors.muted}
            style={{ transform: [{ rotate: "180deg" }] }}
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ExpandablePopover({
  hasItems,
  itemCount,
  showCount = true,
  width = DEFAULT_WIDTH,
  children,
  expandedHeight,
  onExpandedChange,
  defaultExpanded = false,
  collapsedContent,
  collapsedLabel,
  expandedStyle,
  persistState = false,
  storageKey,
  peekHeight = DEFAULT_PEEK_HEIGHT,
}: ExpandablePopoverProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isStateRestored, setIsStateRestored] = useState(!persistState);

  const progress = useRef(new Animated.Value(defaultExpanded ? 1 : 0)).current;
  const hasInitialized = useRef(false);

  // Restore expanded state on mount if persistence is enabled
  useEffect(() => {
    if (!persistState || !storageKey) {
      setIsStateRestored(true);
      return;
    }

    const restoreState = async () => {
      try {
        // Dynamic import to avoid circular dependency
        const { safeGetItem } = await import("../../utils/safeAsyncStorage");
        const saved = await safeGetItem(storageKey);
        if (saved === "true") {
          setIsExpanded(true);
          progress.setValue(1);
        }
      } catch {
        // Ignore errors
      }
      setIsStateRestored(true);
    };
    restoreState();
  }, [persistState, storageKey, progress]);

  // Persist expanded state when it changes
  useEffect(() => {
    if (!persistState || !storageKey || !isStateRestored) return;

    const persistExpanded = async () => {
      try {
        const { safeSetItem } = await import("../../utils/safeAsyncStorage");
        await safeSetItem(storageKey, isExpanded ? "true" : "false");
      } catch {
        // Ignore errors
      }
    };
    persistExpanded();
  }, [isExpanded, persistState, storageKey, isStateRestored]);

  // Notify parent of expansion state changes
  useEffect(() => {
    onExpandedChange?.(isExpanded);
  }, [isExpanded, onExpandedChange]);

  // Expand handler
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Collapse handler
  const handleCollapse = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsExpanded(false);
    });
  }, [progress]);

  // Initialize animation when items first appear
  useEffect(() => {
    if (!isStateRestored) return;

    if (hasItems && !hasInitialized.current) {
      hasInitialized.current = true;
      if (isExpanded) {
        progress.setValue(1);
      } else {
        progress.setValue(0);
      }
    } else if (!hasItems) {
      hasInitialized.current = false;
      setIsExpanded(false);
      progress.setValue(0);
    }
  }, [hasItems, progress, isStateRestored, isExpanded]);

  // Don't render if no items
  if (!hasItems) {
    return null;
  }

  return (
    <View style={[styles.container, { height: peekHeight }]}>
      {/* Expanded content - positioned so bottom aligns with container */}
      <View
        style={styles.expandedWrapper}
        pointerEvents={isExpanded ? "box-none" : "none"}
      >
        <ExpandedWrapper
          onCollapse={handleCollapse}
          progress={progress}
          width={width}
          expandedHeight={expandedHeight}
          isExpanded={isExpanded}
          style={expandedStyle}
        >
          {children}
        </ExpandedWrapper>
      </View>

      {/* Collapsed peek tab */}
      <View
        style={styles.peekWrapper}
        pointerEvents={isExpanded ? "none" : "box-none"}
      >
        <CollapsedPeek
          count={itemCount}
          showCount={showCount}
          onPress={handleExpand}
          progress={progress}
          width={width}
          height={peekHeight}
          customContent={collapsedContent}
          label={collapsedLabel}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    overflow: "visible",
    zIndex: 1000,
  },
  expandedWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "visible",
  },
  peekWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  peekContainer: {},
  peekButton: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: gameUIColors.panel,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: gameUIColors.muted + "66",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  peekCount: {
    fontSize: 9,
    fontWeight: "600",
    color: gameUIColors.muted,
    marginLeft: 1,
  },
  expandedContainer: {
    backgroundColor: gameUIColors.panel,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: gameUIColors.muted + "66",
  },
  expandedInner: {
    alignItems: "center",
    paddingTop: 8,
    gap: 6,
  },
  collapseButton: {
    width: "100%",
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 3,
  },
});
