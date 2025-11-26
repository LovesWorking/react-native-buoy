import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Easing,
} from "react-native";
import {
  gameUIColors,
  ChevronUp,
  safeGetItem,
  safeSetItem,
} from "@react-buoy/shared-ui";
import { useMinimizedTools, MinimizedTool } from "./MinimizedToolsContext";

// ============================================================================
// Constants
// ============================================================================

const PEEK_HEIGHT = 28; // Height of the collapsed peek tab
const TOOLBAR_WIDTH = 44; // Width of the toolbar (matches floating menu style)
const TOOL_ITEM_SIZE = 32; // Size of each tool icon
const ICON_GAP = 6; // Gap between tool items
const TOOLBAR_PADDING = 8; // Padding inside the toolbar
const COLLAPSE_BUTTON_SIZE = 24; // Size of the collapse button

const STORAGE_KEY_EXPANDED = "@react_buoy_minimized_stack_expanded";

// Glitch effect constants
const GLITCH_DURATION_MS = 80; // Quick glitch animation
const MIN_GLITCH_DELAY = 2000; // Minimum delay between glitches (2s)
const MAX_GLITCH_DELAY = 6000; // Maximum delay between glitches (6s)

// ============================================================================
// Glitch Tool Button Component
// ============================================================================

interface GlitchToolButtonProps {
  tool: MinimizedTool;
  onPress: (tool: MinimizedTool) => void;
  index: number;
}

function GlitchToolButton({ tool, onPress, index }: GlitchToolButtonProps) {
  const glitchX = useRef(new Animated.Value(0)).current;
  const glitchOpacity = useRef(new Animated.Value(1)).current;
  const glitchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let isMounted = true;

    const runGlitch = () => {
      if (!isMounted) return;

      const d = GLITCH_DURATION_MS;

      // Run glitch animations in parallel
      Animated.parallel([
        // X displacement - quick shake
        Animated.sequence([
          Animated.timing(glitchX, {
            toValue: 3,
            duration: d * 0.2,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: -3,
            duration: d * 0.2,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 2,
            duration: d * 0.2,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: -1,
            duration: d * 0.2,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(glitchX, {
            toValue: 0,
            duration: d * 0.2,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
        // Opacity flicker
        Animated.sequence([
          Animated.timing(glitchOpacity, {
            toValue: 0.4,
            duration: d * 0.25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 1,
            duration: d * 0.25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 0.6,
            duration: d * 0.25,
            useNativeDriver: true,
          }),
          Animated.timing(glitchOpacity, {
            toValue: 1,
            duration: d * 0.25,
            useNativeDriver: true,
          }),
        ]),
        // Scale pulse
        Animated.sequence([
          Animated.timing(glitchScale, {
            toValue: 1.1,
            duration: d * 0.3,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 0.95,
            duration: d * 0.4,
            useNativeDriver: true,
          }),
          Animated.timing(glitchScale, {
            toValue: 1,
            duration: d * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    const scheduleNextGlitch = () => {
      if (!isMounted) return;

      // Random delay with stagger based on index
      const delay =
        MIN_GLITCH_DELAY +
        Math.random() * (MAX_GLITCH_DELAY - MIN_GLITCH_DELAY) +
        index * 300;

      setTimeout(() => {
        if (isMounted) {
          runGlitch();
          scheduleNextGlitch();
        }
      }, delay);
    };

    // Initial delay before first glitch (staggered by index)
    const initialDelay = 500 + Math.random() * 1500 + index * 200;
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        runGlitch();
        scheduleNextGlitch();
      }
    }, initialDelay);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [glitchX, glitchOpacity, glitchScale, index]);

  return (
    <TouchableOpacity
      onPress={() => onPress(tool)}
      activeOpacity={0.7}
      style={styles.toolButton}
      accessibilityLabel={`Restore ${tool.title}`}
      accessibilityRole="button"
    >
      <Animated.View
        style={{
          opacity: glitchOpacity,
          transform: [{ translateX: glitchX }, { scale: glitchScale }],
        }}
      >
        {tool.icon}
      </Animated.View>
    </TouchableOpacity>
  );
}

// ============================================================================
// Types
// ============================================================================

export interface MinimizedToolsStackProps {
  /** Callback when a tool should be restored */
  onRestore?: (tool: MinimizedTool) => void;
  /** Width of the parent container (for matching widths) */
  containerWidth?: number;
}

// ============================================================================
// Collapsed Peek Tab Component (shows at top of floating menu)
// ============================================================================

interface CollapsedPeekProps {
  count: number;
  onPress: () => void;
  progress: Animated.Value; // 0 = collapsed (peek visible), 1 = expanded (peek hidden)
  width: number;
}

function CollapsedPeek({ count, onPress, progress, width }: CollapsedPeekProps) {
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
        style={[styles.peekButton, { width }]}
        accessibilityLabel={`Show ${count} minimized tools`}
        accessibilityRole="button"
      >
        {/* Chevron points UP to indicate expansion direction */}
        <ChevronUp size={12} color={gameUIColors.muted} strokeWidth={2} />
        {count > 1 && (
          <Text style={styles.peekCount}>{count}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Expanded Toolbar Component (expands upward from the peek tab)
// ============================================================================

interface ExpandedToolbarProps {
  tools: MinimizedTool[];
  onToolPress: (tool: MinimizedTool) => void;
  onCollapse: () => void;
  progress: Animated.Value; // 0 = collapsed (toolbar hidden), 1 = expanded (toolbar visible)
  width: number;
}

function ExpandedToolbar({
  tools,
  onToolPress,
  onCollapse,
  progress,
  width,
}: ExpandedToolbarProps) {
  // Calculate toolbar height based on number of tools
  // Layout from top to bottom: tool icons, then collapse button at bottom
  const toolbarHeight =
    TOOLBAR_PADDING +
    tools.length * TOOL_ITEM_SIZE +
    (tools.length - 1) * ICON_GAP +
    ICON_GAP + // Gap before collapse button
    COLLAPSE_BUTTON_SIZE +
    4; // Small bottom padding

  // Animate height from 0 to full height (shrink/grow effect)
  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, toolbarHeight],
  });

  return (
    <Animated.View
      style={[
        styles.toolbarContainer,
        {
          width,
          height: animatedHeight,
          overflow: "hidden", // Clip content as height shrinks
        },
      ]}
    >
      {/* Inner container to keep content positioned from top */}
      <View style={[styles.toolbarInner, { height: toolbarHeight }]}>
        {/* Tool Icons - in reverse order so newest appears at top */}
        {[...tools].reverse().map((tool, index) => (
          <GlitchToolButton
            key={tool.instanceId}
            tool={tool}
            onPress={onToolPress}
            index={index}
          />
        ))}

        {/* Collapse button at bottom (chevron down to indicate collapse) */}
        <TouchableOpacity
          onPress={onCollapse}
          activeOpacity={0.6}
          style={styles.collapseButton}
          accessibilityLabel="Collapse minimized tools"
          accessibilityRole="button"
        >
          <ChevronUp size={12} color={gameUIColors.muted} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MinimizedToolsStack({
  onRestore,
  containerWidth = TOOLBAR_WIDTH,
}: MinimizedToolsStackProps) {
  const { minimizedTools, restore } = useMinimizedTools();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStateRestored, setIsStateRestored] = useState(false);

  // Use provided container width or default
  const width = containerWidth;

  // Single progress value: 0 = collapsed (peek visible), 1 = expanded (toolbar visible)
  const progress = useRef(new Animated.Value(0)).current;
  const hasInitialized = useRef(false);

  // Restore expanded state on mount
  useEffect(() => {
    const restoreExpandedState = async () => {
      try {
        const saved = await safeGetItem(STORAGE_KEY_EXPANDED);
        if (saved === "true") {
          setIsExpanded(true);
        }
      } catch {
        // Ignore errors
      }
      setIsStateRestored(true);
    };
    restoreExpandedState();
  }, []);

  // Persist expanded state when it changes
  useEffect(() => {
    if (!isStateRestored) return;
    safeSetItem(STORAGE_KEY_EXPANDED, isExpanded ? "true" : "false");
  }, [isExpanded, isStateRestored]);

  // Handle tool press (restore)
  const handleToolPress = useCallback(
    (tool: MinimizedTool) => {
      const restored = restore(tool.instanceId);
      if (restored && onRestore) {
        onRestore(restored);
      }
    },
    [restore, onRestore]
  );

  // Expand the toolbar (animate progress from 0 to 1)
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    Animated.timing(progress, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false, // Height animation requires JS driver
    }).start();
  }, [progress]);

  // Collapse the toolbar (animate progress from 1 to 0)
  const handleCollapse = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false, // Height animation requires JS driver
    }).start(() => {
      setIsExpanded(false);
    });
  }, [progress]);

  // Initialize animation when tools first appear
  useEffect(() => {
    // Wait for state to be restored before initializing
    if (!isStateRestored) return;

    if (minimizedTools.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      // Respect restored expanded state
      if (isExpanded) {
        // Show toolbar directly (no animation on restore)
        progress.setValue(1);
      } else {
        // Start collapsed (peek visible)
        progress.setValue(0);
      }
    } else if (minimizedTools.length === 0) {
      // Reset when all tools are restored
      hasInitialized.current = false;
      setIsExpanded(false);
      progress.setValue(0);
    }
  }, [minimizedTools.length, progress, isStateRestored, isExpanded]);

  // Don't render anything if no minimized tools
  if (minimizedTools.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, { height: PEEK_HEIGHT }]}>
      {/* Expanded State - Toolbar that expands upward from bottom of container */}
      <View
        style={styles.expandedWrapper}
        pointerEvents={isExpanded ? "box-none" : "none"}
      >
        <ExpandedToolbar
          tools={minimizedTools}
          onToolPress={handleToolPress}
          onCollapse={handleCollapse}
          progress={progress}
          width={width}
        />
      </View>

      {/* Collapsed State - Peek tab (always rendered, animation handles visibility) */}
      <View
        style={styles.peekWrapper}
        pointerEvents={isExpanded ? "none" : "box-none"}
      >
        <CollapsedPeek
          count={minimizedTools.length}
          onPress={handleExpand}
          progress={progress}
          width={width}
        />
      </View>
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Main container - positioned relative, overflow visible for upward expansion
  container: {
    overflow: "visible",
    zIndex: 1000,
  },

  // Wrapper for expanded toolbar - positioned so bottom aligns with container bottom
  // This way the toolbar connects directly to the grabber when expanded
  expandedWrapper: {
    position: "absolute",
    bottom: 0, // Align bottom with container (connects to grabber)
    left: 0,
    right: 0,
    overflow: "visible",
  },

  // Wrapper for peek tab - fills container
  peekWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // ==================== Collapsed Peek Styles ====================
  // Matches the floating menu's container styling exactly
  peekContainer: {
    // Relative positioning within the container
  },
  peekButton: {
    height: PEEK_HEIGHT,
    // Match floating menu border radius (6) on top corners only
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    // Match floating menu container background (dark)
    backgroundColor: gameUIColors.panel,
    // Only border on top and sides, none on bottom to seamlessly connect
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

  // ==================== Expanded Toolbar Styles ====================
  toolbarContainer: {
    // Match floating menu container background (dark)
    backgroundColor: gameUIColors.panel,
    // Rounded corners on top only, bottom connects seamlessly
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    // Only border on top and sides - bottom connects seamlessly
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
    borderColor: gameUIColors.muted + "66",
  },
  // Inner container for toolbar content
  toolbarInner: {
    alignItems: "center",
    paddingTop: TOOLBAR_PADDING,
    gap: ICON_GAP,
  },
  // Tool button - compact icon only
  toolButton: {
    width: TOOL_ITEM_SIZE,
    height: TOOL_ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  // Collapse button at bottom of expanded toolbar
  collapseButton: {
    width: "100%",
    height: COLLAPSE_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ICON_GAP / 2,
  },
});
