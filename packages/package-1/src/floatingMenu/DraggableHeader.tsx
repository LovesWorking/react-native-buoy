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
}: DraggableHeaderProps) {
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const touchOffsetRef = useRef({ x: 0, y: 0 });

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
          position.stopAnimation(({ x, y }) => {
            position.setOffset({ x, y });
            position.setValue({ x: 0, y: 0 });
          });
        },

        onPanResponderMove: (evt, gestureState) => {
          const totalDistance = Math.abs(gestureState.dx) + Math.abs(gestureState.dy);
          dragDistanceRef.current = totalDistance;
          if (totalDistance > 5 && !isDraggingRef.current) {
            isDraggingRef.current = true;
            onDragStart?.();
          }
          const x = evt.nativeEvent.pageX - touchOffsetRef.current.x;
          const y = evt.nativeEvent.pageY - touchOffsetRef.current.y;
          position.setOffset({ x: 0, y: 0 });
          position.setValue({ x, y });
        },

        onPanResponderRelease: () => {
          const currentX = Number(JSON.stringify(position.x));
          const currentY = Number(JSON.stringify(position.y));
          if (dragDistanceRef.current <= 5 && !isDraggingRef.current) {
            position.setOffset({ x: 0, y: 0 });
            position.setValue({ x: currentX, y: currentY });
            onTap?.();
            return;
          }
          const clampedX = Math.max(minPosition.x, Math.min(currentX, containerBounds.width - elementSize.width));
          const clampedY = Math.max(minPosition.y, Math.min(currentY, containerBounds.height - elementSize.height));
          position.setValue({ x: clampedX, y: clampedY });
          onDragEnd?.({ x: clampedX, y: clampedY });
          isDraggingRef.current = false;
        },

        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
        },
      }),
    [enabled, position, onDragStart, onDragEnd, onTap, containerBounds, elementSize, minPosition]
  );

  return (
    <View style={style} {...panResponder.panHandlers}>
      {children}
    </View>
  );
});

