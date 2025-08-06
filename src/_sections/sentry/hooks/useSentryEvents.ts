import { useEffect, useState, useRef, useMemo } from "react";
import isEqual from "fast-deep-equal";
import { ConsoleTransportEntry, LogLevel, LogType } from "../../../_shared/logger/types";

import { reactiveSentryEventStore } from "../utils/sentryEventStore";
import { adaptSentryEventsToConsoleEntries } from "../utils/SentryEventAdapter";

interface UseSentryEventsOptions {
  selectedTypes?: Set<LogType>;
  selectedLevels?: Set<LogLevel>;
}

/**
 * Reactive hook for Sentry events with automatic updates
 * Following React Query patterns [[memory:4875074]]
 */
export function useSentryEvents(options: UseSentryEventsOptions = {}) {
  const { selectedTypes = new Set(), selectedLevels = new Set() } = options;

  // Initialize state with a function to avoid running during every render
  const [entries, setEntries] = useState<ConsoleTransportEntry[]>(() => {
    const rawSentryEvents = reactiveSentryEventStore.getEvents();
    const adaptedEntries = adaptSentryEventsToConsoleEntries(rawSentryEvents);
    
    // Remove duplicates based on ID
    const uniqueEntries = adaptedEntries.reduce(
      (acc: ConsoleTransportEntry[], entry: ConsoleTransportEntry) => {
        if (!acc.some((existing: ConsoleTransportEntry) => existing.id === entry.id)) {
          acc.push(entry);
        }
        return acc;
      },
      [] as ConsoleTransportEntry[]
    );

    return uniqueEntries.sort(
      (a: ConsoleTransportEntry, b: ConsoleTransportEntry) =>
        b.timestamp - a.timestamp
    );
  });

  // Ref to track previous state for comparison
  const entriesRef = useRef<unknown[]>([]);
  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Subscribe to store changes
  useEffect(() => {
    isMountedRef.current = true;

    const updateEntries = () => {
      if (!isMountedRef.current) return;

      const rawSentryEvents = reactiveSentryEventStore.getEvents();
      const adaptedEntries = adaptSentryEventsToConsoleEntries(rawSentryEvents);

      // Remove duplicates based on ID
      const uniqueEntries = adaptedEntries.reduce(
        (acc: ConsoleTransportEntry[], entry: ConsoleTransportEntry) => {
          if (!acc.some((existing: ConsoleTransportEntry) => existing.id === entry.id)) {
            acc.push(entry);
          }
          return acc;
        },
        [] as ConsoleTransportEntry[]
      );

      const newEntries = uniqueEntries.sort(
        (a: ConsoleTransportEntry, b: ConsoleTransportEntry) =>
          b.timestamp - a.timestamp
      );

      const newStates = newEntries.map((e) => ({
        id: e.id,
        timestamp: e.timestamp,
      }));

      // Only update if entries actually changed
      if (!isEqual(entriesRef.current, newStates)) {
        entriesRef.current = newStates;
        setEntries(newEntries);
      }
    };

    // Subscribe to reactive store - will auto-update when new events arrive
    const unsubscribe = reactiveSentryEventStore.subscribe(updateEntries);

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []); // Remove dependencies to prevent re-subscription

  // Memoized filtering to prevent expensive recalculation [[memory:4875251]]
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Special handling for spans - they are always hidden by default
      // unless Navigation type is explicitly selected with no other types
      if (entry.metadata?._isSpan) {
        // Only show spans if Navigation is the ONLY selected type
        // This prevents spans from showing when using default filters
        return selectedTypes.size === 1 && selectedTypes.has(LogType.Navigation);
      }

      // Regular filtering logic for non-span events
      const typeMatch =
        selectedTypes.size === 0 || selectedTypes.has(entry.type);
      const levelMatch =
        selectedLevels.size === 0 || selectedLevels.has(entry.level);
      return typeMatch && levelMatch;
    });
  }, [entries, selectedTypes, selectedLevels]);

  return {
    entries: filteredEntries,
    totalCount: entries.length,
    filteredCount: filteredEntries.length,
    maxEvents: reactiveSentryEventStore.getMaxEvents(),
  };
}

/**
 * Hook to get Sentry event counts by type and level
 * Reactive updates when events change
 */
export function useSentryEventCounts() {
  // Initialize with lazy state to avoid calculation during render
  const [counts, setCounts] = useState(() => {
    const events = reactiveSentryEventStore.getEvents();
    const adaptedEntries = adaptSentryEventsToConsoleEntries(events);

    // Count by type
    const byType = adaptedEntries.reduce(
      (acc, entry) => {
        acc[entry.type] = (acc[entry.type] || 0) + 1;
        return acc;
      },
      {} as Record<LogType, number>
    );

    // Count by level
    const byLevel = adaptedEntries.reduce(
      (acc, entry) => {
        acc[entry.level] = (acc[entry.level] || 0) + 1;
        return acc;
      },
      {} as Record<LogLevel, number>
    );

    return { byType, byLevel };
  });

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const updateCounts = () => {
      if (!isMountedRef.current) return;

      const events = reactiveSentryEventStore.getEvents();
      const adaptedEntries = adaptSentryEventsToConsoleEntries(events);

      // Count by type
      const byType = adaptedEntries.reduce(
        (acc, entry) => {
          acc[entry.type] = (acc[entry.type] || 0) + 1;
          return acc;
        },
        {} as Record<LogType, number>
      );

      // Count by level
      const byLevel = adaptedEntries.reduce(
        (acc, entry) => {
          acc[entry.level] = (acc[entry.level] || 0) + 1;
          return acc;
        },
        {} as Record<LogLevel, number>
      );

      setCounts({ byType, byLevel });
    };

    // Subscribe to reactive store
    const unsubscribe = reactiveSentryEventStore.subscribe(updateCounts);

    return () => {
      isMountedRef.current = false;
      unsubscribe();
    };
  }, []);

  return counts;
}
