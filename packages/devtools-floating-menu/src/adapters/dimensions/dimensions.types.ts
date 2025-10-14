/**
 * Platform-agnostic dimensions adapter interface
 *
 * Provides access to window/screen dimensions and resize events
 * across different platforms (web, React Native, etc.)
 */
export interface DimensionsAdapter {
  /**
   * Get current window dimensions
   * @returns Object containing width and height in pixels
   */
  getWindow(): { width: number; height: number };

  /**
   * Subscribe to dimension changes (resize events)
   * @param callback - Function called when dimensions change
   * @returns Cleanup function to unsubscribe
   */
  onChange(callback: (dims: { width: number; height: number }) => void): () => void;
}
