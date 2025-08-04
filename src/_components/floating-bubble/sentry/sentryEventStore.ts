// =============================================================================
// REACTIVE SENTRY EVENT STORE
// =============================================================================

import { SentryEventEntry } from "./sentryEventListeners";

type Listener = () => void;
type Unsubscribe = () => void;

/**
 * Enhanced reactive event store with subscription support
 * Similar to React Query's cache subscription model
 */
export class ReactiveSentryEventStore {
  private events: SentryEventEntry[] = [];
  private maxEvents: number = 100; // Default to 100 as mentioned by user
  private listeners = new Set<Listener>();

  /**
   * Subscribe to store changes
   * Returns an unsubscribe function
   */
  subscribe(listener: Listener): Unsubscribe {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all subscribers of changes
   * Uses setTimeout to avoid updating during render phase
   */
  private notify() {
    // Defer notification to next tick to avoid React render warnings
    setTimeout(() => {
      this.listeners.forEach((listener) => {
        try {
          listener();
        } catch (error) {
          console.error("Error in Sentry event listener:", error);
        }
      });
    }, 0);
  }

  /**
   * Set maximum number of events to store
   */
  setMaxEvents(max: number): void {
    this.maxEvents = max;
    this.trimEvents();
    this.notify();
  }

  /**
   * Add a new event to storage
   * This will notify all subscribers automatically
   */
  add(event: SentryEventEntry): void {
    // Add to beginning for newest first
    this.events.unshift(event);
    this.trimEvents();

    // Notify all subscribers of the change
    this.notify();
  }

  /**
   * Get all stored events
   */
  getEvents(): SentryEventEntry[] {
    return [...this.events];
  }

  /**
   * Get events filtered by type
   */
  getEventsByType(type: string): SentryEventEntry[] {
    return this.events.filter((event) => event.eventType === type);
  }

  /**
   * Get events filtered by level
   */
  getEventsByLevel(level: string): SentryEventEntry[] {
    return this.events.filter((event) => event.level === level);
  }

  /**
   * Clear all stored events
   */
  clear(): void {
    this.events = [];
    this.notify();
  }

  /**
   * Get event count
   */
  getCount(): number {
    return this.events.length;
  }

  /**
   * Get max events limit
   */
  getMaxEvents(): number {
    return this.maxEvents;
  }

  /**
   * Trim events to max limit
   */
  private trimEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
  }
}

// Global reactive store instance
export const reactiveSentryEventStore = new ReactiveSentryEventStore();
