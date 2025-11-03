/**
 * RouteObserver - Tracks route changes in Expo Router
 *
 * Note: This is a simple event emitter that works with the useRouteObserver hook
 * The actual route tracking happens in the hook using public Expo Router APIs
 */

export interface RouteChangeEvent {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  timestamp: number;
  previousPathname?: string;
  timeSincePrevious?: number; // milliseconds since previous event
}

export class RouteObserver {
  private listeners: Set<(event: RouteChangeEvent) => void> = new Set();

  /**
   * Emit a route change event
   * Called by the useRouteObserver hook
   */
  emit(event: RouteChangeEvent) {
    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("[RouteObserver] Error in listener:", error);
      }
    });
  }

  /**
   * Add listener for route changes
   * @returns Cleanup function to remove the listener
   */
  addListener(callback: (event: RouteChangeEvent) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Remove a specific listener
   */
  removeListener(callback: (event: RouteChangeEvent) => void) {
    this.listeners.delete(callback);
  }
}

/**
 * Singleton instance of RouteObserver
 * Use this for all route tracking to ensure events are centralized
 */
export const routeObserver = new RouteObserver();
