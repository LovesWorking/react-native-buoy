import { useRef, useMemo, memo, type ReactNode } from 'react';
import { View, PanResponder, Animated, Dimensions, type ViewStyle, type StyleProp } from 'react-native';

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
  maxOverflowX?: number;
}

export const DraggableHeader = memo(function DraggableHeader({
  children,
  position,
  onDragStart,
  onDragEnd,
  onTap,
  containerBounds = Dimensions.get('window'),
  elementSize = { width: 100, height: 50 },
  minPosition = { x: 0, y: 0 },
  style,
  enabled = true,
  maxOverflowX = 0,
}: DraggableHeaderProps) {
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const touchOffsetRef = useRef({ x: 0, y: 0 });
  const startPositionRef = useRef({ x: 0, y: 0 });

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => enabled,
        onMoveShouldSetPanResponder: (_, g) => enabled && (Math.abs(g.dx) > 1 || Math.abs(g.dy) > 1),
        onPanResponderTerminationRequest: () => false,

        onPanResponderGrant: (evt) => {
          isDraggingRef.current = false;
          dragDistanceRef.current = 0;
          touchOffsetRef.current = { x: evt.nativeEvent.locationX, y: evt.nativeEvent.locationY };
          // Capture starting position in parent coords; avoid relying on window pageX/pageY
          position.stopAnimation(({ x, y }) => {
            startPositionRef.current = { x, y };
          });
        },

        onPanResponderMove: (_evt, gestureState) => {
          const totalDistance = Math.abs(gestureState.dx) + Math.abs(gestureState.dy);
          dragDistanceRef.current = totalDistance;
          if (totalDistance > 5 && !isDraggingRef.current) {
            isDraggingRef.current = true;
            onDragStart?.();
          }
          // Use dx/dy relative movement so parent padding/margins don't affect dragging
          const x = startPositionRef.current.x + gestureState.dx;
          const y = startPositionRef.current.y + gestureState.dy;
          position.setValue({ x, y });
        },

        onPanResponderRelease: () => {
          // Check if this was a tap (minimal movement) before doing anything else
          const wasTap = dragDistanceRef.current <= 5 && !isDraggingRef.current;

          if (wasTap) {
            // For taps, just call the tap handler immediately - no position manipulation needed
            onTap?.();
            isDraggingRef.current = false;
            return;
          }

          // For drags, get the final position and clamp it
          position.stopAnimation(({ x: currentX, y: currentY }) => {
            const maxX = containerBounds.width - elementSize.width + maxOverflowX;
            const clampedX = Math.max(minPosition.x, Math.min(currentX, maxX));
            const clampedY = Math.max(minPosition.y, Math.min(currentY, containerBounds.height - elementSize.height));
            position.setValue({ x: clampedX, y: clampedY });
            onDragEnd?.({ x: clampedX, y: clampedY });
            isDraggingRef.current = false;
          });
        },

        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
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
      maxOverflowX,
    ]
  );

  return (
    <View style={style} {...panResponder.panHandlers}>
      {children}
    </View>
  );
});
