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
const BOTTOM_OFFSET = 140; // Distance from bottom
const RIGHT_MARGIN = 12; // Distance from right edge of screen

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
  animatedValue: Animated.Value;
}

function CollapsedPeek({ count, onPress, animatedValue }: CollapsedPeekProps) {
  // Animate from off-screen (positive = right/hidden) to visible (0)
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PEEK_WIDTH + 20], // 0 = visible, 1 = hidden off right
  });

  return (
    <Animated.View
      style={[
        styles.peekContainer,
        {
          transform: [{ translateX }],
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
  animatedValue: Animated.Value;
}

function ExpandedToolbar({
  tools,
  onToolPress,
  onCollapse,
  animatedValue,
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

  // Animate from off-screen (positive = right/hidden) to visible (0)
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOOLBAR_WIDTH + RIGHT_MARGIN + 10], // 0 = visible, 1 = hidden off right
  });

  return (
    <Animated.View
      style={[
        styles.toolbarContainer,
        {
          height: toolbarHeight,
          transform: [{ translateX }],
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

  const { height: screenHeight } = Dimensions.get("window");

  // Calculate Y position (offset from bottom)
  const toolbarHeight =
    minimizedTools.length > 0
      ? TOOLBAR_PADDING * 2 +
        minimizedTools.length * TOOL_ITEM_SIZE +
        (minimizedTools.length - 1) * ICON_GAP +
        ICON_GAP +
        COLLAPSE_BUTTON_SIZE
      : PEEK_HEIGHT;

  const yPosition = screenHeight - BOTTOM_OFFSET - toolbarHeight;

  // Animated values: 0 = visible, 1 = hidden
  const peekAnim = useRef(new Animated.Value(1)).current; // Start hidden
  const toolbarAnim = useRef(new Animated.Value(1)).current; // Start hidden
  const hasInitialized = useRef(false);

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

  // Expand the toolbar
  const handleExpand = useCallback(() => {
    setIsExpanded(true);
    Animated.parallel([
      // Hide peek
      Animated.timing(peekAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      // Show toolbar
      Animated.spring(toolbarAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [peekAnim, toolbarAnim]);

  // Collapse the toolbar
  const handleCollapse = useCallback(() => {
    setIsExpanded(false);
    Animated.parallel([
      // Hide toolbar
      Animated.timing(toolbarAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
      // Show peek
      Animated.spring(peekAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, [peekAnim, toolbarAnim]);

  // Initialize animation when tools first appear
  useEffect(() => {
    if (minimizedTools.length > 0 && !hasInitialized.current) {
      hasInitialized.current = true;
      // Animate peek in (from 1/hidden to 0/visible)
      Animated.spring(peekAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }).start();
    } else if (minimizedTools.length === 0) {
      // Reset when all tools are restored
      hasInitialized.current = false;
      setIsExpanded(false);
      peekAnim.setValue(1);
      toolbarAnim.setValue(1);
    }
  }, [minimizedTools.length, peekAnim, toolbarAnim]);

  // Handle pushToSide prop (hide everything when modal is open)
  useEffect(() => {
    if (minimizedTools.length === 0) return;

    if (pushToSide) {
      // Hide both peek and toolbar
      Animated.parallel([
        Animated.timing(peekAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(toolbarAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Show appropriate view based on expanded state
      if (isExpanded) {
        Animated.spring(toolbarAnim, {
          toValue: 0,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.spring(peekAnim, {
          toValue: 0,
          tension: 100,
          friction: 12,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [pushToSide, isExpanded, minimizedTools.length, peekAnim, toolbarAnim]);

  // Don't render anything if no minimized tools
  if (minimizedTools.length === 0) {
    return null;
  }

  return (
    <View
      style={[styles.container, { top: yPosition }]}
      pointerEvents="box-none"
    >
      {/* Collapsed State - Half Circle Peek (hide when expanded) */}
      {!isExpanded && (
        <CollapsedPeek
          count={minimizedTools.length}
          onPress={handleExpand}
          animatedValue={peekAnim}
        />
      )}

      {/* Expanded State - Pill Toolbar */}
      {isExpanded && (
        <ExpandedToolbar
          tools={minimizedTools}
          onToolPress={handleToolPress}
          onCollapse={handleCollapse}
          animatedValue={toolbarAnim}
        />
      )}
    </View>
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
