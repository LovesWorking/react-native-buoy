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
}

export class RouteObserver {
  private listeners: Set<(event: RouteChangeEvent) => void> = new Set();

  /**
   * Emit a route change event
   * Called by the useRouteObserver hook
   */
  emit(event: RouteChangeEvent) {
    // Log to console
    this.logEvent(event);

    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[RouteObserver] Error in listener:', error);
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

  /**
   * Log route change event to console
   */
  private logEvent(event: RouteChangeEvent) {
    console.log('📍 [Route Change]', {
      pathname: event.pathname,
      params: event.params,
      segments: event.segments,
      timestamp: new Date(event.timestamp).toISOString(),
    });
  }
}
