/**
 * Hook for accessing network events and controls
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { networkEventStore } from '../utils/networkEventStore';
import { networkInterceptor } from '../utils/networkInterceptor';
import type { NetworkEvent, NetworkStats, NetworkFilter } from '../types';

export function useNetworkEvents() {
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [filter, setFilter] = useState<NetworkFilter>({});
  const [isEnabled, setIsEnabled] = useState(false);

  // Subscribe to event store changes
  useEffect(() => {
    const unsubscribe = networkEventStore.subscribe(setEvents);
    setEvents(networkEventStore.getEvents());
    return unsubscribe;
  }, []);

  // Enable/disable interceptor
  useEffect(() => {
    if (isEnabled) {
      networkInterceptor.enable();
    } else {
      networkInterceptor.disable();
    }
    
    return () => {
      networkInterceptor.disable();
    };
  }, [isEnabled]);

  // Clear all events
  const clearEvents = useCallback(() => {
    networkEventStore.clearEvents();
  }, []);

  // Toggle interception
  const toggleInterception = useCallback(() => {
    setIsEnabled(prev => !prev);
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (filter.method && filter.method.length > 0) {
      filtered = filtered.filter(e => filter.method!.includes(e.method));
    }

    if (filter.status && filter.status !== 'all') {
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
        e.path?.toLowerCase().includes(search) ||
        e.host?.toLowerCase().includes(search) ||
        (e.error && e.error.toLowerCase().includes(search))
      );
    }

    if (filter.host) {
      filtered = filtered.filter(e => e.host === filter.host);
    }

    return filtered;
  }, [events, filter]);

  // Calculate statistics
  const stats: NetworkStats = useMemo(() => {
    const successful = events.filter(e => e.status && e.status >= 200 && e.status < 300);
    const failed = events.filter(e => e.error || (e.status && e.status >= 400));
    const pending = events.filter(e => !e.status && !e.error);
    
    const durations = events
      .filter(e => e.duration)
      .map(e => e.duration!);
    
    const avgDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    const totalSent = events.reduce((sum, e) => sum + (e.requestSize || 0), 0);
    const totalReceived = events.reduce((sum, e) => sum + (e.responseSize || 0), 0);

    return {
      totalRequests: events.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      pendingRequests: pending.length,
      totalDataSent: totalSent,
      totalDataReceived: totalReceived,
      averageDuration: Math.round(avgDuration),
    };
  }, [events]);

  // Get unique hosts
  const hosts = useMemo(() => {
    const hostSet = new Set(events.map(e => e.host).filter(Boolean));
    return Array.from(hostSet);
  }, [events]);

  // Get unique methods
  const methods = useMemo(() => {
    const methodSet = new Set(events.map(e => e.method));
    return Array.from(methodSet);
  }, [events]);

  return {
    events: filteredEvents,
    allEvents: events,
    stats,
    filter,
    setFilter,
    clearEvents,
    isEnabled,
    toggleInterception,
    hosts,
    methods,
  };
}