import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import {
  gameUIColors,
  dialColors,
  ChevronLeft,
  ChevronRight,
  safeGetItem,
  safeSetItem,
} from "@react-buoy/shared-ui";
import { useMinimizedTools, MinimizedTool } from "./MinimizedToolsContext";

// ============================================================================
// Constants
// ============================================================================

const ANIMATION_DURATION = 250;
const PEEK_WIDTH = 20; // Width of the half-circle peek (how much shows)
const PEEK_HEIGHT = 40; // Height of the half-circle peek
const TOOLBAR_WIDTH = 44; // Width of the expanded pill toolbar (thinner, icons only)
const TOOL_ITEM_SIZE = 32; // Size of each tool icon
const ICON_GAP = 6; // Gap between tool items
const TOOLBAR_PADDING = 8; // Padding inside the toolbar
const COLLAPSE_BUTTON_SIZE = 24; // Size of the collapse button
const BOTTOM_OFFSET = 280; // Distance from bottom (closer to center)
const RIGHT_MARGIN = 12; // Distance from right edge of screen

const STORAGE_KEY_EXPANDED = "@react_buoy_minimized_stack_expanded";

// ============================================================================
// Types
// ============================================================================

export interface MinimizedToolsStackProps {
  /** Callback when a tool should be restored */
  onRestore?: (tool: MinimizedTool) => void;
  /** Whether to push the stack to the side (when a modal is open) */
  pushToSide?: boolean;
}

// ============================================================================
// Half-Circle Peek Component (Collapsed State)
// ============================================================================

interface CollapsedPeekProps {
  count: number;
  onPress: () => void;
  progress: Animated.Value; // 0 = collapsed (peek visible), 1 = expanded (peek hidden)
}

function CollapsedPeek({ count, onPress, progress }: CollapsedPeekProps) {
  // When progress=0 (collapsed): peek is visible (translateX=0, opacity=1)
  // When progress=1 (expanded): peek is hidden (translateX=positive, opacity=0)
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PEEK_WIDTH + 20],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.5, 0],
  });

  return (
    <Animated.View
      style={[
        styles.peekContainer,
        {
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.peekButton}
        accessibilityLabel={`Show ${count} minimized tools`}
        accessibilityRole="button"
      >
        <ChevronLeft size={14} color={gameUIColors.muted} strokeWidth={2} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Expanded Pill Toolbar Component
// ============================================================================

interface ExpandedToolbarProps {
  tools: MinimizedTool[];
  onToolPress: (tool: MinimizedTool) => void;
  onCollapse: () => void;
  progress: Animated.Value; // 0 = collapsed (toolbar hidden), 1 = expanded (toolbar visible)
}

function ExpandedToolbar({
  tools,
  onToolPress,
  onCollapse,
  progress,
}: ExpandedToolbarProps) {
  // Breathing animation for the glow effect
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [breatheAnim]);

  // Interpolate breathing to subtle opacity change
  const breatheOpacity = breatheAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  // Calculate toolbar height based on number of tools (icons only, no labels)
  const toolbarHeight =
    TOOLBAR_PADDING * 2 +
    tools.length * TOOL_ITEM_SIZE +
    (tools.length - 1) * ICON_GAP +
    ICON_GAP +
    COLLAPSE_BUTTON_SIZE;

  // When progress=0 (collapsed): toolbar is hidden (translateX=positive, opacity=0)
  // When progress=1 (expanded): toolbar is visible (translateX=0, opacity=1)
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [TOOLBAR_WIDTH + RIGHT_MARGIN + 10, 0],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.toolbarContainer,
        {
          height: toolbarHeight,
          transform: [{ translateX }],
          opacity,
        },
      ]}
    >
      {/* Background gradient layers */}
      <Animated.View
        style={[
          styles.gradientLayer,
          styles.gradientLayer1,
          { opacity: breatheOpacity },
        ]}
      />
      <View style={[styles.gradientLayer, styles.gradientLayer2]} />
      <View style={[styles.gradientLayer, styles.gradientLayer3]} />

      {/* Tool Icons - compact, no labels */}
      {tools.map((tool) => (
        <TouchableOpacity
          key={tool.instanceId}
          onPress={() => onToolPress(tool)}
          activeOpacity={0.7}
          style={styles.toolButton}
          accessibilityLabel={`Restore ${tool.title}`}
          accessibilityRole="button"
        >
          {/* Icon only */}
          {tool.icon}
        </TouchableOpacity>
      ))}

      {/* Collapse Area - subtle bottom section */}
      <TouchableOpacity
        onPress={onCollapse}
        activeOpacity={0.6}
        style={styles.collapseArea}
        accessibilityLabel="Collapse minimized tools"
        accessibilityRole="button"
      >
        {/* Subtle divider line */}
        <View style={styles.collapseDivider} />
        {/* Small chevron pointing right (to hide) */}
        <ChevronRight size={12} color={gameUIColors.muted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function MinimizedToolsStack({
  onRestore,
  pushToSide = false,
}: MinimizedToolsStackProps) {
  const { minimizedTools, restore } = useMinimizedTools();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isStateRestored, setIsStateRestored] = useState(false);

  const { height: screenHeight } = Dimensions.get("window");

  // Calculate toolbar height
  const toolbarHeight =
    minimizedTools.length > 0
      ? TOOLBAR_PADDING * 2 +
        minimizedTools.length * TOOL_ITEM_SIZE +
        (minimizedTools.length - 1) * ICON_GAP +
        ICON_GAP +
        COLLAPSE_BUTTON_SIZE
      : PEEK_HEIGHT;

  // Fixed center point for the peek button (from bottom of screen)
  const peekCenterY = screenHeight - BOTTOM_OFFSET;

  // Peek button position (top of peek = center - half of peek height)
  const peekYPosition = peekCenterY - PEEK_HEIGHT / 2;

  // Toolbar position (top of toolbar = center - half of toolbar height)
  // This centers the toolbar vertically with the peek button
  const toolbarYPosition = peekCenterY - toolbarHeight / 2;

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
    Animated.spring(progress, {
      toValue: 1,
      tension: 65,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  // Collapse the toolbar (animate progress from 1 to 0)
  const handleCollapse = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Deferred state update after animation completes
      setTimeout(() => setIsExpanded(false), 0);
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

  // Handle pushToSide prop (hide everything when modal is open)
  // For now, we just keep the current state - pushToSide can be handled later
  // The main modal will cover this anyway

  // Don't render anything if no minimized tools
  if (minimizedTools.length === 0) {
    return null;
  }

  return (
    <>
      {/* Collapsed State - Half Circle Peek */}
      {/* Always rendered, animation handles visibility */}
      <View
        style={[styles.container, { top: peekYPosition }]}
        pointerEvents={isExpanded ? "none" : "box-none"}
      >
        <CollapsedPeek
          count={minimizedTools.length}
          onPress={handleExpand}
          progress={progress}
        />
      </View>

      {/* Expanded State - Pill Toolbar */}
      {/* Always rendered, animation handles visibility */}
      <View
        style={[styles.container, { top: toolbarYPosition }]}
        pointerEvents={isExpanded ? "box-none" : "none"}
      >
        <ExpandedToolbar
          tools={minimizedTools}
          onToolPress={handleToolPress}
          onCollapse={handleCollapse}
          progress={progress}
        />
      </View>
    </>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 0,
    zIndex: 999,
  },

  // ==================== Collapsed Peek Styles ====================
  peekContainer: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  peekButton: {
    width: PEEK_WIDTH,
    height: PEEK_HEIGHT,
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
    backgroundColor: "#1A1A1C", // Match floating menu bg (macOS card color)
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: gameUIColors.muted + "66",
    alignItems: "center",
    justifyContent: "center",
    // Subtle shadow matching floating tools
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Grip dots pattern - matching floating tools exactly
  peekGripContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  peekGripColumn: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  peekGripDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: gameUIColors.secondary + "CC",
  },

  // ==================== Expanded Toolbar Styles ====================
  toolbarContainer: {
    position: "absolute",
    right: RIGHT_MARGIN, // Float away from edge
    top: 0,
    width: TOOLBAR_WIDTH,
    backgroundColor: "#1A1A1C", // Match floating menu bg (macOS card color)
    borderRadius: TOOLBAR_WIDTH / 2, // Full pill shape
    borderWidth: 1,
    borderColor: gameUIColors.muted + "66", // Match floating menu border
    paddingVertical: TOOLBAR_PADDING,
    alignItems: "center",
    gap: ICON_GAP,
    overflow: "hidden", // Clip gradient layers to pill shape
    // Matching floating menu shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Gradient background layers - matching dial's layered depth
  gradientLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: TOOLBAR_WIDTH / 2,
  },
  gradientLayer1: {
    backgroundColor: dialColors.dialGradient1,
    opacity: 0.6,
  },
  gradientLayer2: {
    backgroundColor: dialColors.dialGradient2,
    opacity: 0.4,
    top: "20%",
    left: "10%",
    right: "10%",
  },
  gradientLayer3: {
    backgroundColor: dialColors.dialGradient3,
    opacity: 0.3,
    top: "40%",
    left: "20%",
    right: "20%",
  },
  // Tool button - compact icon only
  toolButton: {
    width: TOOL_ITEM_SIZE,
    height: TOOL_ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  // Collapse area - subtle integrated bottom section
  collapseArea: {
    width: TOOLBAR_WIDTH - 8,
    height: COLLAPSE_BUTTON_SIZE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ICON_GAP,
  },
  // Subtle divider line above collapse icon
  collapseDivider: {
    position: "absolute",
    top: 0,
    left: 4,
    right: 4,
    height: 1,
    backgroundColor: gameUIColors.muted + "33",
  },
});
