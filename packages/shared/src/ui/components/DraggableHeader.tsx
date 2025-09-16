import { useRef, useMemo, memo, ReactNode } from "react";
import {
  View,
  PanResponder,
  Animated,
  Dimensions,
  ViewStyle,
  StyleProp,
} from "react-native";

interface DraggableHeaderProps {
  children: ReactNode;
  position: Animated.ValueXY;
  onDragStart?: () => void;
  onDragEnd?: (finalPosition: { x: number; y: number }) => void;
  onTap?: () => void;
  containerBounds?: { width: number; height: number };
  elementSize?: { width: number; height: number };
  minPosition?: { x: number; y: number };
  style?: StyleProp<ViewStyle>;
  enabled?: boolean;
}

/**
 * DraggableHeader - Reusable draggable component based on JsModal's working implementation
 *
 * This component provides smooth drag functionality with proper boundary checking.
 * It uses the same proven pattern from JsModal that works reliably.
 */
export const DraggableHeader = memo(function DraggableHeader({
  children,
  position,
  onDragStart,
  onDragEnd,
  onTap,
  containerBounds = Dimensions.get("window"),
  elementSize = { width: 100, height: 50 },
  minPosition = { x: 0, y: 0 },
  style,
  enabled = true,
}: DraggableHeaderProps) {
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const touchOffsetRef = useRef({ x: 0, y: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => enabled,
        onMoveShouldSetPanResponder: (_, g) =>
          enabled && (Math.abs(g.dx) > 1 || Math.abs(g.dy) > 1),
        onPanResponderTerminationRequest: () => false, // Resist touch steal

        onPanResponderGrant: (evt) => {
          isDraggingRef.current = false; // Start as not dragging
          dragDistanceRef.current = 0;
          // Don't call onDragStart immediately - wait to see if it's actually a drag
          
          // Record where inside the bubble the user touched
          touchOffsetRef.current = {
            x: evt.nativeEvent.locationX,
            y: evt.nativeEvent.locationY,
          };

          // Stop any running timing/spring and capture final XY
          position.stopAnimation(({ x, y }) => {
            // Use that exact final value as the new offset for the gesture
            position.setOffset({ x, y });
            position.setValue({ x: 0, y: 0 });
          });
        },

        onPanResponderMove: (evt, gestureState) => {
          // Track total drag distance
          const totalDistance =
            Math.abs(gestureState.dx) + Math.abs(gestureState.dy);
          dragDistanceRef.current = totalDistance;

          // Mark as dragging if moved more than 5 pixels
          if (totalDistance > 5 && !isDraggingRef.current) {
            isDraggingRef.current = true;
            onDragStart?.(); // Call onDragStart only when we confirm it's a drag
          }

          // Use absolute finger anchoring for better grip feel
          const x = evt.nativeEvent.pageX - touchOffsetRef.current.x;
          const y = evt.nativeEvent.pageY - touchOffsetRef.current.y;

          // When using absolute follow, use the value directly (no offset on move)
          position.setOffset({ x: 0, y: 0 });
          position.setValue({ x, y });
        },

        onPanResponderRelease: () => {
          // Get current position before any operations
          const currentX = Number(JSON.stringify(position.x));
          const currentY = Number(JSON.stringify(position.y));
          
          // Check if it was a tap (minimal movement)
          if (dragDistanceRef.current <= 5 && !isDraggingRef.current) {
            // Reset position to current values without offset for tap
            position.setOffset({ x: 0, y: 0 });
            position.setValue({ x: currentX, y: currentY });
            onTap?.();
            // No need to call onDragEnd since onDragStart was never called for a tap
            return;
          }

          // Apply boundary constraints
          const clampedX = Math.max(
            minPosition.x,
            Math.min(currentX, containerBounds.width - elementSize.width)
          );
          const clampedY = Math.max(
            minPosition.y,
            Math.min(currentY, containerBounds.height - elementSize.height)
          );

          // Set to clamped position
          position.setValue({ x: clampedX, y: clampedY });

          onDragEnd?.({ x: clampedX, y: clampedY });
          isDraggingRef.current = false;
        },

        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          // No need to flattenOffset since we're using absolute positioning
        },
      }),
    [
      enabled,
      position,
      onDragStart,
      onDragEnd,
      onTap,
      containerBounds,
      elementSize,
      minPosition,
    ]
  );

  return (
    <View style={style} {...panResponder.panHandlers}>
      {children}
    </View>
  );
});
