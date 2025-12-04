import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  View,
  StyleSheet,
  Easing,
} from "react-native";
import { ExpandablePopover, gameUIColors } from "@react-buoy/shared-ui";
import { useMinimizedTools, MinimizedTool } from "./MinimizedToolsContext";

// ============================================================================
// Constants
// ============================================================================

const PEEK_HEIGHT = 28;
const TOOLBAR_WIDTH = 44;
const TOOL_ITEM_SIZE = 32;
const ICON_GAP = 6;
const TOOLBAR_PADDING = 8;
const COLLAPSE_BUTTON_SIZE = 24;

const STORAGE_KEY_EXPANDED = "@react_buoy_minimized_stack_expanded";

// Glitch effect constants
const GLITCH_DURATION_MS = 80;
const MIN_GLITCH_DELAY = 2000;
const MAX_GLITCH_DELAY = 6000;

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
// Main Component
// ============================================================================

export function MinimizedToolsStack({
  onRestore,
  containerWidth = TOOLBAR_WIDTH,
}: MinimizedToolsStackProps) {
  const { minimizedTools, restore } = useMinimizedTools();

  // Calculate expanded height based on number of tools
  const expandedHeight =
    TOOLBAR_PADDING +
    minimizedTools.length * TOOL_ITEM_SIZE +
    (minimizedTools.length - 1) * ICON_GAP +
    ICON_GAP +
    COLLAPSE_BUTTON_SIZE +
    4;

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

  return (
    <ExpandablePopover
      hasItems={minimizedTools.length > 0}
      itemCount={minimizedTools.length}
      showCount={true}
      width={containerWidth}
      expandedHeight={expandedHeight}
      persistState={true}
      storageKey={STORAGE_KEY_EXPANDED}
      peekHeight={PEEK_HEIGHT}
      collapsedLabel={`Show ${minimizedTools.length} minimized tools`}
    >
      {/* Tool Icons - rendered in reverse order */}
      {[...minimizedTools].reverse().map((tool, index) => (
        <GlitchToolButton
          key={tool.instanceId}
          tool={tool}
          onPress={handleToolPress}
          index={index}
        />
      ))}
    </ExpandablePopover>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  toolButton: {
    width: TOOL_ITEM_SIZE,
    height: TOOL_ITEM_SIZE,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
