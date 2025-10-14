import { useState, useRef, useCallback } from 'react';
import type { DimensionsAdapter } from '../../adapters/dimensions/dimensions.types';
import type { Position, Size } from '../types';
import { DEFAULTS } from '../constants';

export interface UseFloatingVisibilityOptions {
  /** Dimensions adapter for screen size */
  dimensions: DimensionsAdapter;
  /** Current size of the floating bubble */
  bubbleSize: Size;
  /** Callback to update position */
  onPositionChange: (position: Position) => void;
  /** Callback to save position to storage */
  savePosition: (x: number, y: number) => Promise<void>;
}

export interface UseFloatingVisibilityReturn {
  /** Whether the bubble is currently hidden */
  isHidden: boolean;
  /** Hide the bubble (slide off-screen) */
  hide: (position: Position) => Promise<void>;
  /** Show the bubble (restore to saved position) */
  show: (position: Position) => Promise<void>;
  /** Toggle between hidden and visible */
  toggle: (position: Position) => Promise<void>;
  /** Check if bubble should be hidden based on position */
  checkShouldHide: (position: Position) => boolean;
  /** Set hidden state directly */
  setIsHidden: (hidden: boolean) => void;
}

/**
 * Platform-agnostic hook for managing floating bubble visibility
 *
 * Handles hide/show logic, position restoration, and auto-hide detection.
 *
 * @example
 * ```tsx
 * const { isHidden, toggle, checkShouldHide } = useFloatingVisibility({
 *   dimensions: webDimensionsAdapter,
 *   bubbleSize: { width: 200, height: 50 },
 *   currentPosition: position,
 *   onPositionChange: setPosition,
 *   savePosition,
 * });
 * ```
 */
export const useFloatingVisibility = ({
  dimensions,
  bubbleSize,
  onPositionChange,
  savePosition,
}: UseFloatingVisibilityOptions): UseFloatingVisibilityReturn => {
  const [isHidden, setIsHidden] = useState(false);
  const savedPositionRef = useRef<Position | null>(null);

  const hide = useCallback(
    async (position: Position) => {
      const { width } = dimensions.getWindow();

      // Save current position before hiding
      savedPositionRef.current = position;

      // Calculate hidden position (only show grabber)
      const hiddenX = width - DEFAULTS.VISIBLE_HANDLE_WIDTH;
      const hiddenPosition: Position = { x: hiddenX, y: position.y };

      setIsHidden(true);
      onPositionChange(hiddenPosition);
      await savePosition(hiddenX, position.y);
    },
    [dimensions, onPositionChange, savePosition]
  );

  const show = useCallback(
    async (position: Position) => {
      const { width } = dimensions.getWindow();

      // Restore to saved position or default visible position
      let targetPosition: Position;
      if (savedPositionRef.current) {
        targetPosition = savedPositionRef.current;
      } else {
        targetPosition = {
          x: width - bubbleSize.width - DEFAULTS.DEFAULT_BUBBLE_MARGIN,
          y: position.y,
        };
      }

      setIsHidden(false);
      onPositionChange(targetPosition);
      await savePosition(targetPosition.x, targetPosition.y);
    },
    [dimensions, bubbleSize, onPositionChange, savePosition]
  );

  const toggle = useCallback(
    async (position: Position) => {
      if (isHidden) {
        await show(position);
      } else {
        await hide(position);
      }
    },
    [isHidden, show, hide]
  );

  const checkShouldHide = useCallback(
    (position: Position): boolean => {
      const { width } = dimensions.getWindow();
      const bubbleMidpoint = position.x + bubbleSize.width / 2;
      return bubbleMidpoint > width;
    },
    [dimensions, bubbleSize]
  );

  return {
    isHidden,
    hide,
    show,
    toggle,
    checkShouldHide,
    setIsHidden,
  };
};
