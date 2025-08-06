// =============================================================================
// REACTIVE SENTRY EVENT STORE
// =============================================================================

import { SentryEventEntry } from "./sentryEventListeners";
import { LogType, LogLevel } from "../../../_shared/logger/types";
import { adaptSentryEventsToConsoleEntries } from "./SentryEventAdapter";

type Listener = () => void;
type Unsubscribe = () => void;

interface FilterConfig {
  selectedTypes: Set<LogType>;
  selectedLevels: Set<LogLevel>;
}

/**
 * Enhanced reactive event store with subscription support
 * Similar to React Query's cache subscription model
 */
export class ReactiveSentryEventStore {
  private events: SentryEventEntry[] = [];
  private maxEvents: number = 100; // Default to 100 as mentioned by user
  private listeners = new Set<Listener>();
  private filterConfig: FilterConfig | null = null;

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
   * Set active filters for the store
   * Only events matching these filters will be stored
   */
  setFilters(filters: FilterConfig | null): void {
    this.filterConfig = filters;
    // Don't clear existing events - let the UI handle filtering for display
    // Only new incoming events will be filtered
    this.notify();
  }

  /**
   * Check if an event matches the current filters
   */
  private matchesFilters(event: SentryEventEntry): boolean {
    // If no filters are set, accept all events
    if (!this.filterConfig) {
      return true;
    }

    // Convert to console entry to check type and level
    const [consoleEntry] = adaptSentryEventsToConsoleEntries([event]);

    // Check if both filter sets are empty (no filtering)
    if (
      this.filterConfig.selectedTypes.size === 0 &&
      this.filterConfig.selectedLevels.size === 0
    ) {
      return true;
    }

    // Check type filter
    const typeMatch =
      this.filterConfig.selectedTypes.size === 0 ||
      this.filterConfig.selectedTypes.has(consoleEntry.type);

    // Check level filter
    const levelMatch =
      this.filterConfig.selectedLevels.size === 0 ||
      this.filterConfig.selectedLevels.has(consoleEntry.level);

    // Special handling for spans - they are filtered out unless Navigation is explicitly selected
    if (consoleEntry.metadata?._isSpan) {
      return (
        this.filterConfig.selectedTypes.size === 1 &&
        this.filterConfig.selectedTypes.has(LogType.Navigation)
      );
    }

    return typeMatch && levelMatch;
  }

  /**
   * Add a new event to storage
   * This will notify all subscribers automatically
   */
  add(event: SentryEventEntry): void {
    // Safeguard: Check if this event is from our own console logging to prevent infinite loops
    const isFromDevToolsLogging =
      event.data?.__rn_dev_tools_internal_log === true;

    if (!isFromDevToolsLogging) {
      // Log all incoming events with safeguard marker
      console.log("[RN-DevTools] Sentry Event Received:", {
        ...event,
        __rn_dev_tools_internal_log: true, // Safeguard marker
      });
    }
    //temp

    // Only add events that match current filters
    if (!this.matchesFilters(event)) {
      return;
    }

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
