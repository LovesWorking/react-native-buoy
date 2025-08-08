/**
 * Hook for accessing network events and controls
 * Uses Reactotron-style listener pattern
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { networkEventStore } from '../utils/networkEventStore';
import { 
  networkListener, 
  startNetworkListener, 
  stopNetworkListener,
  addNetworkListener 
} from '../utils/networkListener';
import type { NetworkEvent, NetworkStats, NetworkFilter } from '../types';

export function useNetworkEvents() {
  const [events, setEvents] = useState<NetworkEvent[]>([]);
  const [filter, setFilter] = useState<NetworkFilter>({});
  const [isEnabled, setIsEnabled] = useState(false);

  // Subscribe to event store changes
  useEffect(() => {
    // Subscribe to store changes
    const unsubscribeStore = networkEventStore.subscribe(setEvents);
    
    // Add listener to network events
    const unsubscribeListener = addNetworkListener((event) => {
      // Only log in development and for non-ignored URLs
      if (__DEV__ && !event.request.url.includes('symbolicate') && !event.request.url.includes(':8081')) {
        // Uncomment for debugging
        // console.log('[Network Event]', event.type, event.request.method, event.request.url);
      }
      networkEventStore.processNetworkEvent(event);
    });

    // Check if already listening
    setIsEnabled(networkListener.isActive);

    // Start listening if not already
    if (!networkListener.isActive) {
      startNetworkListener();
      setIsEnabled(true);
    }

    // Load initial events
    setEvents(networkEventStore.getEvents());

    return () => {
      unsubscribeStore();
      unsubscribeListener();
    };
  }, []);

  // Clear all events
  const clearEvents = useCallback(() => {
    networkEventStore.clearEvents();
  }, []);

  // Toggle interception
  const toggleInterception = useCallback(() => {
    if (isEnabled) {
      stopNetworkListener();
      setIsEnabled(false);
    } else {
      startNetworkListener();
      setIsEnabled(true);
    }
  }, [isEnabled]);

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

    if (filter.contentType && filter.contentType.length > 0) {
      filtered = filtered.filter(e => {
        const headers = e.responseHeaders || e.requestHeaders;
        const contentType = headers?.['content-type'] || headers?.['Content-Type'] || '';
        
        return filter.contentType!.some(type => {
          switch (type) {
            case 'JSON': return contentType.includes('json');
            case 'XML': return contentType.includes('xml');
            case 'HTML': return contentType.includes('html');
            case 'TEXT': return contentType.includes('text');
            case 'IMAGE': return contentType.includes('image');
            case 'VIDEO': return contentType.includes('video');
            case 'AUDIO': return contentType.includes('audio');
            case 'FORM': return contentType.includes('form');
            case 'OTHER': return !contentType || 
              (!contentType.includes('json') && !contentType.includes('xml') && 
               !contentType.includes('html') && !contentType.includes('text') &&
               !contentType.includes('image') && !contentType.includes('video') &&
               !contentType.includes('audio') && !contentType.includes('form'));
            default: return false;
          }
        });
      });
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