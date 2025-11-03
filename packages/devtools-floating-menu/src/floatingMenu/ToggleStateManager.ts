/**
 * ToggleStateManager
 *
 * Global event emitter for toggle-only dev tools to notify when their state changes.
 * This allows FloatingMenu to re-render and update icon colors.
 */

type Listener = () => void;

class ToggleStateManager {
  private listeners: Set<Listener> = new Set();

  /**
   * Subscribe to any toggle state change
   */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers that a toggle state changed
   */
  notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

// Singleton instance
export const toggleStateManager = new ToggleStateManager();
