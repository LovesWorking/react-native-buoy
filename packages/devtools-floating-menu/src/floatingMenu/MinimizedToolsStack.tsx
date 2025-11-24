import React, { useCallback, useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { gameUIColors } from "@react-buoy/shared-ui";
import {
  useMinimizedTools,
  MinimizedTool,
  getIconPosition,
  getIconSize,
} from "./MinimizedToolsContext";

// ============================================================================
// Constants
// ============================================================================

const ICON_SIZE = getIconSize();
const ANIMATION_DURATION = 300;
const HIDE_OFFSET = 80; // How far to push icons off-screen when hiding

// ============================================================================
// Types
// ============================================================================

export interface MinimizedToolsStackProps {
  /** Callback when a tool should be restored */
  onRestore?: (tool: MinimizedTool) => void;
  /** Whether to push the stack to the side (when a modal is open) */
  pushToSide?: boolean;
  /** Top offset from the screen edge */
  topOffset?: number;
}

// ============================================================================
// Individual Minimized Tool Icon Component
// ============================================================================

interface MinimizedToolIconProps {
  tool: MinimizedTool;
  index: number;
  onPress: () => void;
  pushToSide: boolean;
}

function MinimizedToolIcon({
  tool,
  index,
  onPress,
  pushToSide,
}: MinimizedToolIconProps) {
  const position = getIconPosition(index);
  const animatedX = useRef(new Animated.Value(position.x)).current;
  const animatedY = useRef(new Animated.Value(position.y)).current;
  const animatedScale = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  const { width: screenWidth } = Dimensions.get("window");
  const hiddenX = screenWidth + HIDE_OFFSET;

  // Animate in on mount
  useEffect(() => {
    // Set initial position
    animatedX.setValue(position.x);
    animatedY.setValue(position.y);

    // Animate scale and opacity in
    Animated.parallel([
      Animated.spring(animatedScale, {
        toValue: 1,
        tension: 200,
        friction: 15,
        useNativeDriver: true,
      }),
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: ANIMATION_DURATION,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Update position when index changes (when other icons are removed)
  useEffect(() => {
    const newPosition = getIconPosition(index);
    Animated.parallel([
      Animated.spring(animatedX, {
        toValue: pushToSide ? hiddenX : newPosition.x,
        tension: 200,
        friction: 20,
        useNativeDriver: true,
      }),
      Animated.spring(animatedY, {
        toValue: newPosition.y,
        tension: 200,
        friction: 20,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, pushToSide, hiddenX]);

  // Handle push to side
  useEffect(() => {
    const targetX = pushToSide ? hiddenX : position.x;
    Animated.spring(animatedX, {
      toValue: targetX,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [pushToSide, hiddenX, position.x]);

  return (
    <Animated.View
      style={[
        styles.iconWrapper,
        {
          transform: [
            { translateX: animatedX },
            { translateY: animatedY },
            { scale: animatedScale },
          ],
          opacity: animatedOpacity,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.iconButton,
          {
            borderColor: tool.color ?? gameUIColors.info,
            shadowColor: tool.color ?? gameUIColors.info,
          },
        ]}
        accessibilityLabel={`Restore ${tool.title}`}
        accessibilityRole="button"
      >
        <View style={styles.iconContent}>{tool.icon}</View>
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

  const handleToolPress = useCallback(
    (tool: MinimizedTool) => {
      // Remove from minimized stack
      const restored = restore(tool.instanceId);
      if (restored && onRestore) {
        onRestore(restored);
      }
    },
    [restore, onRestore]
  );

  // Don't render anything if no minimized tools
  if (minimizedTools.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      {minimizedTools.map((tool, index) => (
        <MinimizedToolIcon
          key={tool.instanceId}
          tool={tool}
          index={index}
          onPress={() => handleToolPress(tool)}
          pushToSide={pushToSide}
        />
      ))}
    </View>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  iconWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  iconButton: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: gameUIColors.panel,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  iconContent: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
