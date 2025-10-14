/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Size dimensions
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * Safe area insets (for notches, status bars, etc.)
 */
export interface SafeAreaInsets {
  top: number;
  left: number;
  bottom: number;
  right: number;
}
