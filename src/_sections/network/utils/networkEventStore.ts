/**
 * Network event store for managing captured network requests
 * Works with the Reactotron-style network listener
 */

import type { NetworkEvent } from '../types';
import type { NetworkingEvent } from './networkListener';

class NetworkEventStore {
  private events: NetworkEvent[] = [];
  private pendingRequests: Map<string, NetworkEvent> = new Map();
  private listeners: Set<(events: NetworkEvent[]) => void> = new Set();
  private maxEvents = 500; // Configurable max events to prevent memory issues
  private recentRequests: Map<string, number> = new Map(); // Track recent requests to detect duplicates

  /**
   * Process a network listener event
   */
  processNetworkEvent(event: NetworkingEvent): void {
    const { request } = event;
    
    if (event.type === 'request') {
      // Check for duplicate request based on URL, method, and timing
      const requestKey = `${request.method}:${request.url}`;
      const now = Date.now();
      const lastRequestTime = this.recentRequests.get(requestKey);
      
      // If same request within 50ms, likely a duplicate from XHR/fetch dual interception
      if (lastRequestTime && (now - lastRequestTime) < 50) {
        return; // Skip duplicate
      }
      
      this.recentRequests.set(requestKey, now);
      
      // Clean up old entries to prevent memory leak
      if (this.recentRequests.size > 100) {
        const cutoff = now - 5000; // Remove entries older than 5 seconds
        for (const [key, time] of this.recentRequests.entries()) {
          if (time < cutoff) {
            this.recentRequests.delete(key);
          }
        }
      }
      
      // Create new network event for request
      const networkEvent: NetworkEvent = {
        id: request.id,
        method: request.method,
        url: request.url,
        host: this.extractHost(request.url),
        path: this.extractPath(request.url),
        query: request.params ? `?${new URLSearchParams(request.params).toString()}` : '',
        timestamp: event.timestamp.getTime(),
        requestHeaders: request.headers || {},
        requestData: request.data,
        requestSize: this.getDataSize(request.data),
        responseHeaders: {},
      };
      
      // Store as pending
      this.pendingRequests.set(request.id, networkEvent);
      
      // Add to events list
      this.events = [networkEvent, ...this.events].slice(0, this.maxEvents);
      this.notifyListeners();
      
    } else if (event.type === 'response' || event.type === 'error') {
      // Find and update the pending request
      const index = this.events.findIndex(e => e.id === request.id);
      if (index !== -1) {
        const updatedEvent: NetworkEvent = {
          ...this.events[index],
          duration: event.duration,
        };
        
        if (event.response) {
          updatedEvent.status = event.response.status;
          updatedEvent.statusText = event.response.statusText;
          updatedEvent.responseHeaders = event.response.headers || {};
          updatedEvent.responseData = event.response.body;
          updatedEvent.responseSize = event.response.size || 0;
          updatedEvent.responseType = event.response.headers?.['content-type'];
        }
        
        if (event.error) {
          updatedEvent.error = event.error.message;
          updatedEvent.status = updatedEvent.status || 0;
        }
        
        this.events[index] = updatedEvent;
        this.pendingRequests.delete(request.id);
        this.notifyListeners();
      }
    }
  }

  /**
   * Extract host from URL
   */
  private extractHost(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }

  /**
   * Extract path from URL
   */
  private extractPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch {
      return url;
    }
  }

  /**
   * Get size of data
   */
  private getDataSize(data: unknown): number {
    if (!data) return 0;
    if (typeof data === 'string') return data.length;
    try {
      return JSON.stringify(data).length;
    } catch {
      return 0;
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
    this.pendingRequests.clear();
    this.recentRequests.clear();
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