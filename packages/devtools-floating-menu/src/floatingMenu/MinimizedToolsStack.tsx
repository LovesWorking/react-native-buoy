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
const TOOLBAR_WIDTH = 70; // Width of the expanded pill toolbar
const TOOL_ITEM_HEIGHT = 60; // Height of each tool item (icon + label)
const ICON_GAP = 4; // Gap between tool items
const TOOLBAR_PADDING = 12; // Padding inside the toolbar
const COLLAPSE_BUTTON_SIZE = 28; // Size of the collapse button
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
        <ChevronLeft size={18} color={gameUIColors.info} strokeWidth={2.5} />
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
  // Calculate toolbar height based on number of tools
  const toolbarHeight =
    TOOLBAR_PADDING * 2 +
    tools.length * TOOL_ITEM_HEIGHT +
    (tools.length - 1) * ICON_GAP +
    ICON_GAP +
    COLLAPSE_BUTTON_SIZE;

  // Animate from off-screen (positive = right/hidden) to visible (0)
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOOLBAR_WIDTH + 10], // 0 = visible, 1 = hidden off right
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
      {/* Tool Icons - matching DialIcon style */}
      {tools.map((tool) => (
        <TouchableOpacity
          key={tool.instanceId}
          onPress={() => onToolPress(tool)}
          activeOpacity={0.7}
          style={styles.toolButton}
          accessibilityLabel={`Restore ${tool.title}`}
          accessibilityRole="button"
        >
          {/* Subtle background layers like DialIcon */}
          <View style={styles.toolGradientBg} />
          <View style={styles.toolInnerGlow} />

          {/* Icon */}
          <View style={styles.toolIconWrapper}>{tool.icon}</View>

          {/* Label - matching DialIcon style */}
          <Text style={styles.toolLabel} numberOfLines={1}>
            {tool.title.toUpperCase()}
          </Text>
        </TouchableOpacity>
      ))}

      {/* Collapse Button */}
      <TouchableOpacity
        onPress={onCollapse}
        activeOpacity={0.7}
        style={styles.collapseButton}
        accessibilityLabel="Collapse minimized tools"
        accessibilityRole="button"
      >
        <ChevronRight size={14} color={gameUIColors.secondary} />
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
        minimizedTools.length * TOOL_ITEM_HEIGHT +
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
    borderTopLeftRadius: PEEK_HEIGHT / 2,
    borderBottomLeftRadius: PEEK_HEIGHT / 2,
    backgroundColor: gameUIColors.panel,
    borderWidth: 1.5,
    borderRightWidth: 0,
    borderColor: gameUIColors.info,
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 4,
    shadowColor: gameUIColors.info,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },

  // ==================== Expanded Toolbar Styles ====================
  toolbarContainer: {
    position: "absolute",
    right: RIGHT_MARGIN, // Float away from edge
    top: 0,
    width: TOOLBAR_WIDTH,
    backgroundColor: dialColors.dialBackground,
    borderRadius: TOOLBAR_WIDTH / 2, // Full pill shape
    borderWidth: 1,
    borderColor: dialColors.dialBorder,
    paddingVertical: TOOLBAR_PADDING,
    alignItems: "center",
    gap: ICON_GAP,
    // Matching dial glow effect
    shadowColor: dialColors.dialShadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  // Tool button - matching DialIcon style (no border, transparent bg)
  toolButton: {
    width: TOOLBAR_WIDTH - 8,
    height: TOOL_ITEM_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    backgroundColor: "transparent",
  },
  // Subtle gradient background like DialIcon
  toolGradientBg: {
    position: "absolute",
    width: "85%",
    height: "85%",
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    opacity: 0.3,
  },
  // Inner glow effect like DialIcon
  toolInnerGlow: {
    position: "absolute",
    width: "70%",
    height: "70%",
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    opacity: 0.5,
  },
  // Icon wrapper with margin for label
  toolIconWrapper: {
    marginBottom: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  // Label style matching DialIcon exactly
  toolLabel: {
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.5,
    fontFamily: "monospace",
    marginTop: 2,
    color: gameUIColors.secondary,
    textAlign: "center",
  },
  collapseButton: {
    width: COLLAPSE_BUTTON_SIZE,
    height: COLLAPSE_BUTTON_SIZE,
    borderRadius: COLLAPSE_BUTTON_SIZE / 2,
    backgroundColor: gameUIColors.muted + "22",
    borderWidth: 1,
    borderColor: gameUIColors.muted + "44",
    alignItems: "center",
    justifyContent: "center",
    marginTop: ICON_GAP,
  },
});
