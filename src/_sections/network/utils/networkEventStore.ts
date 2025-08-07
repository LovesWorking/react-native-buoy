/**
 * Network event store for managing captured network requests
 */

import type { NetworkEvent } from '../types';

class NetworkEventStore {
  private events: NetworkEvent[] = [];
  private listeners: Set<(events: NetworkEvent[]) => void> = new Set();
  private maxEvents = 500; // Configurable max events to prevent memory issues
  private eventCounter = 0;

  /**
   * Add a new network event to the store
   */
  addEvent(event: Omit<NetworkEvent, 'id'>): void {
    const newEvent: NetworkEvent = {
      ...event,
      id: `net_${++this.eventCounter}_${Date.now()}`,
    };

    this.events = [newEvent, ...this.events].slice(0, this.maxEvents);
    this.notifyListeners();
  }

  /**
   * Update an existing event (e.g., when response arrives)
   */
  updateEvent(id: string, updates: Partial<NetworkEvent>): void {
    const index = this.events.findIndex(e => e.id === id);
    if (index !== -1) {
      this.events[index] = { ...this.events[index], ...updates };
      this.notifyListeners();
    }
  }

  /**
   * Get all events
   */
  getEvents(): NetworkEvent[] {
    return [...this.events];
  }

  /**
   * Get event by ID
   */
  getEventById(id: string): NetworkEvent | undefined {
    return this.events.find(e => e.id === id);
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    this.notifyListeners();
  }

  /**
   * Subscribe to event changes
   */
  subscribe(listener: (events: NetworkEvent[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const events = this.getEvents();
    this.listeners.forEach(listener => listener(events));
  }

  /**
   * Set maximum number of events to store
   */
  setMaxEvents(max: number): void {
    this.maxEvents = max;
    if (this.events.length > max) {
      this.events = this.events.slice(0, max);
      this.notifyListeners();
    }
  }

  /**
   * Get statistics about network events
   */
  getStats() {
    const total = this.events.length;
    const successful = this.events.filter(e => e.status && e.status >= 200 && e.status < 300).length;
    const failed = this.events.filter(e => e.error || (e.status && e.status >= 400)).length;
    const pending = this.events.filter(e => !e.status && !e.error).length;
    
    const durations = this.events
      .filter(e => e.duration)
      .map(e => e.duration!);
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const totalSent = this.events.reduce((sum, e) => sum + (e.requestSize || 0), 0);
    const totalReceived = this.events.reduce((sum, e) => sum + (e.responseSize || 0), 0);

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      pendingRequests: pending,
      totalDataSent: totalSent,
      totalDataReceived: totalReceived,
      averageDuration: Math.round(avgDuration),
    };
  }

  /**
   * Filter events by criteria
   */
  filterEvents(filter: {
    method?: string;
    status?: 'success' | 'error' | 'pending';
    searchText?: string;
    host?: string;
  }): NetworkEvent[] {
    let filtered = [...this.events];

    if (filter.method) {
      filtered = filtered.filter(e => e.method === filter.method);
    }

    if (filter.status) {
      switch (filter.status) {
        case 'success':
          filtered = filtered.filter(e => e.status && e.status >= 200 && e.status < 300);
          break;
        case 'error':
          filtered = filtered.filter(e => e.error || (e.status && e.status >= 400));
          break;
        case 'pending':
          filtered = filtered.filter(e => !e.status && !e.error);
          break;
      }
    }

    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      filtered = filtered.filter(e => 
        e.url.toLowerCase().includes(search) ||
        e.method.toLowerCase().includes(search) ||
        (e.error && e.error.toLowerCase().includes(search))
      );
    }

    if (filter.host) {
      filtered = filtered.filter(e => e.host === filter.host);
    }

    return filtered;
  }
}

// Export singleton instance
export const networkEventStore = new NetworkEventStore();