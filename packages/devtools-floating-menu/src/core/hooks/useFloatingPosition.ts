import { useEffect, useRef, useCallback, useState } from 'react';
import type { StorageAdapter } from '../../adapters/storage/storage.types';
import type { DimensionsAdapter } from '../../adapters/dimensions/dimensions.types';
import type { Position, Size, SafeAreaInsets } from '../types';
import { STORAGE_KEYS, DEFAULTS } from '../constants';

export interface UseFloatingPositionOptions {
  /** Storage adapter for persisting position */
  storage: StorageAdapter;
  /** Dimensions adapter for screen size */
  dimensions: DimensionsAdapter;
  /** Current size of the floating bubble */
  bubbleSize: Size;
  /** Width of the visible handle when bubble is hidden (default: 32) */
  visibleHandleWidth?: number;
  /** Whether position persistence is enabled (default: true) */
  enabled?: boolean;
  /** Safe area insets (for notches, etc.) */
  safeAreaInsets?: SafeAreaInsets;
}

export interface UseFloatingPositionReturn {
  /** Current position of the floating bubble */
  position: Position;
  /** Update the position */
  setPosition: (pos: Position) => void;
  /** Save position to storage immediately */
  savePosition: (x: number, y: number) => Promise<void>;
  /** Save position with debounce */
  debouncedSavePosition: (x: number, y: number) => void;
  /** Validate and clamp position to screen bounds */
  validatePosition: (pos: Position) => Position;
  /** Whether position has been initialized from storage */
  isInitialized: boolean;
}

/**
 * Platform-agnostic hook for managing floating bubble position
 *
 * Handles position persistence, validation, and boundary constraints.
 * Works on both web and React Native through injected adapters.
 *
 * @example
 * ```tsx
 * const { position, setPosition, validatePosition } = useFloatingPosition({
 *   storage: webStorageAdapter,
 *   dimensions: webDimensionsAdapter,
 *   bubbleSize: { width: 200, height: 50 },
 * });
 * ```
 */
export const useFloatingPosition = ({
  storage,
  dimensions,
  bubbleSize,
  visibleHandleWidth = DEFAULTS.VISIBLE_HANDLE_WIDTH,
  enabled = true,
  safeAreaInsets = { top: 0, left: 0, bottom: 0, right: 0 },
}: UseFloatingPositionOptions): UseFloatingPositionReturn => {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const isInitializedRef = useRef(false);
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  const savePosition = useCallback(
    async (x: number, y: number) => {
      if (!enabled) return;
      try {
        await Promise.all([
          storage.setItem(STORAGE_KEYS.BUBBLE_POSITION_X, x.toString()),
          storage.setItem(STORAGE_KEYS.BUBBLE_POSITION_Y, y.toString()),
        ]);
      } catch (error) {
        console.warn('[FloatingTools] Failed to save position:', error);
      }
    },
    [enabled, storage]
  );

  const debouncedSavePosition = useCallback(
    (x: number, y: number) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(
        () => savePosition(x, y),
        DEFAULTS.DEBOUNCE_DELAY_MS
      );
    },
    [savePosition]
  );

  const loadPosition = useCallback(async (): Promise<Position | null> => {
    if (!enabled) return null;
    try {
      const [xStr, yStr] = await Promise.all([
        storage.getItem(STORAGE_KEYS.BUBBLE_POSITION_X),
        storage.getItem(STORAGE_KEYS.BUBBLE_POSITION_Y),
      ]);
      if (xStr !== null && yStr !== null) {
        const x = parseFloat(xStr);
        const y = parseFloat(yStr);
        if (!Number.isNaN(x) && !Number.isNaN(y)) {
          return { x, y };
        }
      }
    } catch (error) {
      console.warn('[FloatingTools] Failed to load position:', error);
    }
    return null;
  }, [enabled, storage]);

  const validatePosition = useCallback(
    (pos: Position): Position => {
      const { width: screenWidth, height: screenHeight } = dimensions.getWindow();

      const minX = safeAreaInsets.left;
      const maxX = screenWidth - visibleHandleWidth;
      const minY = safeAreaInsets.top + DEFAULTS.SAFE_AREA_TOP_PADDING;
      const maxY = screenHeight - bubbleSize.height - safeAreaInsets.bottom;

      return {
        x: Math.max(minX, Math.min(pos.x, maxX)),
        y: Math.max(minY, Math.min(pos.y, maxY)),
      };
    },
    [dimensions, visibleHandleWidth, bubbleSize, safeAreaInsets]
  );

  // Initialize position on mount
  useEffect(() => {
    if (!enabled || isInitializedRef.current) return;

    const restore = async () => {
      const saved = await loadPosition();

      if (saved) {
        const validated = validatePosition(saved);
        setPosition(validated);

        // Save corrected position if out of bounds
        const wasOutOfBounds =
          Math.abs(saved.x - validated.x) > DEFAULTS.TAP_THRESHOLD_PX ||
          Math.abs(saved.y - validated.y) > DEFAULTS.TAP_THRESHOLD_PX;

        if (wasOutOfBounds) {
          await savePosition(validated.x, validated.y);
        }
      } else {
        // Set default position
        const { width: screenWidth, height: screenHeight } = dimensions.getWindow();
        const defaultX = screenWidth - bubbleSize.width - DEFAULTS.DEFAULT_BUBBLE_MARGIN;
        const defaultY = Math.max(
          safeAreaInsets.top + DEFAULTS.SAFE_AREA_TOP_PADDING,
          Math.min(
            DEFAULTS.DEFAULT_Y_FALLBACK,
            screenHeight - bubbleSize.height - safeAreaInsets.bottom
          )
        );
        setPosition({ x: defaultX, y: defaultY });
      }

      isInitializedRef.current = true;
    };

    restore();
  }, [
    enabled,
    loadPosition,
    validatePosition,
    savePosition,
    dimensions,
    bubbleSize,
    safeAreaInsets,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    position,
    setPosition,
    savePosition,
    debouncedSavePosition,
    validatePosition,
    isInitialized: isInitializedRef.current,
  };
};
