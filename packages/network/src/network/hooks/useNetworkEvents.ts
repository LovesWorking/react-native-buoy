/**
 * Hook for accessing network events and controls
 * Uses Reactotron-style listener pattern
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { networkEventStore } from "../utils/networkEventStore";
import {
  networkListener,
  startNetworkListener,
  stopNetworkListener,
  addNetworkListener,
} from "../utils/networkListener";
import type { NetworkEvent, NetworkStats, NetworkFilter } from "../types";

/**
 * Custom hook for accessing network events and controls
 * 
 * This hook provides a complete interface for network monitoring, including
 * event filtering, statistics calculation, and interception control. It uses
 * the Reactotron-style listener pattern for network event handling.
 * 
 * @returns Object containing filtered events, statistics, controls, and utilities
 * 
 * @example
 * ```typescript
 * function NetworkMonitor() {
 *   const {
 *     events,
 *     stats,
 *     filter,
 *     setFilter,
 *     clearEvents,
 *     toggleInterception,
 *     isEnabled
 *   } = useNetworkEvents();
 * 
 *   return (
 *     <div>
 *       <p>Total requests: {stats.totalRequests}</p>
 *       <p>Success rate: {stats.successfulRequests}/{stats.totalRequests}</p>
 *       <button onClick={toggleInterception}>
 *         {isEnabled ? 'Stop' : 'Start'} Monitoring
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @performance Uses memoization for expensive filtering and statistics calculations
 * @performance Optimizes string operations and array processing for large datasets
 * @performance Includes Set-based lookups for O(1) filter matching
 */
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
      if (
        __DEV__ &&
        !event.request.url.includes("symbolicate") &&
        !event.request.url.includes(":8081")
      ) {
        // Network event processed: [event.type] [method] [url] - available for debugging if needed
      }
      networkEventStore.processNetworkEvent(event);
    });

    // Check if already listening
    setIsEnabled(networkListener().isActive);

    // Start listening if not already
    if (!networkListener().isActive) {
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

  // Memoize search text processing to avoid repeated toLowerCase calls
  // Performance: Expensive string operations repeated for every event on every filter
  const searchLower = useMemo(() => {
    return filter.searchText ? filter.searchText.toLowerCase() : null;
  }, [filter.searchText]);

  // Memoize method filter Set for O(1) lookup instead of Array.includes
  // Performance: Converting array.includes to Set.has for faster lookups with large method lists
  const methodSet = useMemo(() => {
    return filter.method && filter.method.length > 0 
      ? new Set(filter.method) 
      : null;
  }, [filter.method]);

  // Memoize content type Set for O(1) lookup
  // Performance: Converting array.some to Set.has for faster content type matching
  const contentTypeSet = useMemo(() => {
    return filter.contentType && filter.contentType.length > 0 
      ? new Set(filter.contentType) 
      : null;
  }, [filter.contentType]);

  // Filter events with optimized string operations and Set lookups
  // Performance: Complex multi-stage filtering with string operations and content type matching
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    if (methodSet) {
      filtered = filtered.filter((e) => methodSet.has(e.method));
    }

    if (filter.status && filter.status !== "all") {
      switch (filter.status) {
        case "success":
          filtered = filtered.filter(
            (e) => e.status && e.status >= 200 && e.status < 300,
          );
          break;
        case "error":
          filtered = filtered.filter(
            (e) => e.error || (e.status && e.status >= 400),
          );
          break;
        case "pending":
          filtered = filtered.filter((e) => !e.status && !e.error);
          break;
      }
    }

    if (searchLower) {
      filtered = filtered.filter(
        (e) =>
          e.url.toLowerCase().includes(searchLower) ||
          e.method.toLowerCase().includes(searchLower) ||
          e.path?.toLowerCase().includes(searchLower) ||
          e.host?.toLowerCase().includes(searchLower) ||
          (e.error && e.error.toLowerCase().includes(searchLower)) ||
          // Search by GraphQL operation name (e.g., "GetUser", "CreatePost")
          (e.operationName && e.operationName.toLowerCase().includes(searchLower)),
      );
    }

    if (filter.host) {
      filtered = filtered.filter((e) => e.host === filter.host);
    }

    if (contentTypeSet) {
      filtered = filtered.filter((e) => {
        const headers = e.responseHeaders || e.requestHeaders;
        const contentType =
          headers?.["content-type"] || headers?.["Content-Type"] || "";

        for (const type of contentTypeSet) {
          switch (type) {
            case "JSON":
              if (contentType.includes("json")) return true;
              break;
            case "XML":
              if (contentType.includes("xml")) return true;
              break;
            case "HTML":
              if (contentType.includes("html")) return true;
              break;
            case "TEXT":
              if (contentType.includes("text")) return true;
              break;
            case "IMAGE":
              if (contentType.includes("image")) return true;
              break;
            case "VIDEO":
              if (contentType.includes("video")) return true;
              break;
            case "AUDIO":
              if (contentType.includes("audio")) return true;
              break;
            case "FORM":
              if (contentType.includes("form")) return true;
              break;
            case "OTHER":
              if (
                !contentType ||
                (!contentType.includes("json") &&
                  !contentType.includes("xml") &&
                  !contentType.includes("html") &&
                  !contentType.includes("text") &&
                  !contentType.includes("image") &&
                  !contentType.includes("video") &&
                  !contentType.includes("audio") &&
                  !contentType.includes("form"))
              ) {
                return true;
              }
              break;
          }
        }
        return false;
      });
    }

    return filtered;
  }, [events, filter, searchLower, methodSet, contentTypeSet]);

  // Memoize expensive statistics calculation by categorizing events in single pass
  // Performance: Multiple array.filter operations replaced with single loop for better performance
  const stats: NetworkStats = useMemo(() => {
    let successful = 0;
    let failed = 0;
    let pending = 0;
    let totalSent = 0;
    let totalReceived = 0;
    let durationSum = 0;
    let durationCount = 0;

    // Single pass through events for all statistics
    for (const event of events) {
      // Categorize status
      if (event.status && event.status >= 200 && event.status < 300) {
        successful++;
      } else if (event.error || (event.status && event.status >= 400)) {
        failed++;
      } else if (!event.status && !event.error) {
        pending++;
      }

      // Accumulate data sizes
      totalSent += event.requestSize || 0;
      totalReceived += event.responseSize || 0;

      // Accumulate durations
      if (event.duration) {
        durationSum += event.duration;
        durationCount++;
      }
    }

    const avgDuration = durationCount > 0 ? durationSum / durationCount : 0;

    return {
      totalRequests: events.length,
      successfulRequests: successful,
      failedRequests: failed,
      pendingRequests: pending,
      totalDataSent: totalSent,
      totalDataReceived: totalReceived,
      averageDuration: Math.round(avgDuration),
    };
  }, [events]);

  // Memoize unique hosts extraction with single pass instead of map + filter + Set
  // Performance: Avoiding array.map().filter() chain, using single loop with Set for deduplication
  const hosts = useMemo(() => {
    const hostSet = new Set<string>();
    for (const event of events) {
      if (event.host) {
        hostSet.add(event.host);
      }
    }
    return Array.from(hostSet);
  }, [events]);

  // Memoize unique methods extraction with single pass
  // Performance: Avoiding array.map() + Set constructor, using single loop for better performance
  const methods = useMemo(() => {
    const methodSet = new Set<string>();
    for (const event of events) {
      methodSet.add(event.method);
    }
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
