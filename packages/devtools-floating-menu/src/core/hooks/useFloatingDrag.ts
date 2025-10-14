import { useRef, useCallback } from 'react';
import type { Position } from '../types';
import { DEFAULTS } from '../constants';

export interface UseFloatingDragOptions {
  /** Callback when drag starts */
  onDragStart?: () => void;
  /** Callback when drag ends with final position */
  onDragEnd?: (position: Position) => void;
}

export interface UseFloatingDragReturn {
  /** Initialize drag with starting position */
  handleDragStart: (startPoint: Position) => void;
  /** Handle drag movement with delta */
  handleDragMove: (delta: { dx: number; dy: number }) => Position;
  /** Finalize drag with final position */
  handleDragEnd: (finalPosition: Position) => { wasTap: boolean };
  /** Whether currently dragging */
  isDragging: boolean;
  /** Whether the gesture was a tap (not a drag) */
  isTap: boolean;
}

/**
 * Platform-agnostic hook for managing drag interactions
 *
 * Handles drag state, tap detection, and position calculations.
 * Works with platform-specific drag adapters.
 *
 * @example
 * ```tsx
 * const { handleDragStart, handleDragMove, handleDragEnd, isDragging } = useFloatingDrag({
 *   onDragStart: () => setIsDragging(true),
 *   onDragEnd: (pos) => savePosition(pos.x, pos.y),
 * });
 * ```
 */
export const useFloatingDrag = ({
  onDragStart,
  onDragEnd,
}: UseFloatingDragOptions = {}): UseFloatingDragReturn => {
  const isDraggingRef = useRef(false);
  const dragDistanceRef = useRef(0);
  const startPositionRef = useRef<Position>({ x: 0, y: 0 });

  const handleDragStart = useCallback(
    (startPoint: Position) => {
      isDraggingRef.current = false;
      dragDistanceRef.current = 0;
      startPositionRef.current = startPoint;
    },
    []
  );

  const handleDragMove = useCallback(
    (delta: { dx: number; dy: number }): Position => {
      const totalDistance = Math.abs(delta.dx) + Math.abs(delta.dy);
      dragDistanceRef.current = totalDistance;

      // Mark as dragging if moved beyond tap threshold
      if (totalDistance > DEFAULTS.TAP_THRESHOLD_PX && !isDraggingRef.current) {
        isDraggingRef.current = true;
        onDragStart?.();
      }

      // Calculate new position based on delta from start
      return {
        x: startPositionRef.current.x + delta.dx,
        y: startPositionRef.current.y + delta.dy,
      };
    },
    [onDragStart]
  );

  const handleDragEnd = useCallback(
    (finalPosition: Position): { wasTap: boolean } => {
      const wasTap =
        dragDistanceRef.current <= DEFAULTS.TAP_THRESHOLD_PX &&
        !isDraggingRef.current;

      if (!wasTap) {
        onDragEnd?.(finalPosition);
      }

      isDraggingRef.current = false;
      dragDistanceRef.current = 0;

      return { wasTap };
    },
    [onDragEnd]
  );

  return {
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging: isDraggingRef.current,
    isTap: dragDistanceRef.current <= DEFAULTS.TAP_THRESHOLD_PX,
  };
};
